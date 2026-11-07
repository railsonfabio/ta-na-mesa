"use client";

import React, { useState, useEffect, useRef } from "react";
import { Order } from "../../lib/types";
import { StoreSettings } from "../../lib/server-db";
import { RESTAURANT_INFO } from "../../lib/mock-data";
import {
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Sparkles,
  Clock,
  CheckCircle2,
  Flame,
  ChefHat,
  ShoppingBag,
  Utensils,
  Bike,
} from "lucide-react";

export default function TvOrderPanelPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioAllowed, setAudioAllowed] = useState(false);
  const [lastCalledOrder, setLastCalledOrder] = useState<Order | null>(null);

  const prevReadyOrderIdsRef = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Relógio Digital em Tempo Real
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Web Audio API: Síntese de "Plim-Plom" de chamada de TV
  const playTvChime = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Primeiro Tom: D5 (587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Segundo Tom: A5 (880.00 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880.0, now + 0.25);
      gain2.gain.setValueAtTime(0.5, now + 0.25);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.25);
      osc2.stop(now + 0.9);
    } catch {
      // Audio fallback silencioso
    }
  };

  const enableAudioGesture = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
      setAudioAllowed(true);
      playTvChime();
    } catch {
      setAudioAllowed(true);
    }
  };

  // Carregar dados iniciais e conectar com SSE
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/sync");
        const data = await res.json();
        if (data.orders) {
          setOrders(data.orders);
          // Registrar IDs já prontos para não apitar na carga inicial
          const readyIds = new Set<string>(
            data.orders
              .filter((o: Order) => o.status === "a_caminho" || o.status === "entregue")
              .map((o: Order) => o.id)
          );
          prevReadyOrderIdsRef.current = readyIds;
        }
        if (data.settings) {
          setSettings(data.settings);
        }
      } catch (err) {
        console.error("Falha ao carregar dados do painel:", err);
      }
    };

    fetchData();

    // Conexão Server-Sent Events (SSE)
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/events");
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.orders) {
            setOrders(payload.orders);

            // Verifica se algum pedido acabou de entrar em "a_caminho" (Pronto)
            const newlyReady = payload.orders.filter(
              (o: Order) =>
                o.status === "a_caminho" && !prevReadyOrderIdsRef.current.has(o.id)
            );

            if (newlyReady.length > 0) {
              setLastCalledOrder(newlyReady[0]);
              playTvChime();
            }

            // Atualiza o set de prontos
            const currentReadyIds = new Set<string>(
              payload.orders
                .filter((o: Order) => o.status === "a_caminho" || o.status === "entregue")
                .map((o: Order) => o.id)
            );
            prevReadyOrderIdsRef.current = currentReadyIds;
          }
          if (payload.settings) {
            setSettings(payload.settings);
          }
        } catch {
          // parse ignore
        }
      };
    } catch (err) {
      console.error("SSE connection error:", err);
    }

    // Polling de redundância a cada 5 segundos
    const pollInterval = setInterval(fetchData, 5000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(pollInterval);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Separação dos Pedidos (exibe em preparo apenas os pedidos já aceitos pelo PDV)
  const preparingOrders = orders
    .filter((o) => o.status === "em_preparo")
    .slice(0, 8);

  const readyOrders = orders
    .filter((o) => o.status === "a_caminho")
    .slice(0, 6);

  const highlightedReadyOrder =
    lastCalledOrder && readyOrders.some((o) => o.id === lastCalledOrder.id)
      ? lastCalledOrder
      : readyOrders[0] || null;

  const storeTitle = settings?.storeName || RESTAURANT_INFO.name;

  return (
    <div className="min-h-screen bg-[#0D1117] text-white flex flex-col justify-between font-sans select-none overflow-hidden">
      {/* Topo Oficial para TV */}
      <header className="px-6 py-4 bg-[#161B22] border-b border-neutral-800 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white font-black text-2xl shadow-lg">
            🍔
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <span>{storeTitle}</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                TV DISPLAY
              </span>
            </h1>
            <p className="text-xs text-neutral-400 font-medium">
              Painel de Chamada em Tempo Real • Tá na Mesa (A2i Solutions)
            </p>
          </div>
        </div>

        {/* Lado Direito: Áudio, Relógio e Tela Cheia */}
        <div className="flex items-center gap-4">
          {!audioAllowed ? (
            <button
              onClick={enableAudioGesture}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-bold transition-all cursor-pointer animate-pulse"
              title="Clique para ativar som na TV"
            >
              <VolumeX className="w-4 h-4 text-amber-400" />
              <span>Toque para Ativar Áudio</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Áudio Plim-Plom Ativo</span>
            </div>
          )}

          <div className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-lg font-mono font-black text-amber-400 shadow-inner flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span>{currentTime || "00:00:00"}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Alternar Tela Cheia"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Grid Principal com 2 Colunas de Alta Visibilidade */}
      <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
        {/* COLUNA 1: EM PREPARO (Cozinha / Chapa) */}
        <div className="bg-[#161B22]/80 rounded-3xl border border-neutral-800 p-6 flex flex-col justify-between shadow-2xl backdrop-blur-xs">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl">
                  👨‍🍳
                </div>
                <div>
                  <h2 className="text-2xl font-black text-amber-400 tracking-wide uppercase">
                    Em Preparo
                  </h2>
                  <p className="text-xs text-neutral-400">Na chapa e montagem da cozinha</p>
                </div>
              </div>
              <span className="text-lg font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3.5 py-1 rounded-2xl">
                {preparingOrders.length}
              </span>
            </div>

            {/* Lista de Senhas em Preparo */}
            {preparingOrders.length === 0 ? (
              <div className="py-20 text-center text-neutral-500">
                <ChefHat className="w-16 h-16 mx-auto mb-3 opacity-30 text-amber-400" />
                <p className="text-base font-bold">Nenhum pedido na fila no momento</p>
                <p className="text-xs text-neutral-600 mt-1">
                  Os novos pedidos lançados aparecerão aqui automaticamente.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3.5">
                {preparingOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between shadow-md"
                  >
                    <div>
                      <span className="text-xs font-bold text-neutral-400 block mb-0.5">
                        {ord.type === "mesa"
                          ? `Mesa ${ord.tableNumber}`
                          : ord.type === "retirada"
                          ? "Balcão"
                          : "Delivery"}
                      </span>
                      <span className="text-3xl font-black text-white tracking-tight">
                        #{ord.orderNumber}
                      </span>
                      <p className="text-xs text-neutral-400 truncate max-w-[130px] mt-0.5">
                        {ord.customerName}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-bold">
                      <Flame className="w-4 h-4 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-neutral-800 text-xs text-neutral-500 flex items-center justify-between">
            <span>Tempo médio de produção: 15-25 min</span>
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Sincronizado via SSE
            </span>
          </div>
        </div>

        {/* COLUNA 2: PRONTO PARA RETIRADA (Chamar no Balcão) */}
        <div className="bg-gradient-to-b from-[#0F2D1F] to-[#161B22] rounded-3xl border-2 border-emerald-500/40 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          {/* Efeito Glow Verde */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between pb-4 border-b border-emerald-500/30 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/30 text-emerald-300 flex items-center justify-center font-bold text-xl shadow-lg">
                  🔔
                </div>
                <div>
                  <h2 className="text-2xl font-black text-emerald-300 tracking-wide uppercase flex items-center gap-2">
                    <span>Pronto para Retirada</span>
                    <Sparkles className="w-5 h-5 text-amber-300 animate-bounce" />
                  </h2>
                  <p className="text-xs text-emerald-200/70">
                    Por favor, dirija-se ao balcão de entrega
                  </p>
                </div>
              </div>
              <span className="text-lg font-black bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 px-3.5 py-1 rounded-2xl animate-pulse">
                {readyOrders.length}
              </span>
            </div>

            {/* Destaque do Último Pedido Chamado se houver */}
            {highlightedReadyOrder && (
              <div className="mb-4 p-5 rounded-3xl bg-emerald-600/30 border-2 border-emerald-400 flex items-center justify-between shadow-2xl animate-pulse">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-300 block mb-1">
                    ✨ ÚLTIMA CHAMADA
                  </span>
                  <span className="text-5xl font-black text-white tracking-tight drop-shadow-md">
                    #{highlightedReadyOrder.orderNumber}
                  </span>
                  <p className="text-sm font-bold text-emerald-100 mt-1">
                    {highlightedReadyOrder.customerName} •{" "}
                    {highlightedReadyOrder.type === "mesa"
                      ? `Mesa ${highlightedReadyOrder.tableNumber}`
                      : highlightedReadyOrder.type === "retirada"
                      ? "Retirada Balcão"
                      : "Delivery Motoboy"}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-3xl shadow-lg font-black">
                  ✓
                </div>
              </div>
            )}

            {/* Lista dos demais pedidos prontos */}
            {readyOrders.length === 0 ? (
              <div className="py-20 text-center text-emerald-200/50">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-3 opacity-30 text-emerald-400" />
                <p className="text-base font-bold">Nenhum pedido aguardando retirada</p>
                <p className="text-xs text-emerald-200/60 mt-1">
                  Assim que a cozinha concluir o prato, o som soará automaticamente.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3.5">
                {readyOrders
                  .filter((ord) => ord.id !== highlightedReadyOrder?.id)
                  .map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl bg-[#0F2D1F]/90 border border-emerald-500/40 flex items-center justify-between shadow-lg"
                  >
                    <div>
                      <span className="text-xs font-bold text-emerald-300/80 block mb-0.5">
                        {ord.type === "mesa"
                          ? `Mesa ${ord.tableNumber}`
                          : ord.type === "retirada"
                          ? "Balcão"
                          : "Delivery"}
                      </span>
                      <span className="text-3xl font-black text-white tracking-tight">
                        #{ord.orderNumber}
                      </span>
                      <p className="text-xs text-emerald-200/80 truncate max-w-[130px] mt-0.5 font-bold">
                        {ord.customerName}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold">
                      ✓
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-emerald-500/30 text-xs text-emerald-300/70 flex items-center justify-between">
            <span>Apresente o comprovante ou nome no balcão</span>
            <span className="font-bold text-emerald-300">Bom apetite! 😋</span>
          </div>
        </div>
      </main>

      {/* Rodapé Corporativo White-Label */}
      <footer className="px-6 py-2.5 bg-[#161B22] border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>Sistema <strong>Tá na Mesa</strong></span>
          <span>•</span>
          <span>Tecnologia White-Label por <strong>A2i Solutions</strong></span>
          <span>•</span>
          <span>Parceria <strong>Alô Classificados</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-bold">● Painel Operando em Tempo Real</span>
          <span className="text-neutral-500">v1.2.0</span>
        </div>
      </footer>
    </div>
  );
}
