"use client";

import React, { useState } from "react";
import { Order } from "../lib/types";
import {
  TrendingUp,
  TrendingDown,
  Landmark,
  Wallet,
  CreditCard,
  QrCode,
  DollarSign,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Receipt,
  Sparkles,
  AlertCircle,
  X,
  Copy,
} from "lucide-react";

export interface PayoutMethod {
  id: string;
  name: string;
  type: "nupay" | "pix" | "banco" | "cartao";
  detail: string;
  isDefault?: boolean;
}

const DEFAULT_PAYOUT_METHODS: PayoutMethod[] = [
  {
    id: "p1",
    name: "NuPay PJ",
    type: "nupay",
    detail: "Vinculado à sua conta Nubank PJ",
    isDefault: true,
  },
  {
    id: "p2",
    name: "Chave Pix Principal",
    type: "pix",
    detail: "CNPJ 54.321.987/0001-20 (Banco 260)",
  },
  {
    id: "p3",
    name: "Conta Bancária Itaú",
    type: "banco",
    detail: "Ag 0340 • Cc 98765-4",
  },
];

interface FinanceChefiaViewProps {
  orders?: Order[];
  storeName?: string;
}

export function FinanceChefiaView({
  orders = [],
  storeName = "Brasa & Burger Grill",
}: FinanceChefiaViewProps) {
  // Cálculo de receitas a partir dos pedidos
  const deliveredOrders = orders.filter(
    (o) => o.status === "entregue" || o.status === "a_caminho" || o.status === "em_preparo"
  );

  const realOrdersRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
  const baseDemonstrativeRevenue = 15780.5; // Base dos dados do Stitch
  const totalRevenue = Math.max(baseDemonstrativeRevenue, realOrdersRevenue);

  // Regra de Monetização SaaS do Stitch financeiro_chefia:
  // Taxa de 0.8% sobre cada produto + R$ 1,00 para manter serviços do Tá na Mesa
  const totalItemsCount = deliveredOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, it) => s + it.quantity, 0),
    240
  );
  const ordersCount = Math.max(deliveredOrders.length, 120);

  const saasProductFee = totalRevenue * 0.008; // 0.8%
  const saasOrderFixedFee = ordersCount * 1.0; // R$ 1.00 por pedido
  const totalPlatformFee = saasProductFee + saasOrderFixedFee;

  // Saques já realizados (histórico)
  const [withdrawnAmount, setWithdrawnAmount] = useState<number>(6830.5);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>(DEFAULT_PAYOUT_METHODS);

  // Saldo disponível para retirada
  const availableToWithdraw = Math.max(
    0,
    totalRevenue - totalPlatformFee - withdrawnAmount
  );

  // Estados dos Modais do Stitch (retirar_valor_chefia_1 e 2)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isAddMethodModalOpen, setIsAddMethodModalOpen] = useState(false);
  const [withdrawInput, setWithdrawInput] = useState<string>("");
  const [selectedMethodId, setSelectedMethodId] = useState<string>("p1");
  const [securityPassword, setSecurityPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [withdrawSuccessReceipt, setWithdrawSuccessReceipt] = useState<{
    amount: number;
    methodName: string;
    date: string;
    protocol: string;
  } | null>(null);

  // Formulário de novo método
  const [newMethodName, setNewMethodName] = useState("");
  const [newMethodType, setNewMethodType] = useState<"pix" | "nupay" | "banco">("pix");
  const [newMethodPixKey, setNewMethodPixKey] = useState("");
  const [newMethodBank, setNewMethodBank] = useState("");
  const [newMethodAgency, setNewMethodAgency] = useState("");
  const [newMethodAccount, setNewMethodAccount] = useState("");

  const handleConfirmWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(withdrawInput.replace(/[^\d,.]/g, "").replace(",", "."));
    if (isNaN(val) || val <= 0) {
      alert("Por favor, digite um valor válido para retirada.");
      return;
    }
    if (val > availableToWithdraw) {
      alert(`O valor solicitado (R$ ${val.toFixed(2)}) é maior que o saldo disponível (R$ ${availableToWithdraw.toFixed(2)}).`);
      return;
    }
    if (!securityPassword) {
      alert("Digite sua senha de segurança para autorizar o saque.");
      return;
    }

    const method = payoutMethods.find((m) => m.id === selectedMethodId) || payoutMethods[0];
    const protocol = `SAQUE-TNM-${Date.now().toString().slice(-6)}`;

    setWithdrawnAmount((prev) => prev + val);
    setWithdrawSuccessReceipt({
      amount: val,
      methodName: `${method.name} (${method.detail})`,
      date: new Date().toLocaleString("pt-BR"),
      protocol,
    });
    setWithdrawInput("");
    setSecurityPassword("");
    setIsWithdrawModalOpen(false);
  };

  const handleSaveNewMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMethodName.trim()) {
      alert("Digite um nome para identificação da conta.");
      return;
    }

    let detailStr = "";
    if (newMethodType === "pix") {
      detailStr = `Chave Pix: ${newMethodPixKey || "CNPJ/Email"}`;
    } else if (newMethodType === "banco") {
      detailStr = `Banco ${newMethodBank || "001"} • Ag ${newMethodAgency} • Cc ${newMethodAccount}`;
    } else {
      detailStr = "Conta Vinculada NuPay";
    }

    const newMethod: PayoutMethod = {
      id: `p-${Date.now()}`,
      name: newMethodName.trim(),
      type: newMethodType,
      detail: detailStr,
    };

    setPayoutMethods((prev) => [...prev, newMethod]);
    setSelectedMethodId(newMethod.id);
    setIsAddMethodModalOpen(false);
    setNewMethodName("");
    setNewMethodPixKey("");
    setNewMethodBank("");
    setNewMethodAgency("");
    setNewMethodAccount("");
    alert(`✅ Forma de recebimento "${newMethod.name}" cadastrada com sucesso!`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans text-neutral-800">
      {/* Header do Painel Financeiro da Chefia */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-[#E7DCD0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-100 text-[#CA000A]">
              <Wallet className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-[#1F2421]">
                Gestão Financeira & Retiradas da Chefia
              </h2>
              <p className="text-xs text-neutral-500 font-medium">
                {storeName} • Painel Administrativo do Estabelecimento
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsWithdrawModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-[#CA000A] hover:bg-[#b00009] text-white text-xs font-black shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <DollarSign className="w-4 h-4" />
          <span>Retirar Valor</span>
        </button>
      </div>

      {/* Recibo de Retirada Concluída */}
      {withdrawSuccessReceipt && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Solicitação de Retirada Realizada com Sucesso!
              </p>
              <h4 className="text-lg font-black text-emerald-950">
                R$ {withdrawSuccessReceipt.amount.toFixed(2)} transferido via PIX
              </h4>
              <p className="text-xs text-emerald-700 font-medium mt-0.5">
                Destino: {withdrawSuccessReceipt.methodName} • Protocolo:{" "}
                <span className="font-mono font-bold">
                  {withdrawSuccessReceipt.protocol}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setWithdrawSuccessReceipt(null)}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
          >
            Fechar aviso
          </button>
        </div>
      )}

      {/* Seção 1: Resumo de Valores (conforme Stitch financeiro_chefia) */}
      <div>
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-neutral-500 mb-3 px-1">
          Resumo de Valores da Loja
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Card 1: Valor Total Recebido */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E7DCD0] shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-[#CA000A]">
              <TrendingUp className="w-5 h-5 text-[#CA000A]" />
              <p className="text-xs font-bold text-neutral-600">
                Valor Total Recebido
              </p>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#1F2421] tracking-tight">
              R$ {totalRevenue.toFixed(2)}
            </p>
            <p className="text-[11px] text-neutral-400 font-medium">
              Vendas no salão, delivery e comandas
            </p>
          </div>

          {/* Card 2: Valor a Retirar (Disponível) */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50/60 rounded-2xl p-4 sm:p-5 border border-red-200 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-[#CA000A]">
              <Landmark className="w-5 h-5 text-[#CA000A]" />
              <p className="text-xs font-black text-[#CA000A]">
                Valor a Retirar (Disponível)
              </p>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#CA000A] tracking-tight">
              R$ {availableToWithdraw.toFixed(2)}
            </p>
            <p className="text-[11px] text-red-700/80 font-medium">
              Liberado para transferência instantânea via Pix
            </p>
          </div>

          {/* Card 3: Valor Já Retirado */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E7DCD0] shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-neutral-500">
              <TrendingDown className="w-5 h-5 text-neutral-500" />
              <p className="text-xs font-bold text-neutral-600">
                Valor Já Retirado
              </p>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-neutral-800 tracking-tight">
              R$ {withdrawnAmount.toFixed(2)}
            </p>
            <p className="text-[11px] text-neutral-400 font-medium">
              Transferido para conta bancária da empresa
            </p>
          </div>
        </div>
      </div>

      {/* Detalhamento da Taxa SaaS da Plataforma Tá na Mesa */}
      <div className="bg-white rounded-2xl p-5 border border-[#E7DCD0] shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-700">
              Taxa de Operação Tá na Mesa (Transparência SaaS)
            </h4>
          </div>
          <span className="text-xs font-bold text-neutral-500">
            Regra Stitch: 0.8% por produto + R$ 1,00 por pedido
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs">
          <div className="bg-neutral-50 p-3 rounded-xl">
            <span className="text-neutral-500 font-medium block">
              1. Taxa Percentual (0.8%)
            </span>
            <span className="font-extrabold text-[#1F2421] text-sm mt-0.5 block">
              R$ {saasProductFee.toFixed(2)}
            </span>
          </div>

          <div className="bg-neutral-50 p-3 rounded-xl">
            <span className="text-neutral-500 font-medium block">
              2. Taxa Fixa por Pedido (R$ 1.00)
            </span>
            <span className="font-extrabold text-[#1F2421] text-sm mt-0.5 block">
              R$ {saasOrderFixedFee.toFixed(2)}{" "}
              <span className="text-[10px] text-neutral-400 font-normal">
                ({ordersCount} pedidos)
              </span>
            </span>
          </div>

          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
            <span className="text-neutral-500 font-medium block">
              3. Total Retido para a Plataforma
            </span>
            <span className="font-black text-[#CA000A] text-sm mt-0.5 block">
              R$ {totalPlatformFee.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Seção 2: Formas de Pagamento Aceitas no Restaurante (conforme Stitch) */}
      <div>
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-neutral-500 mb-3 px-1">
          Formas de Pagamento Aceitas pelo Restaurante
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {[
            { name: "Pix Instantâneo", badge: "Ativo", icon: QrCode },
            { name: "Cartão Crédito", badge: "Ativo", icon: CreditCard },
            { name: "Cartão Débito", badge: "Ativo", icon: CreditCard },
            { name: "Dinheiro / Troco", badge: "Ativo", icon: DollarSign },
            { name: "Mercado Pago", badge: "Ativo", icon: Building2 },
            { name: "Google Pay", badge: "Ativo", icon: ShieldCheck },
            { name: "NuPay", badge: "Ativo", icon: Wallet },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white p-3 rounded-xl border border-[#E7DCD0] flex flex-col items-center justify-center text-center gap-1 shadow-2xs hover:border-[#CA000A] transition-colors"
              >
                <div className="size-9 rounded-lg bg-neutral-100 flex items-center justify-center text-[#CA000A]">
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-[#1F2421]">{item.name}</p>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Seção 3: Formas de Retirada Cadastradas (conforme Stitch) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-neutral-500">
            Formas de Retirada Cadastradas ({payoutMethods.length})
          </h3>
          <button
            type="button"
            onClick={() => setIsAddMethodModalOpen(true)}
            className="text-xs font-bold text-[#CA000A] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar Nova Forma</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {payoutMethods.map((method) => (
            <div
              key={method.id}
              className="bg-white p-4 rounded-xl border border-[#E7DCD0] flex items-center justify-between shadow-2xs hover:border-neutral-300 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-red-50 text-[#CA000A] flex items-center justify-center font-bold">
                  {method.type === "nupay" ? (
                    <Wallet className="w-5 h-5" />
                  ) : method.type === "pix" ? (
                    <QrCode className="w-5 h-5" />
                  ) : (
                    <Building2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-[#1F2421]">
                      {method.name}
                    </p>
                    {method.isDefault && (
                      <span className="text-[10px] font-bold text-[#CA000A] bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                        Padrão
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 font-medium">
                    {method.detail}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMethodId(method.id);
                    setIsWithdrawModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-neutral-700 transition-colors cursor-pointer"
                >
                  Sacar para esta
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nota Oficial de Monetização do Stitch financeiro_chefia */}
      <div className="pt-2 text-center">
        <p className="text-xs text-[#CA000A] font-bold">
          * Taxa de 0.8% sobre cada produto + R$ 1,00 para manter serviços do Tá na Mesa.
        </p>
      </div>

      {/* ======================================================================= */}
      {/* MODAL 1: RETIRAR VALOR (conforme Stitch retirar_valor_chefia_1)          */}
      {/* ======================================================================= */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl border border-neutral-300 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
              <h3 className="text-base font-black text-[#1F2421]">
                Retirar Valor do Saldo
              </h3>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmWithdraw} className="p-5 space-y-4">
              {/* Valor Disponível */}
              <div className="text-center py-2 bg-neutral-50 rounded-xl border border-neutral-200">
                <p className="text-xs text-neutral-500 font-medium">
                  Valor Disponível para Retirada
                </p>
                <p className="text-2xl font-black text-[#CA000A] mt-0.5">
                  R$ {availableToWithdraw.toFixed(2)}
                </p>
              </div>

              {/* Input Valor a Retirar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-neutral-700">
                    Valor a Retirar (R$):
                  </label>
                  <button
                    type="button"
                    onClick={() => setWithdrawInput(availableToWithdraw.toFixed(2))}
                    className="text-[11px] font-black text-[#CA000A] hover:underline cursor-pointer"
                  >
                    Retirar Total Disponível
                  </button>
                </div>
                <input
                  type="text"
                  value={withdrawInput}
                  onChange={(e) => setWithdrawInput(e.target.value)}
                  placeholder="Ex: 500,00"
                  className="w-full px-3.5 py-2.5 text-base font-black text-[#1F2421] bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-[#CA000A] focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Seleção da Forma de Retirada (Radios do Stitch) */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1.5">
                  Selecione a Forma de Retirada:
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {payoutMethods.map((m) => (
                    <label
                      key={m.id}
                      onClick={() => setSelectedMethodId(m.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        selectedMethodId === m.id
                          ? "bg-red-50/60 border-[#CA000A] ring-2 ring-[#CA000A]/20"
                          : "bg-white border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="withdraw_method"
                        checked={selectedMethodId === m.id}
                        onChange={() => setSelectedMethodId(m.id)}
                        className="text-[#CA000A] focus:ring-[#CA000A]"
                      />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-[#1F2421]">{m.name}</p>
                        <p className="text-[11px] text-neutral-500">{m.detail}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Senha de Segurança (do Stitch retirar_valor_chefia_1) */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Senha de Segurança do Gestor:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={securityPassword}
                    onChange={(e) => setSecurityPassword(e.target.value)}
                    placeholder="Digite sua senha de autorização"
                    className="w-full px-3.5 py-2.5 text-xs font-medium bg-neutral-50 border border-neutral-300 rounded-xl pr-10 focus:ring-2 focus:ring-[#CA000A] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-[#CA000A] font-bold text-center">
                * Taxa de 0.8% sobre cada produto + R$ 1,00 para manter serviços do Tá na Mesa.
              </p>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#CA000A] hover:bg-[#b00009] text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Confirmar Retirada
                </button>
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="w-full py-2 text-neutral-500 hover:text-neutral-800 text-xs font-bold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 2: CADASTRAR FORMA (conforme Stitch retirar_valor_chefia_2)        */}
      {/* ======================================================================= */}
      {isAddMethodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl border border-neutral-300 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
              <h3 className="text-base font-black text-[#1F2421]">
                Cadastrar Forma de Recebimento
              </h3>
              <button
                onClick={() => setIsAddMethodModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewMethod} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Nome para Identificação:
                </label>
                <input
                  type="text"
                  value={newMethodName}
                  onChange={(e) => setNewMethodName(e.target.value)}
                  placeholder="Ex: Conta Principal Itaú ou Chave Pix CNPJ"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-medium focus:ring-2 focus:ring-[#CA000A] focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Tipo de Conta:
                </label>
                <select
                  value={newMethodType}
                  onChange={(e) => setNewMethodType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-bold focus:ring-2 focus:ring-[#CA000A] focus:outline-none"
                >
                  <option value="pix">Chave PIX Instantâneo</option>
                  <option value="nupay">NuPay (Nubank PJ)</option>
                  <option value="banco">Conta Bancária (TED / DOC)</option>
                </select>
              </div>

              {newMethodType === "pix" && (
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Chave PIX (CNPJ, Celular, Email ou Aleatória):
                  </label>
                  <input
                    type="text"
                    value={newMethodPixKey}
                    onChange={(e) => setNewMethodPixKey(e.target.value)}
                    placeholder="Digite sua chave PIX"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-mono focus:ring-2 focus:ring-[#CA000A] focus:outline-none"
                  />
                </div>
              )}

              {newMethodType === "banco" && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-neutral-700 block mb-1">
                        Código do Banco:
                      </label>
                      <input
                        type="text"
                        value={newMethodBank}
                        onChange={(e) => setNewMethodBank(e.target.value)}
                        placeholder="Ex: 260 ou 341"
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-neutral-700 block mb-1">
                        Agência:
                      </label>
                      <input
                        type="text"
                        value={newMethodAgency}
                        onChange={(e) => setNewMethodAgency(e.target.value)}
                        placeholder="0001"
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">
                      Conta com dígito:
                    </label>
                    <input
                      type="text"
                      value={newMethodAccount}
                      onChange={(e) => setNewMethodAccount(e.target.value)}
                      placeholder="12345-6"
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-3">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#CA000A] hover:bg-[#b00009] text-white font-black rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Salvar Forma de Recebimento
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddMethodModalOpen(false)}
                  className="w-full py-2 text-neutral-500 hover:text-neutral-800 font-bold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
