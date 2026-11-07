import { NextResponse } from "next/server";
import { getDb, saveDb, resetDbClean, seedDbDemo } from "../../../lib/server-db";

export async function GET() {
  const db = getDb();
  return NextResponse.json(db);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, order, tables, orders, products, reviews, settings, stock, suppliers, expenses, notification } = body;

    if (action === "reset_clean") {
      const cleanState = resetDbClean(notification);
      return NextResponse.json({ success: true, version: cleanState.version, state: cleanState });
    }

    if (action === "seed_demo") {
      const demoState = seedDbDemo(notification);
      return NextResponse.json({ success: true, version: demoState.version, state: demoState });
    }

    if (action === "append_order" && order) {
      const currentDb = getDb();
      const exists = currentDb.orders.some((o) => o.id === order.id);
      const updatedOrders = exists ? currentDb.orders : [order, ...currentDb.orders];
      const updated = saveDb({ orders: updatedOrders }, notification);
      return NextResponse.json({ success: true, version: updated.version, state: updated });
    }

    if (action === "update_order" && order && order.id) {
      const currentDb = getDb();
      const updatedOrders = currentDb.orders.map((o) =>
        o.id === order.id ? { ...o, ...order } : o
      );
      const updated = saveDb({ orders: updatedOrders }, notification);
      return NextResponse.json({ success: true, version: updated.version, state: updated });
    }

    const updated = saveDb(
      {
        ...(tables ? { tables } : {}),
        ...(orders ? { orders } : {}),
        ...(products ? { products } : {}),
        ...(reviews ? { reviews } : {}),
        ...(settings ? { settings } : {}),
        ...(stock ? { stock } : {}),
        ...(suppliers ? { suppliers } : {}),
        ...(expenses ? { expenses } : {}),
      },
      notification
    );

    return NextResponse.json({ success: true, version: updated.version, state: updated });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao salvar dados", details: String(err) }, { status: 500 });
  }
}
