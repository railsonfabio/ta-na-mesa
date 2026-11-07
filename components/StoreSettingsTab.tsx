"use client";

import React, { useState } from "react";
import { StoreSettings, DeliverySetting } from "../lib/server-db";
import {
  Store,
  Bike,
  Plus,
  Trash2,
  Check,
  Tag,
  Clock,
  MapPin,
  Sparkles,
  Save,
  CheckCircle2,
  RotateCcw,
  Tv,
  EyeOff,
  Timer,
  Printer,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

interface StoreSettingsTabProps {
  settings?: StoreSettings;
  onSaveSettings?: (newSettings: StoreSettings) => void;
  onResetClean?: () => void;
  onSeedDemo?: () => void;
}

export function StoreSettingsTab({
  settings,
  onSaveSettings,
  onResetClean,
  onSeedDemo,
}: StoreSettingsTabProps) {
  const [localSettings, setLocalSettings] = useState<StoreSettings>(
    settings || {
      storeName: "Brasa & Burger Grill",
      logoUrl: "/demo_restaurant_logo.svg",
      isOpen: true,
      minOrderValue: 15.0,
      deliveryType: "bairro",
      fixedDeliveryFee: 8.0,
      neighborhoods: [
        { neighborhood: "Ponta Negra", fee: 5.0, estimatedMinutes: "25-40 min", active: true },
        { neighborhood: "Capim Macio", fee: 7.0, estimatedMinutes: "30-45 min", active: true },
        { neighborhood: "Neópolis / Pirangi", fee: 8.0, estimatedMinutes: "35-50 min", active: true },
        { neighborhood: "Candelária", fee: 10.0, estimatedMinutes: "40-55 min", active: true },
        { neighborhood: "Lagoa Nova", fee: 10.0, estimatedMinutes: "45-60 min", active: true },
        { neighborhood: "Tirol / Petrópolis", fee: 12.0, estimatedMinutes: "45-60 min", active: true },
        { neighborhood: "Retirada no Balcão (Takeaway)", fee: 0.0, estimatedMinutes: "20-30 min", active: true },
      ],
      coupons: [
        { code: "PRIMEIRACOMPRA", discountPercent: 10, active: true },
        { code: "FRETEGRATIS", freeDelivery: true, active: true },
        { code: "QUERO10", discountPercent: 10, active: true },
      ],
    }
  );

  const [newBairroName, setNewBairroName] = useState("");
  const [newBairroFee, setNewBairroFee] = useState("8.00");
  const [newBairroTime, setNewBairroTime] = useState("40-55 min");

  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponType, setNewCouponType] = useState<"frete" | "percent10" | "percent15" | "fixed10">("frete");
  const [newCouponMinOrder, setNewCouponMinOrder] = useState("35.00");
  const [newCouponMaxSubsidy, setNewCouponMaxSubsidy] = useState("8.00");

  // Estados para cadastro de Motoboys / Entregadores (Bloco 2)
  const [newCourierName, setNewCourierName] = useState("");
  const [newCourierPhone, setNewCourierPhone] = useState("");
  const [newCourierVehicle, setNewCourierVehicle] = useState("");
  const [newCourierDailyRate, setNewCourierDailyRate] = useState("50.00");

  // Sincroniza localSettings assim que settings chega do servidor (SSE)
  React.useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSave = () => {
    if (onSaveSettings) {
      onSaveSettings(localSettings);
    }
    alert("✅ Configurações de entrega e loja salvas com sucesso!");
  };

  const handleAddNeighborhood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBairroName.trim()) return;
    const fee = parseFloat(newBairroFee.replace(",", ".")) || 0;

    const newSetting: DeliverySetting = {
      neighborhood: newBairroName.trim(),
      fee,
      estimatedMinutes: newBairroTime.trim() || "40-50 min",
      active: true,
    };

    setLocalSettings({
      ...localSettings,
      neighborhoods: [...localSettings.neighborhoods, newSetting],
    });
    setNewBairroName("");
  };

  const handleRemoveNeighborhood = (index: number) => {
    const updated = localSettings.neighborhoods.filter((_, idx) => idx !== index);
    setLocalSettings({ ...localSettings, neighborhoods: updated });
  };

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCouponCode.trim().toUpperCase();
    if (!clean) return;

    const minOrd = parseFloat(newCouponMinOrder.replace(",", ".")) || 0;
    const maxSub = parseFloat(newCouponMaxSubsidy.replace(",", ".")) || 8;

    const newCp = {
      code: clean,
      freeDelivery: newCouponType === "frete",
      discountPercent:
        newCouponType === "percent10" ? 10 : newCouponType === "percent15" ? 15 : undefined,
      discountFixed: newCouponType === "fixed10" ? 10 : undefined,
      minOrderValue: minOrd > 0 ? minOrd : undefined,
      maxDeliverySubsidy: newCouponType === "frete" && maxSub > 0 ? maxSub : undefined,
      active: true,
    };

    setLocalSettings({
      ...localSettings,
      coupons: [...localSettings.coupons, newCp],
    });
    setNewCouponCode("");
  };

  const handleToggleCoupon = (index: number) => {
    const updated = localSettings.coupons.map((cp, idx) =>
      idx === index ? { ...cp, active: !cp.active } : cp
    );
    setLocalSettings({ ...localSettings, coupons: updated });
  };

  const handleRemoveCoupon = (index: number) => {
    const updated = localSettings.coupons.filter((_, idx) => idx !== index);
    setLocalSettings({ ...localSettings, coupons: updated });
  };

  const handleAddCourier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourierName.trim() || !newCourierPhone.trim()) return;
    const currentCouriers = localSettings.couriers || [];
    const newCourier = {
      id: `mot-${Date.now()}`,
      name: newCourierName.trim(),
      phone: newCourierPhone.replace(/\D/g, ""),
      vehicle: newCourierVehicle.trim() || "Moto Delivery",
      fixedDailyRate: parseFloat(newCourierDailyRate.replace(",", ".")) || 0,
      active: true,
    };
    setLocalSettings({
      ...localSettings,
      couriers: [...currentCouriers, newCourier],
    });
    setNewCourierName("");
    setNewCourierPhone("");
    setNewCourierVehicle("");
  };

  const handleRemoveCourier = (id: string) => {
    const updated = (localSettings.couriers || []).filter((c) => c.id !== id);
    setLocalSettings({ ...localSettings, couriers: updated });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
      {/* Topo de Configurações */}
      <div className="bg-white rounded-3xl p-6 border border-[#EFE9DF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h2 className="text-lg font-black text-[#1F2421]">
              Configurações da Loja & Taxas de Entrega
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Configure taxas por bairro em Natal/RN, cupons promocionais e regras de delivery.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer self-start md:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Alterações</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 & 2: Dados Cadastrais + Tabela de Taxas por Bairro */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Identidade e Dados Operacionais do Estabelecimento */}
          <div className="bg-white rounded-3xl p-6 border border-[#EFE9DF] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DF]">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-[#C83E2B]" />
                <h3 className="text-sm font-black text-[#1F2421]">
                  Dados Cadastrais & Operação da Loja
                </h3>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.isOpen !== false}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, isOpen: e.target.checked })
                  }
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
                <span className={localSettings.isOpen !== false ? "text-emerald-700" : "text-rose-600"}>
                  {localSettings.isOpen !== false ? "🟢 Loja Aberta para Pedidos" : "🔴 Loja Fechada"}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Nome do Estabelecimento:</label>
                <input
                  type="text"
                  value={localSettings.storeName || ""}
                  onChange={(e) => setLocalSettings({ ...localSettings, storeName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#EFE9DF] bg-[#FDFBF7] font-bold text-neutral-900 outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Telefone / WhatsApp Oficial:</label>
                <input
                  type="text"
                  value={localSettings.phone || ""}
                  onChange={(e) => setLocalSettings({ ...localSettings, phone: e.target.value })}
                  placeholder="(84) 99800-2020"
                  className="w-full px-3 py-2 rounded-xl border border-[#EFE9DF] bg-[#FDFBF7] font-bold text-neutral-900 outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="font-bold text-neutral-700 block mb-1">Endereço Físico Completo:</label>
                <input
                  type="text"
                  value={localSettings.address || ""}
                  onChange={(e) => setLocalSettings({ ...localSettings, address: e.target.value })}
                  placeholder="Av. Engenheiro Roberto Freire, 2150 - Ponta Negra, Natal/RN"
                  className="w-full px-3 py-2 rounded-xl border border-[#EFE9DF] bg-[#FDFBF7] font-medium text-neutral-900 outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Chave Pix Oficial (Checkout & Bot):</label>
                <input
                  type="text"
                  value={localSettings.pixKey || ""}
                  onChange={(e) => setLocalSettings({ ...localSettings, pixKey: e.target.value })}
                  placeholder="84998002020 (Celular)"
                  className="w-full px-3 py-2 rounded-xl border border-[#EFE9DF] bg-[#FDFBF7] font-mono font-bold text-emerald-800 outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Horário de Funcionamento:</label>
                <input
                  type="text"
                  value={localSettings.openingHours || ""}
                  onChange={(e) => setLocalSettings({ ...localSettings, openingHours: e.target.value })}
                  placeholder="Terça a Domingo, das 17h30 às 23h45"
                  className="w-full px-3 py-2 rounded-xl border border-[#EFE9DF] bg-[#FDFBF7] font-medium text-neutral-900 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#EFE9DF] shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EFE9DF]">
              <div className="flex items-center gap-2">
                <Bike className="w-5 h-5 text-[#C83E2B]" />
                <h3 className="text-sm font-black text-[#1F2421]">
                  Tabela de Taxas de Entrega por Bairro (Natal/RN)
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-[#FEF6EC] text-[#D97706] px-2.5 py-0.5 rounded-full border border-[#FBD9B0]">
                {localSettings.neighborhoods.length} Bairros
              </span>
            </div>

            {/* Lista dos Bairros */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {localSettings.neighborhoods.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#FDFBF7] border border-[#EFE9DF] text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-[#C83E2B]" />
                    <div>
                      <p className="font-bold text-neutral-800">{item.neighborhood}</p>
                      <p className="text-[11px] text-neutral-400">Tempo: {item.estimatedMinutes}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-black text-sm text-[#1F2421]">
                      {item.fee === 0 ? "Grátis" : `R$ ${item.fee.toFixed(2)}`}
                    </span>
                    <button
                      onClick={() => handleRemoveNeighborhood(idx)}
                      className="text-neutral-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Remover Bairro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Formulário para Adicionar Bairro */}
            <form onSubmit={handleAddNeighborhood} className="mt-4 pt-4 border-t border-neutral-100 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Nome do Bairro (Ex: Pajuçara)"
                value={newBairroName}
                onChange={(e) => setNewBairroName(e.target.value)}
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-[#EFE9DF] bg-[#FDFBF7] outline-none"
                required
              />
              <input
                type="text"
                placeholder="Taxa (R$)"
                value={newBairroFee}
                onChange={(e) => setNewBairroFee(e.target.value)}
                className="w-24 text-xs font-bold px-3 py-2 rounded-xl border border-[#EFE9DF] bg-[#FDFBF7] outline-none"
                required
              />
              <button
                type="submit"
                className="bg-[#C83E2B] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </form>
          </div>

          {/* Card: Equipe de Motoboys / Entregadores do Turno (Bloco 2) */}
          <div className="bg-white rounded-3xl p-6 border border-[#EFE9DF] shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EFE9DF]">
              <div className="flex items-center gap-2">
                <span className="text-lg">🛵</span>
                <div>
                  <h3 className="text-sm font-black text-[#1F2421]">
                    Equipe de Entregadores / Motoboys (Despacho & Acerto de Turno)
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Cadastre os motoboys para despachar rotas via WhatsApp com GPS em 1 clique e fechar as taxas da noite sem discussão.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {(localSettings.couriers || []).length} Entregadores
              </span>
            </div>

            <div className="space-y-2 mb-4">
              {(localSettings.couriers || []).map((courier) => (
                <div
                  key={courier.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-[#FDFBF7] border border-[#EFE9DF] text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#1F2421] text-white flex items-center justify-center font-black text-xs">
                      🛵
                    </div>
                    <div>
                      <p className="font-black text-neutral-900">{courier.name}</p>
                      <p className="text-[11px] text-neutral-500">
                        📱 WhatsApp: {courier.phone} • {courier.vehicle || "Moto"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-[11px] font-bold bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200">
                      Diária Fixa: R$ {(courier.fixedDailyRate || 0).toFixed(2)} + Taxas
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCourier(courier.id)}
                      className="text-neutral-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Remover Entregador"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddCourier} className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-3 border-t border-neutral-100">
              <input
                type="text"
                placeholder="Nome (ex: Carlos Moto)"
                value={newCourierName}
                onChange={(e) => setNewCourierName(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-[#EFE9DF] bg-[#FDFBF7] outline-none font-semibold"
                required
              />
              <input
                type="text"
                placeholder="WhatsApp (84999990000)"
                value={newCourierPhone}
                onChange={(e) => setNewCourierPhone(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-[#EFE9DF] bg-[#FDFBF7] outline-none font-mono"
                required
              />
              <input
                type="text"
                placeholder="Moto/Placa (CG 160)"
                value={newCourierVehicle}
                onChange={(e) => setNewCourierVehicle(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-[#EFE9DF] bg-[#FDFBF7] outline-none"
              />
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Diária R$"
                  value={newCourierDailyRate}
                  onChange={(e) => setNewCourierDailyRate(e.target.value)}
                  className="w-20 text-xs font-bold px-2.5 py-2 rounded-xl border border-[#EFE9DF] bg-[#FDFBF7] outline-none"
                  title="Valor da diária fixa do entregador (além das taxas de entrega)"
                />
                <button
                  type="submit"
                  className="flex-1 bg-[#1F2421] hover:bg-black text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Coluna 3: Cupons Promocionais & Pedido Mínimo */}
        <div className="space-y-6">
          {/* Card de Cupons com Trava Anti-Prejuízo */}
          <div className="bg-white rounded-3xl p-6 border border-[#EFE9DF] shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#EFE9DF]">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#D97706]" />
                <h3 className="text-sm font-black text-[#1F2421]">Cupons & Trava de Margem</h3>
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                Anti-Prejuízo
              </span>
            </div>

            <div className="space-y-2 mb-4">
              {localSettings.coupons.map((cp, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                    cp.active
                      ? "bg-[#FEF6EC] border-[#FBD9B0]"
                      : "bg-neutral-100 border-neutral-200 opacity-60"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-[#D97706]">{cp.code}</span>
                      <span className="text-[10px] font-bold text-neutral-700">
                        •{" "}
                        {cp.freeDelivery
                          ? `Frete Grátis (Teto R$ ${(cp.maxDeliverySubsidy || 8).toFixed(2)})`
                          : cp.discountFixed
                          ? `R$ ${cp.discountFixed.toFixed(2)} OFF`
                          : `${cp.discountPercent}% OFF`}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      {cp.minOrderValue && cp.minOrderValue > 0
                        ? `🔒 Exige pedido mínimo de R$ ${cp.minOrderValue.toFixed(2)}`
                        : "Sem valor mínimo exigido"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleCoupon(idx)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer ${
                        cp.active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                      title="Clique para ativar ou pausar este cupom"
                    >
                      {cp.active ? "Ativo" : "Pausado"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveCoupon(idx)}
                      className="text-neutral-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Excluir cupom"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Criar Cupom com Pedido Mínimo e Teto de Frete */}
            <form onSubmit={handleAddCoupon} className="space-y-2 pt-3 border-t border-neutral-100">
              <p className="text-[11px] font-bold text-neutral-700">Criar Novo Cupom Blindado:</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="CÓDIGO (Ex: VIP10)"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value)}
                  className="w-full text-xs font-mono uppercase px-3 py-2 rounded-xl border border-[#EFE9DF] bg-[#FDFBF7] outline-none font-bold"
                  required
                />
                <select
                  value={newCouponType}
                  onChange={(e) =>
                    setNewCouponType(
                      e.target.value as "frete" | "percent10" | "percent15" | "fixed10"
                    )
                  }
                  className="w-full text-xs px-2 py-2 rounded-xl border border-[#EFE9DF] bg-white outline-none font-bold"
                >
                  <option value="frete">Frete Grátis</option>
                  <option value="percent10">10% de Desconto</option>
                  <option value="percent15">15% de Desconto</option>
                  <option value="fixed10">R$ 10,00 OFF</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <label className="text-neutral-500 font-semibold block mb-0.5">
                    Pedido Mínimo (R$):
                  </label>
                  <input
                    type="text"
                    value={newCouponMinOrder}
                    onChange={(e) => setNewCouponMinOrder(e.target.value)}
                    placeholder="35.00"
                    className="w-full text-xs font-bold px-2.5 py-1.5 rounded-xl border border-[#EFE9DF] bg-[#FDFBF7] outline-none"
                  />
                </div>
                {newCouponType === "frete" && (
                  <div>
                    <label className="text-neutral-500 font-semibold block mb-0.5">
                      Teto Frete Grátis (R$):
                    </label>
                    <input
                      type="text"
                      value={newCouponMaxSubsidy}
                      onChange={(e) => setNewCouponMaxSubsidy(e.target.value)}
                      placeholder="8.00"
                      className="w-full text-xs font-bold px-2.5 py-1.5 rounded-xl border border-[#EFE9DF] bg-[#FDFBF7] outline-none"
                      title="Se o bairro custar R$ 12 e o teto for R$ 8, abate R$ 8 e o cliente paga só R$ 4"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-[#1F2421] hover:bg-black text-white text-xs font-bold py-2 rounded-xl cursor-pointer transition-colors"
              >
                + Adicionar Cupom com Trava
              </button>
            </form>

            {/* Regras da Parceria Alô Classificados */}
            <div className="mt-4 pt-3 border-t border-neutral-100 space-y-2">
              <span className="text-[11px] font-black text-emerald-900 block">
                🤝 Regra Automática Parceria Alô Classificados:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <label className="text-neutral-500 block mb-0.5">Pedido Mínimo (R$):</label>
                  <input
                    type="number"
                    value={localSettings.aloPartnerMinOrder ?? 35}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        aloPartnerMinOrder: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full text-xs font-black px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/50 outline-none"
                  />
                </div>
                <div>
                  <label className="text-neutral-500 block mb-0.5">Teto Frete Pago (R$):</label>
                  <input
                    type="number"
                    value={localSettings.aloPartnerMaxSubsidy ?? 8}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        aloPartnerMaxSubsidy: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full text-xs font-black px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/50 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card de Pedido Mínimo */}
          <div className="bg-white rounded-3xl p-6 border border-[#EFE9DF] shadow-xs">
            <h3 className="text-sm font-black text-[#1F2421] mb-2">Pedido Mínimo Delivery</h3>
            <p className="text-xs text-neutral-500 mb-3">
              Valor mínimo para o cliente conseguir concluir o pedido para entrega.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-neutral-600">R$</span>
              <input
                type="number"
                value={localSettings.minOrderValue}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, minOrderValue: parseFloat(e.target.value) || 0 })
                }
                className="w-24 text-sm font-black px-3 py-2 rounded-xl border border-[#EFE9DF] outline-none"
              />
            </div>
          </div>

          {/* Módulos Opcionais Avançados (Colibri / Totvs Style) */}
          <div className="bg-white rounded-3xl p-6 border border-[#EFE9DF] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DF]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-black text-[#1F2421]">Módulos Avançados (Opcionais)</h3>
              </div>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                Colibri Style
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Recursos de alta maturidade para franquias, rodízios e fast-foods. Ative apenas o que fizer sentido para sua operação:
            </p>

            {/* Toggle 1: Fechamento de Caixa Cego */}
            <div className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-[#FDFBF7] border border-[#EFE9DF]">
              <div className="flex items-start gap-2.5">
                <EyeOff className="w-4 h-4 text-neutral-600 mt-0.5" />
                <div>
                  <label htmlFor="blind-cash" className="text-xs font-bold text-neutral-800 cursor-pointer block">
                    Fechamento de Caixa Cego
                  </label>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Oculta valores esperados no fechamento. O operador é obrigado a contar o dinheiro às cegas para evitar vícios.
                  </p>
                </div>
              </div>
              <input
                id="blind-cash"
                type="checkbox"
                checked={localSettings.enableBlindCashClose || false}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, enableBlindCashClose: e.target.checked })
                }
                className="w-4 h-4 text-emerald-600 rounded cursor-pointer mt-1"
              />
            </div>

            {/* Toggle 2: Timer de Permanência de Mesa (Modo Rodízio) */}
            <div className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-[#FDFBF7] border border-[#EFE9DF]">
              <div className="flex items-start gap-2.5">
                <Timer className="w-4 h-4 text-neutral-600 mt-0.5" />
                <div>
                  <label htmlFor="table-timer" className="text-xs font-bold text-neutral-800 cursor-pointer block">
                    Timer de Mesa / Rodízio
                  </label>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Exibe minutos decorridos nos cards das mesas no Gestor e Garçom para monitorar giro de salão.
                  </p>
                </div>
              </div>
              <input
                id="table-timer"
                type="checkbox"
                checked={localSettings.enableTableTimer !== false}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, enableTableTimer: e.target.checked })
                }
                className="w-4 h-4 text-emerald-600 rounded cursor-pointer mt-1"
              />
            </div>

            {/* Toggle 3: Painel de Senhas para TV */}
            <div className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-[#FDFBF7] border border-[#EFE9DF]">
              <div className="flex items-start gap-2.5">
                <Tv className="w-4 h-4 text-neutral-600 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="tv-panel" className="text-xs font-bold text-neutral-800 cursor-pointer block">
                      Painel de TV (/painel-senhas)
                    </label>
                    <a
                      href="/painel-senhas"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-700 hover:underline flex items-center gap-0.5 font-bold"
                    >
                      <span>Abrir</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Tela cheia para Smart TV com chamada sonora de senhas em preparo e prontas para retirada.
                  </p>
                </div>
              </div>
              <input
                id="tv-panel"
                type="checkbox"
                checked={localSettings.enableTvOrderPanel !== false}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, enableTvOrderPanel: e.target.checked })
                }
                className="w-4 h-4 text-emerald-600 rounded cursor-pointer mt-1"
              />
            </div>

            {/* Config 4: Largura da Impressão Térmica & Impressão Automática no Aceite (Bloco 3) */}
            <div className="p-3 rounded-2xl bg-[#FDFBF7] border border-[#EFE9DF] space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-800">
                <Printer className="w-4 h-4 text-neutral-600" />
                <span>Bobina Térmica & Automação de Pico</span>
              </div>
              <select
                value={localSettings.thermalPrintWidth || "80mm"}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    thermalPrintWidth: e.target.value as "80mm" | "58mm",
                  })
                }
                className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-[#EFE9DF] bg-white outline-none cursor-pointer"
              >
                <option value="80mm">80mm (Padrão Epson / Elgin / Bematech)</option>
                <option value="58mm">58mm (Bobina Estreita / Maquininhas POS)</option>
              </select>

              <label className="flex items-center justify-between gap-2 pt-1 cursor-pointer">
                <span className="text-[11px] font-bold text-neutral-700">
                  🖨️ Imprimir comanda automaticamente ao Aceitar Pedido
                </span>
                <input
                  type="checkbox"
                  checked={localSettings.enableAutoPrintOnAccept || false}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      enableAutoPrintOnAccept: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between gap-2 pt-1 cursor-pointer">
                <span className="text-[11px] font-bold text-neutral-700">
                  🔔 Campainha Persistente (Modo iFood) para pedidos pendentes
                </span>
                <input
                  type="checkbox"
                  checked={localSettings.enablePersistentSoundAlert !== false}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      enablePersistentSoundAlert: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Área de Dados, Homologação & Laboratório de Testes */}
          <div className="bg-white rounded-3xl p-6 border border-[#EFE9DF] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🧪</span>
                <h3 className="text-sm font-black text-[#231F1C]">Laboratório de Testes</h3>
              </div>
              <span className="text-[10px] font-bold bg-neutral-100 text-neutral-600 px-2.5 py-0.5 rounded-full">
                Persistência em Disco
              </span>
            </div>
            <p className="text-xs text-neutral-500 mb-4">
              Zere o salão para iniciar testes limpos ou recarregue o cenário demonstrativo com 1 clique.
            </p>
            <div className="space-y-2">
              {onResetClean && (
                <button
                  type="button"
                  onClick={onResetClean}
                  className="w-full bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>🧹 Zerar Salão & Limpar Dados</span>
                </button>
              )}

              {onSeedDemo && (
                <button
                  type="button"
                  onClick={onSeedDemo}
                  className="w-full bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>🧪 Carregar Cenário de Simulação</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
