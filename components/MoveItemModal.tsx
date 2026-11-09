"use client";

import React, { useState } from "react";
import { Table, Comanda, CartItem } from "../lib/types";
import {
  X,
  ArrowRightLeft,
  Utensils,
  Plus,
  Check,
  Split,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from "lucide-react";

interface MoveItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CartItem | null;
  sourceTable: Table | null;
  sourceComanda: Comanda | null;
  allTables: Table[];
  onConfirmMove: (params: {
    sourceTableNumber: number;
    sourceComandaId: string;
    itemId: string;
    quantityToMove: number;
    destinationType: "same_table_comanda" | "other_table_comanda" | "new_comanda";
    targetTableNumber: number;
    targetComandaId?: string;
    newComandaName?: string;
  }) => void;
}

export function MoveItemModal({
  isOpen,
  onClose,
  item,
  sourceTable,
  sourceComanda,
  allTables,
  onConfirmMove,
}: MoveItemModalProps) {
  if (!isOpen || !item || !sourceTable || !sourceComanda) return null;

  // Quantidade a mover (se item.quantity > 1, permite escolher quantas unidades)
  const [quantityToMove, setQuantityToMove] = useState<number>(1);

  // Destino
  // 'same_table' | 'other_table' | 'new_comanda'
  const otherComandasSameTable = sourceTable.comandas.filter(
    (c) => c.id !== sourceComanda.id
  );

  const [destinationMode, setDestinationMode] = useState<
    "same_table" | "other_table" | "new_comanda"
  >(otherComandasSameTable.length > 0 ? "same_table" : "new_comanda");

  // Destino selecionado
  const [selectedTargetComandaId, setSelectedTargetComandaId] = useState<string>(
    otherComandasSameTable[0]?.id || ""
  );

  // Se 'other_table', qual mesa e qual comanda
  const [targetTableNumber, setTargetTableNumber] = useState<number>(
    sourceTable.number === 1 ? 2 : 1
  );
  const targetTableObj = allTables.find((t) => t.number === targetTableNumber);
  const [otherTableComandaId, setOtherTableComandaId] = useState<string>(
    targetTableObj?.comandas[0]?.id || "new"
  );

  // Se 'new_comanda'
  const [newComandaName, setNewComandaName] = useState<string>("");
  const [newComandaTableNumber, setNewComandaTableNumber] = useState<number>(
    sourceTable.number
  );

  // Atualiza comanda da outra mesa se a mesa mudar
  const handleTargetTableChange = (num: number) => {
    setTargetTableNumber(num);
    const tbl = allTables.find((t) => t.number === num);
    if (tbl && tbl.comandas.length > 0) {
      setOtherTableComandaId(tbl.comandas[0].id);
    } else {
      setOtherTableComandaId("new");
    }
  };

  const handleConfirm = () => {
    if (destinationMode === "same_table") {
      if (!selectedTargetComandaId) return;
      onConfirmMove({
        sourceTableNumber: sourceTable.number,
        sourceComandaId: sourceComanda.id,
        itemId: item.id,
        quantityToMove,
        destinationType: "same_table_comanda",
        targetTableNumber: sourceTable.number,
        targetComandaId: selectedTargetComandaId,
      });
    } else if (destinationMode === "other_table") {
      if (otherTableComandaId === "new") {
        const generatedName = newComandaName.trim() || `Comanda Mesa ${targetTableNumber}`;
        onConfirmMove({
          sourceTableNumber: sourceTable.number,
          sourceComandaId: sourceComanda.id,
          itemId: item.id,
          quantityToMove,
          destinationType: "new_comanda",
          targetTableNumber,
          newComandaName: generatedName,
        });
      } else {
        onConfirmMove({
          sourceTableNumber: sourceTable.number,
          sourceComandaId: sourceComanda.id,
          itemId: item.id,
          quantityToMove,
          destinationType: "other_table_comanda",
          targetTableNumber,
          targetComandaId: otherTableComandaId,
        });
      }
    } else {
      // new_comanda
      const finalName = newComandaName.trim() || `Comanda ${newComandaTableNumber}-${Date.now().toString().slice(-4)}`;
      onConfirmMove({
        sourceTableNumber: sourceTable.number,
        sourceComandaId: sourceComanda.id,
        itemId: item.id,
        quantityToMove,
        destinationType: "new_comanda",
        targetTableNumber: newComandaTableNumber,
        newComandaName: finalName,
      });
    }
    onClose();
  };

  const isFormValid = () => {
    if (destinationMode === "same_table") {
      return Boolean(selectedTargetComandaId);
    }
    if (destinationMode === "other_table") {
      return Boolean(targetTableNumber);
    }
    if (destinationMode === "new_comanda") {
      return newComandaName.trim().length > 0;
    }
    return false;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-neutral-300 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Handle bar mobile (conforme Stitch mover_item_comanda_gar_om) */}
        <div className="flex h-4 w-full items-center justify-center pt-2 sm:hidden flex-shrink-0">
          <div className="h-1.5 w-10 rounded-full bg-neutral-300"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E7DCD0] bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-100 text-[#CA000A]">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#1F2421]">
                Mover Item da Comanda
              </h2>
              <p className="text-xs text-neutral-500 font-medium">
                Mesa {sourceTable.number} • Comanda &ldquo;{sourceComanda.customerName}&rdquo;
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Card do Item a Ser Movido */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5 block">
              Item a ser transferido:
            </label>
            <div className="flex items-center gap-3.5 bg-white p-3.5 rounded-xl border border-[#E7DCD0] shadow-2xs">
              <div className="size-11 rounded-xl bg-red-50 text-[#CA000A] flex items-center justify-center flex-shrink-0 border border-red-100 font-black text-sm">
                <Utensils className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-[#1F2421] truncate">
                  {item.quantity}x {item.name}
                </p>
                <p className="text-xs text-neutral-500 font-medium">
                  R$ {item.price.toFixed(2)} cada • Total: R$ {(item.price * item.quantity).toFixed(2)}
                </p>
                {item.notes && (
                  <p className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md mt-1 inline-block border border-amber-200">
                    {item.notes}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Seletor de Quantidade (quando tem 2 ou mais itens iguais) */}
          {item.quantity > 1 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-amber-950">
                  Quantidade a transferir:
                </p>
                <p className="text-[11px] text-amber-800">
                  Você pode mover apenas uma parte ou todos os {item.quantity} itens.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setQuantityToMove((prev) => Math.max(1, prev - 1))}
                  className="w-7 h-7 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 rounded font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="w-6 text-center text-sm font-black text-[#1F2421]">
                  {quantityToMove}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantityToMove((prev) => Math.min(item.quantity, prev + 1))}
                  className="w-7 h-7 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 rounded font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Abas / Opções de Destino */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 block">
              Selecione o destino:
            </label>

            <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-200/80 rounded-xl mb-3">
              <button
                type="button"
                onClick={() => setDestinationMode("same_table")}
                disabled={otherComandasSameTable.length === 0}
                className={`py-2 px-1 text-xs font-extrabold rounded-lg transition-all text-center ${
                  destinationMode === "same_table"
                    ? "bg-white text-[#CA000A] shadow-xs"
                    : otherComandasSameTable.length === 0
                    ? "text-neutral-400 cursor-not-allowed opacity-60"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Mesma Mesa ({sourceTable.number})
              </button>

              <button
                type="button"
                onClick={() => setDestinationMode("other_table")}
                className={`py-2 px-1 text-xs font-extrabold rounded-lg transition-all text-center ${
                  destinationMode === "other_table"
                    ? "bg-white text-[#CA000A] shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Outra Mesa
              </button>

              <button
                type="button"
                onClick={() => setDestinationMode("new_comanda")}
                className={`py-2 px-1 text-xs font-extrabold rounded-lg transition-all text-center ${
                  destinationMode === "new_comanda"
                    ? "bg-white text-[#CA000A] shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                + Nova Comanda
              </button>
            </div>

            {/* Painel 1: Mesma Mesa */}
            {destinationMode === "same_table" && (
              <div className="space-y-2">
                <p className="text-xs text-neutral-600 font-medium">
                  Comandas abertas na Mesa {sourceTable.number}:
                </p>
                {otherComandasSameTable.map((cmd) => (
                  <label
                    key={cmd.id}
                    onClick={() => setSelectedTargetComandaId(cmd.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedTargetComandaId === cmd.id
                        ? "bg-red-50/60 border-[#CA000A] ring-2 ring-[#CA000A]/20"
                        : "bg-white border-[#E7DCD0] hover:border-neutral-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="same_table_target"
                      checked={selectedTargetComandaId === cmd.id}
                      onChange={() => setSelectedTargetComandaId(cmd.id)}
                      className="text-[#CA000A] focus:ring-[#CA000A]"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#1F2421]">
                        Comanda: {cmd.customerName}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {cmd.items.length} itens atuais • Total atual: R$ {cmd.total.toFixed(2)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Painel 2: Outra Mesa */}
            {destinationMode === "other_table" && (
              <div className="space-y-3">
                <p className="text-xs text-neutral-600 font-medium">
                  1. Escolha a mesa de destino:
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {allTables
                    .filter((t) => t.number !== sourceTable.number)
                    .map((tbl) => (
                      <button
                        key={tbl.number}
                        type="button"
                        onClick={() => handleTargetTableChange(tbl.number)}
                        className={`py-2 px-1 text-center rounded-xl border font-black text-xs transition-all ${
                          targetTableNumber === tbl.number
                            ? "bg-[#1F2421] text-white border-[#1F2421] shadow-xs"
                            : tbl.comandas.length > 0
                            ? "bg-white border-[#E7DCD0] text-neutral-800 hover:border-neutral-400"
                            : "bg-neutral-100 border-neutral-200 text-neutral-500 hover:border-neutral-300"
                        }`}
                      >
                        Mesa {tbl.number}
                        <span className="block text-[10px] font-normal opacity-75">
                          {tbl.comandas.length > 0 ? `${tbl.comandas.length} com.` : "Livre"}
                        </span>
                      </button>
                    ))}
                </div>

                <div className="pt-2">
                  <p className="text-xs text-neutral-600 font-medium mb-1.5">
                    2. Escolha a comanda na Mesa {targetTableNumber}:
                  </p>
                  {targetTableObj && targetTableObj.comandas.length > 0 ? (
                    <div className="space-y-2">
                      {targetTableObj.comandas.map((cmd) => (
                        <label
                          key={cmd.id}
                          onClick={() => setOtherTableComandaId(cmd.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            otherTableComandaId === cmd.id
                              ? "bg-red-50/60 border-[#CA000A] ring-2 ring-[#CA000A]/20"
                              : "bg-white border-[#E7DCD0] hover:border-neutral-400"
                          }`}
                        >
                          <input
                            type="radio"
                            name="other_table_target"
                            checked={otherTableComandaId === cmd.id}
                            onChange={() => setOtherTableComandaId(cmd.id)}
                            className="text-[#CA000A] focus:ring-[#CA000A]"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-[#1F2421]">
                              {cmd.customerName}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {cmd.items.length} itens • R$ {cmd.total.toFixed(2)}
                            </p>
                          </div>
                        </label>
                      ))}

                      <label
                        onClick={() => setOtherTableComandaId("new")}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          otherTableComandaId === "new"
                            ? "bg-red-50/60 border-[#CA000A] ring-2 ring-[#CA000A]/20"
                            : "bg-white border-[#E7DCD0] hover:border-neutral-400"
                        }`}
                      >
                        <input
                          type="radio"
                          name="other_table_target"
                          checked={otherTableComandaId === "new"}
                          onChange={() => setOtherTableComandaId("new")}
                          className="text-[#CA000A] focus:ring-[#CA000A]"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-extrabold text-[#CA000A] flex items-center gap-1">
                            <Plus className="w-4 h-4" /> Criar nova comanda na Mesa {targetTableNumber}
                          </p>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="p-3 bg-neutral-100 border border-neutral-200 rounded-xl">
                      <p className="text-xs font-bold text-neutral-700">
                        Mesa {targetTableNumber} está livre!
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        Uma nova comanda será criada nesta mesa para receber o item.
                      </p>
                      <input
                        type="text"
                        value={newComandaName}
                        onChange={(e) => setNewComandaName(e.target.value)}
                        placeholder="Nome da comanda (ex: João, Casal, Mesa 2)"
                        className="mt-2 w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#CA000A] focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Painel 3: Nova Comanda */}
            {destinationMode === "new_comanda" && (
              <div className="space-y-3 bg-white p-3.5 rounded-xl border border-[#E7DCD0]">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Nome da Nova Comanda:
                  </label>
                  <input
                    type="text"
                    value={newComandaName}
                    onChange={(e) => setNewComandaName(e.target.value)}
                    placeholder="Ex: Comanda 2, Bebidas, Lucas, Amigo..."
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-neutral-300 rounded-lg text-sm font-bold text-[#1F2421] focus:ring-2 focus:ring-[#CA000A] focus:outline-none"
                    autoFocus
                  />
                </div>

                {/* Chips rápidos */}
                <div className="flex flex-wrap gap-1.5">
                  {["+ Bebidas", "+ Sobremesa", "+ Casal", "+ Amigo", "+ Família"].map(
                    (chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setNewComandaName(chip.replace("+ ", ""))}
                        className="text-[11px] font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        {chip}
                      </button>
                    )
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Criar na Mesa:
                  </label>
                  <select
                    value={newComandaTableNumber}
                    onChange={(e) => setNewComandaTableNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-neutral-300 rounded-lg text-xs font-bold text-[#1F2421] focus:ring-2 focus:ring-[#CA000A] focus:outline-none"
                  >
                    {allTables.map((tbl) => (
                      <option key={tbl.number} value={tbl.number}>
                        Mesa {tbl.number} {tbl.number === sourceTable.number ? "(Atual)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer com botões de ação (conforme Stitch mover_item_comanda_gar_om) */}
        <div className="p-4 border-t border-[#E7DCD0] bg-white flex flex-col gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isFormValid()}
            className="w-full py-3 px-4 bg-[#CA000A] hover:bg-[#b00009] disabled:bg-neutral-300 disabled:cursor-not-allowed text-white text-sm font-black rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Confirmar Transferência</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-neutral-600 hover:text-neutral-900 text-xs font-extrabold rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
