"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Search,
  Star,
  Clock,
  Sparkles,
  ChevronRight,
  Flame,
  Utensils,
  Pizza,
  Fish,
  Beer,
  Tag,
  CheckCircle2,
  SlidersHorizontal,
  ArrowRight,
  Receipt,
  Compass,
} from "lucide-react";
import { Logo } from "./Logo";

export interface RestaurantCardData {
  id: string;
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  rating: number;
  reviewsCount: number;
  distance: string;
  deliveryTime: string;
  deliveryFee: number;
  coverImage: string;
  logoUrl: string;
  address: string;
  isOpen: boolean;
  featuredBadge?: string;
  highlightTag?: string;
}

export const NETWORK_RESTAURANTS: RestaurantCardData[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    slug: "brasa-burger-grill",
    name: "Brasa & Burger Grill",
    category: "Burgers & Grelhados",
    categorySlug: "burgers",
    rating: 4.9,
    reviewsCount: 384,
    distance: "1.2 km",
    deliveryTime: "25-35 min",
    deliveryFee: 6.5,
    coverImage:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80",
    logoUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80",
    address: "Av. Eng. Roberto Freire, 2150 - Ponta Negra, Natal/RN",
    isOpen: true,
    featuredBadge: "Loja Piloto Oficial",
    highlightTag: "Comanda Digital Ativa",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    slug: "cantina-da-nona",
    name: "Cantina da Nona",
    category: "Italiana & Pizzas",
    categorySlug: "pizzas",
    rating: 4.8,
    reviewsCount: 215,
    distance: "2.5 km",
    deliveryTime: "30-40 min",
    deliveryFee: 7.5,
    coverImage:
      "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=800&auto=format&fit=crop&q=80",
    logoUrl:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80",
    address: "Rua das Flores, 450 - Tirol, Natal/RN",
    isOpen: true,
    featuredBadge: "Forno a Lenha",
    highlightTag: "Massas Artesanais",
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    slug: "sushi-master",
    name: "Sushi Master",
    category: "Japonesa & Sushi",
    categorySlug: "japonesa",
    rating: 4.9,
    reviewsCount: 420,
    distance: "1.8 km",
    deliveryTime: "20-30 min",
    deliveryFee: 8.0,
    coverImage:
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=80",
    logoUrl:
      "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=200&auto=format&fit=crop&q=80",
    address: "Av. Afonso Pena, 890 - Petrópolis, Natal/RN",
    isOpen: true,
    featuredBadge: "Peixes Nobres",
    highlightTag: "Salmão Maçaricado",
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    slug: "boteco-do-ze",
    name: "Boteco do Zé",
    category: "Brasileira & Petiscos",
    categorySlug: "brasileira",
    rating: 4.7,
    reviewsCount: 189,
    distance: "800 m",
    deliveryTime: "15-25 min",
    deliveryFee: 5.0,
    coverImage:
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80",
    logoUrl:
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=200&auto=format&fit=crop&q=80",
    address: "Praça Cívica, 12 - Centro, Natal/RN",
    isOpen: true,
    featuredBadge: "Chopp Trincando",
    highlightTag: "Torresmo de Rolo",
  },
];

const CATEGORIES_FILTERS = [
  { id: "todos", label: "Todos", icon: Sparkles },
  { id: "burgers", label: "Burgers", icon: Flame },
  { id: "pizzas", label: "Pizzas & Massas", icon: Pizza },
  { id: "japonesa", label: "Japonês", icon: Fish },
  { id: "brasileira", label: "Brasileira", icon: Beer },
  { id: "proximos", label: "Mais Próximos", icon: MapPin },
];

export function RestaurantDiscoveryView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [userCity, setUserCity] = useState("Natal, RN • Ponta Negra");

  const filteredRestaurants = NETWORK_RESTAURANTS.filter((rest) => {
    // Filtro por texto
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = rest.name.toLowerCase().includes(q);
      const matchCat = rest.category.toLowerCase().includes(q);
      const matchTag = rest.highlightTag?.toLowerCase().includes(q);
      if (!matchName && !matchCat && !matchTag) return false;
    }

    // Filtro por categoria
    if (selectedCategory === "todos") return true;
    if (selectedCategory === "proximos") return rest.distance.includes("m") || rest.distance.startsWith("1.");
    return rest.categorySlug === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-[#F8F5F5] font-sans pb-28 text-neutral-800">
      {/* Header Sticky com Localização & Notificações (conforme Stitch explorar_restaurantes) */}
      <div className="sticky top-0 z-30 bg-[#F8F5F5]/95 backdrop-blur-md border-b border-[#EBE4DC]">
        <div className="max-w-3xl mx-auto px-4 pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-full bg-red-100 text-[#CA000A] flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-[#CA000A]" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Localização Atual
              </p>
              <h1 className="text-sm sm:text-base font-black text-[#1F2421] leading-tight">
                {userCity}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/loja/brasa-burger-grill"
              className="px-3 py-1.5 rounded-xl bg-white border border-[#E7DCD0] text-xs font-black text-[#CA000A] hover:bg-red-50 transition-colors shadow-2xs"
            >
              Loja Piloto
            </Link>
          </div>
        </div>

        {/* Barra de Busca de Restaurantes e Culinárias */}
        <div className="max-w-3xl mx-auto px-4 pb-3">
          <div className="flex items-center bg-white rounded-2xl border border-[#E7DCD0] shadow-xs px-3.5 py-2.5 gap-2.5 focus-within:border-[#CA000A] focus-within:ring-2 focus-within:ring-red-100 transition-all">
            <Search className="w-5 h-5 text-neutral-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por restaurante, hambúrguer, pizza, sushi..."
              className="w-full text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none bg-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-xs font-bold text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Carrossel de Categorias / Chips de Filtro */}
        <div className="max-w-3xl mx-auto px-4 pb-3 overflow-x-auto scrollbar-none flex gap-2">
          {CATEGORIES_FILTERS.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-extrabold flex-shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#CA000A] text-white shadow-xs"
                    : "bg-white text-neutral-700 border border-[#E7DCD0] hover:bg-neutral-100"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-neutral-500"}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Banner de Destaque da Rede */}
      <div className="max-w-3xl mx-auto px-4 pt-4 pb-2">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#230F10] to-[#541215] text-white p-5 shadow-lg border border-red-950">
          <div className="relative z-10 max-w-sm">
            <div className="inline-flex items-center gap-1 bg-red-500/20 text-red-200 border border-red-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3 text-red-400" />
              <span>Rede Tá na Mesa</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black leading-tight text-white mb-1">
              Faça pedidos na mesa ou em casa com comanda digital
            </h2>
            <p className="text-xs text-red-100/90 font-medium mb-3">
              Divisão de conta instantânea por Pix, KDS integrado e rastreamento em tempo real.
            </p>
            <Link
              href="/loja/brasa-burger-grill?mode=mesa&mesa=1"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#CA000A] hover:bg-[#b00009] text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
            >
              <span>Abrir Mesa no Brasa Burger</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-15 pointer-events-none">
            <Utensils className="w-48 h-48 text-white" />
          </div>
        </div>
      </div>

      {/* Lista de Restaurantes da Rede */}
      <div className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#1F2421]">
            Restaurantes Disponíveis ({filteredRestaurants.length})
          </h2>
          <span className="text-xs font-semibold text-neutral-500">
            Abertos agora para pedidos
          </span>
        </div>

        {filteredRestaurants.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#E7DCD0] p-6">
            <Utensils className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-neutral-700">
              Nenhum restaurante encontrado para &ldquo;{searchQuery}&rdquo;
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              Tente buscar por outro termo ou selecione a categoria &ldquo;Todos&rdquo;.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="bg-white rounded-2xl overflow-hidden border border-[#E7DCD0] shadow-2xs hover:shadow-md transition-all duration-200 group"
              >
                {/* Imagem de Capa do Restaurante */}
                <div className="relative h-40 w-full overflow-hidden bg-neutral-200">
                  <img
                    src={restaurant.coverImage}
                    alt={restaurant.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                  {/* Badges de Destaque */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    {restaurant.featuredBadge && (
                      <span className="bg-[#CA000A] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
                        {restaurant.featuredBadge}
                      </span>
                    )}
                    {restaurant.highlightTag && (
                      <span className="bg-white/90 backdrop-blur-xs text-neutral-800 text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                        {restaurant.highlightTag}
                      </span>
                    )}
                  </div>

                  {/* Logo circular sobreposto (conforme Stitch explorar_restaurantes) */}
                  <div className="absolute -bottom-5 left-4 size-16 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                    <img
                      src={restaurant.logoUrl}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Conteúdo do Card */}
                <div className="p-4 pt-7">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-extrabold text-[#1F2421] group-hover:text-[#CA000A] transition-colors">
                        {restaurant.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500 font-medium">
                        <span>{restaurant.category}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1 text-[#CA000A] font-bold">
                          <Star className="w-3.5 h-3.5 fill-[#CA000A]" />
                          <span>{restaurant.rating.toFixed(1)}</span>
                          <span className="text-neutral-400 font-normal">
                            ({restaurant.reviewsCount})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Aberto
                      </span>
                    </div>
                  </div>

                  {/* Detalhes de Distância e Entrega */}
                  <div className="flex items-center justify-between text-xs text-neutral-500 pt-3 mt-3 border-t border-neutral-100 font-medium">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                        {restaurant.distance}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        {restaurant.deliveryTime}
                      </span>
                      <span>•</span>
                      <span>
                        Taxa: R$ {restaurant.deliveryFee.toFixed(2)}
                      </span>
                    </div>

                    <Link
                      href={`/loja/${restaurant.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-black text-[#CA000A] hover:underline"
                    >
                      <span>Cardápio</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Ações de Entrada: Salão vs Delivery */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2">
                    <Link
                      href={`/loja/${restaurant.slug}?mode=mesa&mesa=1`}
                      className="py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Utensils className="w-3.5 h-3.5 text-neutral-600" />
                      <span>Pedir na Mesa</span>
                    </Link>

                    <Link
                      href={`/loja/${restaurant.slug}?mode=delivery`}
                      className="py-2.5 px-3 rounded-xl bg-[#CA000A] hover:bg-[#b00009] text-white text-xs font-black text-center flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Pedir Delivery</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Barra de Navegação Inferior Fixa Mobile (conforme Stitch explorar_restaurantes) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EBE4DC] py-2 px-4 shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-3 text-center">
          <Link
            href="/explorar"
            className="flex flex-col items-center justify-center text-[#CA000A] font-black text-[11px]"
          >
            <Compass className="w-5 h-5 mb-0.5" />
            <span>Descobrir</span>
          </Link>

          <Link
            href="/loja/brasa-burger-grill"
            className="flex flex-col items-center justify-center text-neutral-500 hover:text-neutral-900 font-bold text-[11px]"
          >
            <Utensils className="w-5 h-5 mb-0.5" />
            <span>Mesa / Salão</span>
          </Link>

          <Link
            href="/login"
            className="flex flex-col items-center justify-center text-neutral-500 hover:text-neutral-900 font-bold text-[11px]"
          >
            <Receipt className="w-5 h-5 mb-0.5" />
            <span>Área da Loja</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
