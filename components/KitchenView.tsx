"use client";

import React, { useState, useEffect, useRef } from "react";
import { Order, CartItem } from "../lib/types";
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Beer,
  Flame,
  Layers,
  Volume2,
  VolumeX,
  Check,
} from "lucide-react";

interface KitchenViewProps {
  orders: Order[];
  onMarkReady: (orderId: string) => void;
  onToggleItemReady?: (orderId: string, itemIndex: number) => void;
  storeName?: string;
}

export type ProductionSector = "todos" | "chapa" | "bar";

/**
 * Determina o setor de preparo do item ("chapa" ou "bar") usando a propriedade explícita
 * `item.prepSector` ou inferindo pelo catálogo de bebidas/sobremesas.
 */
export function resolveItemPrepSector(item: CartItem): "chapa" | "bar" {
  if (item.prepSector === "bar" || item.prepSector === "chapa") {
    return item.prepSector;
  }
  const n = item.name.toLowerCase();
  const pid = item.productId || "";
  if (
    pid.startsWith("bb-") ||
    pid.startsWith("sb-") ||
    n.includes("coca") ||
    n.includes("guaraná") ||
    n.includes("guarana") ||
    n.includes("suco") ||
    n.includes("água") ||
    n.includes("agua") ||
    n.includes("refrigerante") ||
    n.includes("açaí") ||
    n.includes("acai") ||
    n.includes("cerveja") ||
    n.includes("heineken") ||
    n.includes("milkshake")
  ) {
    return "bar";
  }
  return "chapa";
}

/**
 * Calcula quantos minutos se passaram desde o aceite/criação do pedido para o SLA da Cozinha
 */
function getOrderElapsedMinutes(order: Order, nowMs: number): number {
  if (order.acceptedAt) {
    const parsed = Date.parse(order.acceptedAt);
    if (!isNaN(parsed)) {
      return Math.max(0, Math.floor((nowMs - parsed) / 60000));
    }
  }
  // Extrai timestamp do ID (ex: "ord-1730998000000")
  const idMatch = order.id.match(/ord-(\d{10,14})/);
  if (idMatch) {
    const ts = Number(idMatch[1]);
    if (!isNaN(ts) && nowMs >= ts) {
      return Math.max(0, Math.floor((nowMs - ts) / 60000));
    }
  }
  // Fallback para textos de mock ("Há 12 min", "Agora mesmo")
  const minMatch = (order.createdAt || "").match(/(\d+)\s*min/i);
  if (minMatch) {
    return Number(minMatch[1]);
  }
  return 1;
}

export function KitchenView({
  orders,
  onMarkReady,
  onToggleItemReady,
  storeName = "Brasa & Burger Grill",
}: KitchenViewProps) {
  const [sector, setSector] = useState<ProductionSector>("todos");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [nowMs, setNowMs] = useState<number>(0);
  const prevOrderIdsRef = useRef<string[]>([]);

  // Atualiza o relógio de SLA a cada 15 segundos
  useEffect(() => {
    setNowMs(Date.now());
    const timer = setInterval(() => setNowMs(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const playKitchenBell = (urgent = false) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = urgent ? "triangle" : "sine";
      osc.frequency.setValueAtTime(urgent ? 783.99 : 659.25, now);
      osc.frequency.setValueAtTime(urgent ? 987.77 : 880, now + 0.16);
      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.65);
    } catch {}
  };

  // Pedidos aguardando triagem/aceite do PDV (não vão para a chapa antes do PDV aceitar)
  const pendingApprovalCount = orders.filter((o) => o.status === "pendente").length;

  // Apenas pedidos JÁ ACEITOS pelo PDV (em_preparo) entram na fila de produção da cozinha
  const activeKitchenOrders = orders.filter((o) => o.status === "em_preparo");

  // Toca campainha imediatamente quando um novo pedido é aceito pelo PDV e cai no KDS
  useEffect(() => {
    const currentIds = activeKitchenOrders.map((o) => o.id);
    const hasNewOrder = currentIds.some((id) => !prevOrderIdsRef.current.includes(id));
    if (hasNewOrder && prevOrderIdsRef.current.length > 0) {
      playKitchenBell(false);
    }
    prevOrderIdsRef.current = currentIds;
  }, [activeKitchenOrders]);

  // Campainha Persistente ("Modo iFood") a cada 20s se houver pedido atrasado (>= 20 min) ou recém-chegado sem nenhum item iniciado
  useEffect(() => {
    if (!soundEnabled || activeKitchenOrders.length === 0) return;
    const interval = setInterval(() => {
      const hasDelayedOrUntouched = activeKitchenOrders.some((ord) => {
        const mins = getOrderElapsedMinutes(ord, Date.now());
        const noneReady = ord.items.every((it) => !it.isReady);
        return mins >= 20 || (mins >= 1 && noneReady);
      });
      if (hasDelayedOrUntouched) {
        playKitchenBell(true);
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [activeKitchenOrders, soundEnabled]);

  const chapaOrdersCount = activeKitchenOrders.filter((o) =>
    o.items.some((i) => resolveItemPrepSector(i) === "chapa")
  ).length;

  const barOrdersCount = activeKitchenOrders.filter((o) =>
    o.items.some((i) => resolveItemPrepSector(i) === "bar")
  ).length;

  const displayedOrders = activeKitchenOrders.filter((o) => {
    if (sector === "chapa") {
      return o.items.some((i) => resolveItemPrepSector(i) === "chapa");
    }
    if (sector === "bar") {
      return o.items.some((i) => resolveItemPrepSector(i) === "bar");
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#1F2421] text-white p-4 sm:p-6 pb-24">
      {/* Topo do KDS da Cozinha */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-neutral-800 mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#BD4D2D] flex items-center justify-center text-white shadow-md">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 flex-wrap">
              <span>Monitor de Produção (KDS)</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Check por Item & SLA
              </span>
              {pendingApprovalCount > 0 && (
                <span
                  className="text-[11px] font-bold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1.5"
                  title="Estes pedidos estão na coluna 'Novos' do PDV e aparecerão aqui assim que o caixa clicar em 'Aceitar Pedido'"
                >
                  <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                  <span>{pendingApprovalCount} no caixa aguardando aceite do PDV</span>
                </span>
              )}
            </h1>
            <p className="text-xs text-neutral-400">
              {storeName} • Toque em cada item (Chapa ou Copa/Bar) para marcar como concluído antes de liberar o pedido
            </p>
          </div>
        </div>

        {/* Controles de Som KDS + Seletor de Setor de Produção */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playKitchenBell(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
              soundEnabled
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                : "bg-neutral-900 border-neutral-800 text-neutral-500"
            }`}
            title="Campainha persistente para novos pedidos e alertas de SLA"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? "Campainha KDS: ATIVA" : "Som Silenciado"}</span>
          </button>

          <div className="flex items-center bg-neutral-900 p-1.5 rounded-2xl border border-neutral-800 text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => setSector("todos")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                sector === "todos"
                  ? "bg-[#BD4D2D] text-white shadow-sm font-black"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Todos ({activeKitchenOrders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSector("chapa")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                sector === "chapa"
                  ? "bg-amber-600 text-white shadow-sm font-black"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>Chapa & Cozinha ({chapaOrdersCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setSector("bar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                sector === "bar"
                  ? "bg-blue-600 text-white shadow-sm font-black"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Beer className="w-3.5 h-3.5 text-blue-300" />
              <span>Copa & Bar ({barOrdersCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grade de Comandas da Cozinha */}
      {displayedOrders.length === 0 ? (
        <div className="text-center py-24 text-neutral-500">
          <ChefHat className="w-16 h-16 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-bold">
            {sector === "bar"
              ? "Copa limpa! Nenhuma bebida liberada para preparo na fila."
              : sector === "chapa"
              ? "Chapa limpa! Nenhum pedido liberado pelo PDV no momento."
              : "Produção limpa! Nenhum pedido liberado pelo PDV no momento."}
          </p>
          {pendingApprovalCount > 0 && (
            <p className="text-xs text-amber-400 font-semibold mt-2">
              ⏳ Há {pendingApprovalCount} pedido(s) novo(s) aguardando o caixa clicar em &quot;Aceitar Pedido&quot; no PDV.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedOrders.map((order) => {
            const elapsedMins = getOrderElapsedMinutes(order, nowMs);
            const isWarningSla = elapsedMins >= 10 && elapsedMins < 20;
            const isCriticalSla = elapsedMins >= 20;

            const totalItemsCount = order.items.length;
            const readyItemsCount = order.items.filter((i) => i.isReady).length;
            const allItemsReady = totalItemsCount > 0 && readyItemsCount === totalItemsCount;

            return (
              <div
                key={order.id}
                className={`bg-neutral-900 rounded-3xl p-5 border-2 shadow-xl flex flex-col justify-between transition-all ${
                  allItemsReady
                    ? "border-emerald-500 shadow-emerald-950/40"
                    : isCriticalSla
                    ? "border-rose-500 animate-pulse"
                    : isWarningSla
                    ? "border-amber-500"
                    : "border-neutral-700"
                }`}
              >
                <div>
                  {/* Header do Cartão da Cozinha + Cronômetro SLA */}
                  <div className="flex items-start justify-between pb-3 border-b border-neutral-800 gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-[#F4A261] uppercase tracking-wider">
                          #{order.orderNumber} •{" "}
                          {order.type === "mesa" ? `Mesa ${order.tableNumber}` : "Delivery"}
                        </span>
                        {order.channel === "ifood" && (
                          <span className="px-1.5 py-0.2 rounded bg-red-600 text-white text-[9px] font-black uppercase tracking-wider">
                            iFood
                          </span>
                        )}
                        {order.channel === "99food" && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500 text-neutral-950 text-[9px] font-black uppercase tracking-wider">
                            99Food
                          </span>
                        )}
                        {order.channel === "keeta" && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-neutral-950 text-[9px] font-black uppercase tracking-wider">
                            Keeta
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-white mt-0.5">
                        {order.type === "mesa"
                          ? `Comanda: ${order.comandaName || order.customerName}`
                          : order.customerName}
                      </h3>
                    </div>

                    {/* Badge de Cronômetro SLA */}
                    <div
                      className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-xl border flex-shrink-0 ${
                        isCriticalSla
                          ? "bg-rose-950 text-rose-300 border-rose-500"
                          : isWarningSla
                          ? "bg-amber-950 text-amber-300 border-amber-500"
                          : "bg-emerald-950/70 text-emerald-300 border-emerald-700/60"
                      }`}
                      title="Tempo decorrido de preparo (SLA)"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {isCriticalSla
                          ? `ATRASADO • ${elapsedMins} min`
                          : isWarningSla
                          ? `Atenção • ${elapsedMins} min`
                          : `${elapsedMins} min`}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso de Checklist por Item */}
                  <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-neutral-400">
                    <span>Progresso de bancada (toque no item p/ dar baixa):</span>
                    <span
                      className={
                        allItemsReady ? "text-emerald-400 font-black" : "text-amber-400 font-black"
                      }
                    >
                      {readyItemsCount}/{totalItemsCount} prontos
                    </span>
                  </div>

                  {/* Lista de Pratos com Check Individual por Setor (Chapa vs Bar) */}
                  <div className="py-3 space-y-2.5">
                    {order.items.map((item, idx) => {
                      const itemSec = resolveItemPrepSector(item);
                      const isMatch = sector === "todos" || sector === itemSec;
                      const isItemDone = Boolean(item.isReady);

                      return (
                        <div
                          key={idx}
                          onClick={() => onToggleItemReady?.(order.id, idx)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer select-none ${
                            isItemDone
                              ? "bg-emerald-950/40 border-emerald-500/70 opacity-85"
                              : isMatch
                              ? itemSec === "bar"
                                ? "bg-blue-950/40 border-blue-600/60 hover:border-blue-400 shadow-xs"
                                : "bg-neutral-800/90 border-neutral-700/80 hover:border-amber-500/60 shadow-xs"
                              : "opacity-40 bg-neutral-900 border-neutral-800"
                          }`}
                          title="Toque para marcar/desmarcar este item como pronto"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              {/* Checkbox Tátil */}
                              <div
                                className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                                  isItemDone
                                    ? "bg-emerald-500 border-emerald-400 text-neutral-950"
                                    : "bg-neutral-900 border-neutral-600 text-transparent"
                                }`}
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                              </div>

                              <span
                                className={`text-base font-black ${
                                  isItemDone
                                    ? "text-emerald-400"
                                    : itemSec === "bar"
                                    ? "text-cyan-400"
                                    : "text-[#F4A261]"
                                }`}
                              >
                                {item.quantity}x
                              </span>
                              <span
                                className={`text-sm font-bold leading-tight ${
                                  isItemDone ? "line-through text-emerald-200" : "text-white"
                                }`}
                              >
                                {item.name}
                              </span>
                            </div>

                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${
                                isItemDone
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                  : itemSec === "bar"
                                  ? "bg-blue-900/60 text-blue-300 border border-blue-700/50"
                                  : "bg-amber-900/50 text-amber-300 border border-amber-700/50"
                              }`}
                            >
                              {isItemDone
                                ? "✓ Pronto"
                                : itemSec === "bar"
                                ? "🥤 Copa/Bar"
                                : "🔥 Chapa"}
                            </span>
                          </div>

                          {/* Adicionais & Opcionais Selecionados */}
                          {item.optionsSelected && item.optionsSelected.length > 0 && (
                            <div className="mt-1.5 pl-8 flex flex-wrap gap-1">
                              {item.optionsSelected.map((opt, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-bold bg-neutral-700 text-neutral-200 px-2 py-0.5 rounded-md"
                                >
                                  {opt}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Observações da Cozinha & Chapa (Identificação Especial) */}
                          {item.notes && (
                            <div className="mt-2 ml-8 text-xs font-black text-amber-200 bg-amber-950/80 px-2.5 py-1.5 rounded-xl border border-amber-500/80 flex items-start gap-1.5 shadow-sm">
                              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
                              <div>
                                <span>{item.notes}</span>
                                <span className="block text-[10px] font-bold text-amber-400/90 mt-0.5">
                                  🖊️ Atenção Chapa: Marcar com caneta na embalagem do lanche
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Botão Gigante de Finalização da Cozinha */}
                <button
                  onClick={() => onMarkReady(order.id)}
                  className={`w-full mt-3 font-black text-sm py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                    allItemsReady
                      ? "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 ring-2 ring-emerald-300"
                      : "bg-emerald-700 hover:bg-emerald-600 text-white"
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    {allItemsReady
                      ? "✅ TODOS OS ITENS PRONTOS • LIBERAR AGORA"
                      : `PRONTO PARA SERVIR (${readyItemsCount}/${totalItemsCount})`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
