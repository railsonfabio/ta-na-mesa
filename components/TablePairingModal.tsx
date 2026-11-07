"use client";

import React, { useState } from "react";
import { Utensils, QrCode, X, Bike, Check, AlertCircle } from "lucide-react";

interface TablePairingModalProps {
  currentTableNumber?: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectTable: (tableNumber: number) => void;
  storeName?: string;
}

export function TablePairingModal({
  currentTableNumber = 1,
  isOpen,
  onClose,
  onSelectTable,
  storeName = "Brasa & Burger Grill",
}: TablePairingModalProps) {
  const [selectedTable, setSelectedTable] = useState<number>(currentTableNumber);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onSelectTable(selectedTable);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FDF2F0] text-[#C83E2B] flex items-center justify-center font-black">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#1F2421]">
                Consumo Presencial no Salão
              </h3>
              <p className="text-xs text-neutral-500">
                {storeName} • Salão Presencial
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-full hover:bg-neutral-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aviso de Segurança Anti-Engano */}
        <div className="my-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Atenção:</strong> Escolha esta opção apenas se você estiver <strong>fisicamente sentado</strong> em uma das mesas do restaurante. Os pedidos serão preparados e entregues pelo garçom na sua mesa.
          </p>
        </div>

        {/* Seletor de Mesas 1 a 10 */}
        <div className="mb-5">
          <label className="block text-xs font-black text-neutral-700 uppercase tracking-wider mb-2.5">
            Qual é o número da sua mesa?
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
              const isSelected = selectedTable === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSelectedTable(num)}
                  className={`py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-[#C83E2B] text-white border-[#C83E2B] shadow-sm scale-105"
                      : "bg-[#FDFBF7] text-neutral-700 border-[#EFE9DF] hover:bg-neutral-100"
                  }`}
                >
                  Mesa {num}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ações */}
        <div className="space-y-2 pt-2 border-t border-neutral-100">
          <button
            onClick={handleConfirm}
            className="w-full py-3 px-4 rounded-xl bg-[#C83E2B] hover:bg-[#B03221] text-white font-black text-xs shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar e Abrir Mesa {selectedTable}</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 text-neutral-600 font-bold text-xs hover:bg-neutral-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Bike className="w-3.5 h-3.5 text-[#C83E2B]" />
            <span>Estou em casa, continuar no Delivery</span>
          </button>
        </div>
      </div>
    </div>
  );
}
