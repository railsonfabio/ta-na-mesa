"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Store,
  Loader2,
  ShieldCheck,
  ChefHat,
  UserCheck,
  Smartphone,
  KeyRound,
  PlusCircle,
  Phone,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

const MASTER_EMAILS = [
  "railsonfabio@gmail.com",
  "a2isolutionsbrasil@gmail.com",
  "rhvendasdireta@gmail.com",
  "eetservicebr@gmail.com",
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRedirect = searchParams.get("redirect") || "/gestor";

  const [targetModule, setTargetModule] = useState<string>(initialRedirect);
  const [activeTab, setActiveTab] = useState<"login" | "master_pin" | "register">("login");

  // Campos de Login / PIN Master
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [masterPin, setMasterPin] = useState("");

  // Campos de Primeiro Cadastro (Novo Restaurante)
  const [storeName, setStoreName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const isMasterEmail = MASTER_EMAILS.includes(email.trim().toLowerCase());

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password.trim(),
      });

      if (error || !data.session) {
        setErrorMsg(
          error?.message === "Invalid login credentials"
            ? isMasterEmail
              ? "PIN Master ou senha incorreta. Para contas Master A2i, utilize seu PIN de Segurança de 6 dígitos."
              : "E-mail ou senha incorretos. Se ainda não cadastrou seu restaurante, clique na aba 'Cadastrar Loja'."
            : error?.message || "Não foi possível autenticar sua conta."
        );
        setLoading(false);
        return;
      }

      router.push(targetModule);
      router.refresh();
    } catch {
      setErrorMsg("Erro de conexão ao tentar autenticar com o servidor.");
      setLoading(false);
    }
  };

  const handleMasterPinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const resp = await fetch("/api/auth/register-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "master_pin",
          pin: masterPin.trim(),
          email: email.trim() || "railsonfabio@gmail.com",
        }),
      });

      const resData = await resp.json().catch(() => ({}));
      if (!resp.ok || !resData.ok) {
        setErrorMsg(resData.error || "PIN de Segurança Master incorreto.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: resData.email,
        password: resData.pin,
      });

      if (error || !data.session) {
        setErrorMsg(error?.message || "Não foi possível iniciar a sessão Master.");
        setLoading(false);
        return;
      }

      router.push(targetModule);
      router.refresh();
    } catch {
      setErrorMsg("Erro de conexão ao validar o PIN Master.");
      setLoading(false);
    }
  };

  const handleRegisterStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const resp = await fetch("/api/auth/register-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          storeName: storeName.trim(),
          whatsapp: whatsapp.trim(),
          email: regEmail.trim().toLowerCase(),
          password: regPassword.trim(),
        }),
      });

      const resData = await resp.json().catch(() => ({}));
      if (!resp.ok || !resData.ok) {
        setErrorMsg(resData.error || "Não foi possível cadastrar o restaurante.");
        setLoading(false);
        return;
      }

      setSuccessMsg("Restaurante criado com sucesso! Abrindo o Assistente de Ativação...");

      const { data, error } = await supabase.auth.signInWithPassword({
        email: regEmail.trim().toLowerCase(),
        password: regPassword.trim(),
      });

      if (error || !data.session) {
        setErrorMsg(
          "Conta criada! Faça login na aba 'Entrar' com seu e-mail e senha."
        );
        setActiveTab("login");
        setEmail(regEmail.trim().toLowerCase());
        setLoading(false);
        return;
      }

      router.push("/gestor?onboarding=1");
      router.refresh();
    } catch {
      setErrorMsg("Erro de conexão ao criar sua loja.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] flex flex-col justify-center items-center px-4 py-10">
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-red-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Cardápio Público
        </Link>
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          ● Nuvem A2i Ativa
        </span>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-200/80 p-7 sm:p-8">
        {/* Cabeçalho da Marca */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/25 mb-3">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            Tá na <span className="text-red-600">Mesa</span> • Acesso Equipe
          </h1>
          <p className="text-xs font-medium text-stone-500 mt-1">
            Escolha o terminal de operação e faça seu acesso
          </p>
        </div>

        {/* Seletor Rápido do Módulo de Destino (Gestor, Garçom, Cozinha, POS) */}
        <div className="mb-6">
          <span className="block text-[10px] font-black uppercase tracking-wider text-stone-400 mb-2 text-center">
            1. Qual terminal você deseja abrir?
          </span>
          <div className="grid grid-cols-4 gap-1.5 bg-stone-100 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setTargetModule("/gestor")}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                targetModule === "/gestor"
                  ? "bg-white text-red-600 shadow-xs border border-stone-200/80"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Store className="w-4 h-4 mb-1" />
              <span>Gestor</span>
            </button>
            <button
              type="button"
              onClick={() => setTargetModule("/garcom")}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                targetModule === "/garcom"
                  ? "bg-white text-red-600 shadow-xs border border-stone-200/80"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <UserCheck className="w-4 h-4 mb-1" />
              <span>Garçom</span>
            </button>
            <button
              type="button"
              onClick={() => setTargetModule("/cozinha")}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                targetModule === "/cozinha"
                  ? "bg-white text-red-600 shadow-xs border border-stone-200/80"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <ChefHat className="w-4 h-4 mb-1" />
              <span>Cozinha</span>
            </button>
            <button
              type="button"
              onClick={() => setTargetModule("/pos")}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                targetModule === "/pos"
                  ? "bg-white text-red-600 shadow-xs border border-stone-200/80"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Smartphone className="w-4 h-4 mb-1" />
              <span>Smart POS</span>
            </button>
          </div>
        </div>

        {/* Abas de Modalidade de Autenticação */}
        <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setErrorMsg(null);
            }}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "login"
                ? "bg-stone-900 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            E-mail & Senha
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("master_pin");
              setErrorMsg(null);
            }}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === "master_pin"
                ? "bg-red-600 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>PIN Master</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("register");
              setErrorMsg(null);
            }}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === "register"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Cadastrar Loja</span>
          </button>
        </div>

        {/* Alertas de Erro ou Sucesso */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ABA 1: LOGIN POR E-MAIL E SENHA / CONTA MASTER */}
        {activeTab === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5"
              >
                E-mail do Estabelecimento ou Conta Master
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="railsonfabio@gmail.com ou lojista@..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/60 text-sm text-stone-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                />
              </div>
              {isMasterEmail && (
                <div className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Conta Master A2i identificada! Digite seu PIN Master abaixo.</span>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5"
              >
                {isMasterEmail ? "PIN de Segurança Master" : "Senha de Acesso"}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isMasterEmail ? "Digite seu PIN Master de 6 dígitos" : "••••••••"}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/60 text-sm text-stone-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold text-sm shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Autenticando credenciais...
                </>
              ) : (
                <>
                  Abrir {targetModule === "/gestor" ? "Painel do Gestor" : targetModule === "/garcom" ? "App do Garçom" : targetModule === "/cozinha" ? "KDS da Cozinha" : "Smart POS"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ABA 2: ACESSO DIRETO COM PIN MASTER (IGUAL AO ALÔ) */}
        {activeTab === "master_pin" && (
          <form onSubmit={handleMasterPinLogin} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
              <strong className="block font-bold mb-0.5 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                Chave Mestra A2i Solutions
              </strong>
              Digite o seu <strong>PIN de Segurança Master</strong> (o mesmo utilizado no Alô) para destravar imediatamente o terminal selecionado.
            </div>

            <div>
              <label
                htmlFor="masterPin"
                className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5 text-center"
              >
                PIN de Segurança Master
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="masterPin"
                  type="password"
                  inputMode="numeric"
                  required
                  autoFocus
                  value={masterPin}
                  onChange={(e) => setMasterPin(e.target.value)}
                  placeholder="••••••"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border-2 border-stone-300 bg-stone-50 text-center text-lg tracking-[0.35em] text-stone-900 font-black focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold text-sm shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validando PIN Master...
                </>
              ) : (
                <>
                  Destravar Terminal com PIN Master
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ABA 3: CADASTRAR NOVO RESTAURANTE (PRIMEIRO ACESSO) */}
        {activeTab === "register" && (
          <form onSubmit={handleRegisterStore} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Nome do Restaurante / Lanchonete
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Ex: Sabor da Brasa Burger"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/60 text-sm text-stone-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                WhatsApp da Loja (com DDD)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(84) 99999-0000"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/60 text-sm text-stone-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                E-mail do Gestor
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="contato@seurestaurante.com.br"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/60 text-sm text-stone-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Crie sua Senha ou PIN (mín. 6 dígitos)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/60 text-sm text-stone-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Provisionando sua loja na nuvem...
                </>
              ) : (
                <>
                  Criar Loja e Iniciar Onboarding
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-stone-100 text-center">
          <p className="text-[11px] text-stone-400 font-medium">
            Ambiente Blindado Multi-Tenant • A2i Solutions & Alô Classificados
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf7f2] flex flex-col items-center justify-center gap-3 text-stone-600">
          <Loader2 className="w-8 h-8 animate-spin text-[#BD4D2D]" />
          <p className="text-xs font-bold uppercase tracking-widest">
            Carregando Portal Operacional...
          </p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
