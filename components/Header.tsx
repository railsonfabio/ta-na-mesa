import React from "react";
import { Logo } from "./Logo";
import { Smartphone, Store, ChefHat, UserCheck, Bike, QrCode, Tv } from "lucide-react";

export type ActiveAppView = "cliente_mesa" | "cliente_delivery" | "gestor_loja" | "cozinha_kds" | "garcom_mobile";

interface HeaderProps {
  activeView: ActiveAppView;
  onViewChange: (view: ActiveAppView) => void;
  unreadAlertsCount?: number;
  onOpenQrModal?: () => void;
}

export function Header({
  activeView,
  onViewChange,
  unreadAlertsCount = 1,
  onOpenQrModal,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EFE9DF] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo Oficial */}
          <div className="flex items-center gap-3">
            <Logo size="md" variant="full" />
            <span className="hidden md:inline-flex text-[11px] font-semibold uppercase tracking-wider bg-[#FDF2F0] text-[#C83E2B] px-2.5 py-0.5 rounded-full border border-[#FADCD7]">
              Demonstração Comercial • White-Label
            </span>
          </div>

          {/* Seletor de Telas / Modos de Demonstração */}
          <div className="flex items-center bg-[#F4EFE6] p-1 rounded-xl gap-1 overflow-x-auto text-xs font-semibold text-neutral-600">
            <button
              onClick={() => onViewChange("cliente_mesa")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all flex-shrink-0 cursor-pointer ${
                activeView === "cliente_mesa"
                  ? "bg-[#C83E2B] text-white shadow-xs"
                  : "hover:bg-white/80 hover:text-neutral-900"
              }`}
              title="Visão do Cliente sentado na Mesa 04"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Cliente (Mesa 04)</span>
            </button>

            <button
              onClick={() => onViewChange("cliente_delivery")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all flex-shrink-0 cursor-pointer ${
                activeView === "cliente_delivery"
                  ? "bg-[#C83E2B] text-white shadow-xs"
                  : "hover:bg-white/80 hover:text-neutral-900"
              }`}
              title="Visão do Cliente pedindo em casa"
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Cliente (Delivery)</span>
            </button>

            <button
              onClick={() => onViewChange("gestor_loja")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all flex-shrink-0 cursor-pointer relative ${
                activeView === "gestor_loja"
                  ? "bg-[#1F2421] text-white shadow-xs"
                  : "hover:bg-white/80 hover:text-neutral-900"
              }`}
              title="Visão do Dono/Balcão (PDV e Gestor)"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Gestor Loja (PDV)</span>
              {unreadAlertsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#C83E2B] animate-pulse" />
              )}
            </button>

            <button
              onClick={() => onViewChange("cozinha_kds")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all flex-shrink-0 cursor-pointer ${
                activeView === "cozinha_kds"
                  ? "bg-[#1F2421] text-white shadow-xs"
                  : "hover:bg-white/80 hover:text-neutral-900"
              }`}
              title="KDS: Tela da Cozinha e Chapa"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Cozinha (KDS)</span>
            </button>

            <button
              onClick={() => onViewChange("garcom_mobile")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all flex-shrink-0 cursor-pointer ${
                activeView === "garcom_mobile"
                  ? "bg-[#1F2421] text-white shadow-xs"
                  : "hover:bg-white/80 hover:text-neutral-900"
              }`}
              title="App do Garçom no celular/maquininha"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Garçom Mobile</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Link direto para o Painel de TV */}
            <a
              href="/painel-senhas"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-black cursor-pointer shadow-2xs transition-all flex-shrink-0"
              title="Abre o Painel de Chamada de Senhas para Smart TV em tela cheia"
            >
              <Tv className="w-3.5 h-3.5 text-amber-400" />
              <span>TV Senhas</span>
            </a>

            {/* Botão de Abrir QR Code da Mesa para Escanear no Celular Real */}
            {onOpenQrModal && (
              <button
                onClick={onOpenQrModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FEF6EC] border border-[#FBD9B0] text-[#D97706] text-xs font-bold hover:bg-[#FDEEDC] cursor-pointer shadow-2xs transition-all flex-shrink-0"
                title="Abre o QR Code real da mesa para escanear com a câmera do seu celular"
              >
                <QrCode className="w-4 h-4 text-[#C83E2B]" />
                <span className="hidden sm:inline">📷 Escanear c/ Celular</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
