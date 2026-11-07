"use client";

import React, { useState, useEffect, useRef } from "react";
import { CustomerHeader } from "../components/CustomerHeader";
import { CustomerView } from "../components/CustomerView";
import { TableQrModal } from "../components/TableQrModal";
import { ReviewModal } from "../components/ReviewModal";
import { AuthModal, UserProfile } from "../components/AuthModal";
import { OrderHistoryModal } from "../components/OrderHistoryModal";
import { TablePairingModal } from "../components/TablePairingModal";
import {
  loadInitialData,
  saveStateToStorage,
  syncStateWithServer,
  initRealtimeSync,
  CustomerReview,
} from "../lib/store";
import { Table, Order, ProductItem, CartItem } from "../lib/types";
import { INITIAL_TABLES, INITIAL_ORDERS, PRODUCTS, RESTAURANT_INFO } from "../lib/mock-data";
import { StoreSettings } from "../lib/server-db";
import Link from "next/link";
import { Store, ShieldCheck } from "lucide-react";

export default function Home() {
  const [mode, setMode] = useState<"mesa" | "delivery">("delivery");
  const [activeTableNumber, setActiveTableNumber] = useState<number>(1);
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [products, setProducts] = useState<ProductItem[]>(PRODUCTS);
  const [settings, setSettings] = useState<StoreSettings | undefined>(undefined);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isAloReferral, setIsAloReferral] = useState(false);
  const [isTablePairingModalOpen, setIsTablePairingModalOpen] = useState(false);

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

  // Review Modal state
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

    // Read query params from QR scan or partner link (e.g. ?mesa=4, ?origem=aloclassificados)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get("mode");
      const mesaParam = params.get("mesa");
      const origemParam = params.get("origem")?.toLowerCase();
      const refParam = params.get("ref")?.toLowerCase();
      const cupomParam = params.get("cupom")?.toUpperCase();

      if (
        origemParam === "aloclassificados" ||
        origemParam === "alo" ||
        refParam === "aloclassificados" ||
        refParam === "alo" ||
        cupomParam === "REDINHAGRATIS" ||
        cupomParam === "FRETEALO"
      ) {
        setIsAloReferral(true);
      }

      if (mesaParam) {
        setActiveTableNumber(Number(mesaParam));
        setMode("mesa");
      } else if (modeParam === "mesa") {
        setMode("mesa");
      } else {
        setMode("delivery");
      }
    }

    // Fase 7: Sincronização Local Multi-Dispositivos em Tempo Real via Servidor (SSE)
    const cleanup = initRealtimeSync((db) => {
      if (db.tables) setTables(db.tables);
      if (db.orders) setOrders(db.orders);
      if (db.products) setProducts(db.products);
      if (db.reviews) setReviews(db.reviews);
      if (db.settings) setSettings(db.settings);
      if (db.notification) showFloatingToast(db.notification);
    });

    return () => cleanup();
  }, []);

  const syncState = (
    newTables: Table[],
    newOrders: Order[],
    newReviews?: CustomerReview[],
    notification?: string
  ) => {
    setTables(newTables);
    setOrders(newOrders);
    if (newReviews) setReviews(newReviews);

    // Salva local e replica para todos os aparelhos na rede Wi-Fi via Servidor sem sobrescrever catálogo/settings do Gestor
    syncStateWithServer(newTables, newOrders, newReviews, undefined, undefined, notification);
  };

  const showFloatingToast = (message: string) => {
    setActiveNotification(message);
    setTimeout(() => {
      setActiveNotification(null);
    }, 4500);
  };

  const currentTable =
    tables.find((t) => t.number === activeTableNumber) ||
    tables[0] || {
      id: "t1",
      number: 1,
      status: "livre" as const,
      comandas: [],
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
      type: newOrderData.type || "mesa",
      channel: newOrderData.channel || (newOrderData.type === "delivery" ? "site_proprio" : undefined),
      tableNumber: newOrderData.tableNumber,
      comandaName: newOrderData.comandaName || clientName,
      customerName: clientName,
      customerPhone: user?.phone || newOrderData.customerPhone,
      items: newOrderData.items || [],
      subtotal: newOrderData.subtotal || 0,
      deliveryFee: newOrderData.deliveryFee || 0,
      discount: newOrderData.discount || 0,
      total: newOrderData.total || 0,
      status: "pendente",
      createdAt: "Agora mesmo",
      deliveryAddress: newOrderData.deliveryAddress,
      deliveryNeighborhood: newOrderData.deliveryNeighborhood,
      paymentMethod: newOrderData.paymentMethod,
      pixTxid: newOrderData.pixTxid,
    };

    const newOrdersList = [newOrder, ...orders];
    let newTablesList = [...tables];

    if (newOrder.type === "mesa" && newOrder.tableNumber) {
      newTablesList = tables.map((tbl) => {
        if (tbl.number === newOrder.tableNumber) {
          const comandaToUpdate =
            tbl.comandas.find((cmd) => cmd.customerName === newOrder.comandaName) ||
            tbl.comandas[0];

          let updatedComandas = [...tbl.comandas];
          if (comandaToUpdate) {
            updatedComandas = tbl.comandas.map((cmd) => {
              if (cmd.id === comandaToUpdate.id) {
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
    }

    const notif =
      newOrder.type === "mesa"
        ? `🔥 Novo Pedido #${newOrder.orderNumber}: Mesa ${newOrder.tableNumber} [${newOrder.comandaName || "Comanda"}]`
        : `🛵 Novo Pedido Delivery #${newOrder.orderNumber} (${newOrder.customerName})`;

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

  const handleSaveReview = (review: {
    customerName: string;
    tableNumber?: number;
    rating: number;
    tags: string[];
    comment?: string;
  }) => {
    const newRev: CustomerReview = {
      id: `rev-${Date.now()}`,
      customerName: review.customerName,
      tableNumber: review.tableNumber,
      rating: review.rating,
      tags: review.tags,
      comment: review.comment,
      createdAt: "Hoje",
    };
    syncState(tables, orders, [newRev, ...reviews], `⭐ Nova avaliação recebida de ${review.customerName}!`);
  };

  const handleReorder = (items: CartItem[]) => {
    setReorderCartItems(items);
    setIsHistoryModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
      {/* Toast Flutuante em Tempo Real */}
      {activeNotification && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-3 fade-in duration-200">
          <div className="bg-[#1F2421] text-white px-4 py-3 rounded-2xl shadow-2xl border border-neutral-700 flex items-center gap-3 text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span>{activeNotification}</span>
          </div>
        </div>
      )}

      <div>
        {/* Cabeçalho Limpo 100% Voltado ao Cliente */}
        <CustomerHeader
          mode={mode}
          tableNumber={mode === "mesa" ? currentTable.number : undefined}
          onModeChange={setMode}
          onRequestMesaMode={() => setIsTablePairingModalOpen(true)}
          onOpenQrModal={() => setIsQrModalOpen(true)}
          user={user}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenHistory={() => setIsHistoryModalOpen(true)}
        />

        {/* Experiência do Cliente na Mesa ou no Delivery */}
        <main>
          <CustomerView
            mode={mode}
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
            isAloReferral={isAloReferral}
          />
        </main>
      </div>

      {/* Rodapé Limpo com Link de Acesso Exclusivo da Equipe */}
      <footer className="bg-white border-t border-[#EFE9DF] py-6 px-4 text-center text-xs text-neutral-400 mt-12">
        <p className="font-semibold text-neutral-700">
          {settings?.storeName || RESTAURANT_INFO.name} • {settings?.address || RESTAURANT_INFO.address}
        </p>
        <p className="text-[11px] mt-1 text-neutral-500">
          Tá na Mesa • Um produto <strong className="text-[#1F2421]">A2i Solutions</strong> em parceria com o{" "}
          <strong className="text-[#C83E2B]">Alô Classificados</strong>
        </p>

        <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
          <Link
            href="/gestor"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 hover:text-[#C83E2B] bg-neutral-100 hover:bg-[#FDF2F0] px-3 py-1.5 rounded-full transition-colors border border-neutral-200"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
            <span>Acesso da Equipe (PDV / KDS)</span>
          </Link>
        </div>
      </footer>

      {/* Modais de Autenticação, Histórico, QR Code e Avaliação */}
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
        <TableQrModal tableNumber={currentTable.number} onClose={() => setIsQrModalOpen(false)} />
      )}

      {/* Modal de Pareamento / Seleção de Mesa Segura Anti-Engano */}
      <TablePairingModal
        currentTableNumber={activeTableNumber}
        isOpen={isTablePairingModalOpen}
        storeName={settings?.storeName}
        onClose={() => setIsTablePairingModalOpen(false)}
        onSelectTable={(tableNum) => {
          setActiveTableNumber(tableNum);
          setMode("mesa");
        }}
      />

      {reviewData.isOpen && (
        <ReviewModal
          customerName={reviewData.customerName}
          tableNumber={reviewData.tableNumber}
          onClose={() => setReviewData({ isOpen: false, customerName: "" })}
          onSubmitReview={handleSaveReview}
        />
      )}
    </div>
  );
}
