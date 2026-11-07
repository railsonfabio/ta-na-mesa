"use client";

import React, { useState, useEffect } from "react";
import { KitchenView, resolveItemPrepSector } from "../../components/KitchenView";
import {
  loadInitialData,
  saveStateToStorage,
  syncStateWithServer,
  initRealtimeSync,
} from "../../lib/store";
import { Table, Order } from "../../lib/types";
import { INITIAL_TABLES, INITIAL_ORDERS, RESTAURANT_INFO } from "../../lib/mock-data";
import { Logo } from "../../components/Logo";
import Link from "next/link";
import { DeviceHubModal } from "../../components/DeviceHubModal";
import { UserCheck, Monitor, QrCode } from "lucide-react";
import { StoreSettings } from "../../lib/server-db";

export default function CozinhaPage() {
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [settings, setSettings] = useState<StoreSettings | undefined>(undefined);
  const [isDeviceHubOpen, setIsDeviceHubOpen] = useState(false);

  useEffect(() => {
    const data = loadInitialData();
    setTables(data.tables);
    setOrders(data.orders);

    // Fase 7: Sincronização Local Multi-Dispositivos em Tempo Real via Servidor (SSE)
    const cleanup = initRealtimeSync((db) => {
      if (db.tables) setTables(db.tables);
      if (db.orders) setOrders(db.orders);
      if (db.settings) setSettings(db.settings);
    });

    return () => cleanup();
  }, []);

  const handleToggleItemReady = (orderId: string, itemIndex: number) => {
    const updated = orders.map((ord) => {
      if (ord.id !== orderId) return ord;
      const updatedItems = ord.items.map((it, idx) =>
        idx === itemIndex
          ? {
              ...it,
              prepSector: it.prepSector || resolveItemPrepSector(it),
              isReady: !it.isReady,
            }
          : {
              ...it,
              prepSector: it.prepSector || resolveItemPrepSector(it),
            }
      );
      return { ...ord, items: updatedItems };
    });
    setOrders(updated);
    syncStateWithServer(tables, updated, undefined, undefined, undefined, undefined);
  };

  const handleMarkReady = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    const updated = orders.map((ord) =>
      ord.id === orderId
        ? {
            ...ord,
            status: "a_caminho" as const,
            items: ord.items.map((it) => ({
              ...it,
              prepSector: it.prepSector || resolveItemPrepSector(it),
              isReady: true,
            })),
          }
        : ord
    );
    setOrders(updated);

    const notif =
      targetOrder?.type === "mesa"
        ? `🟢 Cozinha: Pedido #${targetOrder.orderNumber} pronto no balcão para levar à Mesa ${targetOrder.tableNumber}!`
        : `🛵 Pedido #${targetOrder?.orderNumber} pronto na cozinha para expedição delivery!`;

    syncStateWithServer(tables, updated, undefined, undefined, undefined, notif);
  };

  return (
    <div className="min-h-screen bg-[#1F2421]">
      {/* Topo Mínimo KDS (Modo Quiosque / Tablet da Cozinha) */}
      <div className="bg-black/80 text-neutral-400 px-4 py-2.5 text-xs flex items-center justify-between border-b border-neutral-800">
        <div className="flex items-center gap-2.5 text-white font-extrabold text-sm">
          <Logo size="sm" variant="icon" />
          <span>Monitor de Chapa & Cozinha (KDS) • {settings?.storeName || "Brasa & Burger"}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 mr-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-400 text-xs font-bold font-mono">ONLINE</span>
          </div>
          <button
            onClick={() => setIsDeviceHubOpen(true)}
            className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2.5 py-1 rounded-lg border border-neutral-700 font-bold cursor-pointer transition-colors"
            title="Parear celulares e tablets"
          >
            <QrCode className="w-3.5 h-3.5 text-[#BD4D2D]" />
            <span className="hidden sm:inline">Parear</span>
          </button>
          <Link
            href="/garcom"
            className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2.5 py-1 rounded-lg border border-neutral-700 font-bold transition-colors"
            title="Abrir Terminal Garçom"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Garçom</span>
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

      <KitchenView
        orders={orders}
        onMarkReady={handleMarkReady}
        onToggleItemReady={handleToggleItemReady}
        storeName={settings?.storeName}
      />

      {isDeviceHubOpen && <DeviceHubModal onClose={() => setIsDeviceHubOpen(false)} />}
    </div>
  );
}
