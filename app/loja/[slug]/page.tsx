"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Store, Loader2, AlertTriangle } from "lucide-react";
import { CustomerHeader } from "../../../components/CustomerHeader";
import { CustomerView } from "../../../components/CustomerView";
import { TableQrModal } from "../../../components/TableQrModal";
import { ReviewModal } from "../../../components/ReviewModal";
import { AuthModal, UserProfile } from "../../../components/AuthModal";
import { OrderHistoryModal } from "../../../components/OrderHistoryModal";
import { TablePairingModal } from "../../../components/TablePairingModal";
import { getSupabaseBrowserClient } from "../../../lib/supabase-client";
import {
  useSyncStore,
  syncStateWithServer,
  CustomerReview,
} from "../../../lib/store";
import { Table, Order, CartItem } from "../../../lib/types";
import { RESTAURANT_INFO } from "../../../lib/mock-data";

function TenantStorefrontContent() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = (params?.slug || "").toLowerCase();

  // Estado da busca inicial da loja pelo `slug` na tabela `stores`
  const [resolvedStoreId, setResolvedStoreId] = useState<string | undefined>(
    undefined
  );
  const [resolvingSlug, setResolvingSlug] = useState<boolean>(true);
  const [storeNotFound, setStoreNotFound] = useState<boolean>(false);

  // Hook Multi-Tenant alimentado diretamente pelo `store_id` encontrado
  const {
    orders,
    tables,
    products,
    settings,
    reviews,
    setOrders,
    setTables,
    setReviews,
  } = useSyncStore(resolvedStoreId);

  const [mode, setMode] = useState<"mesa" | "delivery">("delivery");
  const [activeTableNumber, setActiveTableNumber] = useState<number>(1);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isAloReferral, setIsAloReferral] = useState(false);
  const [isTablePairingModalOpen, setIsTablePairingModalOpen] = useState(false);

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
  const [reorderCartItems, setReorderCartItems] = useState<CartItem[] | null>(
    null
  );
  const [reviewData, setReviewData] = useState<{
    isOpen: boolean;
    customerName: string;
    tableNumber?: number;
  }>({
    isOpen: false,
    customerName: "",
  });

  // 1. Busca o `id` e dados da loja na tabela `stores` do Supabase a partir do `slug` da URL
  useEffect(() => {
    let isMounted = true;

    async function fetchStoreBySlug() {
      if (!slug) {
        setStoreNotFound(true);
        setResolvingSlug(false);
        return;
      }

      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        setResolvingSlug(false);
        return;
      }

      try {
        const supabase = getSupabaseBrowserClient();
        const candidateSlugs =
          slug === "brasa-burger" || slug === "brasa-burger-grill"
            ? ["brasa-burger-grill", "brasa-burger"]
            : [slug];
        const { data: storeRow, error } = await supabase
          .from("stores")
          .select("id, slug, store_name, is_open")
          .in("slug", candidateSlugs)
          .limit(1)
          .maybeSingle();

        if (!isMounted) return;

        if (error || !storeRow?.id) {
          setStoreNotFound(true);
          setResolvingSlug(false);
          return;
        }

        setResolvedStoreId(storeRow.id);
        setStoreNotFound(false);
      } catch {
        if (isMounted) setStoreNotFound(true);
      } finally {
        if (isMounted) setResolvingSlug(false);
      }
    }

    fetchStoreBySlug();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // 2. Leitura de parâmetros de QR Code da Mesa (?mesa=4) ou campanha Alô Classificados
  useEffect(() => {
    const modeParam = searchParams.get("mode");
    const mesaParam = searchParams.get("mesa");
    const origemParam = searchParams.get("origem")?.toLowerCase();
    const refParam = searchParams.get("ref")?.toLowerCase();
    const cupomParam = searchParams.get("cupom")?.toUpperCase();

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
  }, [searchParams]);

  const syncTenantState = (
    newTables: Table[],
    newOrders: Order[],
    newReviews?: CustomerReview[],
    notification?: string
  ) => {
    setTables(newTables);
    setOrders(newOrders);
    if (newReviews) setReviews(newReviews);

    syncStateWithServer(
      newTables,
      newOrders,
      newReviews,
      undefined,
      undefined,
      notification,
      undefined,
      undefined,
      undefined,
      resolvedStoreId
    );
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
    syncTenantState(updated, orders, undefined, notif);
    alert(`🔔 Chamado enviado ao garçom: "${reason}". O garçom foi notificado!`);
  };

  const handlePlaceOrder = (newOrderData: Partial<Order>) => {
    const orderNumber =
      Math.max(...orders.map((o) => o.orderNumber || 0), 100) + 1;
    const clientName = user?.isLoggedIn
      ? user.name
      : newOrderData.customerName || "Cliente";

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      type: newOrderData.type || "mesa",
      channel:
        newOrderData.channel ||
        (newOrderData.type === "delivery" ? "site_proprio" : undefined),
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
      couponCode: newOrderData.couponCode,
    };

    const newOrdersList = [newOrder, ...orders];
    let newTablesList = [...tables];

    if (newOrder.type === "mesa" && newOrder.tableNumber) {
      newTablesList = tables.map((tbl) => {
        if (tbl.number === newOrder.tableNumber) {
          const comandaToUpdate =
            tbl.comandas.find(
              (cmd) => cmd.customerName === newOrder.comandaName
            ) || tbl.comandas[0];

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

    syncTenantState(newTablesList, newOrdersList, undefined, notif);
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

    syncTenantState(
      updated,
      orders,
      undefined,
      `👤 Mesa ${tableNumber}: Nova comanda "${name}" aberta!`
    );
  };

  const handleRegisterPayment = (
    tableNumber: number,
    comandaId: string | undefined,
    amount: number,
    method: string
  ) => {
    const updated = tables.map((tbl) => {
      if (tbl.number === tableNumber) {
        let remainingToDistribute = amount;

        const updatedComandas = tbl.comandas.map((cmd) => {
          if (!comandaId || cmd.id === comandaId) {
            const addPay = comandaId
              ? amount
              : Math.min(
                  remainingToDistribute,
                  Math.max(0, cmd.total - (cmd.paidAmount || 0))
                );
            remainingToDistribute -= addPay;
            const newPaid = (cmd.paidAmount || 0) + addPay;
            return {
              ...cmd,
              paidAmount: newPaid,
              status:
                newPaid >= cmd.total && cmd.total > 0
                  ? ("paga" as const)
                  : cmd.status,
            };
          }
          return cmd;
        });

        const totalCons = updatedComandas.reduce((s, c) => s + c.total, 0);
        const totalPaid = updatedComandas.reduce(
          (s, c) => s + (c.paidAmount || 0),
          0
        );
        const allPaid = totalPaid >= totalCons && totalCons > 0;

        return {
          ...tbl,
          status: allPaid ? ("pedindo_conta" as const) : tbl.status,
          comandas: updatedComandas,
        };
      }
      return tbl;
    });

    const notif = `💳 Mesa ${tableNumber}: Pagamento de R$ ${amount.toFixed(
      2
    )} (${method.toUpperCase()}) registrado!`;
    syncTenantState(updated, orders, reviews, notif);
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
    syncTenantState(tables, orders, [newRev, ...reviews]);
  };

  if (resolvingSlug) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-[#C83E2B] animate-spin mb-3" />
        <p className="text-sm font-bold text-stone-700">
          Carregando cardápio digital de{" "}
          <span className="text-[#C83E2B]">{slug}</span>...
        </p>
      </div>
    );
  }

  if (storeNotFound) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-black text-stone-900">
          Estabelecimento não encontrado
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-sm">
          Não localizamos nenhuma loja ativa com o identificador{" "}
          <strong className="text-stone-800">&quot;{slug}&quot;</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
      <div>
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
            onRegisterPayment={handleRegisterPayment}
            isAloReferral={isAloReferral}
          />
        </main>
      </div>

      <footer className="bg-white border-t border-[#EFE9DF] py-6 px-4 text-center text-xs text-neutral-400 mt-12">
        <p className="font-semibold text-neutral-700">
          {settings?.storeName || RESTAURANT_INFO.name} •{" "}
          {settings?.address || RESTAURANT_INFO.address}
        </p>
        <p className="text-[11px] mt-1 text-neutral-500">
          Tá na Mesa • Um produto{" "}
          <strong className="text-[#1F2421]">A2i Solutions</strong> em parceria
          com o <strong className="text-[#C83E2B]">Alô Classificados</strong>
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
          onReorder={(items) => {
            setReorderCartItems(items);
            setIsHistoryModalOpen(false);
          }}
        />
      )}

      {isQrModalOpen && (
        <TableQrModal
          tableNumber={currentTable.number}
          onClose={() => setIsQrModalOpen(false)}
        />
      )}

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

export default function TenantStorefrontPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7]" />}>
      <TenantStorefrontContent />
    </Suspense>
  );
}
