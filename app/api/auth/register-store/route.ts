import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const MASTER_EMAILS = [
  "railsonfabio@gmail.com",
  "a2isolutionsbrasil@gmail.com",
  "rhvendasdireta@gmail.com",
  "eetservicebr@gmail.com",
];

function slugifyStoreName(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `loja-${Date.now().toString().slice(-4)}`
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { ok: false, error: "Configuração do servidor Supabase ausente." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "register").trim();

    // 1. Validação de PIN Master Rápido (Estilo Alô)
    if (action === "master_pin") {
      const pin = String(body.pin || "").trim();
      const expectedMasterPin = (process.env.ADMIN_MASTER_PIN || "849981").trim();
      const rawEmail = String(body.email || "railsonfabio@gmail.com")
        .trim()
        .toLowerCase();

      const targetEmail = MASTER_EMAILS.includes(rawEmail)
        ? rawEmail
        : "railsonfabio@gmail.com";

      if (pin !== expectedMasterPin) {
        return NextResponse.json(
          {
            ok: false,
            error: "PIN de Segurança Master incorreto. Tente novamente.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json({
        ok: true,
        email: targetEmail,
        pin: expectedMasterPin,
      });
    }

    // 2. Cadastro de Novo Restaurante (Primeiro Acesso Multi-Tenant)
    const storeName = String(body.storeName || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "").trim();
    const whatsapp = String(body.whatsapp || "").trim();

    if (!storeName || storeName.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Informe o nome do seu restaurante ou lanchonete." },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Informe um e-mail válido para o estabelecimento." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        {
          ok: false,
          error: "A senha ou PIN de acesso deve ter pelo menos 6 caracteres.",
        },
        { status: 400 }
      );
    }

    const storeId = crypto.randomUUID();
    const baseSlug = slugifyStoreName(storeName);

    // Verifica se o slug já existe
    const { data: existingSlug } = await supabaseAdmin
      .from("stores")
      .select("id")
      .eq("slug", baseSlug)
      .maybeSingle();

    const finalSlug = existingSlug
      ? `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`
      : baseSlug;

    // Cria o usuário já confirmado no Supabase Auth vinculado ao novo store_id
    const { data: createdUser, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          store_id: storeId,
          store_name: storeName,
          whatsapp,
          role: "owner",
        },
      });

    if (createUserError || !createdUser.user) {
      const msg = createUserError?.message || "";
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("registered")) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Este e-mail já possui cadastro. Use a aba 'Entrar no Sistema' para acessar sua loja.",
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        {
          ok: false,
          error: createUserError?.message || "Não foi possível criar a conta do restaurante.",
        },
        { status: 400 }
      );
    }

    // Cria o registro inicial da loja em public.stores
    await supabaseAdmin.from("stores").upsert(
      {
        id: storeId,
        slug: finalSlug,
        store_name: storeName,
        whatsapp: whatsapp || "(84) 99999-0000",
        address: "Configure seu endereço no Painel",
        pix_key: "",
        pix_key_type: "cnpj",
        delivery_time_estimate: "35-50 min",
        is_open: true,
        auto_approve_orders: false,
        loyalty_enabled: true,
      },
      { onConflict: "id" }
    );

    // Provisiona 10 mesas iniciais para o novo restaurante
    const initialTables = Array.from({ length: 10 }, (_, idx) => ({
      id: `${storeId}-mesa-${idx + 1}`,
      store_id: storeId,
      table_number: idx + 1,
      status: "livre",
    }));

    await supabaseAdmin
      .from("restaurant_tables")
      .upsert(initialTables, { onConflict: "id" });

    return NextResponse.json({
      ok: true,
      storeId,
      slug: finalSlug,
      storeName,
      email,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Erro interno ao processar o cadastro do restaurante.",
      },
      { status: 500 }
    );
  }
}
