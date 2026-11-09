"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  X,
  Users,
  CheckCircle2,
  CreditCard,
  QrCode,
  Copy,
  Check,
  Plus,
  Receipt,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Split,
  BadgeDollarSign,
  Coffee,
  Beer,
  Heart,
  Loader2,
  DollarSign,
  AlertCircle
} from "lucide-react";
import { Table, Comanda, CartItem } from "../lib/types";
import { StoreSettings } from "../lib/server-db";
import { generatePixBrCode } from "../lib/pix-brcode";

interface BillSplitModalProps {
  table: Table;
  settings?: StoreSettings;
  activeComandaId?: string;
  onClose: () => void;
  onCallWaiter: (tableNumber: number, reason: string) => void;
  onAddSubcomanda: (tableNumber: number, name: string) => void;
  onRegisterPayment?: (
    tableNumber: number,
    comandaId: string | undefined,
    amount: number,
    method: string
  ) => void;
}

export function BillSplitModal({
  table,
  settings,
  activeComandaId,
  onClose,
  onCallWaiter,
  onAddSubcomanda,
  onRegisterPayment,
}: BillSplitModalProps) {
  // 1. Escopo de Comanda Selecionada ("all" = toda a mesa, ou UUID da comanda específica)
  const [selectedComandaScope, setSelectedComandaScope] = useState<string>(
    activeComandaId || "all"
  );

  // 2. Modo de Divisão
  const [splitMode, setSplitMode] = useState<"itens" | "pessoas" | "comandas" | "valor">("itens");

  // 3. Estado de Nova Comanda Personalizada
  const [isAddingCustomComanda, setIsAddingCustomComanda] = useState(false);
  const [newComandaName, setNewComandaName] = useState("");

  // 4. Seleção de Itens (para "Dividir por Itens")
  // Chave: `${item.id || item.name}-${comandaId}-${index}`
  const [selectedItemKeys, setSelectedItemKeys] = useState<Record<string, boolean>>({});

  // 5. Racha Igualitário (Pessoas)
  const [peopleCount, setPeopleCount] = useState<number>(2);

  // 6. Valor Livre
  const [customAmountStr, setCustomAmountStr] = useState<string>("");

  // 7. Etapa do Modal: 'config' (escolha dos itens/divisão) | 'payment_pix' | 'payment_waiter' | 'success'
  const [step, setStep] = useState<"config" | "payment_pix" | "payment_waiter" | "success">("config");

  // 8. Estado do Pix
  const [pixQrDataUrl, setPixQrDataUrl] = useState<string>("");
  const [pixCopyCode, setPixCopyCode] = useState<string>("");
  const [copiedPix, setCopiedPix] = useState(false);
  const [generatingPix, setGeneratingPix] = useState(false);

  // 9. Estado da Maquininha (Garçom)
  const [cardType, setCardType] = useState<"credito" | "debito" | "refeicao" | "dinheiro">("credito");
  const [needChangeFor, setNeedChangeFor] = useState<string>("");

  // 10. Valor Ativo a Ser Pago no Checkout
  const [amountToPay, setAmountToPay] = useState<number>(0);

  // Total Geral e Pagamentos Acumulados da Mesa
  const totalTableConsumption = table.comandas.reduce((sum, c) => sum + (c.total || 0), 0);
  const totalTablePaid = table.comandas.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
  const tableRemaining = Math.max(0, totalTableConsumption - totalTablePaid);
  const tableProgressPercent =
    totalTableConsumption > 0
      ? Math.min(100, Math.round((totalTablePaid / totalTableConsumption) * 100))
      : 0;

  // Comanda selecionada no filtro
  const targetComanda = table.comandas.find((c) => c.id === selectedComandaScope);

  // Lista agregada de itens conforme o escopo (toda a mesa ou comanda específica)
  interface FlattenedItem {
    key: string;
    item: CartItem;
    comandaId: string;
    comandaName: string;
  }

  const availableItems: FlattenedItem[] = [];
  if (selectedComandaScope === "all") {
    table.comandas.forEach((cmd) => {
      cmd.items.forEach((it, idx) => {
        availableItems.push({
          key: `${it.id || it.name}-${cmd.id}-${idx}`,
          item: it,
          comandaId: cmd.id,
          comandaName: cmd.customerName,
        });
      });
    });
  } else if (targetComanda) {
    targetComanda.items.forEach((it, idx) => {
      availableItems.push({
        key: `${it.id || it.name}-${targetComanda.id}-${idx}`,
        item: it,
        comandaId: targetComanda.id,
        comandaName: targetComanda.customerName,
      });
    });
  }

  // Inicializa a seleção de itens marcando todos os itens da comanda ativa por conveniência
  useEffect(() => {
    const initialKeys: Record<string, boolean> = {};
    availableItems.forEach((it) => {
      initialKeys[it.key] = true;
    });
    setSelectedItemKeys(initialKeys);
  }, [selectedComandaScope]);

  // Cálculo da soma dos itens selecionados
  const selectedItemsTotal = availableItems.reduce((sum, it) => {
    if (selectedItemKeys[it.key]) {
      return sum + it.item.price * it.item.quantity;
    }
    return sum;
  }, 0);

  const selectedItemsCount = availableItems.filter((it) => selectedItemKeys[it.key]).length;

  // Valor a dividir por pessoas no escopo atual
  const scopeTotal = selectedComandaScope === "all" ? tableRemaining : Math.max(0, (targetComanda?.total || 0) - (targetComanda?.paidAmount || 0));
  const amountPerPerson = peopleCount > 0 ? scopeTotal / peopleCount : scopeTotal;

  // Função para alternar seleção de item
  const toggleItemSelection = (key: string) => {
    setSelectedItemKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectAll = () => {
    const next: Record<string, boolean> = {};
    availableItems.forEach((it) => {
      next[it.key] = true;
    });
    setSelectedItemKeys(next);
  };

  const handleDeselectAll = () => {
    setSelectedItemKeys({});
  };

  // Criação rápida de Nova Comanda Personalizada
  const handleCreateCustomComanda = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newComandaName.trim()) return;

    onAddSubcomanda(table.number, newComandaName.trim());
    setNewComandaName("");
    setIsAddingCustomComanda(false);
  };

  const handleQuickAddComanda = (suffix: string) => {
    const baseName = newComandaName.trim() || "Comanda";
    const fullName = `${baseName} (${suffix})`;
    onAddSubcomanda(table.number, fullName);
    setNewComandaName("");
    setIsAddingCustomComanda(false);
  };

  // Avança para o pagamento (Pix ou Garçom) com o valor calculado
  const handleProceedToPayment = async (amount: number, method: "pix" | "waiter") => {
    if (amount <= 0) {
      alert("Por favor, selecione itens ou defina um valor maior que zero para pagar.");
      return;
    }

    setAmountToPay(amount);

    if (method === "pix") {
      setGeneratingPix(true);
      setStep("payment_pix");

      try {
        const pixKey = settings?.pixKey || "pix@tanamesa.a2isolutions.com.br";
        const merchant = settings?.storeName || "TA NA MESA";
        const txid = `MESA${table.number}C${Date.now().toString().slice(-4)}`;

        const brCode = generatePixBrCode({
          pixKey,
          merchantName: merchant,
          amount,
          txid,
          description: `Mesa ${table.number} - Divisao`,
        });

        setPixCopyCode(brCode);

        const qrData = await QRCode.toDataURL(brCode, {
          width: 320,
          margin: 2,
          color: {
            dark: "#1F2421",
            light: "#FFFFFF",
          },
        });

        setPixQrDataUrl(qrData);
      } catch (err) {
        console.error("Erro gerando Pix:", err);
      } finally {
        setGeneratingPix(false);
      }
    } else {
      setStep("payment_waiter");
    }
  };

  // Confirmação de Pagamento via Pix
  const handleConfirmPixPaid = () => {
    if (onRegisterPayment) {
      const targetId = selectedComandaScope !== "all" ? selectedComandaScope : table.comandas[0]?.id;
      onRegisterPayment(table.number, targetId, amountToPay, "pix");
    }

    // Notifica garçom e gestor
    onCallWaiter(
      table.number,
      `💳 Pagamento Pix de R$ ${amountToPay.toFixed(2)} confirmado pelo cliente (${
        targetComanda?.customerName || "Mesa " + table.number
      })`
    );

    setStep("success");
  };

  // Confirmação de Chamado de Maquininha
  const handleConfirmWaiterPayment = () => {
    const methodLabel = {
      credito: "Cartão de Crédito",
      debito: "Cartão de Débito",
      refeicao: "Vale Refeição (VR)",
      dinheiro: needChangeFor ? `Dinheiro (Troco p/ R$ ${needChangeFor})` : "Dinheiro",
    }[cardType];

    onCallWaiter(
      table.number,
      `🧾 Solicitou Maquininha na Mesa: R$ ${amountToPay.toFixed(2)} (${methodLabel}) [${
        targetComanda?.customerName || "Mesa " + table.number
      }]`
    );

    setStep("success");
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCopyCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FDFBF7] rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl border border-[#EFE9DF] overflow-hidden">
        
        {/* ========================================================================= */}
        {/* TOPO DO MODAL */}
        {/* ========================================================================= */}
        <div className="bg-white px-5 py-4 border-b border-[#EFE9DF] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {step !== "config" && (
              <button
                onClick={() => setStep("config")}
                className="p-1.5 -ml-1 text-neutral-500 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors"
                title="Voltar às opções de divisão"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-9 h-9 rounded-2xl bg-[#FDF2F0] text-[#C83E2B] flex items-center justify-center font-black">
              <Split className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#1F2421]">
                {step === "config" && "Conferir & Dividir Conta"}
                {step === "payment_pix" && "Pagamento Instantâneo via Pix"}
                {step === "payment_waiter" && "Chamar Garçom com Maquininha"}
                {step === "success" && "Operação Registrada!"}
              </h3>
              <p className="text-xs text-neutral-500">
                Mesa {table.number} • {settings?.storeName || "Tá na Mesa"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* CONTEÚDO PRINCIPAL: PASSO CONFIG (DIVISÃO) */}
        {/* ========================================================================= */}
        {step === "config" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            
            {/* Card de Quitação & Barra de Progresso */}
            <div className="p-4 rounded-2xl bg-white border border-[#EFE9DF] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Total Acumulado da Mesa
                  </span>
                  <p className="text-2xl font-black text-[#1F2421]">
                    R$ {totalTableConsumption.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Restante a Pagar
                  </span>
                  <p className="text-xl font-black text-[#C83E2B]">
                    R$ {tableRemaining.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 mb-1.5">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Pago: R$ {totalTablePaid.toFixed(2)} ({tableProgressPercent}%)
                  </span>
                  <span>Falta: R$ {tableRemaining.toFixed(2)}</span>
                </div>
                <div className="h-2.5 w-full bg-neutral-100 rounded-full overflow-hidden p-0.5 border border-neutral-200">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-[#C83E2B] rounded-full transition-all duration-500"
                    style={{ width: `${tableProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* ===================================================================== */}
            {/* GESTÃO E SELEÇÃO DE COMANDAS PERSONALIZADAS */}
            {/* ===================================================================== */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#C83E2B]" />
                  Comandas Personalizadas da Mesa:
                </span>
                <span className="text-[11px] text-neutral-400">
                  {table.comandas.length} comanda(s) aberta(s)
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {/* Opção Toda a Mesa */}
                <button
                  onClick={() => setSelectedComandaScope("all")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                    selectedComandaScope === "all"
                      ? "bg-[#1F2421] text-white border-[#1F2421] shadow-xs"
                      : "bg-white text-neutral-700 border-[#EFE9DF] hover:bg-neutral-50"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#F4A261]" />
                  <span>Toda a Mesa</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white">
                    R$ {totalTableConsumption.toFixed(2)}
                  </span>
                </button>

                {/* Comandas Individuais */}
                {table.comandas.map((c) => {
                  const isCurrent = selectedComandaScope === c.id;
                  const isPaid = (c.paidAmount || 0) >= c.total && c.total > 0;

                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedComandaScope(c.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                        isCurrent
                          ? "bg-[#C83E2B] text-white border-[#C83E2B] shadow-xs"
                          : "bg-white text-neutral-700 border-[#EFE9DF] hover:bg-neutral-50"
                      }`}
                    >
                      <span>👤 {c.customerName}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isCurrent
                            ? "bg-white/20 text-white"
                            : isPaid
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {isPaid ? "Paga" : `R$ ${c.total.toFixed(2)}`}
                      </span>
                    </button>
                  );
                })}

                {/* Botão de Nova Comanda Personalizada */}
                {!isAddingCustomComanda ? (
                  <button
                    onClick={() => setIsAddingCustomComanda(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-[#C83E2B] bg-[#FDF2F0] border border-[#FADCD7] hover:bg-[#FCEAE7] transition-all shrink-0 cursor-pointer"
                    title="Adicionar mais uma pessoa ou casal à mesa"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Nova Comanda</span>
                  </button>
                ) : null}
              </div>

              {/* Caixa de Criação Rápida de Nova Comanda */}
              {isAddingCustomComanda && (
                <div className="p-3 bg-white rounded-2xl border border-[#C83E2B]/40 shadow-sm space-y-2 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-700">
                    <span>Criar Comanda Personalizada:</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomComanda(false)}
                      className="text-neutral-400 hover:text-neutral-600"
                    >
                      ✕
                    </button>
                  </div>
                  <form onSubmit={handleCreateCustomComanda} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nome do cliente (ex: Lucas, Casal Silva)..."
                      value={newComandaName}
                      onChange={(e) => setNewComandaName(e.target.value)}
                      className="flex-1 text-xs px-3 py-2 rounded-xl border border-neutral-300 focus:border-[#C83E2B] outline-none bg-neutral-50"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!newComandaName.trim()}
                      className="bg-[#C83E2B] hover:bg-[#B03221] disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
                    >
                      Criar
                    </button>
                  </form>
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 overflow-x-auto pt-1">
                    <span className="font-semibold text-neutral-400 shrink-0">Sugestões:</span>
                    <button
                      type="button"
                      onClick={() => handleQuickAddComanda("Bebidas")}
                      className="px-2 py-0.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium shrink-0"
                    >
                      🍻 + Bebidas
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAddComanda("Casal")}
                      className="px-2 py-0.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium shrink-0"
                    >
                      💑 + Casal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAddComanda("Sobremesa")}
                      className="px-2 py-0.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium shrink-0"
                    >
                      🍨 + Sobremesa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAddComanda("Amigo")}
                      className="px-2 py-0.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium shrink-0"
                    >
                      👤 + Amigo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ===================================================================== */}
            {/* ABAS DE MÉTODOS DE DIVISÃO (DO STITCH) */}
            {/* ===================================================================== */}
            <div className="bg-neutral-100 p-1 rounded-2xl flex items-center gap-1 text-xs font-bold text-neutral-600">
              <button
                onClick={() => setSplitMode("itens")}
                className={`flex-1 py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  splitMode === "itens"
                    ? "bg-white text-[#C83E2B] shadow-xs"
                    : "hover:text-neutral-900"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Por Itens</span>
              </button>
              <button
                onClick={() => setSplitMode("pessoas")}
                className={`flex-1 py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  splitMode === "pessoas"
                    ? "bg-white text-[#C83E2B] shadow-xs"
                    : "hover:text-neutral-900"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Por Pessoas</span>
              </button>
              <button
                onClick={() => setSplitMode("comandas")}
                className={`flex-1 py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  splitMode === "comandas"
                    ? "bg-white text-[#C83E2B] shadow-xs"
                    : "hover:text-neutral-900"
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Por Comandas</span>
              </button>
              <button
                onClick={() => setSplitMode("valor")}
                className={`flex-1 py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  splitMode === "valor"
                    ? "bg-white text-[#C83E2B] shadow-xs"
                    : "hover:text-neutral-900"
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Valor Avulso</span>
              </button>
            </div>

            {/* ===================================================================== */}
            {/* ABA 1: DIVIDIR POR ITENS (SELEÇÃO INDIVIDUAL DO STITCH) */}
            {/* ===================================================================== */}
            {splitMode === "itens" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-700">
                    Selecione o que você consumiu:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="text-[#C83E2B] hover:underline font-bold"
                    >
                      Marcar Todos
                    </button>
                    <span className="text-neutral-300">•</span>
                    <button
                      onClick={handleDeselectAll}
                      className="text-neutral-500 hover:underline font-medium"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                {availableItems.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-[#EFE9DF] text-xs text-neutral-400">
                    Nenhum item lançado ainda nesta comanda.
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-[#EFE9DF] divide-y divide-neutral-100 max-h-60 overflow-y-auto">
                    {availableItems.map((entry) => {
                      const isChecked = Boolean(selectedItemKeys[entry.key]);
                      const itemSubtotal = entry.item.price * entry.item.quantity;

                      return (
                        <label
                          key={entry.key}
                          className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                            isChecked ? "bg-[#FDF9F7]" : "hover:bg-neutral-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleItemSelection(entry.key)}
                            className="w-4 h-4 rounded text-[#C83E2B] focus:ring-[#C83E2B] border-neutral-300 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-neutral-800">
                                {entry.item.quantity}x {entry.item.name}
                              </span>
                              {selectedComandaScope === "all" && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-600 font-medium">
                                  {entry.comandaName}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-400">
                              R$ {entry.item.price.toFixed(2)} cada
                              {entry.item.notes ? ` • ${entry.item.notes}` : ""}
                            </p>
                          </div>
                          <span className="text-xs font-black text-neutral-900 shrink-0">
                            R$ {itemSubtotal.toFixed(2)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Subtotal da Seleção */}
                <div className="p-3.5 bg-[#FDF2F0] rounded-2xl border border-[#FADCD7] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#C83E2B] uppercase tracking-wider block">
                      Sua Parte Selecionada:
                    </span>
                    <span className="text-xs text-neutral-600">
                      {selectedItemsCount} de {availableItems.length} item(ns)
                    </span>
                  </div>
                  <span className="text-2xl font-black text-[#C83E2B]">
                    R$ {selectedItemsTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* ABA 2: DIVIDIR POR PESSOAS (RACHA IGUALITÁRIO) */}
            {/* ===================================================================== */}
            {splitMode === "pessoas" && (
              <div className="space-y-4 p-4 bg-white rounded-2xl border border-[#EFE9DF]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-neutral-700 block">
                      Dividir com quantas pessoas?
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      Racha igual do valor restante (R$ {scopeTotal.toFixed(2)})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                      className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center font-bold text-neutral-700 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-black text-base w-6 text-center text-neutral-900">
                      {peopleCount}
                    </span>
                    <button
                      onClick={() => setPeopleCount(peopleCount + 1)}
                      className="w-8 h-8 rounded-xl bg-[#C83E2B] hover:bg-[#B03221] text-white flex items-center justify-center font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-[#FDF2F0] rounded-2xl border border-[#FADCD7] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#C83E2B] uppercase tracking-wider block">
                      Valor por pessoa:
                    </span>
                    <span className="text-xs text-neutral-600">
                      {peopleCount} parte(s) iguais
                    </span>
                  </div>
                  <span className="text-2xl font-black text-[#C83E2B]">
                    R$ {amountPerPerson.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* ABA 3: DIVIDIR POR COMANDAS FECHADAS */}
            {/* ===================================================================== */}
            {splitMode === "comandas" && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-neutral-700 block">
                  Escolha qual comanda deseja pagar agora:
                </span>
                <div className="space-y-2">
                  {table.comandas.map((c) => {
                    const cRemaining = Math.max(0, c.total - (c.paidAmount || 0));
                    const isPaid = cRemaining <= 0 && c.total > 0;

                    return (
                      <div
                        key={c.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                          isPaid
                            ? "bg-emerald-50/70 border-emerald-200"
                            : "bg-white border-[#EFE9DF] hover:border-[#C83E2B]/50"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-neutral-900">
                              👤 {c.customerName}
                            </span>
                            {isPaid && (
                              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                ✓ 100% Paga
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            Total: R$ {c.total.toFixed(2)} • Pago: R$ {(c.paidAmount || 0).toFixed(2)}
                          </p>
                        </div>

                        {!isPaid && (
                          <button
                            onClick={() => handleProceedToPayment(cRemaining, "pix")}
                            className="bg-[#C83E2B] hover:bg-[#B03221] text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
                          >
                            Pagar R$ {cRemaining.toFixed(2)}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* ABA 4: VALOR LIVRE / AVULSO */}
            {/* ===================================================================== */}
            {splitMode === "valor" && (
              <div className="space-y-3 p-4 bg-white rounded-2xl border border-[#EFE9DF]">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Digite quanto quer pagar da conta:
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-neutral-400 text-sm">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      max={tableRemaining}
                      placeholder="0,00"
                      value={customAmountStr}
                      onChange={(e) => setCustomAmountStr(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 text-base font-black text-neutral-900 focus:border-[#C83E2B] outline-none"
                    />
                  </div>
                </div>

                {/* Atalhos Rápidos */}
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <button
                    onClick={() => setCustomAmountStr("20.00")}
                    className="flex-1 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                  >
                    R$ 20
                  </button>
                  <button
                    onClick={() => setCustomAmountStr("50.00")}
                    className="flex-1 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                  >
                    R$ 50
                  </button>
                  <button
                    onClick={() => setCustomAmountStr("100.00")}
                    className="flex-1 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                  >
                    R$ 100
                  </button>
                  <button
                    onClick={() => setCustomAmountStr(tableRemaining.toFixed(2))}
                    className="flex-1 py-1.5 rounded-lg bg-[#FDF2F0] text-[#C83E2B] hover:bg-[#FADCD7]"
                  >
                    Restante
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* CONTEÚDO: PASSO PAGAMENTO PIX */}
        {/* ========================================================================= */}
        {step === "payment_pix" && (
          <div className="flex-1 overflow-y-auto p-5 text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
              <span>🔑 Pix Dinâmico Instantâneo</span>
            </div>

            <div>
              <span className="text-xs text-neutral-500 font-medium">Valor desta parcela:</span>
              <p className="text-3xl font-black text-[#C83E2B]">
                R$ {amountToPay.toFixed(2)}
              </p>
            </div>

            {generatingPix ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-neutral-500 text-xs">
                <Loader2 className="w-8 h-8 animate-spin text-[#C83E2B]" />
                <span>Gerando QR Code Oficial do Banco Central...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* QR Code */}
                {pixQrDataUrl && (
                  <div className="p-3 bg-white rounded-2xl border-2 border-neutral-200 shadow-md inline-block">
                    <img
                      src={pixQrDataUrl}
                      alt="QR Code Pix"
                      className="w-48 h-48 mx-auto rounded-lg"
                    />
                  </div>
                )}

                {/* Copia e Cola */}
                <div className="space-y-1.5 max-w-sm mx-auto">
                  <span className="text-[11px] font-bold text-neutral-500 block">
                    Pix Copia e Cola:
                  </span>
                  <div className="flex items-center gap-2 p-1.5 bg-neutral-100 rounded-xl border border-neutral-200">
                    <input
                      type="text"
                      readOnly
                      value={pixCopyCode}
                      className="bg-transparent border-none text-[11px] font-mono text-neutral-600 truncate flex-1 outline-none px-2"
                    />
                    <button
                      onClick={handleCopyPix}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                        copiedPix
                          ? "bg-emerald-600 text-white"
                          : "bg-[#1F2421] text-white hover:bg-neutral-800"
                      }`}
                    >
                      {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPix ? "Copiado!" : "Copiar"}</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-400">
                  Abra o app do seu banco, escolha Pix &gt; Copia e Cola e cole o código.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* CONTEÚDO: PASSO CHAMAR GARÇOM (MAQUININHA) */}
        {/* ========================================================================= */}
        {step === "payment_waiter" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="text-center">
              <span className="text-xs text-neutral-500 font-medium">Valor a ser cobrado na máquina:</span>
              <p className="text-3xl font-black text-[#1F2421]">
                R$ {amountToPay.toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700 block">
                Escolha a forma de pagamento na maquininha:
              </label>

              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCardType("credito")}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2 transition-all ${
                    cardType === "credito"
                      ? "border-[#C83E2B] bg-[#FDF2F0] text-[#C83E2B]"
                      : "border-neutral-200 bg-white text-neutral-700"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Cartão de Crédito</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCardType("debito")}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2 transition-all ${
                    cardType === "debito"
                      ? "border-[#C83E2B] bg-[#FDF2F0] text-[#C83E2B]"
                      : "border-neutral-200 bg-white text-neutral-700"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Cartão de Débito</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCardType("refeicao")}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2 transition-all ${
                    cardType === "refeicao"
                      ? "border-[#C83E2B] bg-[#FDF2F0] text-[#C83E2B]"
                      : "border-neutral-200 bg-white text-neutral-700"
                  }`}
                >
                  <Coffee className="w-4 h-4" />
                  <span>Vale Refeição (VR)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCardType("dinheiro")}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2 transition-all ${
                    cardType === "dinheiro"
                      ? "border-[#C83E2B] bg-[#FDF2F0] text-[#C83E2B]"
                      : "border-neutral-200 bg-white text-neutral-700"
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Dinheiro</span>
                </button>
              </div>

              {cardType === "dinheiro" && (
                <div className="pt-2 animate-in fade-in">
                  <label className="text-[11px] font-bold text-neutral-600 block mb-1">
                    Precisa de troco para quanto? (Opcional)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 50,00 ou 100,00"
                    value={needChangeFor}
                    onChange={(e) => setNeedChangeFor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs bg-white outline-none focus:border-[#C83E2B]"
                  />
                </div>
              )}
            </div>

            <div className="p-3 bg-neutral-100 rounded-xl text-neutral-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>O garçom receberá o aviso na hora e levará a máquina até a Mesa {table.number}.</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CONTEÚDO: PASSO SUCESSO / CONFIRMAÇÃO */}
        {/* ========================================================================= */}
        {step === "success" && (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl font-black mb-2 animate-bounce">
              ✓
            </div>
            <h4 className="text-xl font-black text-[#1F2421]">
              Solicitação Enviada com Sucesso!
            </h4>
            <p className="text-xs text-neutral-600 max-w-sm">
              O pagamento / chamado de R$ {amountToPay.toFixed(2)} foi computado e enviado em tempo real para a equipe da loja.
            </p>
            <button
              onClick={() => {
                setStep("config");
                onClose();
              }}
              className="mt-4 px-6 py-2.5 rounded-xl bg-[#1F2421] text-white font-bold text-xs hover:bg-neutral-800 transition-all cursor-pointer"
            >
              Concluir & Voltar à Mesa
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* RODAPÉ FIXO DO MODAL (BOTÕES DE AÇÃO) */}
        {/* ========================================================================= */}
        {step === "config" && (
          <div className="bg-white p-4 border-t border-[#EFE9DF] shrink-0 space-y-2">
            {splitMode === "itens" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleProceedToPayment(selectedItemsTotal, "pix")}
                  disabled={selectedItemsTotal <= 0}
                  className="flex-1 bg-[#C83E2B] hover:bg-[#B03221] disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Pagar Itens no Pix (R$ {selectedItemsTotal.toFixed(2)})</span>
                </button>
                <button
                  onClick={() => handleProceedToPayment(selectedItemsTotal, "waiter")}
                  disabled={selectedItemsTotal <= 0}
                  className="bg-[#1F2421] hover:bg-neutral-800 disabled:opacity-50 text-white font-bold text-xs px-4 py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  title="Chamar Garçom com a Maquininha"
                >
                  <CreditCard className="w-4 h-4 text-[#F4A261]" />
                  <span className="hidden sm:inline">Maquininha</span>
                </button>
              </div>
            )}

            {splitMode === "pessoas" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleProceedToPayment(amountPerPerson, "pix")}
                  disabled={amountPerPerson <= 0}
                  className="flex-1 bg-[#C83E2B] hover:bg-[#B03221] disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Pagar Minha Cota no Pix (R$ {amountPerPerson.toFixed(2)})</span>
                </button>
                <button
                  onClick={() => handleProceedToPayment(amountPerPerson, "waiter")}
                  disabled={amountPerPerson <= 0}
                  className="bg-[#1F2421] hover:bg-neutral-800 disabled:opacity-50 text-white font-bold text-xs px-4 py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  <CreditCard className="w-4 h-4 text-[#F4A261]" />
                  <span className="hidden sm:inline">Maquininha</span>
                </button>
              </div>
            )}

            {splitMode === "valor" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleProceedToPayment(Number(customAmountStr) || 0, "pix")}
                  disabled={!customAmountStr || Number(customAmountStr) <= 0}
                  className="flex-1 bg-[#C83E2B] hover:bg-[#B03221] disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Pagar Valor no Pix</span>
                </button>
                <button
                  onClick={() => handleProceedToPayment(Number(customAmountStr) || 0, "waiter")}
                  disabled={!customAmountStr || Number(customAmountStr) <= 0}
                  className="bg-[#1F2421] hover:bg-neutral-800 disabled:opacity-50 text-white font-bold text-xs px-4 py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  <CreditCard className="w-4 h-4 text-[#F4A261]" />
                  <span className="hidden sm:inline">Maquininha</span>
                </button>
              </div>
            )}

            {/* Ação Auxiliar de Fechar a Mesa Completa */}
            <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-400">
              <span>Quer encerrar a mesa inteira?</span>
              <button
                onClick={() => {
                  onCallWaiter(table.number, "Pediu a conta para fechamento total da mesa");
                  alert(`🧾 Pedido de encerramento da Mesa ${table.number} enviado ao garçom!`);
                  onClose();
                }}
                className="text-neutral-700 hover:text-[#C83E2B] font-bold hover:underline"
              >
                Pedir Fechamento Total da Mesa &gt;
              </button>
            </div>
          </div>
        )}

        {step === "payment_pix" && (
          <div className="bg-white p-4 border-t border-[#EFE9DF] shrink-0 space-y-2">
            <button
              onClick={handleConfirmPixPaid}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Já Realizei o Pagamento via Pix</span>
            </button>
            <button
              onClick={() => setStep("config")}
              className="w-full text-neutral-500 hover:text-neutral-800 text-xs font-semibold py-1.5"
            >
              Voltar às opções de valor
            </button>
          </div>
        )}

        {step === "payment_waiter" && (
          <div className="bg-white p-4 border-t border-[#EFE9DF] shrink-0 space-y-2">
            <button
              onClick={handleConfirmWaiterPayment}
              className="w-full bg-[#1F2421] hover:bg-neutral-800 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
            >
              <CreditCard className="w-4 h-4 text-[#F4A261]" />
              <span>Confirmar e Chamar Garçom na Mesa</span>
            </button>
            <button
              onClick={() => setStep("config")}
              className="w-full text-neutral-500 hover:text-neutral-800 text-xs font-semibold py-1.5"
            >
              Voltar às opções
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
