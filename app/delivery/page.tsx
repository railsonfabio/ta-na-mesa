"use client";

import React, { useState, useEffect } from "react";
import { CustomerView } from "../../components/CustomerView";
import { CustomerHeader } from "../../components/CustomerHeader";
import { AuthModal, UserProfile } from "../../components/AuthModal";
import { OrderHistoryModal } from "../../components/OrderHistoryModal";
import { Logo } from "../../components/Logo";
import {
  loadInitialData,
  saveStateToStorage,
  syncStateWithServer,
  initRealtimeSync,
  CustomerReview,
} from "../../lib/store";
import { Table, Order, ProductItem, CartItem } from "../../lib/types";
import { INITIAL_TABLES, INITIAL_ORDERS, PRODUCTS, RESTAURANT_INFO } from "../../lib/mock-data";
import { StoreSettings } from "../../lib/server-db";
import { Bike, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DeliveryPage() {
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [products, setProducts] = useState<ProductItem[]>(PRODUCTS);
  const [settings, setSettings] = useState<StoreSettings | undefined>(undefined);

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
  }, []);

  const syncState = (newTables: Table[], newOrders: Order[], notification?: string) => {
    setTables(newTables);
    setOrders(newOrders);
    syncStateWithServer(newTables, newOrders, undefined, undefined, undefined, notification);
  };

  const showFloatingToast = (message: string) => {
    setActiveNotification(message);
    setTimeout(() => setActiveNotification(null), 4500);
  };

  const handlePlaceOrder = (newOrderData: Partial<Order>) => {
    const orderNumber = Math.max(...orders.map((o) => o.orderNumber || 0), 100) + 1;
    const clientName = user?.isLoggedIn ? user.name : newOrderData.customerName || "Cliente Delivery";

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      type: "delivery",
      channel: newOrderData.channel || "site_proprio",
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
    };

    const newOrdersList = [newOrder, ...orders];
    const notif = `🛵 Novo Pedido Delivery #${newOrder.orderNumber} (${newOrder.customerName})`;
    syncState(tables, newOrdersList, notif);
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
        <CustomerHeader
          mode="delivery"
          onModeChange={(newMode) => {
            if (newMode === "mesa") {
              router.push("/mesa/4");
            }
          }}
          user={user}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenHistory={() => setIsHistoryModalOpen(true)}
        />

        <main>
          <CustomerView
            mode="delivery"
            table={tables[0]}
            products={products}
            orders={orders}
            customerName={user?.name}
            customerPhone={user?.phone}
            settings={settings}
            reorderItems={reorderCartItems}
            onClearReorder={() => setReorderCartItems(null)}
            onCallWaiter={() => {}}
            onPlaceOrder={handlePlaceOrder}
            onAddSubcomanda={() => {}}
          />
        </main>
      </div>

      <footer className="bg-white border-t border-[#EFE9DF] py-6 px-4 text-center text-xs text-neutral-400 mt-12">
        <p className="font-semibold text-neutral-700">{settings?.storeName || RESTAURANT_INFO.name} • Delivery Oficial</p>
        <p className="text-[11px] mt-1 text-neutral-500">
          Tá na Mesa • Um produto <strong className="text-[#1F2421]">A2i Solutions</strong> integrado ao{" "}
          <strong className="text-[#C83E2B]">Alô Classificados</strong>
        </p>
        <div className="mt-3">
          <Link
            href="/gestor"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 hover:text-[#C83E2B] bg-neutral-100 hover:bg-[#FDF2F0] px-3 py-1.5 rounded-full transition-colors border border-neutral-200"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
            <span>Acesso da Equipe do Restaurante (PDV / KDS)</span>
          </Link>
        </div>
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
    </div>
  );
}
