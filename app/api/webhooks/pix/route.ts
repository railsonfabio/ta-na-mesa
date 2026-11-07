import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface NormalizedPixWebhook {
  txid: string | null;
  orderId: string | null;
  isPaid: boolean;
  provider: "asaas" | "mercadopago" | "bacen" | "custom";
  amount?: number;
  forceAutoApprove?: boolean;
}

/**
 * Normaliza payloads de Webhook Pix dos principais PSPs do mercado brasileiro:
 * - Asaas (`event: "PAYMENT_RECEIVED" | "PAYMENT_CONFIRMED"`)
 * - Mercado Pago (`status: "approved"`, `action: "payment.updated"`)
 * - Padrão BACEN / Efí (`pix: [{ txid, valor, endToEndId }]`)
 * - Payload Direto de Homologação (`{ txid, status: "PAID" }`)
 */
function parsePixWebhookPayload(body: any): NormalizedPixWebhook {
  // 1. Formato Asaas
  if (body?.event && body?.payment) {
    const paidEvents = ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"];
    const txid =
      body.payment?.pixTransaction?.txid ||
      body.payment?.externalReference ||
      body.payment?.id ||
      null;
    return {
      txid: txid ? String(txid).trim() : null,
      orderId: body.payment?.externalReference
        ? String(body.payment.externalReference).trim()
        : null,
      isPaid: paidEvents.includes(String(body.event).toUpperCase()),
      provider: "asaas",
      amount: body.payment?.value ? Number(body.payment.value) : undefined,
      forceAutoApprove: body.autoApprove,
    };
  }

  // 2. Formato Padrão BACEN / Efí / Inter (`{ pix: [{ txid, valor }] }`)
  if (Array.isArray(body?.pix) && body.pix.length > 0) {
    const firstPix = body.pix[0];
    return {
      txid: firstPix?.txid ? String(firstPix.txid).trim() : null,
      orderId: null,
      isPaid: Boolean(firstPix?.txid),
      provider: "bacen",
      amount: firstPix?.valor ? Number(firstPix.valor) : undefined,
      forceAutoApprove: body.autoApprove,
    };
  }

  // 3. Formato Mercado Pago
  if (body?.data?.id || body?.type === "payment" || body?.action?.startsWith("payment.")) {
    const mpStatus = String(
      body?.data?.status || body?.status || "approved"
    ).toLowerCase();
    const txid =
      body?.data?.txid ||
      body?.data?.external_reference ||
      body?.external_reference ||
      body?.txid ||
      null;
    return {
      txid: txid ? String(txid).trim() : null,
      orderId: body?.data?.external_reference || body?.external_reference || null,
      isPaid: mpStatus === "approved" || mpStatus === "paid",
      provider: "mercadopago",
      amount: body?.data?.transaction_amount
        ? Number(body.data.transaction_amount)
        : undefined,
      forceAutoApprove: body.autoApprove,
    };
  }

  // 4. Formato Direto / Homologação Interna
  const rawStatus = String(body?.status || "PAID").toUpperCase();
  const paidStatuses = [
    "PAID",
    "PAGO",
    "APPROVED",
    "CONFIRMED",
    "CONCLUIDA",
    "LIQUIDADO",
  ];

  return {
    txid: body?.txid ? String(body.txid).trim() : null,
    orderId: body?.orderId ? String(body.orderId).trim() : null,
    isPaid: paidStatuses.includes(rawStatus),
    provider: "custom",
    amount: body?.amount ? Number(body.amount) : undefined,
    forceAutoApprove: body?.autoApprove,
  };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verificação opcional de token secreto do Webhook (Header Asaas / Custom)
    const configuredSecret = process.env.PIX_WEBHOOK_SECRET;
    if (configuredSecret) {
      const incomingToken =
        request.headers.get("asaas-access-token") ||
        request.headers.get("x-webhook-secret") ||
        request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

      if (incomingToken !== configuredSecret) {
        return NextResponse.json(
          { error: "Assinatura do Webhook Pix inválida ou não autorizada." },
          { status: 401 }
        );
      }
    }

    const body = await request.json();
    const parsed = parsePixWebhookPayload(body);

    if (!parsed.txid && !parsed.orderId) {
      return NextResponse.json(
        {
          error:
            "Payload inválido: informe o `txid` do Pix ou `externalReference` do pedido.",
        },
        { status: 400 }
      );
    }

    if (!parsed.isPaid) {
      return NextResponse.json({
        received: true,
        processed: false,
        reason: "Evento recebido, porém o status ainda não indica liquidação.",
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error:
            "Variáveis de ambiente do Supabase não configuradas no servidor.",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // 2. Executa a baixa automática via RPC SECURITY DEFINER (`mark_pix_order_paid`) no PostgreSQL,
    //    localizando o pedido por `pix_txid` (ou `id`), atualizando para 'Pago ✅' / 'em_preparo'
    //    e disparando o broadcast WebSocket (`postgres_changes`) para o /gestor, /cozinha e cliente
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "mark_pix_order_paid",
      {
        p_txid: parsed.txid,
        p_order_id: parsed.orderId,
        p_force_auto_approve:
          parsed.forceAutoApprove !== undefined
            ? Boolean(parsed.forceAutoApprove)
            : null,
      }
    );

    if (rpcError) {
      return NextResponse.json(
        {
          error: "Falha ao atualizar o status de pagamento do pedido no banco.",
          details: rpcError.message,
        },
        { status: 500 }
      );
    }

    if (!rpcResult?.found) {
      return NextResponse.json(
        {
          error: `Nenhum pedido localizado para o txid/referência informado (${parsed.txid || parsed.orderId}).`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      provider: parsed.provider,
      message:
        rpcResult.status === "em_preparo"
          ? `Pix liquidado com sucesso! Pedido #${rpcResult.order_number} aprovado e enviado automaticamente para a Cozinha (KDS).`
          : `Pix liquidado com sucesso! Pedido #${rpcResult.order_number} marcado como Pago no PDV.`,
      order: rpcResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Erro interno ao processar o Webhook de pagamento Pix.",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
