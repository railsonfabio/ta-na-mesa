"use client";

import React from "react";
import { Order, CartItem, OrderStatus } from "../lib/types";
import {
  X,
  RefreshCw,
  Clock,
  CheckCircle2,
  ChefHat,
  Bike,
  Utensils,
  AlertCircle,
  MapPin,
} from "lucide-react";

interface OrderHistoryModalProps {
  customerName: string;
  customerPhone?: string;
  orders: Order[];
  onClose: () => void;
  onReorder: (items: CartItem[]) => void;
}

function getOrderStatusMeta(status: OrderStatus, type: Order["type"], tableNumber?: number) {
  switch (status) {
    case "pendente":
      return {
        badgeLabel: "⏳ Aguardando Aceite",
        badgeClass: "bg-amber-50 text-amber-800 border-amber-300 animate-pulse",
        stepIndex: 1,
        detailTitle: "Etapa 1/4: Pedido enviado ao caixa",
        detailDescription:
          "O restaurante recebeu seu pedido e o caixa (PDV) fará a confirmação para liberar a cozinha.",
      };
    case "em_preparo":
      return {
        badgeLabel: "👨‍🍳 Em Preparo na Cozinha",
        badgeClass: "bg-orange-50 text-[#C83E2B] border-orange-300",
        stepIndex: 2,
        detailTitle: "Etapa 2/4: Pedido aceito • Na chapa/cozinha",
        detailDescription:
          "O caixa confirmou seu pedido e nossa cozinha já está preparando seus itens.",
      };
    case "a_caminho":
      return {
        badgeLabel: type === "mesa" ? "🍽️ Pronto • Indo p/ Mesa" : "🛵 Saiu para Entrega",
        badgeClass: "bg-blue-50 text-blue-800 border-blue-300 animate-pulse",
        stepIndex: 3,
        detailTitle:
          type === "mesa"
            ? `Etapa 3/4: Pedido pronto • Indo para a Mesa ${tableNumber || ""}`
            : "Etapa 3/4: Pedido pronto • Saiu com o entregador",
        detailDescription:
          type === "mesa"
            ? "Seu pedido acabou de sair da cozinha e está indo para sua mesa!"
            : "Seu pedido já foi embalado e o motoboy está a caminho do seu endereço!",
      };
    case "entregue":
      return {
        badgeLabel: "✅ Pedido Entregue",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        stepIndex: 4,
        detailTitle:
          type === "mesa"
            ? `Etapa 4/4: Servido na Mesa ${tableNumber || ""} (Entrega Concluída)`
            : "Etapa 4/4: Entrega concluída no endereço do cliente",
        detailDescription:
          "Todas as etapas (Aceite, Preparo na Cozinha e Entrega) foram concluídas. Bom apetite!",
      };
    case "cancelado":
    default:
      return {
        badgeLabel: "❌ Cancelado",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
        stepIndex: 0,
        detailTitle: "Pedido cancelado",
        detailDescription: "Este pedido foi cancelado e não seguirá para produção.",
      };
  }
}

export function OrderHistoryModal({
  customerName,
  customerPhone,
  orders,
  onClose,
  onReorder,
}: OrderHistoryModalProps) {
  const cleanPhone = (customerPhone || "").replace(/\D/g, "");
  const pastOrders = orders.filter((o) => {
    const byPhone =
      cleanPhone.length >= 8 &&
      (o.customerPhone || "").replace(/\D/g, "").endsWith(cleanPhone.slice(-8));
    const byName =
      customerName &&
      customerName !== "Cliente" &&
      (o.customerName.toLowerCase().includes(customerName.toLowerCase()) ||
        o.comandaName?.toLowerCase().includes(customerName.toLowerCase()));
    return byPhone || byName;
  });

  const displayOrders = pastOrders.length > 0 ? pastOrders : orders.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#EFE9DF] shadow-2xl relative animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 p-2 rounded-full hover:bg-neutral-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-3 border-b border-[#EFE9DF] mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#FEF6EC] text-[#D97706] flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#1F2421]">
              Meus Pedidos & Status em Tempo Real
            </h3>
            <p className="text-xs text-neutral-500">
              Acompanhamento ao vivo e histórico de <strong>{customerName}</strong>
            </p>
          </div>
        </div>

        <div className="space-y-3.5 max-h-[440px] overflow-y-auto pr-1">
          {displayOrders.map((ord) => {
            const meta = getOrderStatusMeta(ord.status, ord.type, ord.tableNumber);
            return (
              <div
                key={ord.id}
                className="bg-[#FDFBF7] rounded-2xl p-4 border border-[#EFE9DF] flex flex-col justify-between hover:border-neutral-300 transition-colors space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                    <div>
                      <span className="text-xs font-black text-neutral-900">
                        Pedido #{ord.orderNumber} •{" "}
                        {ord.type === "mesa" ? `Mesa ${ord.tableNumber}` : "Delivery"}
                      </span>
                      <span className="text-[10px] text-neutral-400 ml-2 font-medium">
                        ({ord.createdAt})
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${meta.badgeClass}`}
                    >
                      {meta.badgeLabel}
                    </span>
                  </div>

                  {/* Barra de Progresso de 4 Etapas do Pedido */}
                  {meta.stepIndex > 0 && (
                    <div className="my-2.5 p-2.5 rounded-xl bg-white border border-[#EFE9DF]">
                      <div className="grid grid-cols-4 gap-1.5 mb-2">
                        {[
                          { step: 1, label: "1. Recebido" },
                          { step: 2, label: "2. Preparo" },
                          { step: 3, label: ord.type === "mesa" ? "3. Servindo" : "3. Em Rota" },
                          { step: 4, label: "4. Entregue" },
                        ].map((s) => {
                          const active = meta.stepIndex >= s.step;
                          const isCurrent = meta.stepIndex === s.step && meta.stepIndex < 4;
                          return (
                            <div key={s.step} className="text-center">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  active
                                    ? meta.stepIndex === 4
                                      ? "bg-emerald-500"
                                      : isCurrent
                                      ? "bg-[#C83E2B] animate-pulse"
                                      : "bg-[#C83E2B]"
                                    : "bg-neutral-200"
                                }`}
                              />
                              <span
                                className={`text-[9px] font-bold block mt-1 ${
                                  active ? "text-neutral-800" : "text-neutral-400"
                                }`}
                              >
                                {s.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[11px] font-extrabold text-neutral-800">
                        {meta.detailTitle}
                      </p>
                      <p className="text-[10px] text-neutral-500 mt-0.5 leading-snug">
                        {meta.detailDescription}
                      </p>
                    </div>
                  )}

                  {ord.courierName && ord.type === "delivery" && (
                    <p className="text-[10px] font-bold text-emerald-800 flex items-center gap-1 mb-2 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <Bike className="w-3 h-3 text-emerald-700 flex-shrink-0" />
                      <span>Entregador responsável: <strong>{ord.courierName}</strong></span>
                    </p>
                  )}

                  {ord.deliveryAddress && ord.type === "delivery" && (
                    <p className="text-[10px] text-neutral-500 flex items-center gap-1 mb-2 bg-neutral-100/80 px-2.5 py-1 rounded-lg">
                      <MapPin className="w-3 h-3 text-[#C83E2B] flex-shrink-0" />
                      <span className="truncate">{ord.deliveryAddress}</span>
                    </p>
                  )}

                  <div className="text-xs text-neutral-600 space-y-1">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span>
                          {it.quantity}x {it.name}
                        </span>
                        <span className="text-neutral-500 font-semibold">
                          R$ {(it.price * it.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-neutral-200 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-neutral-500">Total: </span>
                    <strong className="text-[#C83E2B]">R$ {ord.total.toFixed(2)}</strong>
                  </div>

                  <button
                    onClick={() => {
                      onReorder(ord.items);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C83E2B] hover:bg-[#B03221] text-white text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Repetir em 1 Clique</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-neutral-100 text-center">
          <p className="text-[11px] text-neutral-400">
            💡 Os status acima atualizam automaticamente conforme o restaurante avança seu pedido.
          </p>
        </div>
      </div>
    </div>
  );
}
