"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { X, Copy, Check, ExternalLink, Smartphone, Tablet, ChefHat, Bike, Monitor, CreditCard } from "lucide-react";

interface DeviceHubModalProps {
  onClose: () => void;
}

interface RoleConfig {
  id: string;
  title: string;
  deviceLabel: string;
  path: string;
  icon: React.ReactNode;
  badge: string;
  description: string;
  color: string;
  bgColor: string;
}

export function DeviceHubModal({ onClose }: DeviceHubModalProps) {
  const [activeHost, setActiveHost] = useState("192.168.1.2");
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const roles: RoleConfig[] = [
    {
      id: "gestor",
      title: "Painel Gestor (PDV)",
      deviceLabel: "💻 Notebook ou Tablet do Caixa",
      path: "/gestor",
      icon: <Monitor className="w-5 h-5 text-[#BD4D2D]" />,
      badge: "Gestão",
      description: "Mapa de mesas em tempo real, fechamento de comandas, fila de pedidos, financeiro e estoque.",
      color: "#BD4D2D",
      bgColor: "#FDF2F0",
    },
    {
      id: "cliente",
      title: "Cliente na Mesa (Mesa 04)",
      deviceLabel: "📱 Celular do Cliente",
      path: "/mesa/4",
      icon: <Smartphone className="w-5 h-5 text-[#BD4D2D]" />,
      badge: "Salão",
      description: "Cardápio na mesa, comanda viva compartilhada, divisão da conta e chamar garçom.",
      color: "#BD4D2D",
      bgColor: "#FDF2F0",
    },
    {
      id: "garcom",
      title: "Terminal do Garçom",
      deviceLabel: "📟 Tablet ou Celular do Garçom",
      path: "/garcom",
      icon: <Tablet className="w-5 h-5 text-[#D97706]" />,
      badge: "Atendimento",
      description: "Lançamento em 2 toques, abertura de subcomandas (casais/amigos), estorno e praças.",
      color: "#D97706",
      bgColor: "#FEF6EC",
    },
    {
      id: "pos",
      title: "Maquininha Smart POS",
      deviceLabel: "💳 Stone, Cielo ou PagBank",
      path: "/pos",
      icon: <CreditCard className="w-5 h-5 text-amber-600" />,
      badge: "Mobilidade",
      description: "Layout vertical com botões touch largos, cobrança com taxa de 10% e impressão térmica integrada.",
      color: "#D97706",
      bgColor: "#FEF6EC",
    },
    {
      id: "cozinha",
      title: "Cozinha & Chapa (KDS)",
      deviceLabel: "📺 Tablet da Cozinha",
      path: "/cozinha",
      icon: <ChefHat className="w-5 h-5 text-emerald-600" />,
      badge: "Produção",
      description: "Monitor da chapa em modo escuro com toque de conclusão de prato e alertas de urgência.",
      color: "#059669",
      bgColor: "#ECFDF5",
    },
    {
      id: "delivery",
      title: "Delivery & Retirada",
      deviceLabel: "🛵 Cliente em Casa",
      path: "/delivery",
      icon: <Bike className="w-5 h-5 text-blue-600" />,
      badge: "Entrega",
      description: "Cardápio delivery com endereço, taxa por bairro e cupons promocionais.",
      color: "#2563EB",
      bgColor: "#EFF6FF",
    },
  ];

  useEffect(() => {
    let host = "192.168.1.2";
    if (typeof window !== "undefined") {
      const currentHost = window.location.hostname;
      if (currentHost && currentHost !== "localhost" && currentHost !== "127.0.0.1") {
        host = currentHost;
      }
    }
    setActiveHost(host);

    const port = typeof window !== "undefined" && window.location.port ? `:${window.location.port}` : ":3005";
    const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";

    // Generate QR codes for each role
    const generatedQrs: Record<string, string> = {};
    const promises = roles.map(async (r) => {
      const fullUrl = `${protocol}//${host}${port}${r.path}`;
      try {
        const url = await QRCode.toDataURL(fullUrl, {
          width: 220,
          margin: 2,
          color: {
            dark: "#231F1C",
            light: "#FFFFFF",
          },
        });
        generatedQrs[r.id] = url;
      } catch (err) {
        console.error(`Erro gerando QR para ${r.id}:`, err);
      }
    });

    Promise.all(promises).then(() => {
      setQrCodes({ ...generatedQrs });
    });
  }, []);

  const handleCopy = (id: string, path: string) => {
    const port = typeof window !== "undefined" && window.location.port ? `:${window.location.port}` : ":3005";
    const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
    const fullUrl = `${protocol}//${activeHost}${port}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 border border-[#EFE9DF] shadow-2xl relative my-auto animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-700 p-2 rounded-full hover:bg-neutral-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[#C83E2B] text-white flex items-center justify-center font-bold">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#1F2421]">
              Central de Conexão de Aparelhos (Multi-Telas)
            </h2>
            <p className="text-xs text-neutral-500">
              Aponte a câmera do seu celular ou tablet para abrir cada tela na rede local <span className="font-bold text-[#1F2421]">({activeHost})</span> sem digitar nada!
            </p>
          </div>
        </div>

        {/* Grade com os 5 Aparelhos e Perfis */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {roles.map((role) => {
            const port = typeof window !== "undefined" && window.location.port ? `:${window.location.port}` : ":3005";
            const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
            const fullUrl = `${protocol}//${activeHost}${port}${role.path}`;
            return (
              <div
                key={role.id}
                className="bg-[#FDFBF7] rounded-2xl p-4 border border-[#EFE9DF] flex flex-col justify-between hover:border-neutral-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl" style={{ backgroundColor: role.bgColor }}>
                        {role.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-[#1F2421]">{role.title}</h3>
                        <p className="text-[11px] font-bold text-neutral-500">{role.deviceLabel}</p>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: role.bgColor, color: role.color }}
                    >
                      {role.badge}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-600 mb-3">{role.description}</p>
                </div>

                {/* Área do QR Code e Ações */}
                <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-[#EFE9DF]">
                  <div className="w-24 h-24 flex-shrink-0 bg-white border border-neutral-200 rounded-lg p-1 flex items-center justify-center">
                    {qrCodes[role.id] ? (
                      <img
                        src={qrCodes[role.id]}
                        alt={`QR Code ${role.title}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-[10px] text-neutral-400">Gerando...</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="text-[11px] font-mono bg-neutral-50 px-2 py-1 rounded border border-neutral-200 text-neutral-700 truncate">
                      {fullUrl}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(role.id, role.path)}
                        className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-all cursor-pointer"
                      >
                        {copiedId === role.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>

                      <a
                        href={role.path}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1F2421] text-white hover:bg-black text-xs font-bold transition-all cursor-pointer"
                        title="Abrir em nova aba do navegador"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé Informativo */}
        <div className="mt-6 pt-4 border-t border-[#EFE9DF] flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-2">
          <span>💡 Certifique-se de que os aparelhos estejam conectados na mesma rede Wi-Fi.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
