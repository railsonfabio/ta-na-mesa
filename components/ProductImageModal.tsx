"use client";

import React from "react";
import { X, Plus, Sparkles, Check } from "lucide-react";
import { ProductItem } from "../lib/types";

interface ProductImageModalProps {
  product: ProductItem | null;
  onClose: () => void;
  onAdd: (product: ProductItem) => void;
}

export function ProductImageModal({ product, onClose, onAdd }: ProductImageModalProps) {
  if (!product) return null;

  const isImageUrl = product.image && (product.image.startsWith("http") || product.image.startsWith("/"));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl border border-neutral-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Imagem Ampliada com Botão Fechar Flutuante */}
        <div className="relative w-full h-72 sm:h-80 bg-neutral-900 flex items-center justify-center overflow-hidden">
          {isImageUrl ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className="text-8xl select-none">{product.image}</div>
          )}

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer shadow-lg"
            title="Fechar visualização"
          >
            <X className="w-5 h-5" />
          </button>

          {product.popular && (
            <div className="absolute bottom-4 left-4 bg-[#C83E2B] text-white text-xs font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mais Vendido</span>
            </div>
          )}
        </div>

        {/* Ficha Técnica & Descrição do Lanche */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-[#1F2421] leading-tight">
                {product.name}
              </h3>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mt-0.5">
                Categoria: {product.category}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-[#C83E2B]">
                R$ {product.price.toFixed(2)}
              </span>
            </div>
          </div>

          <p className="text-sm text-neutral-600 leading-relaxed mt-3 bg-[#FDFBF7] p-3.5 rounded-2xl border border-[#EFE9DF]">
            {product.description}
          </p>

          {/* Dica de personalização */}
          <p className="text-[11px] text-neutral-400 mt-2 text-center">
            💡 Ao adicionar, você poderá remover ingredientes (sem cebola, sem milho) e adicionar extras!
          </p>

          {/* Ações */}
          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-neutral-100">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-neutral-200 text-neutral-600 font-bold text-sm hover:bg-neutral-50 transition-colors cursor-pointer text-center"
            >
              Voltar ao Cardápio
            </button>
            <button
              onClick={() => {
                onAdd(product);
                onClose();
              }}
              className="flex-2 py-3 px-4 rounded-xl bg-[#C83E2B] hover:bg-[#B03221] text-white font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Personalizar & Adicionar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
