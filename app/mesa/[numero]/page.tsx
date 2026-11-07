"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useParams } from "next/navigation";
import { CustomerView } from "../../../components/CustomerView";
import { TableQrModal } from "../../../components/TableQrModal";
import { ReviewModal } from "../../../components/ReviewModal";
import { AuthModal, UserProfile } from "../../../components/AuthModal";
import { OrderHistoryModal } from "../../../components/OrderHistoryModal";
import { Logo } from "../../../components/Logo";
import {
  loadInitialData,
  saveStateToStorage,
  syncStateWithServer,
  initRealtimeSync,
  CustomerReview,
} from "../../../lib/store";
import { Table, Order, ProductItem, CartItem } from "../../../lib/types";
import { INITIAL_TABLES, INITIAL_ORDERS, PRODUCTS, RESTAURANT_INFO } from "../../../lib/mock-data";
import { StoreSettings } from "../../../lib/server-db";
import { Utensils, QrCode, Clock, KeyRound, User } from "lucide-react";

function MesaContent() {
  const params = useParams();
  const tableNum = Number(params?.numero) || 1;

  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [products, setProducts] = useState<ProductItem[]>(PRODUCTS);
  const [settings, setSettings] = useState<StoreSettings | undefined>(undefined);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Fase 8: Autenticação WhatsApp & Histórico / Recompra
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("tanamesa_user_session_v3");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [reorderCartItems, setReorderCartItems] = useState<CartItem[] | null>(null);

  const [reviewData, setReviewData] = useState<{
    isOpen: boolean;
    customerName: string;
    tableNumber?: number;
  }>({
    isOpen: false,
    customerName: "",
  });

  const [activeNotification, setActiveNotification] = useState<string | null>(null);

  useEffect(() => {
    const data = loadInitialData();
    if (data.tables?.length) setTables(data.tables);
    if (data.orders?.length) setOrders(data.orders);
    if (data.reviews?.length) setReviews(data.reviews);
    if (data.products?.length) setProducts(data.products);

    // Fase 7: Sincronização em Tempo Real Multi-Dispositivos via Servidor (SSE)
    const cleanup = initRealtimeSync((db) => {
      if (db.tables) setTables(db.tables);
      if (db.orders) setOrders(db.orders);
      if (db.products) setProducts(db.products);
      if (db.reviews) setReviews(db.reviews);
      if (db.settings) setSettings(db.settings);
      if (db.notification) showFloatingToast(db.notification);
    });

    return () => cleanup();
  }, [tableNum]);

  const syncState = (newTables: Table[], newOrders: Order[], newReviews?: CustomerReview[], notification?: string) => {
    setTables(newTables);
    setOrders(newOrders);
    if (newReviews) setReviews(newReviews);

    syncStateWithServer(newTables, newOrders, newReviews, undefined, undefined, notification);
  };

  const showFloatingToast = (message: string) => {
    setActiveNotification(message);
    setTimeout(() => setActiveNotification(null), 4500);
  };

  const currentTable = tables.find((t) => t.number === tableNum) || {
    id: `t${tableNum}`,
    number: tableNum,
    status: "ocupada" as const,
    comandas: [
      {
        id: `c-t${tableNum}-1`,
        tableId: `t${tableNum}`,
        customerName: user?.name || "Fábio",
        isConnectedViaPhone: true,
        status: "aberta" as const,
        items: [],
        total: 0,
      },
    ],
  };

  const handleCallWaiter = (tableNumber: number, reason: string) => {
    const notif = `🔔 Mesa ${tableNumber} está chamando: "${reason}"`;
    const updated = tables.map((tbl) =>
      tbl.number === tableNumber
        ? { ...tbl, status: "chamando_garcom" as const, callReason: reason }
        : tbl
    );
    syncState(updated, orders, undefined, notif);
    alert(`🔔 Chamado enviado ao garçom: "${reason}". O garçom foi notificado!`);
  };

  const handlePlaceOrder = (newOrderData: Partial<Order>) => {
    const orderNumber = Math.max(...orders.map((o) => o.orderNumber || 0), 100) + 1;
    const clientName = user?.isLoggedIn ? user.name : newOrderData.customerName || "Cliente";

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      type: "mesa",
      tableNumber: tableNum,
      comandaName: newOrderData.comandaName || clientName,
      customerName: clientName,
      items: newOrderData.items || [],
      subtotal: newOrderData.subtotal || 0,
      deliveryFee: 0,
      discount: 0,
      total: newOrderData.total || 0,
      status: "pendente",
      createdAt: "Agora mesmo",
    };

    const newOrdersList = [newOrder, ...orders];
    let newTablesList = tables.map((tbl) => {
      if (tbl.number === tableNum) {
        const targetComanda =
          tbl.comandas.find((c) => c.customerName === newOrder.comandaName) ||
          tbl.comandas[0];

        let updatedComandas = [...tbl.comandas];
        if (targetComanda) {
          updatedComandas = tbl.comandas.map((cmd) => {
            if (cmd.id === targetComanda.id) {
              return {
                ...cmd,
                items: [...cmd.items, ...(newOrder.items || [])],
                total: cmd.total + newOrder.total,
              };
            }
            return cmd;
          });
        } else {
          updatedComandas.push({
            id: `c-t${tbl.number}-${Date.now()}`,
            tableId: tbl.id,
            customerName: newOrder.customerName,
            isConnectedViaPhone: true,
            status: "aberta",
            items: newOrder.items || [],
            total: newOrder.total,
          });
        }

        return {
          ...tbl,
          status: "ocupada" as const,
          comandas: updatedComandas,
        };
      }
      return tbl;
    });

    const notif = `🔥 Novo Pedido #${newOrder.orderNumber}: Mesa ${newOrder.tableNumber} [${newOrder.comandaName || "Comanda"}]`;
    syncState(newTablesList, newOrdersList, undefined, notif);
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

    syncState(
      updated,
      orders,
      undefined,
      `👤 Mesa ${tableNumber}: Nova comanda "${name}" aberta!`
    );
    alert(`👤 Nova comanda "${name}" aberta com sucesso na Mesa ${tableNumber}!`);
  };

  const handleReorder = (items: CartItem[]) => {
    setReorderCartItems(items);
    setIsHistoryModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Toast Flutuante em Tempo Real */}
      {activeNotification && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-3 fade-in duration-200">
          <div className="bg-[#1F2421] text-white px-4 py-3 rounded-2xl shadow-2xl border border-neutral-700 flex items-center gap-3 text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span>{activeNotification}</span>
          </div>
        </div>
      )}

      {/* Topo Limpo do Salão - 100% Voltado à Mesa */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EFE9DF] shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Logo size="md" variant="full" />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FDF2F0] text-[#C83E2B] border border-[#FADCD7] text-xs font-black">
              <Utensils className="w-3.5 h-3.5" />
              <span>Salão • Mesa {tableNum}</span>
            </div>

            {/* Perfil / Meus Pedidos */}
            {user?.isLoggedIn ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold cursor-pointer"
                  title="Histórico de Pedidos e Recompra em 1 Clique"
                >
                  <Clock className="w-3.5 h-3.5 text-[#C83E2B]" />
                  <span className="hidden sm:inline">Meus Pedidos</span>
                </button>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="p-1.5 rounded-xl bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  title="Perfil do Cliente"
                >
                  <User className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-bold hover:bg-emerald-100 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Entrar</span>
              </button>
            )}

            <button
              onClick={() => setIsQrModalOpen(true)}
              className="p-1.5 rounded-xl bg-neutral-100 text-neutral-600 hover:bg-neutral-200 cursor-pointer"
              title="Exibir QR Code da Mesa"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Experiência Pura de Mesa */}
      <main>
        <CustomerView
          mode="mesa"
          table={currentTable}
          products={products}
          orders={orders}
          customerName={user?.name}
          customerPhone={user?.phone}
          settings={settings}
          reorderItems={reorderCartItems}
          onClearReorder={() => setReorderCartItems(null)}
          onCallWaiter={handleCallWaiter}
          onPlaceOrder={handlePlaceOrder}
          onAddSubcomanda={handleAddSubcomanda}
        />
      </main>

      {/* Rodapé Simples */}
      <footer className="bg-white border-t border-[#EFE9DF] py-6 px-4 text-center text-xs text-neutral-400 mt-12">
        <p className="font-semibold text-neutral-700">
          {settings?.storeName || RESTAURANT_INFO.name} • {settings?.address || RESTAURANT_INFO.address}
        </p>
        <p className="text-[11px] mt-1 text-neutral-500">
          Tá na Mesa (Mesa {tableNum}) • Um produto <strong className="text-[#1F2421]">A2i Solutions</strong> em parceria com o <strong className="text-[#C83E2B]">Alô Classificados</strong>
        </p>
      </footer>

      {isAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={(loggedUser) => {
            setUser(loggedUser);
            setIsAuthModalOpen(false);
          }}
        />
      )}

      {isHistoryModalOpen && (
        <OrderHistoryModal
          customerName={user?.name || "Cliente"}
          customerPhone={user?.phone}
          orders={orders}
          onClose={() => setIsHistoryModalOpen(false)}
          onReorder={handleReorder}
        />
      )}

      {isQrModalOpen && (
        <TableQrModal tableNumber={tableNum} onClose={() => setIsQrModalOpen(false)} />
      )}

      {reviewData.isOpen && (
        <ReviewModal
          customerName={reviewData.customerName}
          tableNumber={reviewData.tableNumber}
          onClose={() => setReviewData({ isOpen: false, customerName: "" })}
          onSubmitReview={(r) => {
            const newRev: CustomerReview = {
              id: `rev-${Date.now()}`,
              customerName: r.customerName,
              tableNumber: r.tableNumber,
              rating: r.rating,
              tags: r.tags,
              comment: r.comment,
              createdAt: "Hoje",
            };
            syncState(tables, orders, [newRev, ...reviews], `⭐ Nova avaliação recebida na Mesa ${tableNum}!`);
          }}
        />
      )}
    </div>
  );
}

export default function MesaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-xs font-bold text-neutral-400">Carregando Mesa...</div>}>
      <MesaContent />
    </Suspense>
  );
}
