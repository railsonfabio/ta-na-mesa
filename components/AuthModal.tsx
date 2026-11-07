"use client";

import React, { useState } from "react";
import { Logo } from "./Logo";
import { X, Smartphone, ArrowRight, ShieldCheck, CheckCircle2, Sparkles, KeyRound } from "lucide-react";

export interface UserProfile {
  name: string;
  phone: string;
  isLoggedIn: boolean;
  avatar?: string;
  loyaltyPoints?: number;
}

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export function AuthModal({ onClose, onLoginSuccess }: AuthModalProps) {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [name, setName] = useState("Fábio Barbosa");
  const [phone, setPhone] = useState("(84) 99876-5432");
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep("code");
    }, 600);
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const user: UserProfile = {
        name: name.trim() || "Cliente Alô",
        phone: phone.trim(),
        isLoggedIn: true,
        loyaltyPoints: 150,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("tanamesa_user_session", JSON.stringify(user));
      }
      onLoginSuccess(user);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-[#EFE9DF] shadow-2xl relative animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 p-2 rounded-full hover:bg-neutral-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Topo do Modal */}
        <div className="text-center mb-5">
          <div className="flex justify-center mb-3">
            <Logo size="md" variant="icon" />
          </div>
          <h3 className="text-base font-black text-[#1F2421]">
            {step === "phone" ? "Entrar ou Identificar-se" : "Confirmação por WhatsApp"}
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            {step === "phone"
              ? "Acesse seus cupons do Alô Classificados e histórico de pedidos em 1 clique."
              : `Digite o código de 4 dígitos enviado para ${phone}`}
          </p>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendCode} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Seu Nome Completo:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Fábio Barbosa"
                className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-[#EFE9DF] outline-none focus:border-[#C83E2B]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Seu Número de WhatsApp (com DDD):
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(84) 9____-____"
                  className="w-full text-xs font-bold pl-9 pr-3.5 py-2.5 rounded-xl border border-[#EFE9DF] outline-none focus:border-[#C83E2B]"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#C83E2B] hover:bg-[#B03221] text-white font-extrabold text-xs py-3 rounded-2xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{isLoading ? "Enviando Código..." : "Continuar com WhatsApp"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="relative my-4 text-center">
              <span className="bg-white px-2 text-[10px] uppercase font-bold text-neutral-400 relative z-10">
                Ou acesse com
              </span>
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-neutral-200" />
            </div>

            <button
              type="button"
              onClick={() => {
                const user: UserProfile = {
                  name: "Fábio Barbosa (Google)",
                  phone: "(84) 99876-5432",
                  isLoggedIn: true,
                  loyaltyPoints: 200,
                };
                if (typeof window !== "undefined") {
                  localStorage.setItem("tanamesa_user_session", JSON.stringify(user));
                }
                onLoginSuccess(user);
              }}
              className="w-full bg-white hover:bg-neutral-50 text-neutral-700 border border-[#EFE9DF] font-bold text-xs py-2.5 rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.9c2.28-2.1 3.645-5.18 3.645-9.14z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.1-6.68-4.93H1.21v3.15C3.25 21.43 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.32 14.27c-.24-.73-.38-1.5-.38-2.27s.14-1.54.38-2.27V6.58H1.21C.44 8.11 0 9.99 0 12s.44 3.89 1.21 5.42l4.11-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.57 1.21 6.58l4.11 3.15c.94-2.83 3.58-4.98 6.68-4.98z"
                />
              </svg>
              <span>Entrar com Conta Google</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="bg-[#FEF6EC] border border-[#FBD9B0] p-3 rounded-2xl text-center">
              <span className="text-[11px] font-bold text-[#D97706] block">
                Código de Simulação: <strong>1234</strong>
              </span>
              <span className="text-[10px] text-neutral-500">
                (Em produção real, enviado via API do WhatsApp)
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1 text-center">
                Digite o Código de 4 dígitos:
              </label>
              <input
                type="text"
                maxLength={4}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="1 2 3 4"
                className="w-full text-center text-xl tracking-widest font-black py-2.5 rounded-xl border border-[#EFE9DF] outline-none focus:border-[#C83E2B]"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-2xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isLoading ? "Validando..." : "Confirmar e Entrar"}</span>
            </button>

            <button
              type="button"
              onClick={() => setStep("phone")}
              className="w-full text-center text-xs font-bold text-neutral-400 hover:text-neutral-600 pt-1"
            >
              Trocar número de telefone
            </button>
          </form>
        )}

        <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Acesso seguro com chancela <strong>A2i Solutions</strong></span>
        </div>
      </div>
    </div>
  );
}
