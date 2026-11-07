"use client";

import React, { useState, useEffect, useRef } from "react";
import { ManagerView } from "../../components/ManagerView";
import { ReceiptModal } from "../../components/ReceiptModal";
import { OnboardingWizardModal } from "../../components/OnboardingWizardModal";
import { resolveItemPrepSector } from "../../components/KitchenView";
import {
  loadInitialData,
  saveStateToStorage,
  syncStateWithServer,
  initRealtimeSync,
  CustomerReview,
  resetCleanStateOnServer,
  seedDemoStateOnServer,
} from "../../lib/store";
import { Table, Order, OrderStatus, ProductItem, StockItem, Supplier, FinancialExpense } from "../../lib/types";
import { INITIAL_TABLES, INITIAL_ORDERS, PRODUCTS, RESTAURANT_INFO, INITIAL_STOCK, INITIAL_SUPPLIERS, INITIAL_EXPENSES } from "../../lib/mock-data";
import { StoreSettings } from "../../lib/server-db";
import { Logo } from "../../components/Logo";
import Link from "next/link";
import { ChefHat, UserCheck, ArrowLeft, Sparkles } from "lucide-react";

export default function GestorPage() {
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [products, setProducts] = useState<ProductItem[]>(PRODUCTS);
  const [settings, setSettings] = useState<StoreSettings | undefined>(undefined);
  const [stock, setStock] = useState<StockItem[]>(INITIAL_STOCK);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [expenses, setExpenses] = useState<FinancialExpense[]>(INITIAL_EXPENSES);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("onboarding=1")) {
      setIsOnboardingOpen(true);
    }
    const data = loadInitialData();
    setTables(data.tables);
    setOrders(data.orders);
    setReviews(data.reviews);
    if (data.products?.length) setProducts(data.products);

    const cleanup = initRealtimeSync((db) => {
      if (db.tables) setTables(db.tables);
      if (db.orders) setOrders(db.orders);
      if (db.products) setProducts(db.products);
      if (db.reviews) setReviews(db.reviews);
      if (db.settings) setSettings(db.settings);
      if (db.stock) setStock(db.stock);
      if (db.suppliers) setSuppliers(db.suppliers);
      if (db.expenses) setExpenses(db.expenses);
    });

    return () => cleanup();
  }, []);

  const syncState = (
    newTables: Table[],
    newOrders: Order[],
    newProducts?: ProductItem[],
    newSettings?: StoreSettings,
    notification?: string,
    newStock?: StockItem[],
    newSuppliers?: Supplier[],
    newExpenses?: FinancialExpense[]
  ) => {
    const currentProds = newProducts || products;
    const currentSettings = newSettings || settings;
    const currentStock = newStock || stock;
    const currentSuppliers = newSuppliers || suppliers;
    const currentExpenses = newExpenses || expenses;

    setTables(newTables);
    setOrders(newOrders);
    if (newProducts) setProducts(newProducts);
    if (newSettings) setSettings(newSettings);
    if (newStock) setStock(newStock);
    if (newSuppliers) setSuppliers(newSuppliers);
    if (newExpenses) setExpenses(newExpenses);

    syncStateWithServer(
      newTables,
      newOrders,
      reviews,
      currentProds,
      currentSettings,
      notification,
      currentStock,
      currentSuppliers,
      currentExpenses
    );
  };

  const handleAddOrder = (newOrder: Order) => {
    const updated = [newOrder, ...orders];
    syncState(
      tables,
      updated,
      undefined,
      undefined,
      `🔔 Novo Pedido #${newOrder.orderNumber} via WhatsApp Bot (${newOrder.customerName})!`
    );
  };

  const handleUpdateOrderStatus = (
    orderId: string,
    newStatus: OrderStatus,
    courierData?: { courierId: string; courierName: string; courierPhone: string }
  ) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    const updated = orders.map((ord) =>
      ord.id === orderId
        ? {
            ...ord,
            status: newStatus,
            ...(newStatus === "em_preparo"
              ? {
                  acceptedAt: ord.acceptedAt || new Date().toISOString(),
                  items: ord.items.map((it) => ({
                    ...it,
                    prepSector: it.prepSector || resolveItemPrepSector(it),
                    isReady: Boolean(it.isReady),
                  })),
                }
              : {}),
            ...(courierData
              ? {
                  courierId: courierData.courierId,
                  courierName: courierData.courierName,
                  courierPhone: courierData.courierPhone,
                  dispatchedAt: new Date().toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                }
              : {}),
          }
        : ord
    );
    let notif: string | undefined = undefined;

    if (newStatus === "em_preparo") {
      notif = `👨‍🍳 Pedido #${targetOrder?.orderNumber} confirmado pelo restaurante e em preparo na cozinha!`;
      // Bloco 3: Se Impressão Automática ao Aceitar estiver ativa, abre o cupom térmico na hora
      if (settings?.enableAutoPrintOnAccept && targetOrder) {
        setReceiptOrder({ ...targetOrder, status: "em_preparo" });
      }
    } else if (newStatus === "a_caminho") {
      const courierLabel =
        courierData?.courierName || targetOrder?.courierName
          ? ` com o entregador ${courierData?.courierName || targetOrder?.courierName}`
          : "";
      notif =
        targetOrder?.type === "mesa"
          ? `🍽️ Pedido #${targetOrder.orderNumber} ficou pronto e está a caminho da Mesa ${targetOrder.tableNumber}!`
          : `🛵 Pedido #${targetOrder?.orderNumber} ficou pronto e saiu para entrega${courierLabel}!`;
    } else if (newStatus === "entregue") {
      notif =
        targetOrder?.type === "mesa"
          ? `✅ Pedido #${targetOrder.orderNumber} entregue e servido na Mesa ${targetOrder.tableNumber}! Bom apetite!`
          : `✅ Pedido #${targetOrder?.orderNumber} entregue com sucesso! Bom apetite!`;
    }

    syncState(tables, updated, undefined, undefined, notif);
  };

  const handleAssignCourier = (
    orderId: string,
    courier: { id: string; name: string; phone: string }
  ) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    const updated = orders.map((ord) =>
      ord.id === orderId
        ? {
            ...ord,
            courierId: courier.id,
            courierName: courier.name,
            courierPhone: courier.phone,
            dispatchedAt:
              ord.dispatchedAt ||
              new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          }
        : ord
    );
    syncState(
      tables,
      updated,
      undefined,
      undefined,
      `🛵 Entregador ${courier.name} vinculado ao Pedido #${targetOrder?.orderNumber}!`
    );
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

    syncState(updated, orders, undefined, undefined, `💰 Comanda de ${closedName} quitada na Mesa ${tableNumber}!`);
  };

  const handleClearTableCall = (tableNumber: number) => {
    const updated = tables.map((tbl) =>
      tbl.number === tableNumber
        ? { ...tbl, status: "ocupada" as const, callReason: undefined }
        : tbl
    );
    syncState(updated, orders);
  };

  const handleUpdateProductPrice = (productId: string, newPrice: number) => {
    const updated = products.map((p) => (p.id === productId ? { ...p, price: newPrice } : p));
    syncState(tables, orders, updated);
  };

  const handleToggleProductAvailability = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    const newStatus = target?.isAvailable === false ? true : false;
    const updated = products.map((p) =>
      p.id === productId ? { ...p, isAvailable: newStatus } : p
    );
    const notif = newStatus
      ? `✅ "${target?.name}" agora está DISPONÍVEL no cardápio!`
      : `⏸️ "${target?.name}" foi marcado como ESGOTADO!`;

    syncState(tables, orders, updated, undefined, notif);
  };

  const handleAddProduct = (newProduct: ProductItem) => {
    const updated = [newProduct, ...products];
    syncState(tables, orders, updated);
  };

  const handleEditProduct = (updatedProduct: ProductItem) => {
    const updated = products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
    syncState(tables, orders, updated, undefined, `✏️ Produto "${updatedProduct.name}" atualizado no cardápio.`);
  };

  const handleDeleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    const updated = products.filter((p) => p.id !== productId);
    syncState(tables, orders, updated, undefined, `🗑️ Produto "${target?.name}" excluído do cardápio.`);
  };

  const handleBulkUpdateProducts = (newProducts: ProductItem[]) => {
    syncState(tables, orders, newProducts, undefined, `📊 Cardápio atualizado em massa via Excel (${newProducts.length} itens)!`);
  };

  const handleAddTable = (tableNumber: number) => {
    const newTbl: Table = {
      id: `t${tableNumber}`,
      number: tableNumber,
      status: "livre",
      comandas: [],
    };
    const updated = [...tables, newTbl].sort((a, b) => a.number - b.number);
    syncState(updated, orders);
  };

  const handleFreeTable = (tableNumber: number) => {
    const updated = tables.map((t) =>
      t.number === tableNumber
        ? { ...t, status: "livre" as const, comandas: [], callReason: undefined }
        : t
    );
    syncState(updated, orders);
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

    // Atualiza os pedidos da cozinha caso o item cancelado esteja em preparo
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

    const notif = `🗑️ Gestor cancelou 1x ${removedItemName} da comanda de ${customerName} (Mesa ${tableNumber})`;
    syncState(updatedTables, updatedOrders, undefined, undefined, notif);
  };

  const handleSaveSettings = (newSettings: StoreSettings) => {
    syncState(tables, orders, products, newSettings, "⚙️ Configurações da loja atualizadas!");
  };

  const handleResetClean = async () => {
    if (confirm("⚠️ Tem certeza que deseja zerar o salão? Todas as 10 mesas ficarão livres e todos os pedidos serão limpos para testes.")) {
      await resetCleanStateOnServer("🧹 Salão zerado com sucesso! 10 mesas livres e pedidos limpos.");
    }
  };

  const handleSeedDemo = async () => {
    if (confirm("🧪 Deseja carregar o cenário completo de simulação com comandas e pedidos de teste?")) {
      await seedDemoStateOnServer("🧪 Cenário de teste e simulação carregado com sucesso!");
    }
  };

  const handleUpdateStock = (newStock: StockItem[]) => {
    syncState(tables, orders, products, settings, undefined, newStock);
  };

  const handleUpdateSuppliers = (newSuppliers: Supplier[]) => {
    syncState(tables, orders, products, settings, undefined, undefined, newSuppliers);
  };

  const handleUpdateExpenses = (newExpenses: FinancialExpense[]) => {
    syncState(tables, orders, products, settings, undefined, undefined, undefined, newExpenses);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Barra Interna da Equipe */}
      <div className="bg-[#1F2421] text-white px-4 py-2.5 text-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" variant="icon" />
          <span className="font-bold">Painel Operacional do Restaurante</span>
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
            {settings?.storeName || RESTAURANT_INFO.name}
          </span>
          <span className="hidden sm:inline-block text-[10px] text-neutral-400 font-medium border-l border-neutral-700 pl-3">
            by <strong>A2i Solutions</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOnboardingOpen(true)}
            className="flex items-center gap-1.5 bg-[#C83E2B] hover:bg-[#b03524] text-white px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ativar Loja (Wizard)</span>
          </button>
          <Link
            href="/cozinha"
            className="flex items-center gap-1.5 hover:text-[#F4A261] transition-colors"
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Abrir KDS Cozinha</span>
          </Link>
          <Link
            href="/garcom"
            className="flex items-center gap-1.5 hover:text-[#F4A261] transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Terminal Garçom</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-neutral-300 text-neutral-400 ml-2"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Ver Cardápio do Cliente</span>
          </Link>
        </div>
      </div>

      <ManagerView
        orders={orders}
        tables={tables}
        products={products}
        settings={settings}
        stock={stock}
        suppliers={suppliers}
        expenses={expenses}
        onAddOrder={handleAddOrder}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onAssignCourier={handleAssignCourier}
        onCloseComanda={handleCloseComanda}
        onRemoveItemFromComanda={handleRemoveItemFromComanda}
        onClearTableCall={handleClearTableCall}
        onPrintReceipt={(order) => setReceiptOrder(order)}
        onUpdateProductPrice={handleUpdateProductPrice}
        onToggleProductAvailability={handleToggleProductAvailability}
        onAddProduct={handleAddProduct}
        onEditProduct={handleEditProduct}
        onDeleteProduct={handleDeleteProduct}
        onBulkUpdateProducts={handleBulkUpdateProducts}
        onAddTable={handleAddTable}
        onFreeTable={handleFreeTable}
        onSaveSettings={handleSaveSettings}
        onResetClean={handleResetClean}
        onSeedDemo={handleSeedDemo}
        onUpdateStock={handleUpdateStock}
        onUpdateSuppliers={handleUpdateSuppliers}
        onUpdateExpenses={handleUpdateExpenses}
      />

      {receiptOrder && (
        <ReceiptModal order={receiptOrder} settings={settings} onClose={() => setReceiptOrder(null)} />
      )}

      <OnboardingWizardModal
        isOpen={isOnboardingOpen}
        initialSettings={settings}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={(updatedSettings) => {
          setSettings(updatedSettings);
          handleSaveSettings(updatedSettings);
        }}
      />
    </div>
  );
}
