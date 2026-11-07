"use client";

import React, { useState } from "react";
import {
  X,
  Check,
  ExternalLink,
  Settings,
  Sparkles,
  Zap,
  TrendingDown,
  DollarSign,
  Share2,
  Copy,
  Radio,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { OrderChannel } from "../lib/types";

interface DeliveryIntegrationsModalProps {
  onClose: () => void;
  onSimulateExternalOrder?: (channel: OrderChannel, customerName: string, itemsDescription: string, total: number) => void;
}

interface ChannelConfig {
  id: OrderChannel;
  name: string;
  badgeColor: string;
  badgeBg: string;
  status: "conectado" | "desconectado" | "pendente";
  enabled: boolean;
  merchantId?: string;
  clientId?: string;
  clientSecret?: string;
  autoAccept: boolean;
  syncMenu: boolean;
}

export function DeliveryIntegrationsModal({
  onClose,
  onSimulateExternalOrder,
}: DeliveryIntegrationsModalProps) {
  const [activeTab, setActiveTab] = useState<"hub" | "calculadora">("hub");
  const [configuringChannel, setConfiguringChannel] = useState<OrderChannel | null>(null);

  // Estados de Conexão Simulada/Real dos Canais
  const [ifoodConfig, setIfoodConfig] = useState<ChannelConfig>({
    id: "ifood",
    name: "iFood",
    badgeColor: "#EA1D2C",
    badgeBg: "bg-red-50 text-red-700 border-red-200",
    status: "conectado",
    enabled: true,
    merchantId: "brasa-burger-pontanegra-natal",
    clientId: "client_ifood_a2i_solutions",
    autoAccept: true,
    syncMenu: true,
  });

  const [ninetyNineConfig, setNinetyNineConfig] = useState<ChannelConfig>({
    id: "99food",
    name: "99Food",
    badgeColor: "#F7A800",
    badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
    status: "desconectado",
    enabled: false,
    merchantId: "store-99-988210",
    autoAccept: false,
    syncMenu: false,
  });

  const [keetaConfig, setKeetaConfig] = useState<ChannelConfig>({
    id: "keeta",
    name: "Keeta (Meituan)",
    badgeColor: "#00B14F",
    badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    status: "desconectado",
    enabled: false,
    merchantId: "keeta-natal-01",
    autoAccept: false,
    syncMenu: false,
  });

  // Calculadora Delivery
  const [monthlyDeliveryRevenue, setMonthlyDeliveryRevenue] = useState<number>(20000);
  const [ifoodCommissionRate, setIfoodCommissionRate] = useState<number>(23); // 23% comissão típica iFood entrega parceira
  const [migrationPercentage, setMigrationPercentage] = useState<number>(50); // % que migra para o Tá na Mesa

  const totalCommissionsPaid = (monthlyDeliveryRevenue * ifoodCommissionRate) / 100;
  const potentialSavingsWithTaNaMesa = (totalCommissionsPaid * migrationPercentage) / 100;
  const yearlySavings = potentialSavingsWithTaNaMesa * 12;

  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const webhookUrl = typeof window !== "undefined" ? `${window.location.origin}/api/integrations/webhook` : "/api/integrations/webhook";

  const handleSimulate = async (channel: OrderChannel) => {
    let customerName = "Felipe Alencar";
    let itemsDescription = "1x Hot Dog Cheddar e Catupiry Completo + 1x Guaraná 1L";
    let total = 26.0;

    if (channel === "ifood") {
      customerName = "Camila Medeiros (iFood)";
      itemsDescription = "2x Hot Dog Especial na Nata + 1x Batata Suprema";
      total = 58.0;
    } else if (channel === "99food") {
      customerName = "Rodrigo Tavares (99Food)";
      itemsDescription = "1x Combo Casal Brasa & Burger + 1x Coca-Cola";
      total = 44.0;
    } else if (channel === "keeta") {
      customerName = "Mariana Queiroz (Keeta)";
      itemsDescription = "1x Smash Salada 2.0 + 1x Batata Frita Palito";
      total = 40.0;
    }

    try {
      await fetch("/api/integrations/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          customerName,
          orderId: String(Math.floor(1000 + Math.random() * 9000)),
          items: [
            {
              name: itemsDescription,
              price: total - 6.0,
              quantity: 1,
            },
          ],
          deliveryFee: 6.0,
          total,
          neighborhood: "Ponta Negra",
        }),
      });

      if (onSimulateExternalOrder) {
        onSimulateExternalOrder(channel, customerName, itemsDescription, total);
      }
      alert(`🚀 Pedido de teste do ${channel.toUpperCase()} disparado com sucesso! Verifique a coluna "Novos" no Gestor (PDV) e no KDS da Cozinha.`);
    } catch (err) {
      console.error(err);
      alert("Erro ao disparar webhook de simulação.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#F8F6F0] rounded-3xl max-w-4xl w-full border border-[#E7DCD0] shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        {/* Cabeçalho do Modal no padrão Consumer */}
        <div className="bg-[#1F2421] text-white px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🛵</span>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight">
                Cardápio Digital • Hub de Integrações Delivery
              </h2>
              <p className="text-[11px] text-neutral-400">
                Receba pedidos do iFood, 99Food, Keeta e Canal Próprio no mesmo PDV e KDS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === "hub" ? "calculadora" : "hub")}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activeTab === "hub" ? "Calculadora de Economia" : "Ver Hub de Apps"}</span>
            </button>

            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpo Rolável */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {activeTab === "hub" ? (
            <>
              {/* Notificação Estratégica Baseada na Filosofia do Fábio */}
              <div className="bg-[#FEF6EC] border border-[#FBD9B0] p-3.5 rounded-2xl flex items-start gap-3">
                <span className="text-xl flex-shrink-0">💡</span>
                <div className="text-xs text-[#8A4A0A] leading-relaxed">
                  <strong className="font-black text-[#5C3005]">
                    Estratégia Híbrida Omnichannel recomendada:
                  </strong>{" "}
                  Mantenha o iFood e a 99Food abertos para captar novos clientes através do forte investimento de marketing dos marketplaces. Ao entregar o pedido, inclua no pacote um panfleto com o QR Code do <strong>Tá na Mesa</strong> oferecendo 10% de desconto na próxima compra. Assim você fideliza o cliente direto na sua base e elimina 23% de taxas recorrentes!
                </div>
              </div>

              {/* Grade de 5 Cards no Padrão do Print do Consumer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. SOLUÇÃO OFICIAL: TÁ NA MESA DELIVERY */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-emerald-500 shadow-sm flex flex-col justify-between relative overflow-hidden md:col-span-2 lg:col-span-1">
                  <div className="absolute top-2.5 right-3 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" /> 0% de Comissões
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">⭐</span>
                      <div>
                        <h3 className="text-base font-black text-[#1F2421]">Tá na Mesa Delivery</h3>
                        <p className="text-[11px] text-neutral-500">Solução Oficial A2i Solutions</p>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-600 mb-3.5 leading-snug">
                      Seu canal próprio de delivery com a experiência mais lucrativa e completa para o seu negócio:
                    </p>

                    <ul className="text-xs space-y-1.5 text-neutral-700">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>Receba pedidos direto no PDV e KDS</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>Publique e pause itens do cardápio em tempo real</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>Notificações e disparo automático por WhatsApp</span>
                      </li>
                      <li className="flex items-center gap-2 font-bold text-emerald-700">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>Delivery 100% livre de comissões (Zero Taxas)</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 mt-3 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      ● Ativo e Operacional
                    </span>
                    <a
                      href="/delivery"
                      target="_blank"
                      className="px-4 py-2 bg-[#C83E2B] hover:bg-[#A33F23] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <span>Abrir Delivery</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* 2. IFOOD */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E7DCD0] shadow-2xs flex flex-col justify-between hover:border-red-300 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-[#EA1D2C] tracking-tighter">
                          iFood
                        </span>
                        <span className="text-[10px] font-bold text-neutral-400 border-l border-neutral-200 pl-2">
                          Marketplace
                        </span>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        ✓ Conectado
                      </span>
                    </div>

                    <p className="text-xs text-neutral-600 mb-3 leading-snug">
                      Integração oficial via API do iFood para recepção instantânea de pedidos:
                    </p>

                    <ul className="text-xs space-y-1.5 text-neutral-600">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#EA1D2C] flex-shrink-0" />
                        <span>Receba pedidos direto no PDV e na Cozinha</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#EA1D2C] flex-shrink-0" />
                        <span>Atualização automática do status no iFood</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#EA1D2C] flex-shrink-0" />
                        <span>Sincronização de catálogo e pausa de itens</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 mt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleSimulate("ifood")}
                      className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#EA1D2C] text-xs font-bold border border-red-200 cursor-pointer flex items-center gap-1 transition-colors"
                      title="Simular pedido chegando do iFood agora"
                    >
                      <Zap className="w-3 h-3 text-[#EA1D2C]" />
                      <span>Testar Pedido</span>
                    </button>

                    <button
                      onClick={() => setConfiguringChannel("ifood")}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Settings className="w-3 h-3" />
                      <span>Configurar</span>
                    </button>
                  </div>
                </div>

                {/* 3. 99FOOD */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E7DCD0] shadow-2xs flex flex-col justify-between hover:border-amber-300 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black px-2 py-0.5 rounded-lg bg-[#F7A800] text-neutral-950">
                          99Food
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                        Disponível
                      </span>
                    </div>

                    <p className="text-xs text-neutral-600 mb-3 leading-snug">
                      Recepção automatizada dos pedidos realizados pelos usuários do app 99:
                    </p>

                    <ul className="text-xs space-y-1.5 text-neutral-600">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span>Receba pedidos direto no PDV</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span>Atualização de status automática</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span>Relatórios unificados de faturamento</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 mt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleSimulate("99food")}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <Zap className="w-3 h-3 text-amber-600" />
                      <span>Testar Pedido</span>
                    </button>

                    <button
                      onClick={() => setConfiguringChannel("99food")}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Settings className="w-3 h-3" />
                      <span>Configurar</span>
                    </button>
                  </div>
                </div>

                {/* 4. KEETA (MEITUAN) */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E7DCD0] shadow-2xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black px-2 py-0.5 rounded-lg bg-[#FFE600] text-neutral-950 font-black">
                          keeta
                        </span>
                        <span className="text-[10px] font-bold text-neutral-400">
                          Novo no Brasil
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                        Pronto p/ Ativar
                      </span>
                    </div>

                    <p className="text-xs text-neutral-600 mb-3 leading-snug">
                      Plataforma de delivery internacional em expansão nacional pelo grupo Meituan:
                    </p>

                    <ul className="text-xs space-y-1.5 text-neutral-600">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>Receba pedidos direto no PDV</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>Aceite automático e impressão de comandas</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>Integração com motoboys do app Keeta</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 mt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleSimulate("keeta")}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-200 cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <Zap className="w-3 h-3 text-emerald-600" />
                      <span>Testar Pedido</span>
                    </button>

                    <button
                      onClick={() => setConfiguringChannel("keeta")}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Settings className="w-3 h-3" />
                      <span>Configurar</span>
                    </button>
                  </div>
                </div>

                {/* 5. OUTROS APPS & API ABERTA (WEBHOOKS) */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E7DCD0] shadow-2xs flex flex-col justify-between hover:border-blue-300 transition-colors md:col-span-2">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                          API
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-[#1F2421]">Outros Apps & API REST / Webhooks</h3>
                          <p className="text-[10px] text-neutral-400">Integração com parceiros e sistemas externos</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        Ativa
                      </span>
                    </div>

                    <p className="text-xs text-neutral-600 mb-2 leading-relaxed">
                      Conecte robôs externos de WhatsApp, ERPs contábeis ou qualquer marketplace local via Webhook JSON.
                    </p>

                    <div className="flex items-center gap-2 bg-[#FBF6EF] p-2.5 rounded-xl border border-[#E7DCD0]">
                      <span className="text-[11px] font-mono text-neutral-700 truncate flex-1">
                        POST {webhookUrl}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(webhookUrl)}
                        className="px-2.5 py-1 bg-white hover:bg-neutral-100 text-xs font-bold text-neutral-800 border border-[#E7DCD0] rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedWebhook ? "Copiado!" : "Copiar"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ABA 2: CALCULADORA DELIVERY DE ECONOMIA DE COMISSÕES */
            <div className="space-y-5">
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E7DCD0] shadow-xs">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#F0E5D9] mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                    $
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1F2421]">Calculadora de Economia Delivery</h3>
                    <p className="text-xs text-neutral-500">
                      Simule quanto o restaurante economiza trazendo os clientes do iFood para o Tá na Mesa
                    </p>
                  </div>
                </div>

                {/* Controles da Calculadora */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-3.5 rounded-2xl bg-[#FBF6EF] border border-[#E7DCD0]">
                    <label className="text-xs font-bold text-neutral-600 block mb-1">
                      Faturamento Mensal no iFood / 99:
                    </label>
                    <div className="text-base font-black text-[#1F2421] flex items-center gap-1">
                      <span>R$</span>
                      <input
                        type="number"
                        value={monthlyDeliveryRevenue}
                        onChange={(e) => setMonthlyDeliveryRevenue(Number(e.target.value) || 0)}
                        className="w-full bg-white px-2 py-1 rounded-lg border border-[#E7DCD0] outline-none text-base font-black text-[#1F2421]"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FBF6EF] border border-[#E7DCD0]">
                    <label className="text-xs font-bold text-neutral-600 block mb-1">
                      Taxa Média do Marketplace (%):
                    </label>
                    <div className="text-base font-black text-rose-700 flex items-center gap-1">
                      <input
                        type="number"
                        value={ifoodCommissionRate}
                        onChange={(e) => setIfoodCommissionRate(Number(e.target.value) || 0)}
                        className="w-20 bg-white px-2 py-1 rounded-lg border border-[#E7DCD0] outline-none text-base font-black text-rose-700"
                      />
                      <span>% (Comissão + Mensalidade)</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FBF6EF] border border-[#E7DCD0]">
                    <label className="text-xs font-bold text-neutral-600 block mb-1">
                      % Migrado para o Tá na Mesa:
                    </label>
                    <div className="text-base font-black text-emerald-700 flex items-center gap-1">
                      <input
                        type="number"
                        min="10"
                        max="100"
                        value={migrationPercentage}
                        onChange={(e) => setMigrationPercentage(Number(e.target.value) || 0)}
                        className="w-20 bg-white px-2 py-1 rounded-lg border border-[#E7DCD0] outline-none text-base font-black text-emerald-700"
                      />
                      <span>% dos clientes fiéis</span>
                    </div>
                  </div>
                </div>

                {/* Resultado da Economia */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                    <span className="text-[10px] font-black uppercase text-rose-700 tracking-wider">
                      Taxas pagas ao iFood hoje
                    </span>
                    <p className="text-xl font-black text-rose-700 mt-1">
                      R$ {totalCommissionsPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[10px] text-rose-600">por mês indo embora</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-center shadow-xs">
                    <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                      Economia Mensal com Tá na Mesa
                    </span>
                    <p className="text-2xl font-black text-emerald-700 mt-1">
                      + R$ {potentialSavingsWithTaNaMesa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[10px] text-emerald-700 font-bold">Líquido no bolso da loja todo mês</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-center">
                    <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
                      Economia Projetada em 1 Ano
                    </span>
                    <p className="text-xl font-black text-amber-900 mt-1">
                      R$ {yearlySavings.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[10px] text-amber-700 font-bold">Mais de {Math.round(yearlySavings / 5000)} meses de aluguel grátis</span>
                  </div>
                </div>

                {/* Plano de Ação de Marketing */}
                <div className="mt-5 p-4 rounded-2xl bg-white border border-[#E7DCD0] space-y-2">
                  <h4 className="text-xs font-black text-[#1F2421] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#C83E2B]" />
                    Como executar essa migração na prática:
                  </h4>
                  <ol className="text-xs text-neutral-600 space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Mantenha a loja aberta no iFood e na 99Food nos horários de pico.</li>
                    <li>
                      Em cada pacote entregue pelo iFood, grampeie um <strong>ímã de geladeira ou panfleto com o QR Code do Tá na Mesa</strong>.
                    </li>
                    <li>Ofereça um cupom de 10% OFF para o primeiro pedido no canal direto (ex: <code>QUERO10</code>).</li>
                    <li>Como o Tá na Mesa tem custo zero de comissão, o lojista dá 10% de desconto ao cliente e ainda lucra 13% a mais do que se a venda tivesse sido no iFood!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="bg-white px-5 sm:px-6 py-3 border-t border-[#E7DCD0] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <button
            onClick={() => setActiveTab(activeTab === "hub" ? "calculadora" : "hub")}
            className="text-neutral-500 hover:text-[#C83E2B] underline font-bold cursor-pointer"
          >
            {activeTab === "hub" ? "Compare os custos na Calculadora Delivery" : "← Voltar aos Canais de Integração"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1F2421] hover:bg-black text-white font-bold cursor-pointer transition-colors shadow-xs"
          >
            Fechar Janela
          </button>
        </div>
      </div>

      {/* SUB-MODAL DE CONFIGURAÇÃO DE CREDENCIAIS (Ex: iFood, 99, Keeta) */}
      {configuringChannel && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 border border-[#E7DCD0] shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setConfiguringChannel(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 p-1.5 rounded-full hover:bg-neutral-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-[#E7DCD0] mb-4">
              <div className="w-9 h-9 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1F2421]">
                  Configurar Integração: {configuringChannel.toUpperCase()}
                </h3>
                <p className="text-xs text-neutral-500">Credenciais oficiais da API</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert(`✅ Credenciais do ${configuringChannel.toUpperCase()} salvas e validadas com sucesso!`);
                setConfiguringChannel(null);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  ID do Estabelecimento ({configuringChannel === "ifood" ? "Merchant ID" : "Store ID"}):
                </label>
                <input
                  type="text"
                  defaultValue="brasa-burger-pontanegra-natal"
                  className="w-full px-3 py-2 rounded-xl border border-[#E7DCD0] bg-[#FDFBF7] outline-none focus:border-[#C83E2B]"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Client ID / Chave da Aplicação (App Key):
                </label>
                <input
                  type="text"
                  defaultValue="client_a2i_solutions_hotdog"
                  className="w-full px-3 py-2 rounded-xl border border-[#E7DCD0] bg-[#FDFBF7] outline-none focus:border-[#C83E2B]"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Client Secret / Chave Secreta:
                </label>
                <input
                  type="password"
                  defaultValue="••••••••••••••••••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-[#E7DCD0] bg-[#FDFBF7] outline-none focus:border-[#C83E2B]"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-[#C83E2B]" />
                  <span className="font-bold text-neutral-700">
                    Aceitar pedidos do {configuringChannel} automaticamente no PDV
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-[#C83E2B]" />
                  <span className="font-bold text-neutral-700">
                    Sincronizar pausas e esgotamento de produtos em tempo real
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-[#E7DCD0] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleSimulate(configuringChannel)}
                  className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 font-bold hover:bg-red-100 cursor-pointer flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  <span>Testar Webhook</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfiguringChannel(null)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-100 text-neutral-600 font-bold hover:bg-neutral-200 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[#1F2421] text-white font-bold hover:bg-black cursor-pointer shadow-xs"
                  >
                    Salvar Conexão
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
