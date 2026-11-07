"use client";

import React, { useState } from "react";
import { Order } from "../lib/types";
import { RESTAURANT_INFO } from "../lib/mock-data";
import { StoreSettings } from "../lib/server-db";
import {
  X,
  Printer,
  DollarSign,
  CreditCard,
  QrCode,
  Banknote,
  ArrowDownRight,
  ArrowUpRight,
  Lock,
  Plus,
  Minus,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

interface CashMovement {
  id: string;
  type: "sangria" | "suprimento";
  reason: string;
  amount: number;
  time: string;
}

interface CashRegisterModalProps {
  orders: Order[];
  settings?: StoreSettings;
  onClose: () => void;
}

export function CashRegisterModal({ orders, settings, onClose }: CashRegisterModalProps) {
  const isBlindMode = settings?.enableBlindCashClose || false;
  const [initialFund, setInitialFund] = useState(150.0);
  const [blindCountedAmount, setBlindCountedAmount] = useState<string>("");
  const [isBlindAudited, setIsBlindAudited] = useState<boolean>(!isBlindMode);
  const [movements, setMovements] = useState<CashMovement[]>([
    {
      id: "mov-1",
      type: "suprimento",
      reason: "Fundo de Troco Inicial Abertura",
      amount: 150.0,
      time: "18:00",
    },
  ]);

  const [movementType, setMovementType] = useState<"sangria" | "suprimento">("sangria");
  const [movementReason, setMovementReason] = useState("");
  const [movementAmount, setMovementAmount] = useState("");
  const [showAddMovement, setShowAddMovement] = useState(false);

  // Calcula totais das vendas reais por forma de pagamento (com fallback proporcional para pedidos sem método explícito)
  const completedOrders = orders.filter((o) => o.status !== "cancelado");
  const totalSales = completedOrders.reduce((sum, o) => sum + o.total, 0);

  let pixSales = 0;
  let creditSales = 0;
  let debitSales = 0;
  let cashSales = 0;

  completedOrders.forEach((o) => {
    const pm = (o.paymentMethod || "").toLowerCase();
    const addr = (o.deliveryAddress || "").toLowerCase();
    if (pm.includes("pix") || addr.includes("pix")) {
      pixSales += o.total;
    } else if (pm.includes("debito") || pm.includes("débito")) {
      debitSales += o.total;
    } else if (pm.includes("cartao") || pm.includes("cartão") || pm.includes("credito") || pm.includes("crédito") || addr.includes("cartão")) {
      creditSales += o.total;
    } else if (pm.includes("dinheiro") || addr.includes("dinheiro")) {
      cashSales += o.total;
    } else {
      pixSales += o.total * 0.45;
      creditSales += o.total * 0.35;
      debitSales += o.total * 0.1;
      cashSales += o.total * 0.1;
    }
  });

  const totalSangrias = movements
    .filter((m) => m.type === "sangria")
    .reduce((sum, m) => sum + m.amount, 0);

  const totalSuprimentos = movements
    .filter((m) => m.type === "suprimento")
    .reduce((sum, m) => sum + m.amount, 0);

  const cashInDrawerExpected = totalSuprimentos + cashSales - totalSangrias;

  const handleAddMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(movementAmount.replace(",", "."));
    if (!val || val <= 0 || !movementReason.trim()) {
      alert("Informe um valor e um motivo válido.");
      return;
    }

    const newMov: CashMovement = {
      id: `mov-${Date.now()}`,
      type: movementType,
      reason: movementReason.trim(),
      amount: val,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMovements([newMov, ...movements]);
    setMovementReason("");
    setMovementAmount("");
    setShowAddMovement(false);
  };

  const handlePrintZReport = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-neutral-200 animate-in zoom-in-95 my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
              💼
            </div>
            <div>
              <h2 className="text-base font-black text-[#231F1C]">
                Fechamento de Caixa & Controle de Turno (PDV)
              </h2>
              <p className="text-xs text-neutral-500 font-medium">
                {settings?.storeName || RESTAURANT_INFO.name} • Turno Noturno das 18h às 00h
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-2 rounded-xl hover:bg-neutral-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo Rápido em Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-[#FDFBF7] p-3 rounded-2xl border border-[#EFE9DF]">
            <span className="text-[10px] font-black uppercase text-neutral-500 block">Total Vendido</span>
            <span className="text-base font-black text-[#231F1C]">R$ {totalSales.toFixed(2)}</span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
              {completedOrders.length} pedido(s)
            </span>
          </div>

          <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
            <span className="text-[10px] font-black uppercase text-emerald-700 block">Pix Recebido</span>
            <span className="text-base font-black text-emerald-800">R$ {pixSales.toFixed(2)}</span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">45% do faturamento</span>
          </div>

          <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200">
            <span className="text-[10px] font-black uppercase text-blue-700 block">Cartões (C/D)</span>
            <span className="text-base font-black text-blue-800">R$ {(creditSales + debitSales).toFixed(2)}</span>
            <span className="text-[10px] text-blue-600 font-bold block mt-0.5">45% maquininhas</span>
          </div>

          <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200">
            <span className="text-[10px] font-black uppercase text-amber-700 block">
              {isBlindMode && !isBlindAudited ? "Gaveta (Modo Cego)" : "Gaveta em Dinheiro"}
            </span>
            <span className="text-base font-black text-amber-800">
              {isBlindMode && !isBlindAudited ? "🔒 R$ ••••" : `R$ ${cashInDrawerExpected.toFixed(2)}`}
            </span>
            <span className="text-[10px] text-amber-600 font-bold block mt-0.5">
              {isBlindMode && !isBlindAudited ? "Contagem às cegas" : "Esperado em espécie"}
            </span>
          </div>
        </div>

        {/* Banner de Fechamento de Caixa Cego (Colibri Style) */}
        {isBlindMode && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-300">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-amber-700" />
                <h4 className="text-xs font-black text-amber-900 uppercase">
                  Auditoria de Fechamento Cego Ativa (Padrão Colibri)
                </h4>
              </div>
              <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                Prevenção de Fraude & Vício
              </span>
            </div>
            <p className="text-xs text-amber-800 mb-3">
              Para garantir que o operador não adeque a contagem ao saldo do sistema, o valor esperado foi ocultado. Conte as cédulas e moedas físicas na gaveta e digite o valor real apurado:
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <span className="absolute left-3 top-2 text-xs font-bold text-neutral-500">R$</span>
                <input
                  type="text"
                  placeholder="0.00"
                  value={blindCountedAmount}
                  onChange={(e) => setBlindCountedAmount(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-black text-neutral-900 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const val = parseFloat(blindCountedAmount.replace(",", "."));
                  if (isNaN(val) || val < 0) {
                    alert("Digite um valor numérico válido para a contagem física.");
                    return;
                  }
                  setIsBlindAudited(true);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Auditar e Revelar Diferença</span>
              </button>
            </div>

            {/* Resultado da Auditoria Cega */}
            {isBlindAudited && (
              <div className="mt-3 pt-3 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-neutral-600">Contagem Física: <strong>R$ {parseFloat(blindCountedAmount.replace(",", ".") || "0").toFixed(2)}</strong></span>
                  <span className="mx-2">•</span>
                  <span className="text-neutral-600">Esperado Sistema: <strong>R$ {cashInDrawerExpected.toFixed(2)}</strong></span>
                </div>
                {(() => {
                  const counted = parseFloat(blindCountedAmount.replace(",", ".") || "0");
                  const diff = counted - cashInDrawerExpected;
                  if (Math.abs(diff) < 0.01) {
                    return (
                      <span className="font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Caixa 100% Batido! (Diferença R$ 0,00)
                      </span>
                    );
                  } else if (diff < 0) {
                    return (
                      <span className="font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Falta de Caixa: R$ {Math.abs(diff).toFixed(2)}
                      </span>
                    );
                  } else {
                    return (
                      <span className="font-black text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Sobra de Caixa: R$ {diff.toFixed(2)}
                      </span>
                    );
                  }
                })()}
              </div>
            )}
          </div>
        )}

        {/* Divisão por Formas de Pagamento & Sangrias */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Coluna 1: Conciliação de Vendas */}
          <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#EFE9DF] space-y-2.5 text-xs">
            <h3 className="font-black text-neutral-800 flex items-center justify-between">
              <span>📊 Conciliação por Forma de Pagamento</span>
              <span className="text-[10px] font-bold bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-full">
                Auditado
              </span>
            </h3>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center py-1 border-b border-neutral-200">
                <span className="flex items-center gap-1.5 text-neutral-700">
                  <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                  Pix Direto / QR Code
                </span>
                <span className="font-bold text-neutral-900">R$ {pixSales.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-neutral-200">
                <span className="flex items-center gap-1.5 text-neutral-700">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  Cartão de Crédito
                </span>
                <span className="font-bold text-neutral-900">R$ {creditSales.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-neutral-200">
                <span className="flex items-center gap-1.5 text-neutral-700">
                  <CreditCard className="w-3.5 h-3.5 text-cyan-600" />
                  Cartão de Débito
                </span>
                <span className="font-bold text-neutral-900">R$ {debitSales.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-neutral-200">
                <span className="flex items-center gap-1.5 text-neutral-700">
                  <Banknote className="w-3.5 h-3.5 text-amber-600" />
                  Dinheiro em Espécie
                </span>
                <span className="font-bold text-neutral-900">R$ {cashSales.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center pt-2 font-black text-neutral-900">
                <span>Total de Vendas no Turno:</span>
                <span className="text-[#BD4D2D]">R$ {totalSales.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Coluna 2: Sangrias e Suprimentos */}
          <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#EFE9DF] space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-neutral-800">
                💸 Sangrias & Suprimentos do Turno
              </h3>
              <button
                type="button"
                onClick={() => setShowAddMovement(!showAddMovement)}
                className="text-[11px] font-bold text-[#BD4D2D] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Lançar</span>
              </button>
            </div>

            {showAddMovement && (
              <form onSubmit={handleAddMovement} className="p-3 bg-white rounded-xl border border-neutral-200 space-y-2 shadow-xs">
                <div className="flex gap-2 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setMovementType("sangria")}
                    className={`flex-1 py-1 rounded-lg ${
                      movementType === "sangria" ? "bg-rose-100 text-rose-800 border border-rose-300" : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    Sangria (Retirada)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType("suprimento")}
                    className={`flex-1 py-1 rounded-lg ${
                      movementType === "suprimento" ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    Suprimento (Entrada)
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Motivo (ex: Compra de Gelo / Troco)"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs"
                  required
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Valor R$ (ex: 30.00)"
                    value={movementAmount}
                    onChange={(e) => setMovementAmount(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs font-bold"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-[#231F1C] text-white px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            )}

            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {movements.map((m) => (
                <div key={m.id} className="flex justify-between items-center py-1 border-b border-neutral-200/80">
                  <div>
                    <p className="font-bold text-neutral-800 flex items-center gap-1">
                      {m.type === "sangria" ? (
                        <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>{m.reason}</span>
                    </p>
                    <span className="text-[10px] text-neutral-400">{m.time}</span>
                  </div>
                  <span
                    className={`font-black ${
                      m.type === "sangria" ? "text-rose-600" : "text-emerald-700"
                    }`}
                  >
                    {m.type === "sangria" ? "-" : "+"} R$ {m.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bloco 2: Acerto de Motoboys & Taxas de Entrega do Turno */}
        {(() => {
          const deliveryOrders = completedOrders.filter((o) => o.type === "delivery");
          const couriersConfig = settings?.couriers || [
            { id: "mot-1", name: "Carlos Motoboy (Fixo)", phone: "84998112233", fixedDailyRate: 50, active: true },
            { id: "mot-2", name: "Júnior Express", phone: "84998223344", fixedDailyRate: 50, active: true },
          ];

          const courierStats = couriersConfig.map((c) => {
            const assigned = deliveryOrders.filter(
              (o) => o.courierId === c.id || o.courierName === c.name
            );
            const feesSum = assigned.reduce((acc, o) => acc + (o.deliveryFee || 0), 0);
            const daily = c.fixedDailyRate || 0;
            return {
              ...c,
              deliveriesCount: assigned.length,
              feesSum,
              daily,
              totalPayout: daily + feesSum,
            };
          });

          const unassignedDeliveries = deliveryOrders.filter(
            (o) => !o.courierId && !o.courierName
          );
          const unassignedFees = unassignedDeliveries.reduce(
            (acc, o) => acc + (o.deliveryFee || 0),
            0
          );

          return (
            <div className="mb-5 p-4 rounded-2xl bg-[#FDFBF7] border border-[#EFE9DF] space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-neutral-800 flex items-center gap-1.5">
                  <span>🛵 Acerto de Motoboys & Repasse de Taxas (Fim de Turno)</span>
                </h3>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {deliveryOrders.length} entrega(s) no turno
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                {courierStats.map((st) => (
                  <div
                    key={st.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 px-2.5 rounded-xl bg-white border border-neutral-200"
                  >
                    <div>
                      <span className="font-black text-neutral-900">{st.name}</span>
                      <span className="text-[11px] text-neutral-500 ml-2">
                        • {st.deliveriesCount} corrida(s)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-neutral-500">
                        Diária: R$ {st.daily.toFixed(2)} + Taxas: R$ {st.feesSum.toFixed(2)}
                      </span>
                      <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        Pagar: R$ {st.totalPayout.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}

                {unassignedDeliveries.length > 0 && (
                  <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900">
                    <span>
                      ⚠️ {unassignedDeliveries.length} entrega(s) sem motoboy vinculado no card
                    </span>
                    <span className="font-bold">Taxas acumuladas: R$ {unassignedFees.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Ações de Fechamento */}
        <div className="pt-3 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-neutral-500">
            <span>Operador: <strong>Fábio Barbosa</strong> • Caixa #01</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrintZReport}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-bold hover:bg-neutral-100 cursor-pointer transition-colors"
              title="Imprimir relatório Z de fechamento em impressora térmica"
            >
              <Printer className="w-4 h-4 text-neutral-600" />
              <span>Imprimir Relatório Z</span>
            </button>

            <button
              type="button"
              onClick={() => {
                alert(`✅ Fechamento de Caixa Realizado com Sucesso!\n\nTotal de Vendas: R$ ${totalSales.toFixed(2)}\nDinheiro em Gaveta: R$ ${cashInDrawerExpected.toFixed(2)}\nPix: R$ ${pixSales.toFixed(2)}\nCartões: R$ ${(creditSales + debitSales).toFixed(2)}`);
                onClose();
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#231F1C] hover:bg-black text-white text-xs font-extrabold cursor-pointer transition-colors shadow-xs"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Fechar Turno / Caixa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}