"use client";

import React, { useState, useEffect } from "react";
import { WaiterView } from "../../components/WaiterView";
import { resolveItemPrepSector } from "../../components/KitchenView";
import {
  loadInitialData,
  saveStateToStorage,
  syncStateWithServer,
  initRealtimeSync,
} from "../../lib/store";
import { Table, Order, ProductItem, CartItem } from "../../lib/types";
import { INITIAL_TABLES, INITIAL_ORDERS, PRODUCTS } from "../../lib/mock-data";
import { Logo } from "../../components/Logo";
import Link from "next/link";
import { DeviceHubModal } from "../../components/DeviceHubModal";
import { ChefHat, Monitor, QrCode, CreditCard } from "lucide-react";

export default function GarcomPage() {
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [products, setProducts] = useState<ProductItem[]>(PRODUCTS);
  const [isDeviceHubOpen, setIsDeviceHubOpen] = useState(false);

  useEffect(() => {
    const data = loadInitialData();
    setTables(data.tables);
    setOrders(data.orders);
    if (data.products?.length) setProducts(data.products);

    // Fase 7: Sincronização em Tempo Real Multi-Dispositivos via Servidor (SSE)
    const cleanup = initRealtimeSync((db) => {
      if (db.tables) setTables(db.tables);
      if (db.orders) setOrders(db.orders);
      if (db.products) setProducts(db.products);
    });

    return () => cleanup();
  }, []);

  const syncState = (newTables: Table[], newOrders: Order[], notification?: string) => {
    setTables(newTables);
    setOrders(newOrders);
    syncStateWithServer(newTables, newOrders, undefined, undefined, undefined, notification);
  };

  const handleAddSubcomanda = (tableNumber: number, name: string) => {
    const newComandaId = `c-t${tableNumber}-${Date.now()}`;
    const updated = tables.map((tbl) => {
      if (tbl.number === tableNumber) {
        return {
          ...tbl,
          status: "ocupada" as const,
          comandas: [
            ...tbl.comandas,
            {
              id: newComandaId,
              tableId: tbl.id,
              customerName: name,
              isConnectedViaPhone: true,
              status: "aberta" as const,
              items: [],
              total: 0,
            },
          ],
        };
      }
      return tbl;
    });

    const notif = `👤 Garçom: Nova comanda "${name}" aberta na Mesa ${tableNumber}!`;
    syncState(updated, orders, notif);
  };

  const handleAddItemToComanda = (
    tableNumber: number,
    comandaId: string,
    product: ProductItem,
    customization?: {
      quantity?: number;
      unitPrice?: number;
      optionsSelected?: string[];
      removals?: string[];
      notes?: string;
    }
  ) => {
    let targetName = "";
    const qty = customization?.quantity || 1;
    const unitPrice = customization?.unitPrice || product.price;
    const optionsSelected = customization?.optionsSelected || [];

    const specialParts: string[] = [];
    if (customization?.removals && customization.removals.length > 0) {
      specialParts.push(customization.removals.join(", ").toUpperCase());
    }
    if (customization?.notes) {
      specialParts.push(customization.notes);
    }
    const fullNotes =
      specialParts.length > 0 ? `⚠️ ESPECIAL: ${specialParts.join(" • ")}` : undefined;

    const newItem: CartItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      name: product.name,
      price: unitPrice,
      quantity: qty,
      optionsSelected,
      notes: fullNotes,
      prepSector:
        product.category === "bebidas" || product.category === "sobremesas"
          ? "bar"
          : "chapa",
      isReady: false,
    };

    const updatedTables = tables.map((tbl) => {
      if (tbl.number === tableNumber) {
        const updatedComandas = tbl.comandas.map((cmd) => {
          if (cmd.id === comandaId) {
            targetName = cmd.customerName;
            return {
              ...cmd,
              items: [...cmd.items, newItem],
              total: cmd.total + unitPrice * qty,
            };
          }
          return cmd;
        });
        return {
          ...tbl,
          status: "ocupada" as const,
          comandas: updatedComandas,
        };
      }
      return tbl;
    });

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: Math.max(...orders.map((o) => o.orderNumber || 0), 100) + 1,
      type: "mesa",
      tableNumber,
      comandaName: targetName,
      customerName: targetName,
      items: [newItem],
      subtotal: unitPrice * qty,
      deliveryFee: 0,
      discount: 0,
      total: unitPrice * qty,
      status: "em_preparo",
      createdAt: "Agora mesmo",
      acceptedAt: new Date().toISOString(),
    };

    const notif = `🛎️ Garçom lançou ${qty}x ${product.name} ${
      fullNotes ? "(ESPECIAL)" : ""
    } na Mesa ${tableNumber} [${targetName}]`;
    syncState(updatedTables, [newOrder, ...orders], notif);
  };

  const handleRemoveItemFromComanda = (
    tableNumber: number,
    comandaId: string,
    itemId: string
  ) => {
    let removedItemName = "";
    let customerName = "";

    const updatedTables = tables.map((tbl) => {
      if (tbl.number === tableNumber) {
        const updatedComandas = tbl.comandas.map((cmd) => {
          if (cmd.id === comandaId) {
            customerName = cmd.customerName;
            const targetItem = cmd.items.find((it) => it.id === itemId);
            if (targetItem) {
              removedItemName = targetItem.name;
              let newItems = [];
              if (targetItem.quantity > 1) {
                newItems = cmd.items.map((it) =>
                  it.id === itemId ? { ...it, quantity: it.quantity - 1 } : it
                );
              } else {
                newItems = cmd.items.filter((it) => it.id !== itemId);
              }
              const newTotal = Math.max(0, cmd.total - targetItem.price);
              return {
                ...cmd,
                items: newItems,
                total: newTotal,
              };
            }
          }
          return cmd;
        });

        return {
          ...tbl,
          comandas: updatedComandas,
        };
      }
      return tbl;
    });

    // Atualiza os pedidos em preparo na cozinha para refletir a retirada do item
    const updatedOrders = orders
      .map((ord) => {
        if (
          ord.tableNumber === tableNumber &&
          ord.comandaName === customerName &&
          ord.status !== "entregue"
        ) {
          const itemIdx = ord.items.findIndex(
            (it) => it.id === itemId || it.name === removedItemName
          );
          if (itemIdx >= 0) {
            const ordItem = ord.items[itemIdx];
            let newItems = [];
            if (ordItem.quantity > 1) {
              newItems = ord.items.map((it, idx) =>
                idx === itemIdx ? { ...it, quantity: it.quantity - 1 } : it
              );
            } else {
              newItems = ord.items.filter((_, idx) => idx !== itemIdx);
            }
            const subtotal = newItems.reduce((s, i) => s + i.price * i.quantity, 0);
            return {
              ...ord,
              items: newItems,
              subtotal,
              total: subtotal,
            };
          }
        }
        return ord;
      })
      .filter((ord) => ord.items.length > 0 || ord.status === "entregue");

    const notif = `🗑️ Garçom cancelou 1x ${removedItemName} da comanda de ${customerName} (Mesa ${tableNumber})`;
    syncState(updatedTables, updatedOrders, notif);
  };

  const handleClearTableCall = (tableNumber: number) => {
    const updated = tables.map((t) =>
      t.number === tableNumber
        ? {
            ...t,
            status: t.comandas.length > 0 ? ("ocupada" as const) : ("livre" as const),
            callReason: undefined,
          }
        : t
    );
    const notif = `✅ Chamado da Mesa ${tableNumber} atendido pelo garçom`;
    syncState(updated, orders, notif);
  };

  const handleCloseComanda = (tableNumber: number, comandaId: string) => {
    let closedName = "";
    const updated = tables.map((tbl) => {
      if (tbl.number === tableNumber) {
        const target = tbl.comandas.find((c) => c.id === comandaId);
        if (target) closedName = target.customerName;
        const remaining = tbl.comandas.filter((c) => c.id !== comandaId);
        return {
          ...tbl,
          comandas: remaining,
          status: remaining.length === 0 ? ("livre" as const) : tbl.status,
        };
      }
      return tbl;
    });

    const notif = `💰 Garçom quitou a comanda de ${closedName} na Mesa ${tableNumber}`;
    syncState(updated, orders, notif);
  };

  const handleTransferComanda = (
    fromTableNumber: number,
    comandaId: string,
    toTableNumber: number
  ) => {
    let comandaToMove: any = null;

    // 1. Remove comanda da mesa de origem
    const tablesWithoutComanda = tables.map((tbl) => {
      if (tbl.number === fromTableNumber) {
        const target = tbl.comandas.find((c) => c.id === comandaId);
        if (target) comandaToMove = target;
        const remaining = tbl.comandas.filter((c) => c.id !== comandaId);
        return {
          ...tbl,
          comandas: remaining,
          status: remaining.length === 0 ? ("livre" as const) : tbl.status,
        };
      }
      return tbl;
    });

    if (!comandaToMove) return;

    // 2. Adiciona a comanda na mesa de destino
    const finalTables = tablesWithoutComanda.map((tbl) => {
      if (tbl.number === toTableNumber) {
        return {
          ...tbl,
          status: "ocupada" as const,
          comandas: [...tbl.comandas, { ...comandaToMove, tableId: tbl.id }],
        };
      }
      return tbl;
    });

    // 3. Atualiza os pedidos em preparo para apontarem para a nova mesa
    const updatedOrders = orders.map((ord) => {
      if (
        ord.tableNumber === fromTableNumber &&
        ord.comandaName === comandaToMove.customerName &&
        ord.status !== "entregue"
      ) {
        return { ...ord, tableNumber: toTableNumber };
      }
      return ord;
    });

    const notif = `🔄 Garçom: Comanda de "${comandaToMove.customerName}" transferida da Mesa ${fromTableNumber} para a Mesa ${toTableNumber}!`;
    syncState(finalTables, updatedOrders, notif);
    alert(`✅ Comanda de "${comandaToMove.customerName}" transferida com sucesso para a Mesa ${toTableNumber}!`);
  };

  const handleAlertKitchenPriority = (tableNumber: number, comandaName: string) => {
    const notif = `🔥 URGÊNCIA COZINHA: Mesa ${tableNumber} [${comandaName}] com prioridade na chapa!`;
    syncState(tables, orders, notif);
    alert(`🔥 Alerta de prioridade enviado ao monitor KDS da Cozinha para a Mesa ${tableNumber}!`);
  };

  const handleMarkOrderDelivered = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    const updatedOrders = orders.map((ord) =>
      ord.id === orderId ? { ...ord, status: "entregue" as const } : ord
    );
    const notif = `✅ Garçom entregou o Pedido #${targetOrder?.orderNumber} na Mesa ${targetOrder?.tableNumber}!`;
    syncState(tables, updatedOrders, notif);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <div className="bg-[#1F2421] text-white px-4 py-2.5 text-xs flex items-center justify-between border-b border-neutral-800">
        <div className="flex items-center gap-2 font-black text-sm">
          <Logo size="sm" variant="icon" />
          <span>Terminal do Garçom • Salão</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/pos"
            className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg font-bold transition-colors"
            title="Abrir Modo Maquininha Smart POS (Stone / Cielo)"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Smart POS</span>
          </Link>
          <button
            onClick={() => setIsDeviceHubOpen(true)}
            className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2.5 py-1 rounded-lg border border-neutral-700 font-bold cursor-pointer transition-colors"
            title="Parear celulares e tablets"
          >
            <QrCode className="w-3.5 h-3.5 text-[#BD4D2D]" />
            <span className="hidden sm:inline">Parear</span>
          </button>
          <Link
            href="/cozinha"
            className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2.5 py-1 rounded-lg border border-neutral-700 font-bold transition-colors"
            title="Abrir KDS da Cozinha"
          >
            <ChefHat className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">KDS</span>
          </Link>
          <Link
            href="/gestor"
            className="flex items-center gap-1 bg-[#BD4D2D] hover:bg-[#A33F23] text-white px-2.5 py-1 rounded-lg font-bold transition-colors shadow-xs"
            title="Abrir Painel do Gestor (PDV)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gestor</span>
          </Link>
        </div>
      </div>

      <WaiterView
        tables={tables}
        orders={orders}
        products={products}
        onAddSubcomanda={handleAddSubcomanda}
        onAddItemToComanda={handleAddItemToComanda}
        onRemoveItemFromComanda={handleRemoveItemFromComanda}
        onCloseComanda={handleCloseComanda}
        onTransferComanda={handleTransferComanda}
        onAlertKitchenPriority={handleAlertKitchenPriority}
        onClearTableCall={handleClearTableCall}
        onMarkOrderDelivered={handleMarkOrderDelivered}
      />

      {isDeviceHubOpen && <DeviceHubModal onClose={() => setIsDeviceHubOpen(false)} />}
    </div>
  );
}
