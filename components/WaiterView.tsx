"use client";

import React, { useState, useEffect, useRef } from "react";
import { Table, ProductItem, CartItem, Order } from "../lib/types";
import { PRODUCTS, CATEGORIES } from "../lib/mock-data";
import { TableQrModal } from "./TableQrModal";
import { ProductDetailModal } from "./ProductDetailModal";
import { CloseComandaModal } from "./CloseComandaModal";
import {
  UserCheck,
  Plus,
  QrCode,
  Check,
  Utensils,
  X,
  ArrowRightLeft,
  Flame,
  CreditCard,
  Search,
  Bell,
  MapPin,
  Sparkles,
  Zap,
  SlidersHorizontal,
  ChevronRight,
  AlertTriangle,
  User,
  Trash2,
} from "lucide-react";

interface WaiterViewProps {
  tables: Table[];
  orders?: Order[];
  products?: ProductItem[];
  onAddSubcomanda: (tableNumber: number, name: string) => void;
  onAddItemToComanda: (
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
  ) => void;
  onRemoveItemFromComanda?: (tableNumber: number, comandaId: string, itemId: string) => void;
  onCloseComanda: (tableNumber: number, comandaId: string) => void;
  onTransferComanda?: (fromTableNumber: number, comandaId: string, toTableNumber: number) => void;
  onAlertKitchenPriority?: (tableNumber: number, comandaName: string) => void;
  onClearTableCall?: (tableNumber: number) => void;
  onMarkOrderDelivered?: (orderId: string) => void;
}

interface WaiterProfile {
  id: string;
  name: string;
  sector: "salao" | "varanda" | "todos";
  sectorLabel: string;
  tablesRange: string;
  allowedTables: number[];
}

const WAITER_PROFILES: WaiterProfile[] = [
  {
    id: "tiago",
    name: "Tiago Silva",
    sector: "salao",
    sectorLabel: "Praça Salão Interno",
    tablesRange: "Mesas 1 a 5",
    allowedTables: [1, 2, 3, 4, 5],
  },
  {
    id: "marcos",
    name: "Marcos Santos",
    sector: "varanda",
    sectorLabel: "Praça Varanda & Deck",
    tablesRange: "Mesas 6 a 10",
    allowedTables: [6, 7, 8, 9, 10],
  },
  {
    id: "fabio",
    name: "Fábio Barbosa",
    sector: "todos",
    sectorLabel: "Supervisor Geral",
    tablesRange: "Todas as Mesas (1 a 10)",
    allowedTables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
];

export function WaiterView({
  tables,
  orders = [],
  products = PRODUCTS,
  onAddSubcomanda,
  onAddItemToComanda,
  onRemoveItemFromComanda,
  onCloseComanda,
  onTransferComanda,
  onAlertKitchenPriority,
  onClearTableCall,
  onMarkOrderDelivered,
}: WaiterViewProps) {
  // Estado do Atendente Ativo (com persistência em LocalStorage)
  const [activeWaiterId, setActiveWaiterId] = useState<string>("tiago");
  const [customWaiterName, setCustomWaiterName] = useState<string>("");
  const [isWaiterModalOpen, setIsWaiterModalOpen] = useState(false);

  // Filtro de Praça / Setor de Mesas
  const [praçaFilter, setPraçaFilter] = useState<"minha_praca" | "todas" | "chamando" | "conta">(
    "minha_praca"
  );

  const [selectedTableNumber, setSelectedTableNumber] = useState<number | null>(null);
  const [selectedComandaId, setSelectedComandaId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("destaques");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  // Modal de Personalização BK / McDonald's para o Lanche Selecionado
  const [customizingProduct, setCustomizingProduct] = useState<ProductItem | null>(null);

  // Recupera perfil do garçom no localStorage se houver
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ta_na_mesa_waiter_id");
      if (saved) setActiveWaiterId(saved);
      const savedCustom = localStorage.getItem("ta_na_mesa_waiter_custom");
      if (savedCustom) setCustomWaiterName(savedCustom);
    }
  }, []);

  const activeProfile =
    WAITER_PROFILES.find((p) => p.id === activeWaiterId) || WAITER_PROFILES[0];
  const displayName = customWaiterName.trim() || activeProfile.name;

  const handleSelectWaiterProfile = (profileId: string) => {
    setActiveWaiterId(profileId);
    setCustomWaiterName("");
    if (typeof window !== "undefined") {
      localStorage.setItem("ta_na_mesa_waiter_id", profileId);
      localStorage.removeItem("ta_na_mesa_waiter_custom");
    }
    setIsWaiterModalOpen(false);
  };

  const handleSaveCustomWaiter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customWaiterName.trim()) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("ta_na_mesa_waiter_custom", customWaiterName.trim());
    }
    setIsWaiterModalOpen(false);
  };

  // Mesa atual selecionada (null quando em visão geral do salão)
  const currentTable =
    selectedTableNumber !== null
      ? tables.find((t) => t.number === selectedTableNumber) || null
      : null;

  const activeComanda = currentTable
    ? currentTable.comandas.find((c) => c.id === selectedComandaId) ||
      currentTable.comandas[0] ||
      null
    : null;

  const isTableInMySector = (tableNumber: number) => {
    if (activeProfile.sector === "todos") return true;
    if (activeProfile.sector === "varanda") return tableNumber >= 6;
    return activeProfile.allowedTables.includes(tableNumber);
  };

  // Identifica mesas chamando ou pedindo conta na praça deste garçom
  const tablesCallingInMySector = tables.filter(
    (t) =>
      isTableInMySector(t.number) &&
      (t.status === "chamando_garcom" || t.status === "pedindo_conta")
  );

  // Identifica pedidos de mesa que a Cozinha acabou de marcar como PRONTOS ("a_caminho") para o garçom retirar no balcão
  const readyOrdersInMySector = orders.filter(
    (o) =>
      o.type === "mesa" &&
      o.status === "a_caminho" &&
      isTableInMySector(o.tableNumber || 1)
  );

  const prevReadyIdsRef = useRef<string[]>([]);

  const playWaiterChime = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.14);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.55);
    } catch {}
  };

  // Toca campainha imediata quando um prato novo fica pronto no balcão da cozinha
  useEffect(() => {
    const currentIds = readyOrdersInMySector.map((o) => o.id);
    const hasNewReady = currentIds.some((id) => !prevReadyIdsRef.current.includes(id));
    if (hasNewReady) {
      playWaiterChime();
    }
    prevReadyIdsRef.current = currentIds;
  }, [readyOrdersInMySector]);

  // Campainha Persistente ("Modo iFood") a cada 15s enquanto houver prato esperando retirada no balcão ou mesa chamando
  useEffect(() => {
    if (readyOrdersInMySector.length === 0 && tablesCallingInMySector.length === 0) return;
    const interval = setInterval(() => {
      playWaiterChime();
    }, 15000);
    return () => clearInterval(interval);
  }, [readyOrdersInMySector.length, tablesCallingInMySector.length]);

  // Filtro de Mesas a exibir
  const displayedTables = tables.filter((tbl) => {
    if (praçaFilter === "minha_praca") {
      return isTableInMySector(tbl.number);
    }
    if (praçaFilter === "chamando") {
      return tbl.status === "chamando_garcom";
    }
    if (praçaFilter === "conta") {
      return tbl.status === "pedindo_conta";
    }
    return true; // todas
  });

  const handleCreateNewComanda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTable || !newClientName.trim()) return;
    onAddSubcomanda(currentTable.number, newClientName.trim());
    setNewClientName("");
  };

  const handleExecuteTransfer = (targetTableNumber: number) => {
    if (!currentTable || !activeComanda || !onTransferComanda) return;
    if (targetTableNumber === currentTable.number) {
      alert("A comanda já está nesta mesa!");
      return;
    }

    onTransferComanda(currentTable.number, activeComanda.id, targetTableNumber);
    setIsTransferModalOpen(false);
    setSelectedTableNumber(targetTableNumber);
  };

  // Lançamento Rápido em 1-Toque (Receita Padrão)
  const handleQuickAddStandard = (product: ProductItem) => {
    if (product.isAvailable === false) {
      alert("⚠️ Este item está temporariamente esgotado!");
      return;
    }
    if (!currentTable || !activeComanda) {
      alert("Abra ou selecione uma mesa e comanda antes de lançar itens.");
      return;
    }
    onAddItemToComanda(currentTable.number, activeComanda.id, product);
  };

  // Confirmação do Modal de Ingredientes da Receita
  const handleConfirmCustomization = (
    product: ProductItem,
    quantity: number,
    selectedSubstitution?: string,
    removals?: string[],
    notes?: string,
    unitPriceWithExtras?: number,
    extrasDetails?: string[]
  ) => {
    if (!currentTable || !activeComanda) {
      alert("Abra ou selecione uma mesa e comanda antes de lançar itens.");
      return;
    }

    const optionsSelected: string[] = [];
    if (selectedSubstitution) optionsSelected.push(selectedSubstitution);
    if (extrasDetails) optionsSelected.push(...extrasDetails);

    onAddItemToComanda(currentTable.number, activeComanda.id, product, {
      quantity,
      unitPrice: unitPriceWithExtras || product.price,
      optionsSelected,
      removals,
      notes,
    });

    setCustomizingProduct(null);
  };

  // Filtragem de Produtos: Busca em tempo real ou Categoria
  const hasSearch = searchQuery.trim().length > 0;
  const filteredProducts = hasSearch
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : selectedCategory === "destaques"
    ? products.filter((p) => p.popular)
    : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-3 sm:p-6 pb-28">
      <div className="max-w-xl mx-auto">
        {/* TOPO DO APP: IDENTIDADE DO GARÇOM & PRAÇA DE ATENDIMENTO */}
        <div className="bg-white rounded-3xl p-4 border border-[#EFE9DF] shadow-xs mb-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#C83E2B] text-white flex items-center justify-center font-bold shadow-xs">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black text-[#1F2421]">
                  {displayName}
                </h1>
                <button
                  type="button"
                  onClick={() => setIsWaiterModalOpen(true)}
                  className="text-[10px] font-bold text-[#C83E2B] bg-rose-50 px-2 py-0.5 rounded-full hover:bg-rose-100 cursor-pointer"
                  title="Trocar atendente"
                >
                  Trocar
                </button>
              </div>
              <p className="text-xs text-neutral-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#D97706]" />
                <span>
                  {activeProfile.sectorLabel} • {activeProfile.tablesRange}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsQrModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FEF6EC] border border-[#FBD9B0] text-[#D97706] text-xs font-bold hover:bg-[#FDEEDC] cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>QR Mesa</span>
          </button>
        </div>

        {/* ALERTA DE PRATO PRONTO NO BALCÃO DA COZINHA PARA O GARÇOM LEVAR À MESA */}
        {readyOrdersInMySector.length > 0 && (
          <div className="mb-3.5 space-y-2">
            {readyOrdersInMySector.map((ord) => (
              <div
                key={ord.id}
                className="p-3.5 rounded-2xl bg-emerald-600 border-2 border-emerald-400 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in"
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-xl mt-0.5">🍽️</span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide">
                      RETIRAR NO BALCÃO • Mesa {ord.tableNumber} ({ord.comandaName || ord.customerName})
                    </p>
                    <p className="text-xs font-semibold text-emerald-50 mt-0.5">
                      Pedido #{ord.orderNumber}:{" "}
                      {ord.items.map((it) => `${it.quantity}x ${it.name}`).join(", ")}
                    </p>
                  </div>
                </div>

                {onMarkOrderDelivered && (
                  <button
                    type="button"
                    onClick={() => onMarkOrderDelivered(ord.id)}
                    className="px-3.5 py-2 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-black shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 flex-shrink-0"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Já Entreguei na Mesa</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ALERTA VISUAL DE CHAMADO NA PRAÇA DESTE GARÇOM */}
        {tablesCallingInMySector.length > 0 && (
          <div className="mb-3.5 space-y-2">
            {tablesCallingInMySector.map((tbl) => {
              const isCalling = tbl.status === "chamando_garcom";
              return (
                <div
                  key={tbl.id}
                  onClick={() => {
                    setSelectedTableNumber(tbl.number);
                    setSelectedComandaId(tbl.comandas[0]?.id || "");
                  }}
                  className={`p-3.5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer shadow-sm ${
                    isCalling
                      ? "bg-amber-500 border-amber-600 text-neutral-950 animate-pulse"
                      : "bg-blue-600 border-blue-700 text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{isCalling ? "🔔" : "🧾"}</span>
                    <div>
                      <p className="text-xs font-black">
                        {isCalling
                          ? `Mesa ${tbl.number} da sua Praça está Chamando!`
                          : `Mesa ${tbl.number} da sua Praça Pediu a Conta!`}
                      </p>
                      <p className="text-[11px] opacity-90">
                        {tbl.callReason || (isCalling ? "Atendimento no salão" : "Levar maquininha")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onClearTableCall && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClearTableCall(tbl.number);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-black/20 hover:bg-black/30 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Atendido ✓
                      </button>
                    )}
                    <span className="text-xs font-black bg-white/20 px-2 py-1 rounded-xl">
                      Ir p/ Mesa →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SELEÇÃO DE MESAS CENTRALIZADA (MINIMALISTA COM ÍCONE E CORES PADRÃO GESTOR) */}
        <div className="bg-white rounded-3xl p-3 sm:p-4 border border-[#E7DCD0] shadow-xs mb-3.5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pb-2.5 border-b border-[#F0E5D9]">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#231F1C]">
              <Utensils className="w-3.5 h-3.5 text-[#BD4D2D]" />
              <span>Salão • Mesas em Atendimento</span>
            </div>

            {/* Alternador de Praça */}
            <div className="flex items-center gap-1 bg-[#FBF6EF] p-1 rounded-xl border border-[#E7DCD0]">
              <button
                type="button"
                onClick={() => setPraçaFilter("minha_praca")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  praçaFilter === "minha_praca"
                    ? "bg-[#BD4D2D] text-white shadow-2xs"
                    : "text-neutral-600 hover:bg-neutral-200/60"
                }`}
              >
                ⭐ Minha Praça ({activeProfile.allowedTables.length})
              </button>
              <button
                type="button"
                onClick={() => setPraçaFilter("todas")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  praçaFilter === "todas"
                    ? "bg-[#231F1C] text-white shadow-2xs"
                    : "text-neutral-600 hover:bg-neutral-200/60"
                }`}
              >
                Todas ({tables.length})
              </button>
            </div>
          </div>

          {/* Legenda visual sutil das cores do salão (Idêntico ao Gestor) */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] font-bold text-neutral-500 py-2 border-b border-[#F0E5D9]/60 mb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Livre
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#BD4D2D]" /> Ocupada
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" /> Chamando
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Pediu Conta
            </span>
          </div>

          {/* Grade / Carrossel de Mesas Centralizado (Minimalista, com Cores do Gestor e Rolagem Suave no PC/Mobile) */}
          <div className="overflow-x-auto pb-2 pt-1 scrollbar-thin flex items-center justify-start sm:justify-center gap-2">
            {displayedTables.map((tbl) => {
              const isSelected = currentTable ? tbl.number === currentTable.number : false;
              const isCalling = tbl.status === "chamando_garcom";
              const isBillRequested = tbl.status === "pedindo_conta";
              const isOccupied =
                (tbl.comandas && tbl.comandas.length > 0) || tbl.status === "ocupada";

              let colorClass =
                "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 shadow-2xs";
              let statusIcon = "🍽️";

              if (isCalling) {
                colorClass =
                  "bg-amber-400 text-neutral-950 border-amber-500 font-black animate-pulse shadow-sm";
                statusIcon = "🔔";
              } else if (isBillRequested) {
                colorClass = "bg-blue-600 text-white border-blue-700 font-black shadow-xs";
                statusIcon = "🧾";
              } else if (isOccupied) {
                colorClass = "bg-[#BD4D2D] text-white border-[#A33F23] font-black shadow-xs";
              }

              return (
                <button
                  key={tbl.id}
                  type="button"
                  onClick={() => {
                    setSelectedTableNumber(tbl.number);
                    setSelectedComandaId(tbl.comandas[0]?.id || "");
                  }}
                  className={`px-3 py-2 rounded-2xl font-black text-xs transition-all cursor-pointer border-2 flex items-center gap-1.5 flex-shrink-0 ${colorClass} ${
                    isSelected
                      ? "ring-3 ring-[#231F1C] scale-105 shadow-md z-10"
                      : "hover:scale-102 opacity-95 hover:opacity-100"
                  }`}
                  title={`Mesa ${tbl.number} • ${
                    isCalling
                      ? "Chamando Garçom"
                      : isBillRequested
                      ? "Pediu a Conta"
                      : isOccupied
                      ? "Ocupada"
                      : "Livre"
                  }`}
                >
                  <span className="text-xs">{statusIcon}</span>
                  <span>M{tbl.number}</span>
                  {tbl.comandas.length > 0 && (
                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-black/20">
                      {tbl.comandas.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* VISÃO GERAL DO SALÃO (QUANDO NENHUMA MESA ESTÁ SELECIONADA) */}
        {!currentTable ? (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E7DCD0] shadow-xs mb-3.5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E5D9]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shadow-2xs">
                  <Utensils className="w-5 h-5 text-[#BD4D2D]" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-[#231F1C]">Salão Operacional • Sem Mesa Fixada</h2>
                  <p className="text-[11px] text-neutral-500">Toque em qualquer mesa acima para iniciar o atendimento</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Total Mesas</span>
                <span className="text-xs font-black text-[#231F1C]">{displayedTables.length} mesas na praça</span>
              </div>
            </div>

            {/* Painel de Indicadores Rápidos da Praça */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center">
                <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Livres</span>
                <p className="text-xl font-black text-emerald-700 mt-0.5">
                  {displayedTables.filter((t) => t.status === "livre" && t.comandas.length === 0).length}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200 text-center">
                <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider">Ocupadas</span>
                <p className="text-xl font-black text-[#BD4D2D] mt-0.5">
                  {displayedTables.filter((t) => t.status === "ocupada" || t.comandas.length > 0).length}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-center">
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Chamando</span>
                <p className="text-xl font-black text-amber-600 mt-0.5">
                  {displayedTables.filter((t) => t.status === "chamando_garcom").length}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 text-center">
                <span className="text-[10px] font-black uppercase text-blue-800 tracking-wider">Pediu Conta</span>
                <p className="text-xl font-black text-blue-600 mt-0.5">
                  {displayedTables.filter((t) => t.status === "pedindo_conta").length}
                </p>
              </div>
            </div>

            {/* Guia Intuitivo do Salão */}
            <div className="p-4 rounded-2xl bg-[#FBF6EF] border border-[#E7DCD0] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <p className="text-xs font-black text-[#231F1C]">Pronto para atender um cliente?</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Toque na mesa correspondente (M1 a M10) na barra acima para abrir uma comanda e lançar produtos.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E7DCD0] hover:bg-neutral-50 text-xs font-bold text-neutral-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#BD4D2D]" />
                  <span>Gerar QR Code</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* GESTÃO DAS SUBCOMANDAS DA MESA SELECIONADA */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#EFE9DF] shadow-xs mb-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DF] mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black text-[#1F2421]">
                      Mesa {currentTable.number} • Comandas:
                    </h2>
                    <span className="text-[10px] font-bold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
                      {currentTable.number <= 5 ? "Salão Interno" : "Varanda & Deck"}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    {currentTable.comandas.length} cliente(s) ativo(s)
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-black text-[#C83E2B]">
                    Total: R$ {currentTable.comandas.reduce((s, c) => s + c.total, 0).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTableNumber(null);
                      setSelectedComandaId("");
                    }}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Voltar para a visão geral do salão"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Salão</span>
                  </button>
                </div>
              </div>

          {/* Abas das Comandas da Mesa */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {currentTable.comandas.map((cmd) => {
              const isSelected = activeComanda?.id === cmd.id;
              return (
                <button
                  key={cmd.id}
                  onClick={() => setSelectedComandaId(cmd.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex-shrink-0 ${
                    isSelected
                      ? "bg-[#1F2421] text-white border-[#1F2421] shadow-2xs"
                      : "bg-[#FDFBF7] text-neutral-700 border-[#EFE9DF] hover:bg-neutral-100"
                  }`}
                >
                  👤 {cmd.customerName} (R$ {cmd.total.toFixed(2)})
                </button>
              );
            })}
          </div>

          {/* Detalhes da Comanda Selecionada com Superpoderes de Autonomia do Garçom */}
          {activeComanda && (
            <div className="mt-3 p-3 bg-[#FDFBF7] rounded-2xl border border-[#EFE9DF]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-neutral-800">
                  Consumo de <strong>{activeComanda.customerName}</strong>:
                </span>
                <span className="text-xs font-black text-[#C83E2B]">
                  R$ {activeComanda.total.toFixed(2)}
                </span>
              </div>

              {/* Lista dos Itens da Comanda com Destaque para Observações Especiais & Exclusão */}
              <div className="space-y-2 mb-3 text-[11px] text-neutral-600 max-h-48 overflow-y-auto">
                {activeComanda.items.length === 0 ? (
                  <p className="text-neutral-400 italic py-2 text-center">Nenhum item lançado nesta comanda ainda</p>
                ) : (
                  activeComanda.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white border border-[#E7DCD0] space-y-1 hover:border-neutral-300 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-[#231F1C]">
                          {it.quantity}x {it.name}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="font-black text-[#BD4D2D]">
                            R$ {(it.price * it.quantity).toFixed(2)}
                          </span>

                          {/* BOTÃO DE RETIRADA / CANCELAMENTO DE ITEM (Solicitado pelo Fábio) */}
                          {onRemoveItemFromComanda && (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  confirm(
                                    `Deseja estornar/cancelar 1x "${it.name}" da comanda de ${activeComanda.customerName}?`
                                  )
                                ) {
                                  onRemoveItemFromComanda(
                                    currentTable.number,
                                    activeComanda.id,
                                    it.id
                                  );
                                }
                              }}
                              className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
                              title="Estornar / Cancelar este item da comanda"
                            >
                              <Trash2 className="w-3 h-3 text-rose-600" />
                              <span>Cancelar</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Exibição dos Adicionais Turbinados */}
                      {it.optionsSelected && it.optionsSelected.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {it.optionsSelected.map((opt, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-bold bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded-md"
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* DESTAQUE DE OBSERVAÇÃO ESPECIAL / SEM INGREDIENTE */}
                      {it.notes && (
                        <div className="text-[10px] font-black text-amber-900 bg-amber-100/90 px-2 py-1 rounded-lg border border-amber-300 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-700 flex-shrink-0" />
                          <span>{it.notes}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* BARRINHA DE AUTONOMIA: Transferir de Mesa, Prioridade e Fechar */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#EFE9DF]">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(true)}
                  className="flex-1 py-2 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="Trocar cliente de mesa (chuva, ar-condicionado ou juntar amigos)"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                  <span>Mudar de Mesa</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onAlertKitchenPriority) {
                      onAlertKitchenPriority(currentTable.number, activeComanda.customerName);
                    } else {
                      alert(
                        `🔥 Prioridade de preparo enviada à Cozinha/Chapa para a Mesa ${currentTable.number}!`
                      );
                    }
                  }}
                  className="py-2 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="Avisar a cozinha que o cliente tem pressa"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  <span>Urgência Cozinha</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(true)}
                  className="py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="Quitar comanda com forma de pagamento e taxa de 10%"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Quitar</span>
                </button>
              </div>
            </div>
          )}

          {/* Campo para o Garçom adicionar novo cliente na mesma mesa */}
          <form
            onSubmit={handleCreateNewComanda}
            className="flex gap-2 mt-3 pt-3 border-t border-neutral-100"
          >
            <input
              type="text"
              placeholder="Adicionar cliente nesta mesa..."
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              className="flex-1 text-xs px-3 py-2 rounded-xl border border-[#EFE9DF] bg-[#FDFBF7] outline-none focus:border-[#C83E2B]"
            />
            <button
              type="submit"
              className="bg-[#C83E2B] text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Abrir</span>
            </button>
          </form>
        </div>

        {/* LANÇAMENTO RÁPIDO NO SALÃO: BUSCA EM TEMPO REAL + CATEGORIAS + TOTEM BK */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#EFE9DF] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-neutral-800">
                Lançamento no Salão:
              </h2>
              <p className="text-[10px] text-neutral-400">
                Toque no card para personalizar ingredientes
              </p>
            </div>
            <span className="text-[11px] text-neutral-500 font-semibold bg-neutral-100 px-2 py-0.5 rounded-lg">
              Destino: <strong>{activeComanda?.customerName || "Nenhuma comanda"}</strong>
            </span>
          </div>

          {/* CAMPO DE BUSCA EM TEMPO REAL (DOUBLE PROCURA) */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Buscar produto no mix (ex: coca, smash, pastel, nata, brotinho)..."
              className="w-full text-xs pl-10 pr-9 py-2.5 rounded-2xl border border-[#EFE9DF] bg-[#FDFBF7] outline-none focus:border-[#C83E2B] focus:bg-white transition-all shadow-2xs font-medium"
            />
            {hasSearch && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700 p-0.5 rounded-full hover:bg-neutral-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro de Categorias (visível quando não há busca ativa) */}
          {!hasSearch ? (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-3 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                    selectedCategory === cat.id
                      ? "bg-[#C83E2B] text-white shadow-xs"
                      : "bg-[#FDFBF7] text-neutral-600 border border-[#EFE9DF] hover:bg-neutral-100"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="pb-2 text-[11px] font-bold text-neutral-500 flex items-center justify-between">
              <span>{filteredProducts.length} itens encontrados para &quot;{searchQuery}&quot;</span>
              <button
                onClick={() => setSearchQuery("")}
                className="text-[#C83E2B] text-[10px] underline cursor-pointer"
              >
                Ver todas categorias
              </button>
            </div>
          )}

          {/* Grade de Produtos */}
          <div className="grid grid-cols-2 gap-2.5">
            {filteredProducts.length === 0 ? (
              <div className="col-span-2 py-8 text-center text-neutral-400">
                <Utensils className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold">Nenhum produto encontrado</p>
                <p className="text-[10px] mt-0.5">Tente outro termo na busca</p>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const isPaused = product.isAvailable === false;

                return (
                  <div
                    key={product.id}
                    onClick={() => {
                      if (isPaused) {
                        alert("⚠️ Este produto está temporariamente esgotado!");
                        return;
                      }
                      if (!activeComanda) {
                        alert("Abra ou selecione uma comanda antes de lançar itens.");
                        return;
                      }
                      // Abre o Modal Totem BK / McDonald's para personalizar ingredientes
                      setCustomizingProduct(product);
                    }}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all relative ${
                      isPaused
                        ? "bg-neutral-100 border-neutral-200 opacity-50 cursor-not-allowed"
                        : "border-[#EFE9DF] bg-[#FDFBF7] hover:border-[#C83E2B] hover:shadow-xs cursor-pointer active:scale-98"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center flex-shrink-0 border border-[#EFE9DF]">
                          {product.image && (product.image.startsWith("http") || product.image.startsWith("/")) ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm">{product.image}</span>
                          )}
                        </div>
                        <span
                          className={`text-xs font-black ${
                            isPaused ? "text-neutral-400" : "text-[#C83E2B]"
                          }`}
                        >
                          R$ {product.price.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-neutral-800 line-clamp-1 mt-1">
                        {product.name}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                      {isPaused ? (
                        <span className="text-[10px] text-rose-600 font-black">
                          ⚠️ Esgotado
                        </span>
                      ) : (
                        <>
                          <span className="text-[10px] font-bold text-neutral-500 flex items-center gap-0.5">
                            <SlidersHorizontal className="w-3 h-3 text-[#D97706]" /> Personalizar
                          </span>

                          {/* Botão de Atalho Rápido em 1-Toque (Receita Padrão) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAddStandard(product);
                            }}
                            className="p-1 px-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center gap-0.5 transition-colors cursor-pointer border border-emerald-200"
                            title="Lançamento Rápido em 1-Toque (Receita Padrão Completa)"
                          >
                            <Zap className="w-2.5 h-2.5 text-emerald-600" />
                            <span>1-Toque</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        </>
      )}
      </div>

      {/* MODAL DE PERSONALIZAÇÃO DE INGREDIENTES (ESTILO BURGER KING / MCDONALD'S) */}
      {customizingProduct && (
        <ProductDetailModal
          product={customizingProduct}
          targetCustomerName={activeComanda?.customerName}
          onClose={() => setCustomizingProduct(null)}
          onConfirm={handleConfirmCustomization}
        />
      )}

      {/* MODAL DE TRANSFERÊNCIA DE MESA (Autonomia do Garçom) */}
      {isTransferModalOpen && activeComanda && currentTable && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-[#EFE9DF] shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setIsTransferModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 p-1.5 rounded-full hover:bg-neutral-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-[#EFE9DF] mb-3">
              <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1F2421]">Mudar de Mesa</h3>
                <p className="text-xs text-neutral-500">
                  Transferir <strong>{activeComanda.customerName}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 mb-3 leading-relaxed">
              O cliente está na <strong>Mesa {currentTable.number}</strong>. Para qual mesa ele vai se mudar?
            </p>

            <div className="grid grid-cols-5 gap-2 my-2">
              {tables.map((t) => {
                const isCurrent = t.number === currentTable.number;
                const isOccupied = t.comandas.length > 0;

                return (
                  <button
                    key={t.id}
                    disabled={isCurrent}
                    onClick={() => handleExecuteTransfer(t.number)}
                    className={`p-2.5 rounded-xl border font-black text-xs flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed"
                        : isOccupied
                        ? "bg-[#FEF6EC] text-[#D97706] border-[#FBD9B0] hover:bg-[#FDEEDC]"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    <span>M{t.number}</span>
                    <span className="text-[9px] font-normal mt-0.5">
                      {isCurrent ? "Atual" : isOccupied ? "Juntar" : "Livre"}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-[10px] text-neutral-400 text-center mt-3">
              * Se escolher uma mesa com amigos, a conta será agrupada automaticamente. Se a mesa atual ficar vazia, ela será liberada.
            </p>
          </div>
        </div>
      )}

      {/* MODAL DE TROCA DE ATENDENTE / IDENTIFICAÇÃO DO GARÇOM */}
      {isWaiterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-[#EFE9DF] shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setIsWaiterModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 p-1.5 rounded-full hover:bg-neutral-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-[#EFE9DF] mb-3">
              <div className="w-9 h-9 rounded-2xl bg-rose-100 text-[#C83E2B] flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1F2421]">Identificação do Atendente</h3>
                <p className="text-xs text-neutral-500">Selecione quem está operando o terminal</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {WAITER_PROFILES.map((prof) => {
                const isSelected = activeWaiterId === prof.id && !customWaiterName;
                return (
                  <div
                    key={prof.id}
                    onClick={() => handleSelectWaiterProfile(prof.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-[#FEF6EC] border-[#FBD9B0] shadow-2xs"
                        : "bg-white border-[#EFE9DF] hover:bg-neutral-50"
                    }`}
                  >
                    <div>
                      <p className={`font-black text-xs ${isSelected ? "text-[#D97706]" : "text-neutral-800"}`}>
                        {prof.name}
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        {prof.sectorLabel} • {prof.tablesRange}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#C83E2B] text-white flex items-center justify-center text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Cadastro ou Nome Personalizado */}
            <form onSubmit={handleSaveCustomWaiter} className="pt-3 border-t border-[#EFE9DF]">
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Ou digite outro nome para este turno:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: Carlos Oliveira"
                  value={customWaiterName}
                  onChange={(e) => setCustomWaiterName(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-[#EFE9DF] bg-[#FDFBF7] outline-none focus:border-[#C83E2B]"
                />
                <button
                  type="submit"
                  className="bg-[#1F2421] text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-neutral-800 cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isQrModalOpen && (
        <TableQrModal
          tableNumber={currentTable ? currentTable.number : 1}
          onClose={() => setIsQrModalOpen(false)}
        />
      )}

      {isCloseModalOpen && activeComanda && currentTable && (
        <CloseComandaModal
          tableNumber={currentTable.number}
          comanda={activeComanda}
          onClose={() => setIsCloseModalOpen(false)}
          onConfirmClose={(paymentData) => {
            onCloseComanda(currentTable.number, activeComanda.id);
            setIsCloseModalOpen(false);
            alert(
              `✅ Comanda de "${activeComanda.customerName}" quitada via ${paymentData.paymentMethod.toUpperCase()} com total de R$ ${paymentData.total.toFixed(2)} (Taxa de Garçom: R$ ${paymentData.serviceFee.toFixed(2)})!`
            );
          }}
        />
      )}
    </div>
  );
}
