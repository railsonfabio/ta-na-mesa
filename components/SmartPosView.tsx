"use client";

import React, { useState } from "react";
import { Table, ProductItem, CartItem, Order, Comanda } from "../lib/types";
import { PRODUCTS, RESTAURANT_INFO } from "../lib/mock-data";
import { Logo } from "./Logo";
import {
  CreditCard,
  Printer,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  Search,
  UserCheck,
  ChevronLeft,
  Banknote,
  QrCode,
  Flame,
  SlidersHorizontal,
} from "lucide-react";
import { ProductDetailModal } from "./ProductDetailModal";

export interface CustomPosItemData {
  quantity?: number;
  price?: number;
  optionsSelected?: string[];
  notes?: string;
}

interface SmartPosViewProps {
  tables: Table[];
  products?: ProductItem[];
  storeName?: string;
  onAddSubcomanda: (tableNumber: number, name: string) => void;
  onAddItemToComanda: (
    tableNumber: number,
    comandaId: string,
    product: ProductItem,
    customItem?: CustomPosItemData
  ) => void;
  onRemoveItemFromComanda?: (
    tableNumber: number,
    comandaId: string,
    itemId: string
  ) => void;
  onCloseComanda: (tableNumber: number, comandaId: string) => void;
}

export function SmartPosView({
  tables,
  products = PRODUCTS,
  storeName,
  onAddSubcomanda,
  onAddItemToComanda,
  onRemoveItemFromComanda,
  onCloseComanda,
}: SmartPosViewProps) {
  const [selectedTableNumber, setSelectedTableNumber] = useState<number>(1);
  const [viewStep, setViewStep] = useState<"mesas" | "comanda" | "catalogo" | "pagamento">("mesas");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("destaques");
  const [includeServiceFee, setIncludeServiceFee] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"credito" | "debito" | "pix" | "dinheiro">("credito");
  const [customizingProduct, setCustomizingProduct] = useState<ProductItem | null>(null);

  const currentTable = tables.find((t) => t.number === selectedTableNumber) || tables[0] || {
    id: "t1",
    number: 1,
    status: "livre" as const,
    comandas: [],
  };

  const activeComanda = currentTable.comandas[0];

  const subtotal = activeComanda?.total || 0;
  const serviceFee = includeServiceFee ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
  const grandTotal = subtotal + serviceFee;

  // Lançamento rápido de produto com receita padrão
  const handleQuickAdd = (p: ProductItem) => {
    const targetComandaId = activeComanda ? activeComanda.id : `c-t${currentTable.number}-${Date.now()}`;
    onAddItemToComanda(currentTable.number, targetComandaId, p);
    setViewStep("comanda");
  };

  // Confirmação de personalização no Smart POS (Totem BK/McDonald's com adicionais e remoções)
  const handleConfirmCustomization = (
    product: ProductItem,
    quantity: number,
    selectedSubstitution?: string,
    removals?: string[],
    notes?: string,
    unitPriceWithExtras?: number,
    extrasDetails?: string[]
  ) => {
    const noteParts: string[] = [];
    if (selectedSubstitution) noteParts.push(selectedSubstitution);
    if (extrasDetails && extrasDetails.length > 0) noteParts.push(`Extras: ${extrasDetails.join(", ")}`);
    if (removals && removals.length > 0) noteParts.push(`Tirar: ${removals.join(", ")}`);
    if (notes) noteParts.push(`Obs: ${notes}`);
    const combinedNotes = noteParts.join(" | ");

    const finalPrice = unitPriceWithExtras !== undefined ? unitPriceWithExtras : product.price;
    const targetComandaId = activeComanda ? activeComanda.id : `c-t${currentTable.number}-${Date.now()}`;

    onAddItemToComanda(currentTable.number, targetComandaId, product, {
      quantity,
      price: finalPrice,
      optionsSelected: [
        ...(selectedSubstitution ? [selectedSubstitution] : []),
        ...(extrasDetails || []),
        ...(removals || []),
      ],
      notes: combinedNotes || undefined,
    });

    setCustomizingProduct(null);
    setViewStep("comanda");
  };

  // Impressão na bobina térmica integrada da maquininha Android
  const handlePrintBobbin = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#1F2421] text-neutral-900 flex justify-center p-0 sm:p-4">
      {/* Container proporcional ao formato da maquininha Android (Sunmi/Stone/Cielo) */}
      <div className="w-full max-w-[420px] bg-[#FDFBF7] min-h-screen sm:min-h-[780px] sm:max-h-[880px] sm:rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden border-2 border-neutral-800">
        
        {/* Barra Superior da Maquininha */}
        <div className="bg-[#231F1C] text-white px-3.5 py-2.5 flex items-center justify-between text-xs font-bold shadow-md">
          <div className="flex items-center gap-2">
            <Logo size="sm" variant="icon" />
            <span className="tracking-tight text-amber-400">SMART POS • {storeName || RESTAURANT_INFO.name}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-neutral-300 font-mono">ONLINE</span>
          </div>
        </div>

        {/* Barra de Seleção Rápida de Mesa */}
        <div className="bg-[#EFE9DF] px-3 py-2 border-b border-neutral-300 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewStep("mesas")}
              className="px-2.5 py-1 bg-white hover:bg-neutral-100 rounded-lg text-xs font-black border border-neutral-300 shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <span>Mesa {currentTable.number}</span>
              <span className="text-[10px] text-neutral-400">▼</span>
            </button>
            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                currentTable.status === "livre"
                  ? "bg-emerald-100 text-emerald-800"
                  : currentTable.status === "chamando_garcom"
                  ? "bg-amber-300 text-neutral-950 font-black animate-pulse"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {currentTable.status === "livre" ? "Livre" : currentTable.status === "chamando_garcom" ? "Chamando" : "Ocupada"}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-neutral-500 font-bold block">Total Mesa:</span>
            <span className="text-xs font-black text-[#BD4D2D]">
              R$ {subtotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* ================= CORPO DO APLICATIVO POS ================= */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          
          {/* TELA 1: SELETOR DE MESAS (GRADE NUMÉRICA GIGANTE PARA TOUCH) */}
          {viewStep === "mesas" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-neutral-800 uppercase tracking-wider">
                  Selecione a Mesa para Atender:
                </h3>
                <button
                  onClick={() => setViewStep("comanda")}
                  className="text-xs font-bold text-neutral-500 hover:text-neutral-800"
                >
                  Voltar
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {tables.map((t) => (
                  <button
                    key={t.number}
                    type="button"
                    onClick={() => {
                      setSelectedTableNumber(t.number);
                      setViewStep("comanda");
                    }}
                    className={`py-4 rounded-xl font-black text-sm border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                      t.number === currentTable.number
                        ? "border-[#231F1C] bg-neutral-900 text-white shadow-md scale-105"
                        : t.status === "livre"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                        : t.status === "chamando_garcom"
                        ? "border-amber-400 bg-amber-300 text-neutral-950 animate-pulse font-black"
                        : "border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100"
                    }`}
                  >
                    <span>M{t.number}</span>
                    <span className="text-[9px] font-bold mt-0.5">
                      {t.comandas.length > 0 ? `R$${t.comandas[0].total.toFixed(0)}` : "Livre"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TELA 2: COMANDA ATIVA DA MESA */}
          {viewStep === "comanda" && (
            <div className="space-y-3">
              {!activeComanda || activeComanda.items.length === 0 ? (
                <div className="text-center py-10 px-4 bg-white rounded-2xl border border-dashed border-neutral-300">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-2 text-xl">
                    🍽️
                  </div>
                  <h4 className="text-xs font-black text-neutral-800 mb-1">Mesa {currentTable.number} sem pedidos</h4>
                  <p className="text-[11px] text-neutral-500 mb-3">Toque abaixo para lançar itens na comanda.</p>
                  <button
                    onClick={() => setViewStep("catalogo")}
                    className="w-full bg-[#BD4D2D] hover:bg-[#A33F23] text-white font-extrabold text-xs py-3 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Lançar Pedido Agora</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-600 px-1">
                    <span>Cliente: <strong>{activeComanda.customerName}</strong></span>
                    <span>{activeComanda.items.length} item(ns)</span>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#EFE9DF] divide-y divide-neutral-100 max-h-56 overflow-y-auto">
                    {activeComanda.items.map((it, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-neutral-900 leading-tight">
                            {it.quantity}x {it.name}
                          </p>
                          {it.notes && (
                            <span className="text-[10px] text-amber-700 font-bold block mt-0.5">
                              * {it.notes}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-neutral-800">
                            R$ {(it.price * it.quantity).toFixed(2)}
                          </span>
                          {onRemoveItemFromComanda && (
                            <button
                              onClick={() => onRemoveItemFromComanda(currentTable.number, activeComanda.id, it.id)}
                              className="p-1 text-neutral-400 hover:text-rose-600 rounded"
                              title="Remover item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Ações da Comanda */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setViewStep("catalogo")}
                      className="py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#BD4D2D]" />
                      <span>Adicionar Itens</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePrintBobbin}
                      className="py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                      title="Imprimir conferência na bobina térmica"
                    >
                      <Printer className="w-3.5 h-3.5 text-neutral-600" />
                      <span>Imprimir Bobina</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TELA 3: CATÁLOGO DE LANÇAMENTO RÁPIDO */}
          {viewStep === "catalogo" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setViewStep("comanda")}
                  className="flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Voltar p/ Mesa</span>
                </button>
                <span className="text-[11px] font-black text-neutral-400">Toque p/ Lançar</span>
              </div>

              {/* Categorias em Pílulas */}
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px] font-bold">
                {["destaques", "hotdogs", "burgers", "pasteis", "tapiocas", "bebidas"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-shrink-0 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-[#231F1C] text-white"
                        : "bg-white text-neutral-600 border border-neutral-200"
                    }`}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Grade de Produtos com Foto e Ações de Personalização BK/Mc */}
              <div className="grid grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-0.5">
                {products
                  .filter((p) => selectedCategory === "destaques" ? p.popular : p.category === selectedCategory)
                  .map((prod) => (
                    <div
                      key={prod.id}
                      className="p-2 bg-white rounded-2xl border border-neutral-200 hover:border-amber-400 text-left transition-all shadow-2xs flex flex-col justify-between"
                    >
                      <div 
                        onClick={() => setCustomizingProduct(prod)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0 border border-[#EFE9DF]">
                            {prod.image && (prod.image.startsWith("http") || prod.image.startsWith("/")) ? (
                              <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm">{prod.image}</span>
                            )}
                          </div>
                          <span className="text-xs font-black text-[#BD4D2D]">
                            R$ {prod.price.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-[11px] font-black text-neutral-900 leading-snug line-clamp-2">
                          {prod.name}
                        </p>
                      </div>

                      {/* Botões de Ação: Personalizar (BK/Mc) ou Padrão (1-Toque) */}
                      <div className="grid grid-cols-2 gap-1 mt-2 pt-1.5 border-t border-neutral-100">
                        <button
                          type="button"
                          onClick={() => setCustomizingProduct(prod)}
                          className="py-1 px-1 bg-[#FEF6EC] hover:bg-[#FDEEDC] text-[#D97706] border border-[#FBD9B0] rounded-lg text-[9px] font-black flex items-center justify-center gap-0.5 cursor-pointer"
                          title="Personalizar ingredientes (Sem cebola, Sem milho, + Extras)"
                        >
                          <SlidersHorizontal className="w-2.5 h-2.5" />
                          <span>Customizar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(prod)}
                          className="py-1 px-1 bg-[#C83E2B] hover:bg-[#B03221] text-white rounded-lg text-[9px] font-black flex items-center justify-center gap-0.5 cursor-pointer shadow-2xs"
                          title="Lançamento Rápido Direto (Receita Padrão)"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>Padrão</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TELA 4: PAGAMENTO & COBRANÇA NA MAQUININHA */}
          {viewStep === "pagamento" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setViewStep("comanda")}
                  className="flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>
                <h3 className="text-xs font-black text-neutral-900">Cobrança Smart POS</h3>
              </div>

              {/* Totalizador com Taxa de 10% */}
              <div className="bg-white p-3.5 rounded-2xl border border-neutral-300 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal Itens:</span>
                  <span className="font-bold">R$ {subtotal.toFixed(2)}</span>
                </div>

                <label className="flex items-center justify-between pt-1 border-t border-neutral-100 cursor-pointer">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={includeServiceFee}
                      onChange={(e) => setIncludeServiceFee(e.target.checked)}
                      className="w-4 h-4 text-[#BD4D2D] accent-[#BD4D2D]"
                    />
                    <span className="font-bold text-neutral-700">Taxa Garçom 10%:</span>
                  </div>
                  <span className="font-black text-amber-700">+ R$ {serviceFee.toFixed(2)}</span>
                </label>

                <div className="flex justify-between items-center pt-2 border-t-2 border-neutral-200 text-sm font-black">
                  <span>TOTAL A COBRAR:</span>
                  <span className="text-lg text-[#BD4D2D]">R$ {grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Seleção do Meio de Pagamento */}
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod("credito")}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 ${
                    selectedPaymentMethod === "credito"
                      ? "bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-500/20"
                      : "bg-white border-neutral-200 text-neutral-700"
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Cartão Crédito</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod("debito")}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 ${
                    selectedPaymentMethod === "debito"
                      ? "bg-cyan-50 border-cyan-600 text-cyan-900 ring-2 ring-cyan-500/20"
                      : "bg-white border-neutral-200 text-neutral-700"
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-cyan-600" />
                  <span>Cartão Débito</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod("pix")}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 ${
                    selectedPaymentMethod === "pix"
                      ? "bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500/20"
                      : "bg-white border-neutral-200 text-neutral-700"
                  }`}
                >
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>Pix na Tela</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod("dinheiro")}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 ${
                    selectedPaymentMethod === "dinheiro"
                      ? "bg-amber-50 border-amber-600 text-amber-900 ring-2 ring-amber-500/20"
                      : "bg-white border-neutral-200 text-neutral-700"
                  }`}
                >
                  <Banknote className="w-4 h-4 text-amber-600" />
                  <span>Dinheiro</span>
                </button>
              </div>

              {/* Botão de Conclusão */}
              <button
                type="button"
                onClick={() => {
                  if (activeComanda) {
                    onCloseComanda(currentTable.number, activeComanda.id);
                  }
                  alert(`✅ Pagamento de R$ ${grandTotal.toFixed(2)} processado com sucesso na maquininha via ${selectedPaymentMethod.toUpperCase()}!`);
                  setViewStep("mesas");
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-3.5 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Check className="w-5 h-5" />
                <span>CONFIRMAR COBRANÇA</span>
              </button>
            </div>
          )}
        </div>

        {/* Rodapé da Maquininha: Botão de Ação Principal */}
        <div className="p-3 bg-[#EFE9DF] border-t border-neutral-300">
          {viewStep === "comanda" && activeComanda && activeComanda.items.length > 0 && (
            <button
              type="button"
              onClick={() => setViewStep("pagamento")}
              className="w-full bg-[#231F1C] hover:bg-black text-white font-black text-xs py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>COBRAR CONTA (R$ {grandTotal.toFixed(2)})</span>
            </button>
          )}

          {viewStep === "mesas" && (
            <div className="text-center text-[10px] text-neutral-500 font-bold">
              Toque em uma mesa para visualizar comandas ou lançar pedidos.
            </div>
          )}
        </div>

        {/* Modal de Personalização BK / McDonald's (Ingredientes, Adicionais e Retiradas) */}
        {customizingProduct && (
          <ProductDetailModal
            product={customizingProduct}
            onClose={() => setCustomizingProduct(null)}
            onConfirm={handleConfirmCustomization}
          />
        )}
      </div>
    </div>
  );
}