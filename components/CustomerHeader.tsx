"use client";

import React from "react";
import { Logo } from "./Logo";
import { Utensils, Bike, QrCode, User, Clock, KeyRound } from "lucide-react";
import { UserProfile } from "./AuthModal";

interface CustomerHeaderProps {
  mode: "mesa" | "delivery";
  tableNumber?: number;
  onModeChange: (mode: "mesa" | "delivery") => void;
  onRequestMesaMode?: () => void;
  onOpenQrModal?: () => void;
  cartItemsCount?: number;
  onOpenCart?: () => void;
  user?: UserProfile | null;
  onOpenAuth?: () => void;
  onOpenHistory?: () => void;
}

export function CustomerHeader({
  mode,
  tableNumber,
  onModeChange,
  onRequestMesaMode,
  onOpenQrModal,
  cartItemsCount = 0,
  onOpenCart,
  user,
  onOpenAuth,
  onOpenHistory,
}: CustomerHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EFE9DF] shadow-xs">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo Oficial */}
          <Logo size="md" variant="full" />

          {/* Seletor de Modalidade do Cliente (Mesa vs Delivery) */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-[#F4EFE6] p-1 rounded-xl text-xs font-bold text-neutral-700">
              <button
                onClick={() => {
                  if (mode === "delivery" && onRequestMesaMode) {
                    onRequestMesaMode();
                  } else {
                    onModeChange("mesa");
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mode === "mesa"
                    ? "bg-[#C83E2B] text-white shadow-xs"
                    : "hover:bg-white/80 hover:text-neutral-900"
                }`}
                title={tableNumber ? `Consumo presencial na Mesa ${tableNumber}` : "Consumo presencial no Salão"}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>{mode === "mesa" && tableNumber ? `Salão (Mesa ${tableNumber})` : "Salão"}</span>
              </button>

              <button
                onClick={() => onModeChange("delivery")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mode === "delivery"
                    ? "bg-[#C83E2B] text-white shadow-xs"
                    : "hover:bg-white/80 hover:text-neutral-900"
                }`}
                title="Pedir para entrega em casa"
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Delivery</span>
              </button>
            </div>

            {/* Autenticação & Meus Pedidos */}
            {user?.isLoggedIn ? (
              <div className="flex items-center gap-1">
                {onOpenHistory && (
                  <button
                    onClick={onOpenHistory}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold cursor-pointer"
                    title="Ver histórico de pedidos e repetir com 1 clique"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#C83E2B]" />
                    <span className="hidden sm:inline">Meus Pedidos</span>
                  </button>
                )}

                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FDF2F0] text-[#C83E2B] border border-[#FADCD7] text-xs font-black cursor-pointer"
                  title="Perfil logado"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
                </button>
              </div>
            ) : (
              onOpenAuth && (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-bold hover:bg-emerald-100 cursor-pointer"
                  title="Entrar com WhatsApp para cupons e histórico"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Entrar c/ WhatsApp</span>
                </button>
              )
            )}

            {/* Atalho QR Code para abrir e testar no celular */}
            {onOpenQrModal && (
              <button
                onClick={onOpenQrModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#FEF6EC] border border-[#FBD9B0] text-[#D97706] hover:bg-[#FDEEDC] transition-colors cursor-pointer text-xs font-bold"
                title="Abrir QR Code para apontar a câmera do celular e testar na mesma rede"
              >
                <QrCode className="w-3.5 h-3.5 text-[#C83E2B]" />
                <span className="hidden md:inline text-[11px]">QR Celular</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
