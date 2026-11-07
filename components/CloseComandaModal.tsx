"use client";

import React, { useState } from "react";
import { Comanda, Table } from "../lib/types";
import { X, Check, DollarSign, CreditCard, QrCode, Banknote, UserCheck } from "lucide-react";

interface CloseComandaModalProps {
  tableNumber: number;
  comanda: Comanda;
  onClose: () => void;
  onConfirmClose: (paymentData: {
    paymentMethod: "dinheiro" | "pix" | "cartao_credito" | "cartao_debito";
    subtotal: number;
    serviceFee: number;
    total: number;
  }) => void;
}

export function CloseComandaModal({
  tableNumber,
  comanda,
  onClose,
  onConfirmClose,
}: CloseComandaModalProps) {
  const [includeServiceFee, setIncludeServiceFee] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<
    "dinheiro" | "pix" | "cartao_credito" | "cartao_debito"
  >("pix");

  const subtotal = comanda.total;
  const serviceFee = includeServiceFee ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
  const grandTotal = subtotal + serviceFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmClose({
      paymentMethod,
      subtotal,
      serviceFee,
      total: grandTotal,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              💰
            </div>
            <div>
              <h3 className="text-sm font-black text-neutral-900">
                Fechamento de Conta • Mesa {tableNumber}
              </h3>
              <p className="text-[11px] text-neutral-500 font-bold">
                Cliente: {comanda.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo dos Itens Consumidos */}
        <div className="max-h-40 overflow-y-auto space-y-1.5 mb-4 pr-1 text-xs border-b border-neutral-100 pb-3">
          {comanda.items.map((it, idx) => (
            <div key={idx} className="flex justify-between items-center text-neutral-700">
              <span className="truncate pr-2">
                {it.quantity}x {it.name}
              </span>
              <span className="font-bold text-neutral-900">
                R$ {(it.price * it.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Subtotal e Taxa de 10% do Garçom */}
        <div className="bg-[#FDFBF7] p-3.5 rounded-2xl border border-[#EFE9DF] space-y-2 text-xs mb-4">
          <div className="flex justify-between text-neutral-600">
            <span>Subtotal dos Itens:</span>
            <span className="font-bold">R$ {subtotal.toFixed(2)}</span>
          </div>

          <label className="flex items-center justify-between pt-1 border-t border-neutral-200 cursor-pointer">
            <div className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={includeServiceFee}
                onChange={(e) => setIncludeServiceFee(e.target.checked)}
                className="w-4 h-4 rounded text-[#BD4D2D] focus:ring-[#BD4D2D] accent-[#BD4D2D]"
              />
              <span className="font-bold text-neutral-800 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                Taxa de Serviço 10% (Garçom):
              </span>
            </div>
            <span className="font-black text-amber-700">
              + R$ {(subtotal * 0.1).toFixed(2)}
            </span>
          </label>

          <div className="flex justify-between items-center pt-2 border-t-2 border-neutral-200 text-sm font-black text-neutral-900">
            <span>Total da Comanda:</span>
            <span className="text-lg text-[#BD4D2D]">R$ {grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Forma de Pagamento */}
        <div className="mb-5">
          <label className="block text-xs font-black text-neutral-700 mb-2">
            Forma de Pagamento Utilizada:
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setPaymentMethod("pix")}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                paymentMethod === "pix"
                  ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                  : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>Pix</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("cartao_credito")}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                paymentMethod === "cartao_credito"
                  ? "bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20"
                  : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Cartão Crédito</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("cartao_debito")}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                paymentMethod === "cartao_debito"
                  ? "bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20"
                  : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <CreditCard className="w-4 h-4 text-cyan-600" />
              <span>Cartão Débito</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("dinheiro")}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                paymentMethod === "dinheiro"
                  ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20"
                  : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Banknote className="w-4 h-4 text-amber-600" />
              <span>Dinheiro</span>
            </button>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar Pagamento & Quitar</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 border border-neutral-200 text-neutral-600 text-xs font-bold rounded-xl hover:bg-neutral-100 cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}