import { NextResponse } from "next/server";
import { getDb, saveDb } from "../../../../lib/server-db";
import { Order, CartItem, OrderChannel } from "../../../../lib/types";

// Endpoint de Webhook para receber pedidos de APIs externas (iFood, 99Food, Keeta, Parceiros)
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    // Validação de token Bearer opcional (ou chave da loja)
    const body = await req.json();

    const channel: OrderChannel = body.channel || (body.merchantId ? "ifood" : "api");
    const customerName = body.customerName || body.customer?.name || "Cliente Marketplace";
    const customerPhone = body.customerPhone || body.customer?.phone || "(84) 99888-0000";
    const externalOrderId = body.orderId || body.id || String(Date.now()).slice(-6);

    const rawItems = body.items || [];
    const items: CartItem[] = rawItems.length > 0
      ? rawItems.map((it: any, idx: number) => ({
          id: `ext-item-${Date.now()}-${idx}`,
          productId: it.productId || `prod-ext-${idx}`,
          name: it.name || "Item Marketplace",
          price: Number(it.price || it.unitPrice || 0),
          quantity: Number(it.quantity || 1),
          optionsSelected: it.options || it.optionsSelected || [],
          notes: it.notes || it.observation,
        }))
      : [
          {
            id: `ext-item-${Date.now()}`,
            productId: "hd-1",
            name: "Hot Dog Cheddar e Catupiry Completo (Via Marketplace)",
            price: 16.0,
            quantity: 1,
            optionsSelected: ["Bacon Crispy", "Catupiry Extra"],
            notes: "Entregar com guardanapos extras",
          },
        ];

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const deliveryFee = Number(body.deliveryFee || 6.0);
    const discount = Number(body.discount || 0);
    const total = subtotal + deliveryFee - discount;

    const db = getDb();
    const nextOrderNumber = (db.orders.length > 0 ? Math.max(...db.orders.map((o) => o.orderNumber || 0)) : 100) + 1;

    const newOrder: Order = {
      id: `ord-ext-${Date.now()}`,
      orderNumber: nextOrderNumber,
      type: "delivery",
      channel,
      externalOrderId: String(externalOrderId),
      customerName,
      customerPhone,
      items,
      subtotal,
      deliveryFee,
      discount,
      total,
      status: "pendente",
      createdAt: "Agora mesmo",
      deliveryAddress: body.deliveryAddress || body.address || "Rua Rio Salgado, Redinha - Natal/RN",
      deliveryNeighborhood: body.neighborhood || "Redinha",
      paymentMethod: body.paymentMethod || "Online (Pago no App)",
    };

    const channelLabels: Record<string, string> = {
      ifood: "iFood",
      "99food": "99Food",
      keeta: "Keeta",
      api: "API Parceiro",
      whatsapp: "WhatsApp Bot",
    };

    const notif = `🛵 Novo Pedido #${newOrder.orderNumber} via ${channelLabels[channel] || "Marketplace"} (${customerName})`;
    const updated = saveDb({ orders: [newOrder, ...db.orders] }, notif);

    return NextResponse.json({
      success: true,
      message: `Pedido #${newOrder.orderNumber} recebido e despachado para PDV e KDS via ${channel}`,
      order: newOrder,
      version: updated.version,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Erro processando webhook externo", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    endpoint: "/api/integrations/webhook",
    supportedChannels: ["ifood", "99food", "keeta", "api", "whatsapp"],
    documentation: "Envie um POST com { channel: 'ifood'|'99food'|'keeta'|'api', customerName, items: [...], total }",
  });
}
