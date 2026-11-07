"use client";

import React, { useState } from "react";
import { Order } from "../lib/types";
import { RESTAURANT_INFO } from "../lib/mock-data";
import { StoreSettings } from "../lib/server-db";
import { Printer, X, Check } from "lucide-react";

interface ReceiptModalProps {
  order: Order;
  settings?: StoreSettings;
  onClose: () => void;
}

export function ReceiptModal({ order, settings, onClose }: ReceiptModalProps) {
  const [printType, setPrintType] = useState<"cozinha" | "cliente">("cozinha");
  const is58mm = settings?.thermalPrintWidth === "58mm";
  const storeName = settings?.storeName || RESTAURANT_INFO.name;
  const storePhone = settings?.phone || RESTAURANT_INFO.phone;
  const storeAddress = settings?.address || RESTAURANT_INFO.address;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-[#C83E2B]" />
            <h3 className="text-sm font-black text-neutral-800">Simulador de Cupom Térmico</h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seletor de Tipo de Via */}
        <div className="flex rounded-xl bg-neutral-100 p-1 mb-4 text-xs font-bold">
          <button
            onClick={() => setPrintType("cozinha")}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              printType === "cozinha" ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-500"
            }`}
          >
            👨‍🍳 Via Cozinha / Bar
          </button>
          <button
            onClick={() => setPrintType("cliente")}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              printType === "cliente" ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-500"
            }`}
          >
            🧾 Via Cliente / Entrega
          </button>
        </div>

        {/* O Cupom Térmico (Estilo Bobina de 80mm ou 58mm) */}
        <div
          className={`bg-[#FAF8F5] p-4 rounded-xl border border-dashed border-neutral-300 font-mono text-xs text-neutral-800 space-y-2 select-all shadow-inner mx-auto ${
            is58mm ? "max-w-[240px] text-[11px]" : "w-full"
          }`}
        >
          <div className="text-center pb-2 border-b border-dashed border-neutral-300">
            <p className="font-bold text-sm tracking-wider">{storeName.toUpperCase()}</p>
            <p className="text-[10px] text-neutral-500">{storePhone}</p>
            <p className="text-[10px] text-neutral-500">{storeAddress}</p>
          </div>

          <div className="py-1 border-b border-dashed border-neutral-300 text-[11px]">
            <div className="flex justify-between font-bold">
              <span>PEDIDO #{order.orderNumber}</span>
              <span>{order.type === "mesa" ? `MESA ${order.tableNumber}` : "DELIVERY"}</span>
            </div>
            <p className="text-neutral-600">Cliente: {order.comandaName || order.customerName}</p>
            <p className="text-neutral-400 text-[10px]">Data: {new Date().toLocaleDateString("pt-BR")} - {order.createdAt}</p>
          </div>

          {/* Itens */}
          <div className="py-2 border-b border-dashed border-neutral-300 space-y-1.5">
            <p className="font-bold text-[10px] uppercase text-neutral-500">
              {printType === "cozinha" ? "ITENS PARA PRODUÇÃO:" : "ITENS DO CONSUMO:"}
            </p>
            {order.items.map((it, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between font-bold text-xs">
                  <span>{it.quantity}x {it.name.toUpperCase()}</span>
                  {printType === "cliente" && (
                    <span>R$ {(it.price * it.quantity).toFixed(2)}</span>
                  )}
                </div>
                {it.notes && (
                  <p className="text-[10px] text-neutral-600 bg-neutral-200/60 px-1 rounded inline-block">
                    * OBS: {it.notes.toUpperCase()}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Totais (apenas na via do cliente) */}
          {printType === "cliente" && (
            <div className="pt-1 text-xs space-y-1">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal:</span>
                <span>R$ {order.subtotal.toFixed(2)}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between text-neutral-500">
                  <span>Taxa de Entrega:</span>
                  <span>R$ {order.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Desconto (Cupom):</span>
                  <span>- R$ {order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black pt-1 border-t border-dashed border-neutral-300">
                <span>TOTAL:</span>
                <span>R$ {order.total.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-center text-neutral-400 pt-2">
                Obrigado pela preferência! Volte sempre.
              </p>
            </div>
          )}

          {printType === "cozinha" && (
            <div className="pt-2 text-center text-[10px] text-neutral-500">
              [ FIM DA COMANDA DE PRODUÇÃO ]
            </div>
          )}
        </div>

        {/* Botão de Disparo */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 bg-[#1F2421] hover:bg-neutral-800 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-[#F4A261]" />
            <span>Imprimir Cupom</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-xl border border-neutral-200 text-neutral-600 text-xs font-bold hover:bg-neutral-100 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
