"use client";

import React, { useState } from "react";
import {
  Store,
  QrCode,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  Printer,
  Sparkles,
  Loader2,
  X,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import {
  getSupabaseBrowserClient,
  resolveActiveStoreId,
} from "../lib/supabase-client";
import type { StoreSettings, DeliverySetting } from "../lib/server-db";

interface OnboardingWizardModalProps {
  isOpen: boolean;
  initialSettings?: StoreSettings;
  onClose: () => void;
  onComplete?: (updatedSettings: StoreSettings, slug: string) => void;
}

const DEFAULT_NATAL_NEIGHBORHOODS: DeliverySetting[] = [
  {
    neighborhood: "Ponta Negra",
    fee: 5.0,
    estimatedMinutes: "25-35 min",
    active: true,
  },
  {
    neighborhood: "Capim Macio",
    fee: 6.0,
    estimatedMinutes: "30-40 min",
    active: true,
  },
  {
    neighborhood: "Neópolis",
    fee: 7.0,
    estimatedMinutes: "30-45 min",
    active: true,
  },
  {
    neighborhood: "Lagoa Nova",
    fee: 9.0,
    estimatedMinutes: "35-50 min",
    active: true,
  },
  {
    neighborhood: "Tirol / Petrópolis",
    fee: 12.0,
    estimatedMinutes: "45-60 min",
    active: true,
  },
  {
    neighborhood: "Zona Norte / Redinha",
    fee: 15.0,
    estimatedMinutes: "50-70 min",
    active: true,
  },
];

function slugifyStoreName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function OnboardingWizardModal({
  isOpen,
  initialSettings,
  onClose,
  onComplete,
}: OnboardingWizardModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Etapa 1: Dados da Loja e Chave Pix
  const [storeName, setStoreName] = useState(
    initialSettings?.storeName || "Brasa & Burger Grill"
  );
  const [slug, setSlug] = useState(
    slugifyStoreName(initialSettings?.storeName || "brasa-burger-grill")
  );
  const [pixKey, setPixKey] = useState(
    initialSettings?.pixKey || "financeiro@a2isolutions.com.br"
  );
  const [phone, setPhone] = useState(
    initialSettings?.phone || "(84) 99876-5432"
  );
  const [address, setAddress] = useState(
    initialSettings?.address ||
      "Av. Eng. Roberto Freire, 2150 - Ponta Negra, Natal/RN"
  );
  const [openingHours, setOpeningHours] = useState(
    initialSettings?.openingHours || "Terça a Domingo das 18h às 23h30"
  );
  const [minOrderValue, setMinOrderValue] = useState<number>(
    initialSettings?.minOrderValue ?? 15
  );
  const [aloPartnerMinOrder, setAloPartnerMinOrder] = useState<number>(
    initialSettings?.aloPartnerMinOrder ?? 35
  );
  const [aloPartnerMaxSubsidy, setAloPartnerMaxSubsidy] = useState<number>(
    initialSettings?.aloPartnerMaxSubsidy ?? 8
  );

  // Etapa 2: Taxas de Entrega por Bairro
  const [neighborhoods, setNeighborhoods] = useState<DeliverySetting[]>(
    initialSettings?.neighborhoods?.length
      ? initialSettings.neighborhoods
      : DEFAULT_NATAL_NEIGHBORHOODS
  );
  const [newNeighborhoodName, setNewNeighborhoodName] = useState("");
  const [newNeighborhoodFee, setNewNeighborhoodFee] = useState("8.00");
  const [newNeighborhoodTime, setNewNeighborhoodTime] = useState("30-45 min");

  // Etapa 3: Persistência no Supabase e Kit de QR Codes / Links
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activatedSuccess, setActivatedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [tableCountForQr, setTableCountForQr] = useState<number>(6);

  if (!isOpen) return null;

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://tanamesa.a2isolutions.com.br";

  const cleanSlug = slugifyStoreName(slug || storeName) || "minha-loja";
  const deliveryUrl = `${baseUrl}/loja/${cleanSlug}`;
  const aloReferralUrl = `${baseUrl}/loja/${cleanSlug}?origem=aloclassificados`;

  const handleAddNeighborhood = () => {
    const trimmed = newNeighborhoodName.trim();
    if (!trimmed) return;
    const parsedFee = Math.max(0, Number(newNeighborhoodFee) || 0);

    setNeighborhoods((prev) => [
      ...prev,
      {
        neighborhood: trimmed,
        fee: parsedFee,
        estimatedMinutes: newNeighborhoodTime.trim() || "30-45 min",
        active: true,
      },
    ]);
    setNewNeighborhoodName("");
    setNewNeighborhoodFee("8.00");
  };

  const handleRemoveNeighborhood = (index: number) => {
    setNeighborhoods((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateNeighborhoodFee = (index: number, feeValue: string) => {
    setNeighborhoods((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? { ...item, fee: Math.max(0, Number(feeValue) || 0) }
          : item
      )
    );
  };

  const handlePersistActivation = async () => {
    setSaving(true);
    setSaveError(null);

    const updatedSettings: StoreSettings = {
      ...(initialSettings || {}),
      storeName: storeName.trim(),
      isOpen: true,
      minOrderValue: Number(minOrderValue) || 15,
      deliveryType: "bairro",
      fixedDeliveryFee: 8,
      pixKey: pixKey.trim(),
      phone: phone.trim(),
      address: address.trim(),
      openingHours: openingHours.trim(),
      aloPartnerMinOrder: Number(aloPartnerMinOrder) || 35,
      aloPartnerMaxSubsidy: Number(aloPartnerMaxSubsidy) || 8,
      neighborhoods,
      coupons: initialSettings?.coupons || [],
    };

    try {
      const activeStoreId = await resolveActiveStoreId();

      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        activeStoreId
      ) {
        const supabase = getSupabaseBrowserClient();

        // 1. Upsert na tabela `stores` vinculado ao `store_id` do lojista logado,
        //    deixando a loja imediatamente aberta (`is_open: true`) e operacional
        const { error: storeUpsertError } = await supabase
          .from("stores")
          .upsert(
            {
              id: activeStoreId,
              slug: cleanSlug,
              store_name: storeName.trim(),
              is_open: true,
              min_order_value: Number(minOrderValue) || 15,
              delivery_type: "bairro",
              pix_key: pixKey.trim(),
              phone: phone.trim(),
              address: address.trim(),
              opening_hours: openingHours.trim(),
              alo_partner_min_order: Number(aloPartnerMinOrder) || 35,
              alo_partner_max_subsidy: Number(aloPartnerMaxSubsidy) || 8,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );

        if (storeUpsertError) {
          throw new Error(storeUpsertError.message);
        }

        // 2. Substituição e Insert em Massa na tabela `store_neighborhoods` vinculado ao `store_id`
        await supabase
          .from("store_neighborhoods")
          .delete()
          .eq("store_id", activeStoreId);

        if (neighborhoods.length > 0) {
          const neighborhoodsPayload = neighborhoods.map((n) => ({
            store_id: activeStoreId,
            neighborhood: n.neighborhood,
            fee: n.fee,
            estimated_minutes: n.estimatedMinutes,
            active: n.active !== false,
          }));

          const { error: neighborhoodsInsertError } = await supabase
            .from("store_neighborhoods")
            .insert(neighborhoodsPayload);

          if (neighborhoodsInsertError) {
            throw new Error(neighborhoodsInsertError.message);
          }
        }
      }

      setActivatedSuccess(true);
      setStep(3);
      if (onComplete) {
        onComplete(updatedSettings, cleanSlug);
      }
    } catch (err: any) {
      setSaveError(
        err?.message ||
          "Não foi possível sincronizar a ativação com o Supabase."
      );
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(label);
    setTimeout(() => setCopiedLink(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8">
        {/* Cabeçalho com Indicador de 3 Etapas */}
        <div className="bg-[#1F2421] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#C83E2B] flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                Assistente de Ativação Express • Tá na Mesa
              </h2>
              <p className="text-xs text-stone-300">
                Coloque seu restaurante no ar com Delivery Próprio e QR Codes em
                3 passos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Progresso das 3 Etapas */}
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-3.5 grid grid-cols-3 gap-2">
          {[
            { num: 1, title: "1. Loja & Chave Pix", icon: Store },
            { num: 2, title: "2. Taxas de Bairros", icon: MapPin },
            { num: 3, title: "3. Link & QR Codes", icon: QrCode },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = step === item.num;
            const isDone = step > item.num || activatedSuccess;
            return (
              <div
                key={item.num}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#C83E2B] text-white shadow-xs"
                    : isDone
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-white text-stone-400 border border-stone-200"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.title}</span>
              </div>
            );
          })}
        </div>

        {/* Corpo do Wizard */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {saveError && (
            <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
              ⚠️ {saveError}
            </div>
          )}

          {/* ETAPA 1: CONFIGURAÇÕES DA LOJA E CHAVE PIX */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
                    Nome do Restaurante *
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => {
                      setStoreName(e.target.value);
                      setSlug(slugifyStoreName(e.target.value));
                    }}
                    placeholder="Ex: Brasa & Burger Grill"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#C83E2B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
                    Slug da URL Exclusiva (/loja/...) *
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(slugifyStoreName(e.target.value))}
                    placeholder="brasa-burger-grill"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm font-mono font-bold text-[#C83E2B] focus:outline-none focus:ring-2 focus:ring-[#C83E2B]"
                  />
                  <span className="text-[11px] text-stone-400">
                    URL final: {baseUrl}/loja/{cleanSlug}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-950 font-black text-xs uppercase tracking-wider">
                  <KeyRound className="w-4 h-4 text-emerald-700" />
                  <span>
                    Chave Pix Oficial (Geração de QR Code Dinâmico EMV® BACEN)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                      Chave Pix da Loja (CNPJ, CPF, E-mail ou Celular) *
                    </label>
                    <input
                      type="text"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="pix@seurestaurante.com.br"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-white text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                      WhatsApp de Atendimento / Pedidos *
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(84) 99999-9999"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-white text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
                    Endereço Físico da Loja
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
                    Horário de Funcionamento
                  </label>
                  <input
                    type="text"
                    value={openingHours}
                    onChange={(e) => setOpeningHours(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Pedido Mínimo Geral (R$)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-sm font-bold"
                  />
                </div>
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">
                    Mínimo Cupom Alô (R$)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={aloPartnerMinOrder}
                    onChange={(e) =>
                      setAloPartnerMinOrder(Number(e.target.value))
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-sm font-bold"
                  />
                </div>
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">
                    Teto Subsídio Frete (R$)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={aloPartnerMaxSubsidy}
                    onChange={(e) =>
                      setAloPartnerMaxSubsidy(Number(e.target.value))
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-sm font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 2: CADASTRO DAS TAXAS DE BAIRROS */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <p className="text-xs font-bold uppercase text-stone-700 mb-2.5">
                  Adicionar Novo Bairro de Entrega
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={newNeighborhoodName}
                    onChange={(e) => setNewNeighborhoodName(e.target.value)}
                    placeholder="Nome do Bairro (ex: Candelária)"
                    className="sm:col-span-5 px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold"
                  />
                  <input
                    type="number"
                    step="0.50"
                    value={newNeighborhoodFee}
                    onChange={(e) => setNewNeighborhoodFee(e.target.value)}
                    placeholder="Taxa R$"
                    className="sm:col-span-3 px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={newNeighborhoodTime}
                    onChange={(e) => setNewNeighborhoodTime(e.target.value)}
                    placeholder="30-45 min"
                    className="sm:col-span-2 px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddNeighborhood}
                    className="sm:col-span-2 py-2 px-3 rounded-xl bg-[#1F2421] hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Incluir</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {neighborhoods.map((item, idx) => (
                  <div
                    key={`${item.neighborhood}-${idx}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-stone-200 hover:border-stone-300"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <MapPin className="w-4 h-4 text-[#C83E2B] shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {item.neighborhood}
                        </p>
                        <p className="text-[10px] text-stone-500">
                          Prazo estimado: {item.estimatedMinutes}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-500">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.50"
                        value={item.fee}
                        onChange={(e) =>
                          handleUpdateNeighborhoodFee(idx, e.target.value)
                        }
                        className="w-20 px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs font-black text-stone-900 text-right"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveNeighborhood(idx)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ETAPA 3: LINK DO DELIVERY E DOWNLOAD DOS QR CODES DE MESA */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-black text-emerald-950">
                    Loja Ativada e Sincronizada com Sucesso!
                  </h3>
                  <p className="text-xs text-emerald-800">
                    Seu estabelecimento já está aberto (`is_open = true`) com{" "}
                    {neighborhoods.length} bairros configurados.
                  </p>
                </div>
              </div>

              {/* Links Oficiais de Venda */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                    Link Oficial do Delivery Próprio (Bio do Instagram / WhatsApp)
                  </span>
                  <div className="text-xs font-mono font-bold text-stone-900 truncate bg-white p-2 rounded-lg border border-stone-200">
                    {deliveryUrl}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(deliveryUrl, "delivery")}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#1F2421] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedLink === "delivery" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Link Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>
                    <a
                      href={`/loja/${cleanSlug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FDF2F0] border border-[#FADCD7] space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#C83E2B]">
                    Link Exclusivo Campanha Alô Classificados
                  </span>
                  <div className="text-xs font-mono font-bold text-stone-900 truncate bg-white p-2 rounded-lg border border-[#FADCD7]">
                    {aloReferralUrl}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(aloReferralUrl, "alo")}
                    className="w-full py-2 px-3 rounded-xl bg-[#C83E2B] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink === "alo" ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Link Alô Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Link com Benefício Alô</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Gerador e Download de QR Codes de Mesa */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-black uppercase text-stone-700">
                      QR Codes de Autoatendimento das Mesas
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Cada QR Code abre diretamente a comanda da respectiva mesa
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-stone-600">
                      Qtd. Mesas:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={tableCountForQr}
                      onChange={(e) =>
                        setTableCountForQr(
                          Math.min(30, Math.max(1, Number(e.target.value) || 6))
                        )
                      }
                      className="w-16 px-2 py-1 rounded-lg border border-stone-300 text-xs font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="py-1.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir Todos</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from({ length: tableCountForQr }, (_, idx) => {
                    const tableNum = idx + 1;
                    const tableUrl = `${baseUrl}/loja/${cleanSlug}?mesa=${tableNum}`;
                    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(
                      tableUrl
                    )}`;

                    return (
                      <div
                        key={tableNum}
                        className="p-3 rounded-2xl border border-stone-200 bg-white flex flex-col items-center text-center space-y-2 shadow-2xs"
                      >
                        <span className="text-xs font-black text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded-full">
                          MESA {String(tableNum).padStart(2, "0")}
                        </span>
                        <img
                          src={qrSrc}
                          alt={`QR Code Mesa ${tableNum}`}
                          className="w-28 h-28 rounded-lg border border-stone-100"
                        />
                        <a
                          href={qrSrc}
                          download={`qrcode-${cleanSlug}-mesa-${tableNum}.png`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-1.5 px-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-bold flex items-center justify-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Baixar PNG</span>
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé de Navegação das Etapas */}
        <div className="bg-stone-50 border-t border-stone-200 px-6 py-4 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev === 3 ? 2 : 1))}
              className="py-2.5 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar Etapa</span>
            </button>
          ) : (
            <div />
          )}

          {step === 1 && (
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!storeName.trim() || !pixKey.trim()}
              className="py-2.5 px-5 rounded-xl bg-[#C83E2B] hover:bg-[#b03524] disabled:bg-stone-300 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>Próximo: Taxas de Bairros</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={handlePersistActivation}
              disabled={saving || neighborhoods.length === 0}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Ativando Loja no Supabase...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ativar Loja e Gerar QR Codes</span>
                </>
              )}
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-6 rounded-xl bg-[#1F2421] hover:bg-stone-800 text-white font-bold text-xs cursor-pointer"
            >
              Concluir e Ir para o PDV
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
