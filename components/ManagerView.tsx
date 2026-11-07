"use client";

import React, { useState, useRef } from "react";
import { Order, Table, OrderStatus } from "../lib/types";
import {
  Store,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Users,
  Utensils,
  Bike,
  Plus,
  BarChart3,
  TrendingUp,
  Package,
  AlertTriangle,
  Sparkles,
  ShoppingBag,
  ArrowUpRight,
  Printer,
  QrCode,
  Settings,
  RotateCcw,
  MessageCircle,
  Wallet,
  Bot,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DeviceHubModal } from "./DeviceHubModal";
import { TableMapTab } from "./TableMapTab";
import { MenuManagerTab } from "./MenuManagerTab";
import { StoreSettingsTab } from "./StoreSettingsTab";
import { CashRegisterModal } from "./CashRegisterModal";
import { CloseComandaModal } from "./CloseComandaModal";
import { WhatsAppBotModal } from "./WhatsAppBotModal";
import { DeliveryIntegrationsModal } from "./DeliveryIntegrationsModal";
import { InventoryAndFinanceTab } from "./InventoryAndFinanceTab";
import { ProductItem, Comanda, StockItem, Supplier, FinancialExpense } from "../lib/types";
import { PRODUCTS, RESTAURANT_INFO, INITIAL_STOCK, INITIAL_SUPPLIERS, INITIAL_EXPENSES } from "../lib/mock-data";
import { StoreSettings } from "../lib/server-db";

interface ManagerViewProps {
  orders: Order[];
  tables: Table[];
  products?: ProductItem[];
  settings?: StoreSettings;
  stock?: StockItem[];
  suppliers?: Supplier[];
  expenses?: FinancialExpense[];
  onUpdateOrderStatus: (
    orderId: string,
    newStatus: OrderStatus,
    courierData?: { courierId: string; courierName: string; courierPhone: string }
  ) => void;
  onAssignCourier?: (
    orderId: string,
    courier: { id: string; name: string; phone: string }
  ) => void;
  onAddOrder?: (order: Order) => void;
  onCloseComanda: (tableNumber: number, comandaId: string) => void;
  onRemoveItemFromComanda?: (tableNumber: number, comandaId: string, itemId: string) => void;
  onClearTableCall: (tableNumber: number) => void;
  onPrintReceipt?: (order: Order) => void;
  onUpdateProductPrice?: (productId: string, newPrice: number) => void;
  onToggleProductAvailability?: (productId: string) => void;
  onAddProduct?: (product: ProductItem) => void;
  onEditProduct?: (product: ProductItem) => void;
  onDeleteProduct?: (productId: string) => void;
  onBulkUpdateProducts?: (newProducts: ProductItem[]) => void;
  onAddTable?: (tableNumber: number) => void;
  onFreeTable?: (tableNumber: number) => void;
  onSaveSettings?: (newSettings: StoreSettings) => void;
  onResetClean?: () => void;
  onSeedDemo?: () => void;
  onUpdateStock?: (newStock: StockItem[]) => void;
  onUpdateSuppliers?: (newSuppliers: Supplier[]) => void;
  onUpdateExpenses?: (newExpenses: FinancialExpense[]) => void;
}

export function ManagerView({
  orders,
  tables,
  products = PRODUCTS,
  settings,
  stock,
  suppliers,
  expenses,
  onUpdateOrderStatus,
  onAssignCourier,
  onAddOrder,
  onCloseComanda,
  onRemoveItemFromComanda,
  onClearTableCall,
  onPrintReceipt,
  onUpdateProductPrice,
  onToggleProductAvailability,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onBulkUpdateProducts,
  onAddTable,
  onFreeTable,
  onSaveSettings,
  onResetClean,
  onSeedDemo,
  onUpdateStock,
  onUpdateSuppliers,
  onUpdateExpenses,
}: ManagerViewProps) {
  const [activeTab, setActiveTab] = useState<
    "pedidos" | "mesas" | "cardapio" | "relatorios" | "retaguarda" | "equipe" | "configuracoes"
  >("pedidos");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isDeviceHubOpen, setIsDeviceHubOpen] = useState(false);
  const [isCashRegisterOpen, setIsCashRegisterOpen] = useState(false);
  const [closingComandaData, setClosingComandaData] = useState<{ tableNumber: number; comanda: Comanda } | null>(null);
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [isIntegrationsModalOpen, setIsIntegrationsModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const managerTabsRef = useRef<HTMLDivElement | null>(null);

  const scrollManagerTabs = (direction: "left" | "right") => {
    if (!managerTabsRef.current) return;
    const scrollAmount = direction === "left" ? -280 : 280;
    managerTabsRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  // Play realistic synthesized ding-dong notification sound using Web Audio API
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch {
      // Audio fallback
    }
  };

  const pendingOrders = orders.filter((o) => o.status === "pendente");
  const preparingOrders = orders.filter((o) => o.status === "em_preparo");
  const readyOrders = orders.filter((o) => o.status === "a_caminho");
  const completedOrders = orders.filter((o) => o.status === "entregue");

  const availableCouriers =
    settings?.couriers && settings.couriers.length > 0
      ? settings.couriers.filter((c) => c.active)
      : [
          { id: "mot-1", name: "Carlos Motoboy (Fixo)", phone: "84998112233", active: true },
          { id: "mot-2", name: "Júnior Express", phone: "84998223344", active: true },
          { id: "mot-3", name: "Roberto Entregas", phone: "84998334455", active: true },
        ];

  // Bloco 3: Campainha Persistente ("Modo iFood") enquanto houver pedido aguardando aceite
  React.useEffect(() => {
    if (
      pendingOrders.length === 0 ||
      !soundEnabled ||
      settings?.enablePersistentSoundAlert === false
    ) {
      return;
    }
    const interval = setInterval(() => {
      playAlertSound();
    }, 15000);
    return () => clearInterval(interval);
  }, [pendingOrders.length, soundEnabled, settings?.enablePersistentSoundAlert]);

  // Bloco 2: Despacho em 1 Clique para o WhatsApp do Motoboy com Rota Google Maps
  const openCourierWhatsAppDispatch = (order: Order) => {
    const fallbackCourier = availableCouriers[0];
    const courierName = order.courierName || fallbackCourier?.name || "Entregador";
    const rawCourierPhone = order.courierPhone || fallbackCourier?.phone || "84998112233";
    const cleanPhone = rawCourierPhone.replace(/\D/g, "");
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;

    const addressText = order.deliveryAddress || order.deliveryNeighborhood || "Natal/RN";
    const mapsQuery = encodeURIComponent(`${addressText}, Natal - RN`);
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

    const itemsList = order.items.map((i) => `• ${i.quantity}x ${i.name}`).join("\n");
    const msg =
      `🛵 *FICHA DE DESPACHO DELIVERY — #${order.orderNumber}*\n` +
      `👤 *Motoboy:* ${courierName}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🏠 *Cliente:* ${order.customerName}\n` +
      `📞 *Tel Cliente:* ${order.customerPhone || "No cupom"}\n` +
      `📍 *Endereço:* ${addressText}\n` +
      `🗺️ *Abrir Rota no GPS (Google Maps):*\n${mapsLink}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 *Itens:*\n${itemsList}\n\n` +
      `💰 *Total do Pedido:* R$ ${order.total.toFixed(2)}\n` +
      `🏍️ *Sua Taxa desta Corrida:* R$ ${(order.deliveryFee || 0).toFixed(2)}\n` +
      `💳 *Pagamento:* ${order.paymentMethod || "Conferir na comanda"}`;

    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const openWhatsAppNotification = (order: Order) => {
    const rawPhone = order.customerPhone || "84998002020";
    const cleanPhone = rawPhone.replace(/\D/g, "");
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;

    let statusText = "recebido e confirmado";
    if (order.status === "em_preparo") {
      statusText = "está na chapa sendo preparado 👨‍🍳";
    } else if (order.status === "a_caminho") {
      statusText =
        order.type === "mesa"
          ? `ficou pronto e está sendo servido na sua Mesa ${order.tableNumber} 🍽️`
          : "saiu para entrega com o nosso motoboy 🛵";
    }

    const currentStore = settings?.storeName || RESTAURANT_INFO.name;
    const itemsList = order.items.map((i) => `• ${i.quantity}x ${i.name}`).join("\n");
    const msg = `Olá, *${order.customerName}*! 👋\n\nSeu pedido *#${order.orderNumber}* no *${currentStore}* ${statusText}!\n\n📋 *Resumo:*\n${itemsList}\n\n💰 *Total:* R$ ${order.total.toFixed(2)}\n\nAgradecemos a sua preferência! Tá na Mesa 🍽️`;

    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-24">
      {/* Topo do Gestor */}
      <div className="bg-white border-b border-[#EFE9DF] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#231F1C] text-white flex items-center justify-center font-bold">
                <Store className="w-5 h-5 text-[#BD4D2D]" />
              </div>
              <div>
                <h1 className="text-lg font-black text-[#231F1C]">Painel Gestor da Loja (PDV)</h1>
                <p className="text-xs text-neutral-500">Operação em tempo real • {settings?.storeName || RESTAURANT_INFO.name}</p>
              </div>
            </div>

            {/* Controle de Som, Pareamento, Caixa e Status da Loja */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCashRegisterOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
                title="Abrir controle de caixa, conciliação e sangrias"
              >
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>💼 Caixa & Turno</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBotModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E7FFDB] hover:bg-[#d4f8c2] text-[#075E54] border border-[#a2e88a] transition-colors cursor-pointer shadow-xs"
                title="Abrir Simulador e Configuração do Bot de WhatsApp com IA"
              >
                <Bot className="w-4 h-4 text-[#075E54]" />
                <span>🤖 Bot WhatsApp IA</span>
              </button>

              <button
                type="button"
                onClick={() => setIsIntegrationsModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-[#EA1D2C] border border-rose-200 transition-colors cursor-pointer shadow-xs"
                title="Hub de Integrações Delivery: iFood, 99Food, Keeta e Webhook APIs"
              >
                <span className="text-sm">🛵</span>
                <span>Integrações (iFood / 99 / Keeta)</span>
              </button>

              {onResetClean && (
                <button
                  type="button"
                  onClick={onResetClean}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-neutral-100 hover:bg-rose-50 text-neutral-600 hover:text-rose-700 border border-neutral-200 hover:border-rose-200 transition-colors cursor-pointer"
                  title="Zerar mesas e limpar pedidos de teste"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Zerar Salão</span>
                </button>
              )}

              {onSeedDemo && (
                <button
                  type="button"
                  onClick={onSeedDemo}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors cursor-pointer"
                  title="Carregar cenário completo de simulação para testes"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Simulação Demo</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsDeviceHubOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FEF6EC] border border-[#FBD9B0] text-[#D97706] hover:bg-[#FDEEDC] transition-colors cursor-pointer"
                title="Abrir QR Codes para conectar celular e tablet sem digitar link"
              >
                <QrCode className="w-4 h-4 text-[#BD4D2D]" />
                <span>📲 Parear Aparelhos</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playAlertSound();
                  setSoundEnabled(!soundEnabled);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  soundEnabled
                    ? "bg-[#FEF6EC] border-[#FBD9B0] text-[#D97706]"
                    : "bg-neutral-100 border-neutral-200 text-neutral-400"
                }`}
                title="Tocar som de campainha quando entrar novo pedido"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="hidden sm:inline">{soundEnabled ? "Alerta Sonoro: ATIVO" : "Silenciado"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onSaveSettings && settings) {
                    onSaveSettings({ ...settings, isOpen: !settings.isOpen });
                  }
                }}
                title="Clique para alternar entre Loja Aberta e Loja Fechada"
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                  settings?.isOpen === false
                    ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    settings?.isOpen === false ? "bg-rose-500" : "bg-emerald-500 animate-pulse"
                  }`}
                />
                <span>{settings?.isOpen === false ? "Loja Fechada" : "Loja Aberta"}</span>
              </button>
            </div>
          </div>

          {/* Abas do Gestor com Setas Laterais e Barra de Rolagem para Desktop */}
          <div className="relative flex items-center gap-1.5 mt-5 border-t border-neutral-100 pt-3">
            {/* Botão Seta Esquerda */}
            <button
              type="button"
              onClick={() => scrollManagerTabs("left")}
              className="flex-shrink-0 w-8 h-8 rounded-xl bg-white border border-[#EFE9DF] hover:border-[#C83E2B] hover:text-[#C83E2B] text-neutral-600 flex items-center justify-center shadow-2xs transition-all cursor-pointer"
              title="Rolar abas para a esquerda"
              aria-label="Rolar para a esquerda"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div
              ref={managerTabsRef}
              onWheel={(e) => {
                if (managerTabsRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                  managerTabsRef.current.scrollLeft += e.deltaY;
                }
              }}
              className="flex items-center gap-2 overflow-x-auto pb-1.5 scroll-smooth flex-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-neutral-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300 hover:[&::-webkit-scrollbar-thumb]:bg-[#C83E2B]/60 [&::-webkit-scrollbar-thumb]:rounded-full"
            >
              <button
                onClick={(e) => {
                  setActiveTab("pedidos");
                  e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "pedidos"
                    ? "bg-[#1F2421] text-white shadow-xs"
                    : "bg-white text-neutral-600 border border-[#EFE9DF] hover:bg-neutral-50"
                }`}
                title="Esteira Operacional Kanban: Novos Pedidos, Em Preparo na Cozinha, A Caminho/Prontos e Finalizados"
              >
                <span>📋 Fila de Pedidos & KDS</span>
                {pendingOrders.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#C83E2B] text-white text-[10px] flex items-center justify-center font-bold">
                    {pendingOrders.length}
                  </span>
                )}
              </button>

              <button
                onClick={(e) => {
                  setActiveTab("mesas");
                  e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "mesas"
                    ? "bg-[#1F2421] text-white shadow-xs"
                    : "bg-white text-neutral-600 border border-[#EFE9DF] hover:bg-neutral-50"
                }`}
                title="Mapa de Mesas: Status em tempo real, comandas abertas por cliente, chamados de garçom e fechamento de contas"
              >
                <span>🍽️ Mapa de Mesas do Salão</span>
                <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-bold">
                  {tables.filter((t) => t.status !== "livre" || (t.comandas && t.comandas.length > 0)).length} Ocupadas
                </span>
              </button>

              <button
                onClick={(e) => {
                  setActiveTab("cardapio");
                  e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "cardapio"
                    ? "bg-[#C83E2B] text-white shadow-xs"
                    : "bg-white text-neutral-600 border border-[#EFE9DF] hover:bg-neutral-50"
                }`}
                title="Gestão de Cardápio: Alterar preços rápidos, pausar produtos esgotados, editar e adicionar novos lanches"
              >
                <span>🌭 Cardápio & Preços</span>
                <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-bold">
                  {products.length} Itens
                </span>
              </button>

              <button
                onClick={(e) => {
                  setActiveTab("retaguarda");
                  e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "retaguarda"
                    ? "bg-[#C83E2B] text-white shadow-xs"
                    : "bg-white text-neutral-600 border border-[#EFE9DF] hover:bg-neutral-50"
                }`}
                title="Módulo ERP: Controle de estoque de insumos, ficha técnica de fornecedores, contas a pagar e DRE de lucro líquido"
              >
                <Package className="w-3.5 h-3.5" />
                <span>💼 Estoque & Financeiro</span>
                <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full font-bold">
                  ERP
                </span>
              </button>

              <button
                onClick={(e) => {
                  setActiveTab("relatorios");
                  e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "relatorios"
                    ? "bg-[#C83E2B] text-white shadow-xs"
                    : "bg-white text-neutral-600 border border-[#EFE9DF] hover:bg-neutral-50"
                }`}
                title="Relatórios e Desempenho: Faturamento do dia, total de pedidos, ticket médio e canais de venda"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>📊 Vendas & Métricas</span>
              </button>

              <button
                onClick={(e) => {
                  setActiveTab("equipe");
                  e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "equipe"
                    ? "bg-[#1F2421] text-white shadow-xs"
                    : "bg-white text-neutral-600 border border-[#EFE9DF] hover:bg-neutral-50"
                }`}
                title="Equipe & Acessos: Usuários da equipe, garçons, caixas e permissões operacionais"
              >
                <Users className="w-3.5 h-3.5" />
                <span>👥 Equipe & Permissões</span>
              </button>

              <button
                onClick={(e) => {
                  setActiveTab("configuracoes");
                  e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "configuracoes"
                    ? "bg-[#1F2421] text-white shadow-xs"
                    : "bg-white text-neutral-600 border border-[#EFE9DF] hover:bg-neutral-50"
                }`}
                title="Configurações da Loja: Dados cadastrais, taxas de entrega por bairro, impressora térmica e regras operacionais"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>⚙️ Configurações & Entrega</span>
              </button>
            </div>

            {/* Botão Seta Direita */}
            <button
              type="button"
              onClick={() => scrollManagerTabs("right")}
              className="flex-shrink-0 w-8 h-8 rounded-xl bg-white border border-[#EFE9DF] hover:border-[#C83E2B] hover:text-[#C83E2B] text-neutral-600 flex items-center justify-center shadow-2xs transition-all cursor-pointer"
              title="Rolar abas para a direita"
              aria-label="Rolar para a direita"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo 1: Fila de Pedidos (Kanban) */}
      {activeTab === "pedidos" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-4">
          {/* Bloco 3: Alerta Visual e Sonoro Persistente Estilo iFood quando há pedido pendente */}
          {pendingOrders.length > 0 && (
            <div className="bg-[#C83E2B] text-white px-4 py-3 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-pulse">
              <div className="flex items-center gap-2.5 text-xs font-black">
                <span className="w-3 h-3 rounded-full bg-white animate-ping flex-shrink-0" />
                <span>
                  🔔 ATENÇÃO CAIXA: Há {pendingOrders.length} pedido(s) aguardando aceite! A cozinha só inicia o preparo após você clicar em &quot;Aceitar Pedido&quot;.
                </span>
              </div>
              <span className="text-[10px] font-extrabold bg-black/25 px-2.5 py-1 rounded-full self-start sm:self-auto">
                {soundEnabled ? "🔊 Campainha Persistente Ativa (15s)" : "🔇 Campainha Silenciada"}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Coluna 1: Novos Pedidos (Pendentes) */}
            <div className="bg-[#F9F6F0] rounded-2xl p-3 border border-[#EFE9DF]">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C83E2B] animate-pulse" />
                  Novos ({pendingOrders.length})
                </span>
              </div>

              <div className="space-y-3">
                {pendingOrders.length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-6">Nenhum pedido pendente</p>
                ) : (
                  pendingOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-xl p-3.5 border-2 border-[#C83E2B] shadow-sm animate-in fade-in"
                    >
                      <div className="flex items-center justify-between text-xs mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-[#C83E2B]">
                            #{order.orderNumber} • {order.type === "mesa" ? `Mesa ${order.tableNumber}` : "Delivery"}
                          </span>
                          {order.channel === "ifood" && (
                            <span className="px-1.5 py-0.2 rounded bg-red-100 text-[#EA1D2C] text-[9px] font-black uppercase border border-red-200">
                              iFood
                            </span>
                          )}
                          {order.channel === "99food" && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[9px] font-black uppercase border border-amber-300">
                              99Food
                            </span>
                          )}
                          {order.channel === "keeta" && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 text-[9px] font-black uppercase border border-emerald-300">
                              Keeta
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onPrintReceipt?.(order)}
                            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
                            title="Imprimir Cupom Térmico"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openWhatsAppNotification(order)}
                            className="p-1 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                            title="Enviar atualização para WhatsApp do cliente"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-neutral-400 font-medium">{order.createdAt}</span>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-neutral-800">{order.customerName}</p>

                      <div className="my-2.5 py-2 border-y border-neutral-100 space-y-1 text-xs text-neutral-600">
                        {order.items.map((i, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{i.quantity}x {i.name}</span>
                            <span className="font-semibold">R$ {(i.price * i.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs font-black text-neutral-800">
                          Total: R$ {order.total.toFixed(2)}
                        </span>
                        <button
                          onClick={() => {
                            playAlertSound();
                            onUpdateOrderStatus(order.id, "em_preparo");
                          }}
                          className="bg-[#C83E2B] hover:bg-[#B03221] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs cursor-pointer"
                        >
                          Aceitar Pedido
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Coluna 2: Em Preparo (Cozinha) */}
            <div className="bg-[#F9F6F0] rounded-2xl p-3 border border-[#EFE9DF]">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Em Preparo ({preparingOrders.length})
                </span>
              </div>

              <div className="space-y-3">
                {preparingOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl p-3.5 border border-amber-200 shadow-xs">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-amber-800">
                        #{order.orderNumber} • {order.type === "mesa" ? `Mesa ${order.tableNumber} [${order.comandaName || "Comanda"}]` : "Delivery"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openWhatsAppNotification(order)}
                          className="p-1 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                          title="Enviar atualização de status pelo WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-neutral-400">{order.createdAt}</span>
                      </div>
                    </div>

                    <div className="my-2 py-1.5 border-y border-neutral-100 space-y-1 text-xs text-neutral-700">
                      {order.items.map((i, idx) => (
                        <div key={idx} className="font-medium">
                          • {i.quantity}x {i.name} {i.notes && <span className="text-neutral-400">({i.notes})</span>}
                        </div>
                      ))}
                    </div>

                    {/* Bloco 2: Seletor de Entregador antes de despachar (para pedidos Delivery) */}
                    {order.type === "delivery" && (
                      <div className="mb-2 p-2 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-amber-900 block">
                          🛵 Atribuir Motoboy da Corrida:
                        </label>
                        <select
                          value={order.courierId || ""}
                          onChange={(e) => {
                            const found = availableCouriers.find((c) => c.id === e.target.value);
                            if (found && onAssignCourier) {
                              onAssignCourier(order.id, found);
                            }
                          }}
                          className="w-full text-xs font-bold px-2 py-1.5 rounded-lg border border-amber-300 bg-white text-neutral-800 outline-none cursor-pointer"
                        >
                          <option value="">Selecionar entregador...</option>
                          {availableCouriers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        if (order.type === "delivery" && !order.courierId && availableCouriers[0]) {
                          const defaultCourier = availableCouriers[0];
                          onUpdateOrderStatus(order.id, "a_caminho", {
                            courierId: defaultCourier.id,
                            courierName: defaultCourier.name,
                            courierPhone: defaultCourier.phone,
                          });
                        } else {
                          onUpdateOrderStatus(order.id, "a_caminho");
                        }
                      }}
                      className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{order.type === "delivery" ? "Despachar c/ Motoboy" : "Marcar Pronto"}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna 3: Prontos / Expedição */}
            <div className="bg-[#F9F6F0] rounded-2xl p-3 border border-[#EFE9DF]">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Prontos / Saiu ({readyOrders.length})
                </span>
              </div>

              <div className="space-y-3">
                {readyOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl p-3.5 border border-emerald-200 shadow-xs">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-emerald-800">
                        #{order.orderNumber} • {order.type === "mesa" ? `Mesa ${order.tableNumber}` : "Delivery"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openWhatsAppNotification(order)}
                          className="p-1 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                          title="Enviar aviso de entrega pelo WhatsApp ao Cliente"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-neutral-800">R$ {order.total.toFixed(2)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-500 mb-2">
                      {order.type === "mesa" ? "Aviso enviado: A caminho da mesa" : `Entrega: ${order.deliveryAddress}`}
                    </p>

                    {order.type === "delivery" && (
                      <div className="mb-2.5 p-2 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-emerald-900">
                            🛵 {order.courierName || "Sem motoboy vinculado"}
                          </span>
                          <span className="text-[10px] font-black text-emerald-800">
                            Taxa: R$ {(order.deliveryFee || 0).toFixed(2)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => openCourierWhatsAppDispatch(order)}
                          className="w-full py-1.5 px-2.5 rounded-lg bg-[#075E54] hover:bg-[#054c44] text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          title="Enviar endereço com link do Google Maps direto para o WhatsApp do motoboy"
                        >
                          <Bike className="w-3.5 h-3.5" />
                          <span>📲 Enviar Rota GPS p/ Motoboy</span>
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => onUpdateOrderStatus(order.id, "entregue")}
                      className="w-full bg-[#1F2421] hover:bg-neutral-800 text-white text-xs font-bold py-1.5 rounded-lg cursor-pointer"
                    >
                      Concluir Entrega
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna 4: Finalizados */}
            <div className="bg-[#F9F6F0] rounded-2xl p-3 border border-[#EFE9DF]">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">
                  Finalizados ({completedOrders.length})
                </span>
              </div>
              <div className="space-y-2 opacity-70">
                {completedOrders.slice(0, 4).map((order) => (
                  <div key={order.id} className="bg-white rounded-xl p-2.5 border border-[#EFE9DF] text-xs">
                    <div className="flex justify-between font-bold text-neutral-700">
                      <span>#{order.orderNumber} ({order.customerName})</span>
                      <span>R$ {order.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo 2: Mapa de Mesas do Salão (Grade Colorida & Compacta) */}
      {activeTab === "mesas" && (
        <TableMapTab
          tables={tables}
          settings={settings}
          selectedTable={selectedTable ? tables.find((t) => t.number === selectedTable.number) || null : null}
          onSelectTable={(tbl) => setSelectedTable(tbl)}
          onClearTableCall={onClearTableCall}
          onCloseComanda={onCloseComanda}
          onRemoveItemFromComanda={onRemoveItemFromComanda}
          onRequestCloseComanda={(tblNum, cmd) =>
            setClosingComandaData({ tableNumber: tblNum, comanda: cmd })
          }
          onPrintReceipt={onPrintReceipt}
          onAddTable={onAddTable}
          onFreeTable={onFreeTable}
        />
      )}

      {/* Conteúdo 3: Gestão do Cardápio & Pausa Rápida (Fase 6 do Cronograma) */}
      {activeTab === "cardapio" && (
        <MenuManagerTab
          products={products}
          onUpdateProductPrice={onUpdateProductPrice}
          onToggleProductAvailability={onToggleProductAvailability}
          onAddProduct={onAddProduct}
          onEditProduct={onEditProduct}
          onDeleteProduct={onDeleteProduct}
          onBulkUpdateProducts={onBulkUpdateProducts}
        />
      )}

      {/* Conteúdo: Retaguarda (Estoque, Fornecedores & Financeiro) */}
      {activeTab === "retaguarda" && (
        <InventoryAndFinanceTab
          orders={orders}
          settings={settings}
          stock={stock}
          suppliers={suppliers}
          expenses={expenses}
          onUpdateStock={onUpdateStock}
          onUpdateSuppliers={onUpdateSuppliers}
          onUpdateExpenses={onUpdateExpenses}
        />
      )}

      {/* Conteúdo 3: Relatórios Administrativos & Estoque Inteligente */}
      {activeTab === "relatorios" && (() => {
        const validOrders = orders.filter((o) => o.status !== "cancelado");
        const totalRevenue = validOrders.reduce((acc, o) => acc + o.total, 0);
        const deliveryOrders = validOrders.filter((o) => o.type === "delivery" || o.type === "retirada");
        const deliveryRevenue = deliveryOrders.reduce((acc, o) => acc + o.total, 0);
        const mesaOrders = validOrders.filter((o) => o.type === "mesa");
        const activeComandasTotal = tables.reduce(
          (acc, t) => acc + t.comandas.reduce((s, c) => s + c.total, 0),
          0
        );
        const mesaRevenue = Math.max(
          mesaOrders.reduce((acc, o) => acc + o.total, 0),
          activeComandasTotal
        );
        const whatsappOrders = validOrders.filter((o) => o.channel === "whatsapp");
        const whatsappRevenue = whatsappOrders.reduce((acc, o) => acc + o.total, 0);
        const lowStockItems = (stock || INITIAL_STOCK).filter((item) => item.quantity <= item.minQuantity);
        const hasCamaraoLead = products.some((p) =>
          p.name.toLowerCase().includes("camarão com cream cheese")
        );
        const hasDoisQueijosLead = products.some((p) =>
          p.name.toLowerCase().includes("dois queijos")
        );

        return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
          {/* Métricas do Dia Conectadas em Tempo Real */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-[#EFE9DF] shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-bold">
                <span>Faturamento em Operação</span>
                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> Tempo Real
                </span>
              </div>
              <p className="text-2xl font-black text-[#1F2421] mt-2">
                R$ {totalRevenue.toFixed(2).replace(".", ",")}
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">
                Total de {validOrders.length} pedido(s) registrados no turno
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#EFE9DF] shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-bold">
                <span>Delivery & Alô Classificados</span>
                <span className="text-[#C83E2B] bg-[#FDF2F0] px-2 py-0.5 rounded-full">
                  {deliveryOrders.length} pedido(s)
                </span>
              </div>
              <p className="text-2xl font-black text-[#C83E2B] mt-2">
                R$ {deliveryRevenue.toFixed(2).replace(".", ",")}
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">
                Canal Próprio + Parceria Alô & Apps
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#EFE9DF] shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-bold">
                <span>Vendas no Salão (Mesas)</span>
                <span className="text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-full">
                  {tables.filter((t) => t.status !== "livre" || t.comandas.length > 0).length} mesas ativas
                </span>
              </div>
              <p className="text-2xl font-black text-neutral-800 mt-2">
                R$ {mesaRevenue.toFixed(2).replace(".", ",")}
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">
                {mesaOrders.length} pedido(s) lançados nas mesas
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#EFE9DF] shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-bold">
                <span>Vendas WhatsApp IA</span>
                <span className="text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-full">
                  {whatsappOrders.length} pedido(s)
                </span>
              </div>
              <p className="text-2xl font-black text-neutral-800 mt-2">
                R$ {whatsappRevenue.toFixed(2).replace(".", ",")}
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">
                Fechados pelo Atendente Virtual IA
              </p>
            </div>
          </div>

          {/* Seção 2: Estoque Inteligente & Campanhas Sugeridas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bloco 1: Alerta de Reposição Dinâmico Conectado ao Estoque */}
            <div className="bg-white rounded-3xl p-5 border border-[#EFE9DF] shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  <h3 className="text-sm font-black text-[#1F2421]">
                    Alerta de Estoque Baixo ({lowStockItems.length} insumo{lowStockItems.length === 1 ? "" : "s"}):
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("retaguarda")}
                  className="text-[11px] font-bold text-[#C83E2B] hover:underline cursor-pointer"
                >
                  Abrir Estoque ERP →
                </button>
              </div>

              <div className="space-y-3">
                {lowStockItems.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold text-center">
                    ✅ Todos os insumos estão acima do estoque mínimo de segurança!
                  </div>
                ) : (
                  lowStockItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200 flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-xs font-bold text-neutral-900">{item.name}</p>
                        <p className="text-[11px] text-rose-700 font-semibold mt-0.5">
                          ⚠️ Restam {item.quantity} {item.unit} (Mínimo ideal: {item.minQuantity} {item.unit})
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab("retaguarda")}
                        className="text-xs font-bold bg-white text-rose-700 border border-rose-300 px-3 py-1.5 rounded-xl hover:bg-rose-100 shadow-2xs cursor-pointer flex-shrink-0"
                      >
                        Repor no ERP
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bloco 2: Oportunidade de Campanha (Estoque Alto / Parado) */}
            <div className="bg-gradient-to-br from-[#FEF6EC] to-[#FDF2F0] rounded-3xl p-5 border border-[#FADCD7] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-[#C83E2B]" />
                  <h3 className="text-sm font-black text-[#1F2421]">
                    Oportunidade de Campanha no Alô Classificados:
                  </h3>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Identificamos estoque alto de <strong>Batatas Fritas e Refrigerantes Guaraná Antarctica 1L</strong> com potencial de giro. Deseja criar uma promoção de Happy Hour para movimentar o salão?
                </p>

                <div className="mt-4 p-3 bg-white/80 rounded-2xl border border-[#FBD9B0] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97706]">Sugestão Tá na Mesa</span>
                    <p className="text-xs font-bold text-neutral-800">
                      Happy Hour: Combo Batata Suprema + Guaraná 1L por <span className="text-[#C83E2B] font-black">R$ 24,90</span>
                    </p>
                    <p className="text-[10px] text-neutral-400">Válido das 18h às 20h para quem vier pelo Alô Classificados</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => alert("🎉 Campanha de Happy Hour ativada e impulsionada no Alô Classificados!")}
                className="mt-4 w-full bg-[#C83E2B] hover:bg-[#B03221] text-white font-extrabold text-xs py-3 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Ativar Promoção & Divulgar no Alô Classificados
              </button>
            </div>
          </div>

          {/* Seção 3: Radar de Demandas Especiais & Novos Produtos (Leads de Cardápio Oculto) */}
          <div className="bg-white rounded-3xl p-6 border border-[#EFE9DF] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EFE9DF]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-neutral-950 flex items-center justify-center font-bold">
                  💡
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1F2421]">
                    Radar de Demandas Especiais (Leads de Novos Produtos)
                  </h3>
                  <p className="text-xs text-neutral-500">
                    O sistema analisa as observações e substituições feitas pelos clientes e garçons que <strong>não existem no cardápio oficial</strong>.
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold bg-[#FEF6EC] text-[#D97706] border border-[#FBD9B0] px-3 py-1.5 rounded-xl self-start sm:self-auto">
                3 Oportunidades Identificadas Este Mês
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              {/* Oportunidade 1: Pastel de Camarão com Cream Cheese (Case Real do Fábio) */}
              <div className="p-4 rounded-2xl bg-[#FDFBF7] border-2 border-amber-300 flex flex-col justify-between hover:shadow-xs transition-shadow">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-[#1F2421]">🦐 Pastel de Camarão</span>
                    <span className="text-[10px] font-black bg-rose-100 text-[#C83E2B] px-2 py-0.5 rounded-full">
                      🔥 7 Pedidos
                    </span>
                  </div>
                  <div className="text-xs font-bold text-amber-900 bg-amber-50 p-2 rounded-xl border border-amber-200 mb-2">
                    "Substituir Catupiry por Cream Cheese"
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-relaxed mb-4">
                    Demanda recorrente! Clientes pedem cream cheese no recheio do camarão. A economia do Catupiry equilibra o custo do Cream Cheese.
                  </p>
                </div>

                <button
                  disabled={hasCamaraoLead}
                  onClick={() => {
                    if (onAddProduct && !hasCamaraoLead) {
                      onAddProduct({
                        id: `prod-lead-camarao`,
                        name: "Pastel de Camarão com Cream Cheese",
                        category: "pasteis",
                        price: 22.0,
                        description: "Massa crocante artesanal recheada com camarões selecionados e cream cheese cremoso.",
                        image: "🥟",
                        popular: true,
                        isAvailable: true,
                      });
                      alert("🎉 Sucesso! 'Pastel de Camarão com Cream Cheese' adicionado ao cardápio oficial por R$ 22,00!");
                    }
                  }}
                  className={`w-full text-xs font-bold py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 ${
                    hasCamaraoLead
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default"
                      : "bg-[#C83E2B] hover:bg-[#B03221] text-white cursor-pointer"
                  }`}
                >
                  {hasCamaraoLead ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Já Oficializado no Cardápio (R$ 22,00)</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Oficializar no Cardápio (R$ 22,00)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Oportunidade 2: Pastel de Queijo com Coalho e Mussarela */}
              <div className="p-4 rounded-2xl bg-[#FDFBF7] border-2 border-emerald-300 flex flex-col justify-between hover:shadow-xs transition-shadow">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-[#1F2421]">🧀 Pastel de Queijo</span>
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      🔥 5 Pedidos
                    </span>
                  </div>
                  <div className="text-xs font-bold text-emerald-900 bg-emerald-50 p-2 rounded-xl border border-emerald-200 mb-2">
                    "Misturar Mussarela com Queijo de Coalho"
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-relaxed mb-4">
                    Forte preferência regional! O público quer a liga da mussarela com o sabor tostado do queijo coalho nordestino.
                  </p>
                </div>

                <button
                  disabled={hasDoisQueijosLead}
                  onClick={() => {
                    if (onAddProduct && !hasDoisQueijosLead) {
                      onAddProduct({
                        id: `prod-lead-queijo`,
                        name: "Pastel Dois Queijos (Mussarela & Coalho)",
                        category: "pasteis",
                        price: 18.0,
                        description: "Combinação irresistível de queijo mussarela derretido com queijo de coalho regional em cubos.",
                        image: "🥟",
                        popular: true,
                        isAvailable: true,
                      });
                      alert("🎉 Sucesso! 'Pastel Dois Queijos (Mussarela & Coalho)' oficializado no cardápio!");
                    }
                  }}
                  className={`w-full text-xs font-bold py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 ${
                    hasDoisQueijosLead
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default"
                      : "bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                  }`}
                >
                  {hasDoisQueijosLead ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Já Oficializado no Cardápio (R$ 18,00)</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Oficializar no Cardápio (R$ 18,00)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Oportunidade 3: Ponto da Fritura (Clarinho vs Dourado) */}
              <div className="p-4 rounded-2xl bg-[#FDFBF7] border-2 border-blue-300 flex flex-col justify-between hover:shadow-xs transition-shadow">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-[#1F2421]">⏱️ Ponto de Fritura</span>
                    <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      🔥 12 Pedidos
                    </span>
                  </div>
                  <div className="text-xs font-bold text-blue-900 bg-blue-50 p-2 rounded-xl border border-blue-200 mb-2">
                    "Pastel bem clarinho / pouco frito"
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-relaxed mb-4">
                    Clientes frequentemente instruem a cozinha sobre o ponto da massa. Seletor de ponto rápido já integrado no modal de pedidos.
                  </p>
                </div>

                <div className="bg-blue-50/80 p-2.5 rounded-xl border border-blue-200 text-center">
                  <span className="text-xs font-bold text-blue-800 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Seletor Ativo no Aplicativo</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 4 (Bloco 5): CRM de Retenção & Base de Clientes Reais (Motor Anti-CAC) */}
          <div className="bg-white rounded-3xl p-6 border border-[#EFE9DF] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EFE9DF]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  👥
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1F2421]">
                    CRM de Clientes & Motor de Recompra (CAC Zero via WhatsApp)
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Base consolidada de clientes que já pediram no salão ou delivery. Reative clientes em 1 clique sem pagar comissão ao iFood.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                Retenção Direta Ativa
              </span>
            </div>

            {(() => {
              const customerMap = new Map<
                string,
                {
                  name: string;
                  phone: string;
                  ordersCount: number;
                  totalSpent: number;
                  lastItem: string;
                }
              >();

              validOrders.forEach((o) => {
                const key = (o.customerPhone || o.customerName || "Cliente").toLowerCase().trim();
                const existing = customerMap.get(key);
                const firstItem = o.items[0]?.name || "Lanche da Casa";
                if (existing) {
                  existing.ordersCount += 1;
                  existing.totalSpent += o.total;
                  if (!existing.phone && o.customerPhone) existing.phone = o.customerPhone;
                } else {
                  customerMap.set(key, {
                    name: o.customerName || "Cliente",
                    phone: o.customerPhone || "84998002020",
                    ordersCount: 1,
                    totalSpent: o.total,
                    lastItem: firstItem,
                  });
                }
              });

              const customersList = Array.from(customerMap.values()).sort(
                (a, b) => b.totalSpent - a.totalSpent
              );

              const activeCoupon = settings?.coupons?.find((c) => c.active)?.code || "QUERO10";

              return (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-neutral-200 text-neutral-500 uppercase text-[10px] font-black">
                        <th className="py-2.5 px-3">Cliente</th>
                        <th className="py-2.5 px-3">WhatsApp</th>
                        <th className="py-2.5 px-3">Pedidos</th>
                        <th className="py-2.5 px-3">Total Gasto (LTV)</th>
                        <th className="py-2.5 px-3">Item Favorito</th>
                        <th className="py-2.5 px-3 text-right">Ação de Recompra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {customersList.map((cust, i) => {
                        const cleanPh = cust.phone.replace(/\D/g, "");
                        const fullPh = cleanPh.length <= 11 ? `55${cleanPh}` : cleanPh;
                        const storeTitle = settings?.storeName || RESTAURANT_INFO.name;
                        const promoMsg = `Olá, *${cust.name}*! Tudo bem? 😋\n\nSentimos sua falta aqui no *${storeTitle}*! Que tal pedir aquele *${cust.lastItem}* hoje?\n\n🎁 Preparamos o cupom *${activeCoupon}* exclusivo para você pedir direto pelo nosso cardápio digital!`;

                        return (
                          <tr key={i} className="hover:bg-[#FDFBF7]">
                            <td className="py-3 px-3 font-black text-neutral-900">{cust.name}</td>
                            <td className="py-3 px-3 font-mono text-neutral-600">{cust.phone}</td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-bold text-[11px]">
                                {cust.ordersCount} pedido(s)
                              </span>
                            </td>
                            <td className="py-3 px-3 font-black text-emerald-800">
                              R$ {cust.totalSpent.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-neutral-600 truncate max-w-[180px]">
                              {cust.lastItem}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  window.open(
                                    `https://wa.me/${fullPh}?text=${encodeURIComponent(promoMsg)}`,
                                    "_blank"
                                  )
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs cursor-pointer transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Enviar Cupom VIP</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
        );
      })()}

      {/* Conteúdo 4: Gestão de Equipe & Permissões (RBAC) */}
      {activeTab === "equipe" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#EFE9DF] shadow-xs">
            <h2 className="text-base font-black text-[#1F2421] mb-1">
              Perfis de Acesso & Permissões da Equipe (RBAC)
            </h2>
            <p className="text-xs text-neutral-500 mb-5">
              Garçom não tem acesso ao financeiro nem faturamento. Cozinha opera em modo quiosque independente.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Proprietário / Master */}
              <div className="p-4 rounded-2xl bg-[#FDFBF7] border-2 border-neutral-300 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#1F2421]">👑 Administrador Master</span>
                  <span className="text-[10px] font-bold bg-neutral-900 text-white px-2 py-0.5 rounded-full">
                    Acesso Total
                  </span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Acesso irrestrito a Relatórios de Faturamento, Estoque, Cancelamentos, Permissões e Configurações da Loja.
                </p>
                <div className="pt-2 border-t border-neutral-200 text-[11px] font-semibold text-neutral-500">
                  Usuário atual: Fábio Barbosa (Notebook)
                </div>
              </div>

              {/* Card 2: Garçom do Salão */}
              <div className="p-4 rounded-2xl bg-[#FDFBF7] border-2 border-amber-300 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-900">🤵 Garçom Salão</span>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    Apenas Salão
                  </span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Lançamento de pedidos em 2 toques, abertura de comandas e QR Code na maquininha. <strong>Sem acesso a faturamento ou finanças.</strong>
                </p>
                <div className="pt-2 border-t border-neutral-200 text-[11px] font-semibold text-neutral-500">
                  Link para Celular/Smart POS: <code className="text-[#C83E2B]">/garcom</code>
                </div>
              </div>

              {/* Card 3: Cozinha KDS */}
              <div className="p-4 rounded-2xl bg-[#FDFBF7] border-2 border-emerald-300 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-900">👨‍🍳 Cozinha & Chapa (KDS)</span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Modo Quiosque
                  </span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Tela travada de alta visibilidade para fixar no tablet da parede. Apenas visualiza pedidos e toca em "Pronto".
                </p>
                <div className="pt-2 border-t border-neutral-200 text-[11px] font-semibold text-neutral-500">
                  Link para o Tablet da Cozinha: <code className="text-[#C83E2B]">/cozinha</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo 5: Configurações da Loja & Taxas de Entrega (Fase 9 do Cronograma) */}
      {activeTab === "configuracoes" && (
        <StoreSettingsTab
          settings={settings}
          onSaveSettings={onSaveSettings}
          onResetClean={onResetClean}
          onSeedDemo={onSeedDemo}
        />
      )}

      {/* Modal Central de Pareamento de Dispositivos */}
      {isDeviceHubOpen && <DeviceHubModal onClose={() => setIsDeviceHubOpen(false)} />}

      {/* Modal de Fechamento de Caixa & Controle de Turno (PDV) */}
      {isCashRegisterOpen && (
        <CashRegisterModal orders={orders} settings={settings} onClose={() => setIsCashRegisterOpen(false)} />
      )}

      {/* Modal de Fechamento de Comanda com Taxa de 10% do Garçom */}
      {closingComandaData && (
        <CloseComandaModal
          tableNumber={closingComandaData.tableNumber}
          comanda={closingComandaData.comanda}
          onClose={() => setClosingComandaData(null)}
          onConfirmClose={(paymentData) => {
            onCloseComanda(closingComandaData.tableNumber, closingComandaData.comanda.id);
            setClosingComandaData(null);
            alert(
              `✅ Comanda de ${closingComandaData.comanda.customerName} quitada via ${paymentData.paymentMethod.toUpperCase()} com total de R$ ${paymentData.total.toFixed(2)} (Taxa de Garçom: R$ ${paymentData.serviceFee.toFixed(2)})!`
            );
          }}
        />
      )}
      {/* Modal do Bot de WhatsApp com IA */}
      {isBotModalOpen && (
        <WhatsAppBotModal
          products={products}
          settings={settings}
          onClose={() => setIsBotModalOpen(false)}
          onOrderCreated={onAddOrder}
        />
      )}

      {/* Modal Hub de Integrações Delivery (iFood, 99Food, Keeta e Webhooks) */}
      {isIntegrationsModalOpen && (
        <DeliveryIntegrationsModal onClose={() => setIsIntegrationsModalOpen(false)} />
      )}
    </div>
  );
}
