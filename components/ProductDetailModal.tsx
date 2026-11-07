"use client";

import React, { useState, useEffect } from "react";
import { ProductItem } from "../lib/types";
import {
  X,
  Plus,
  Minus,
  Check,
  ChefHat,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ExtraItem {
  id: string;
  name: string;
  price: number;
}

interface ProductDetailModalProps {
  product: ProductItem;
  targetCustomerName?: string;
  onClose: () => void;
  onConfirm: (
    product: ProductItem,
    quantity: number,
    selectedSubstitution?: string,
    removals?: string[],
    notes?: string,
    unitPriceWithExtras?: number,
    extrasDetails?: string[]
  ) => void;
}

interface StandardIngredient {
  id: string;
  name: string;
  cleanName: string;
  icon: string;
}

export function ProductDetailModal({
  product,
  targetCustomerName,
  onClose,
  onConfirm,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSubstitution, setSelectedSubstitution] = useState<string>("padrao");
  const [extraCounts, setExtraCounts] = useState<{ [id: string]: number }>({});
  const [customNote, setCustomNote] = useState<string>("");
  const [isIngredientsAccordionOpen, setIsIngredientsAccordionOpen] = useState(true);

  const isHotDog = product.category === "hotdogs";
  const isBurger = product.category === "burgers";
  const isPastel = product.category === "pasteis";
  const isPizza = product.category === "pizzas";
  const isTapioca = product.category === "tapiocas";
  const isPorcao = product.category === "porcoes";
  const isBebida = product.category === "bebidas";
  const isCombo = product.category === "combos";

  // Lista de ingredientes da receita oficial do produto
  const defaultIngredients: StandardIngredient[] = isBurger
    ? [
        { id: "carne", name: "Carne Smash 80g na Chapa", cleanName: "Carne Smash", icon: "🥩" },
        { id: "cheddar", name: "Queijo Cheddar Derretido", cleanName: "Cheddar", icon: "🧀" },
        { id: "cebola", name: "Cebola Roxa Fatiada", cleanName: "Cebola", icon: "🧅" },
        { id: "picles", name: "Picles Agridoce Crocante", cleanName: "Picles", icon: "🥒" },
        { id: "alface", name: "Alface Americana Fresca", cleanName: "Alface", icon: "🥬" },
        { id: "tomate", name: "Tomate Caipira Fresco", cleanName: "Tomate", icon: "🍅" },
        { id: "molho", name: "Molho Especial da Casa", cleanName: "Molho Especial", icon: "🥫" },
        { id: "maionese", name: "Maionese Artesanal", cleanName: "Maionese", icon: "🥣" },
      ]
    : isHotDog
    ? [
        { id: "salsicha", name: "Salsicha Perdigão", cleanName: "Salsicha", icon: "🌭" },
        { id: "carne_moida", name: "Carne Moída Temperada", cleanName: "Carne Moída", icon: "🥩" },
        { id: "frango", name: "Frango Desfiado", cleanName: "Frango", icon: "🍗" },
        { id: "cheddar", name: "Cheddar Cremoso", cleanName: "Cheddar", icon: "🧀" },
        { id: "catupiry", name: "Catupiry Original", cleanName: "Catupiry", icon: "🥛" },
        { id: "milho", name: "Milho Verde Suave", cleanName: "Milho", icon: "🌽" },
        { id: "ervilha", name: "Ervilha Fresca", cleanName: "Ervilha", icon: "🟢" },
        { id: "vinagrete", name: "Vinagrete Fresco", cleanName: "Vinagrete", icon: "🥗" },
        { id: "batata_palha", name: "Batata Palha Crocante", cleanName: "Batata Palha", icon: "🍟" },
      ]
    : isPastel
    ? [
        { id: "recheio", name: "Recheio Selecionado do Pastel", cleanName: "Recheio Base", icon: "🥟" },
        { id: "mussarela", name: "Queijo Mussarela Derretido", cleanName: "Mussarela", icon: "🧀" },
        { id: "catupiry", name: "Catupiry Cremoso", cleanName: "Catupiry", icon: "🥛" },
        { id: "oregano", name: "Orégano Fresco", cleanName: "Orégano", icon: "🌿" },
        { id: "azeitona", name: "Azeitonas Fatiadas", cleanName: "Azeitona", icon: "🫒" },
      ]
    : isTapioca
    ? [
        { id: "goma", name: "Goma de Mandioca Peneirada", cleanName: "Goma", icon: "🥞" },
        { id: "manteiga", name: "Manteiga da Terra Potiguar", cleanName: "Manteiga da Terra", icon: "🧈" },
        { id: "coalho", name: "Queijo Coalho Tostadinho", cleanName: "Queijo Coalho", icon: "🧀" },
        { id: "recheio", name: "Recheio Principal", cleanName: "Recheio", icon: "🍖" },
      ]
    : isPizza
    ? [
        { id: "massa", name: "Massa Artesanal", cleanName: "Massa", icon: "🍕" },
        { id: "molho", name: "Molho de Tomate Pelado", cleanName: "Molho de Tomate", icon: "🍅" },
        { id: "mussarela", name: "Queijo Mussarela", cleanName: "Mussarela", icon: "🧀" },
        { id: "cebola", name: "Cebola Fatiada", cleanName: "Cebola", icon: "🧅" },
        { id: "oregano", name: "Orégano", cleanName: "Orégano", icon: "🌿" },
        { id: "azeitona", name: "Azeitonas Pretas", cleanName: "Azeitona", icon: "🫒" },
      ]
    : isBebida
    ? [
        { id: "gelo", name: "Gelo em Cubos", cleanName: "Gelo", icon: "🧊" },
        { id: "limao", name: "Rodela de Limão", cleanName: "Limão", icon: "🍋" },
        { id: "acucar", name: "Açúcar / Adoçante", cleanName: "Açúcar", icon: "🍬" },
      ]
    : isPorcao
    ? [
        { id: "batata", name: "Batata Frita Crocante", cleanName: "Batata", icon: "🍟" },
        { id: "sal", name: "Sal Fino", cleanName: "Sal", icon: "🧂" },
        { id: "molho", name: "Molho Especial", cleanName: "Molho", icon: "🥫" },
      ]
    : isCombo
    ? [
        { id: "cebola", name: "Cebola Roxa nos Lanches", cleanName: "Cebola", icon: "🧅" },
        { id: "picles", name: "Picles nos Burgers", cleanName: "Picles", icon: "🥒" },
        { id: "molho", name: "Molho nos Sanduíches", cleanName: "Molho", icon: "🥫" },
      ]
    : [];

  // Mapeamento de contadores dos ingredientes: padrão = 1 (incluído no lanche)
  // Se o usuário apertar (-) ou zerar, fica 0 (Sem o ingrediente)
  const [ingredientCounts, setIngredientCounts] = useState<{ [id: string]: number }>(() => {
    const initial: { [id: string]: number } = {};
    defaultIngredients.forEach((ing) => {
      initial[ing.id] = 1;
    });
    return initial;
  });

  // Atualiza contador de ingrediente padrão
  const setIngredientQty = (id: string, qty: number) => {
    setIngredientCounts((prev) => ({
      ...prev,
      [id]: Math.max(0, Math.min(2, qty)),
    }));
  };

  // 2. Adicionais com Preço e Contador [+] / [-]
  const availableExtras: ExtraItem[] = isHotDog
    ? [
        { id: "bacon", name: "Bacon Crocante em Cubos", price: 4.0 },
        { id: "cheddar", name: "Cheddar Cremoso Extra", price: 3.5 },
        { id: "catupiry", name: "Catupiry Original Extra", price: 3.5 },
        { id: "salsicha", name: "Salsicha Perdigão Adicional", price: 2.5 },
        { id: "batata_palha", name: "Batata Palha Extra", price: 2.0 },
        { id: "queijo_coalho", name: "Queijo Coalho Tostado", price: 4.0 },
      ]
    : isBurger
    ? [
        { id: "smash", name: "Hambúrguer Smash 80g Extra", price: 6.0 },
        { id: "bacon", name: "Fatias de Bacon Crocante", price: 4.5 },
        { id: "cheddar", name: "Cheddar Cremoso Extra", price: 3.5 },
        { id: "ovo", name: "Ovo Frito na Chapa", price: 2.5 },
        { id: "maionese_alho", name: "Maionese de Alho Artesanal", price: 3.0 },
      ]
    : isPastel
    ? [
        { id: "cream_cheese", name: "Cream Cheese Extra", price: 4.5 },
        { id: "queijo_coalho", name: "Queijo Coalho em Cubos", price: 4.0 },
        { id: "catupiry", name: "Catupiry Original Extra", price: 3.5 },
        { id: "bacon", name: "Bacon em Cubos", price: 3.5 },
      ]
    : isPizza
    ? [
        { id: "borda_catupiry", name: "Borda Recheada de Catupiry", price: 6.0 },
        { id: "borda_cheddar", name: "Borda Recheada de Cheddar", price: 6.0 },
        { id: "bacon", name: "Bacon Extra", price: 4.5 },
        { id: "mussarela", name: "Mussarela Extra", price: 4.0 },
      ]
    : isTapioca
    ? [
        { id: "nata", name: "Nata Potiguar Extra", price: 4.0 },
        { id: "coalho", name: "Queijo Coalho na Chapa", price: 4.0 },
        { id: "leite_condensado", name: "Leite Condensado Extra", price: 2.5 },
      ]
    : isPorcao
    ? [
        { id: "cheddar_bacon", name: "Cobertura Cheddar & Bacon", price: 6.0 },
        { id: "molho_barbecue", name: "Potinho Molho Barbecue (50ml)", price: 3.0 },
        { id: "maionese_casa", name: "Potinho Maionese Especial (50ml)", price: 3.0 },
      ]
    : [];

  // 3. Substituições Inteligentes (R$ 0,00)
  const substitutions = isPastel
    ? [
        { id: "padrao", label: "Receita Padrão da Casa", description: "Seguir receita original" },
        { id: "cream_cheese", label: "🔄 Trocar Catupiry por Cream Cheese", description: "Substituição sem custo (economia compensa insumo)" },
        { id: "coalho_mussarela", label: "🔄 Misturar Mussarela com Queijo Coalho", description: "Metade liga de mussarela, metade sabor de coalho" },
      ]
    : isHotDog || isBurger
    ? [
        { id: "padrao", label: "Receita Padrão da Casa", description: "Pão e molhos originais" },
        { id: "trocar_molho", label: "🔄 Trocar Molho Especial por Maionese de Alho", description: "Sem custo adicional" },
        { id: "pao_prensadinho", label: "🔄 Pão Super Prensado na Manteiga", description: "Mais fininho e tostado" },
      ]
    : [{ id: "padrao", label: "Padrão da Casa", description: "Receita original" }];

  const updateExtraCount = (id: string, delta: number) => {
    const current = extraCounts[id] || 0;
    const next = Math.max(0, current + delta);
    setExtraCounts({ ...extraCounts, [id]: next });
  };

  // Ingredientes zerados (Remoções que viram "SEM ...")
  const activeRemovals: string[] = defaultIngredients
    .filter((ing) => (ingredientCounts[ing.id] ?? 1) === 0)
    .map((ing) => `Sem ${ing.cleanName}`);

  // Ingredientes duplicados (ex: 2x Carne)
  const activeDoubles: string[] = defaultIngredients
    .filter((ing) => (ingredientCounts[ing.id] ?? 1) > 1)
    .map((ing) => `+ 1x ${ing.cleanName} Adicional`);

  // Cálculo de Preço Total
  const extrasTotalPerUnit = availableExtras.reduce((sum, extra) => {
    const qty = extraCounts[extra.id] || 0;
    return sum + extra.price * qty;
  }, 0);

  const unitPrice = product.price + extrasTotalPerUnit;
  const grandTotal = unitPrice * quantity;

  const handleConfirm = () => {
    const subLabel =
      selectedSubstitution !== "padrao"
        ? substitutions.find((s) => s.id === selectedSubstitution)?.label
        : undefined;

    const extrasDetails: string[] = [...activeDoubles];
    Object.entries(extraCounts).forEach(([id, count]) => {
      if (count > 0) {
        const extra = availableExtras.find((e) => e.id === id);
        if (extra) {
          extrasDetails.push(`+ ${count}x ${extra.name} (+ R$ ${(extra.price * count).toFixed(2)})`);
        }
      }
    });

    onConfirm(
      product,
      quantity,
      subLabel,
      activeRemovals,
      customNote.trim(),
      unitPrice,
      extrasDetails
    );
  };

  const hasSpecial = activeRemovals.length > 0 || customNote.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col border border-[#EFE9DF] shadow-2xl relative my-auto animate-in zoom-in-95">
        {/* Cabeçalho Fixo do Modal */}
        <div className="p-4 sm:p-5 border-b border-[#EFE9DF] flex items-start gap-3.5 relative bg-white rounded-t-3xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 p-2 rounded-full hover:bg-neutral-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-[#FDFBF7] border border-[#EFE9DF] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xs">
            {product.image && (product.image.startsWith("http") || product.image.startsWith("/")) ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl">{product.image}</span>
            )}
          </div>
          <div className="pr-6">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-[#1F2421]">{product.name}</h3>
              {targetCustomerName && (
                <span className="text-[10px] font-black bg-[#FEF6EC] text-[#D97706] border border-[#FBD9B0] px-2 py-0.5 rounded-full">
                  👤 {targetCustomerName}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 line-clamp-2 mt-0.5 leading-relaxed">
              {product.description}
            </p>
            <p className="text-sm font-black text-[#C83E2B] mt-1">
              R$ {product.price.toFixed(2)} base
            </p>
          </div>
        </div>

        {/* Corpo Rolável com as Seções de Personalização */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* SEÇÃO 1: PERSONALIZAR INGREDIENTES DA RECEITA */}
          {defaultIngredients.length > 0 && (
            <div className="bg-[#FDFBF7] rounded-2xl border border-[#EFE9DF] overflow-hidden">
              {/* Botão com Setinha para Expandir / Recolher os Ingredientes */}
              <button
                type="button"
                onClick={() => setIsIngredientsAccordionOpen(!isIngredientsAccordionOpen)}
                className="w-full p-3.5 flex items-center justify-between bg-white border-b border-[#EFE9DF] hover:bg-neutral-50 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-[#BD4D2D]" />
                  <div>
                    <h4 className="font-black text-[#231F1C] uppercase tracking-wider text-xs">
                      Ingredientes da Receita
                    </h4>
                    <p className="text-[10px] text-neutral-500 mt-0.2">
                      Toque em (-) para retirar o que não deseja
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeRemovals.length > 0 && (
                    <span className="text-[10px] font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                      {activeRemovals.length} retirado(s)
                    </span>
                  )}
                  {isIngredientsAccordionOpen ? (
                    <ChevronUp className="w-4 h-4 text-neutral-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                  )}
                </div>
              </button>

              {/* Lista dos Ingredientes com Contadores (+) e (-) */}
              {isIngredientsAccordionOpen && (
                <div className="p-3 space-y-2">
                  {defaultIngredients.map((ing) => {
                    const count = ingredientCounts[ing.id] ?? 1;
                    const isRemoved = count === 0;

                    return (
                      <div
                        key={ing.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                          isRemoved
                            ? "bg-rose-50/70 border-rose-300"
                            : "bg-white border-[#EFE9DF]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{ing.icon}</span>
                          <div>
                            <p
                              className={`font-bold text-xs ${
                                isRemoved
                                  ? "text-rose-700 line-through"
                                  : "text-neutral-800"
                              }`}
                            >
                              {ing.name}
                            </p>
                            <span
                              className={`text-[10px] font-bold ${
                                isRemoved
                                  ? "text-rose-600 uppercase"
                                  : "text-emerald-700"
                              }`}
                            >
                              {isRemoved
                                ? `❌ RETIRADO (SEM ${ing.cleanName.toUpperCase()})`
                                : "✓ Incluído no lanche (Padrão)"}
                            </span>
                          </div>
                        </div>

                        {/* Controles Estilo Totem BK: (-) para zerar / retirar, (+) para restaurar */}
                        <div className="flex items-center gap-1.5">
                          {isRemoved ? (
                            <button
                              type="button"
                              onClick={() => setIngredientQty(ing.id, 1)}
                              className="px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 font-extrabold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Restaurar</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setIngredientQty(ing.id, 0)}
                              className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-rose-50 hover:text-rose-700 text-neutral-600 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Minus className="w-3 h-3 text-rose-500" />
                              <span>Retirar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PREVIEW DO CUPOM / KDS DA COZINHA (Identificação para marcação à caneta) */}
          <div
            className={`p-3.5 rounded-2xl border-2 transition-all ${
              hasSpecial
                ? "bg-amber-50 border-amber-400 text-amber-950 shadow-xs"
                : "bg-neutral-50 border-neutral-200 text-neutral-600"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle
                className={`w-4 h-4 flex-shrink-0 ${
                  hasSpecial ? "text-amber-600 animate-bounce" : "text-neutral-400"
                }`}
              />
              <span className="text-[10px] font-black uppercase tracking-wider">
                Como sairá no Ticket da Cozinha & Chapa (KDS):
              </span>
            </div>

            <p className="text-xs font-black leading-snug">
              {hasSpecial ? (
                <span>
                  {activeRemovals.length > 0 && (
                    <span className="text-amber-900 bg-amber-200/80 px-1.5 py-0.5 rounded-md mr-1 font-black">
                      ⚠️ ESPECIAL: {activeRemovals.join(", ").toUpperCase()}
                    </span>
                  )}
                  {customNote.trim() && (
                    <span className="text-amber-800">
                      • Obs: &quot;{customNote.trim()}&quot;
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-neutral-500 font-semibold">
                  Receita Padrão Completa (sem restrições)
                </span>
              )}
            </p>
            <p className="text-[10px] text-neutral-500 mt-1">
              * O chapeiro e garçom recebem este destaque para marcar à caneta na embalagem do lanche.
            </p>
          </div>

          {/* SEÇÃO 2: ADICIONAIS EXTRAS (+) / (-) */}
          {availableExtras.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                  <h4 className="font-black text-[#1F2421] uppercase tracking-wider text-xs">
                    Turbinar com Adicionais (Opcional):
                  </h4>
                </div>
                <span className="text-[10px] text-neutral-400 font-semibold">Opcional</span>
              </div>

              <div className="space-y-2 bg-[#FDFBF7] p-3 rounded-2xl border border-[#EFE9DF]">
                {availableExtras.map((extra) => {
                  const count = extraCounts[extra.id] || 0;
                  return (
                    <div
                      key={extra.id}
                      className="flex items-center justify-between py-1.5 border-b border-neutral-100 last:border-0"
                    >
                      <div>
                        <p className="font-bold text-neutral-800">{extra.name}</p>
                        <p className="text-[11px] text-[#C83E2B] font-extrabold">
                          + R$ {extra.price.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {count > 0 && (
                          <button
                            type="button"
                            onClick={() => updateExtraCount(extra.id, -1)}
                            className="w-7 h-7 rounded-xl bg-white border border-[#EFE9DF] text-neutral-700 font-bold flex items-center justify-center hover:bg-neutral-100 active:scale-95 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        )}
                        {count > 0 && (
                          <span className="w-5 text-center font-black text-sm text-[#1F2421]">
                            {count}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => updateExtraCount(extra.id, 1)}
                          className={`h-7 px-2.5 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                            count > 0
                              ? "bg-[#C83E2B] text-white"
                              : "bg-white border border-[#EFE9DF] text-neutral-700 hover:border-[#C83E2B] hover:text-[#C83E2B]"
                          }`}
                        >
                          <Plus className="w-3 h-3" />
                          <span className="text-[11px]">{count > 0 ? "Mais" : "Adicionar"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SEÇÃO 3: SUBSTITUIÇÕES INTELIGENTES (R$ 0,00) */}
          {substitutions.length > 1 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <h4 className="font-black text-[#1F2421] uppercase tracking-wider text-xs">
                  Substituição Inteligente:
                </h4>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.2 rounded-full border border-blue-200">
                  R$ 0,00
                </span>
              </div>

              <div className="space-y-2">
                {substitutions.map((sub) => {
                  const isSelected = selectedSubstitution === sub.id;
                  return (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedSubstitution(sub.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-[#FEF6EC] border-[#FBD9B0] shadow-xs"
                          : "bg-white border-[#EFE9DF] hover:bg-neutral-50"
                      }`}
                    >
                      <div>
                        <p className={`font-bold ${isSelected ? "text-[#D97706]" : "text-neutral-800"}`}>
                          {sub.label}
                        </p>
                        {sub.description && (
                          <p className="text-[11px] text-neutral-500 mt-0.5">{sub.description}</p>
                        )}
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ml-2 ${
                          isSelected ? "border-[#C83E2B] bg-[#C83E2B] text-white" : "border-neutral-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SEÇÃO 4: OBSERVAÇÃO LIVRE ESCRITA */}
          <div>
            <label className="font-bold text-neutral-700 block mb-1">
              ✍️ Observação livre para a cozinha (opcional):
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Ex: carne bem passada, sem gelo, cortar ao meio..."
              className="w-full text-xs p-3 rounded-2xl border border-[#EFE9DF] bg-[#FDFBF7] outline-none focus:border-[#C83E2B] focus:ring-1 focus:ring-[#C83E2B]"
            />
          </div>
        </div>

        {/* Rodapé Fixo com Quantidade e Total Calculado em Tempo Real */}
        <div className="p-4 border-t border-[#EFE9DF] bg-[#FDFBF7] rounded-b-3xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 border border-[#EFE9DF] rounded-2xl p-1 bg-white">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-700 font-bold flex items-center justify-center hover:bg-neutral-200 cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-5 text-center font-black text-sm text-[#1F2421]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-xl bg-[#C83E2B] text-white font-bold flex items-center justify-center hover:bg-[#B03221] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 bg-[#C83E2B] hover:bg-[#B03221] text-white font-black text-xs py-3.5 rounded-2xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>
              {targetCustomerName ? `Lançar para ${targetCustomerName}` : "Confirmar e Lançar"}
            </span>
            <span>•</span>
            <span className="text-sm font-black">R$ {grandTotal.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
