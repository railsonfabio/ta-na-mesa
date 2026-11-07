"use client";

import React, { useState } from "react";
import { Star, CheckCircle2, Heart, Sparkles, X } from "lucide-react";

interface ReviewModalProps {
  customerName: string;
  tableNumber?: number;
  onClose: () => void;
  onSubmitReview: (review: {
    customerName: string;
    tableNumber?: number;
    rating: number;
    tags: string[];
    comment?: string;
  }) => void;
}

export function ReviewModal({
  customerName,
  tableNumber,
  onClose,
  onSubmitReview,
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(["Comida Quentinha", "Atendimento Rápido"]);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const availableTags = [
    "🔥 Comida Quentinha",
    "⚡ Atendimento Rápido",
    "🍺 Cerveja Gelada",
    "🍔 Muito Saboroso",
    "✨ Ambiente Acolhedor",
    "🤵 Garçom Atencioso",
  ];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReview({
      customerName,
      tableNumber,
      rating,
      tags: selectedTags,
      comment: comment.trim() || undefined,
    });
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center border border-[#EFE9DF] shadow-2xl animate-in zoom-in-95">
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-[#1F2421]">
                Conta Paga com Sucesso!
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {customerName ? `${customerName}, como` : "Como"} foi sua experiência hoje?
              </p>
            </div>

            {/* Estrelas Interativas */}
            <div className="flex items-center justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-125 cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating
                        ? "fill-[#F4A261] text-[#F4A261]"
                        : "text-neutral-200"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Tags de Elogio Rápido */}
            <div className="flex flex-wrap justify-center gap-1.5 pt-1">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#FEF6EC] text-[#D97706] border-[#FBD9B0]"
                        : "bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Comentário Opcional */}
            <textarea
              rows={2}
              placeholder="Deixe um elogio ou sugestão para a equipe..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-[#EFE9DF] bg-[#FDFBF7] outline-none text-neutral-800 placeholder:text-neutral-400"
            />

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 bg-[#C83E2B] hover:bg-[#B03221] text-white text-xs font-bold py-3 rounded-xl shadow-xs cursor-pointer"
              >
                Enviar Avaliação
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-3 rounded-xl border border-neutral-200 text-neutral-400 text-xs font-bold hover:text-neutral-600 cursor-pointer"
              >
                Pular
              </button>
            </div>
          </form>
        ) : (
          <div className="py-6 space-y-2 animate-in fade-in">
            <Heart className="w-12 h-12 text-[#C83E2B] fill-[#C83E2B] mx-auto animate-bounce" />
            <h4 className="text-base font-black text-[#1F2421]">Muito obrigado!</h4>
            <p className="text-xs text-neutral-500">
              Sua avaliação ajuda nossa equipe a manter o atendimento sempre nota 10!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
