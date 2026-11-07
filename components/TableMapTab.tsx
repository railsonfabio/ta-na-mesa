"use client";

import React, { useState } from "react";
import { Table, TableStatus, Order, Comanda } from "../lib/types";
import { StoreSettings } from "../lib/server-db";
import {
  Utensils,
  Plus,
  Bell,
  Receipt,
  Printer,
  QrCode,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Users,
  Search,
  Timer,
  Clock,
} from "lucide-react";
import { TableQrModal } from "./TableQrModal";

interface TableMapTabProps {
  tables: Table[];
  settings?: StoreSettings;
  selectedTable: Table | null;
  onSelectTable: (table: Table) => void;
  onClearTableCall: (tableNumber: number) => void;
  onCloseComanda: (tableNumber: number, comandaId: string) => void;
  onRemoveItemFromComanda?: (tableNumber: number, comandaId: string, itemId: string) => void;
  onRequestCloseComanda?: (tableNumber: number, comanda: Comanda) => void;
  onPrintReceipt?: (order: Order) => void;
  onAddTable?: (tableNumber: number) => void;
  onFreeTable?: (tableNumber: number) => void;
}

export function TableMapTab({
  tables,
  settings,
  selectedTable,
  onSelectTable,
  onClearTableCall,
  onCloseComanda,
  onRemoveItemFromComanda,
  onRequestCloseComanda,
  onPrintReceipt,
  onAddTable,
  onFreeTable,
}: TableMapTabProps) {
  const [filter, setFilter] = useState<"todas" | TableStatus>("todas");
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrTableNumber, setQrTableNumber] = useState<number>(1);
  const [isNewTableModalOpen, setIsNewTableModalOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState<string>(
    String(Math.max(...tables.map((t) => t.number), 0) + 1)
  );

  const getEffectiveStatus = (t: Table): TableStatus => {
    if (t.status === "chamando_garcom" || t.status === "pedindo_conta") return t.status;
    if (t.comandas && t.comandas.length > 0) return "ocupada";
    return t.status || "livre";
  };

  // Status counts calculados dinamicamente pelo estado efetivo da mesa
  const countLivres = tables.filter((t) => getEffectiveStatus(t) === "livre").length;
  const countOcupadas = tables.filter((t) => getEffectiveStatus(t) === "ocupada").length;
  const countChamando = tables.filter((t) => getEffectiveStatus(t) === "chamando_garcom").length;
  const countConta = tables.filter((t) => getEffectiveStatus(t) === "pedindo_conta").length;

  const filteredTables = tables.filter((t) => {
    if (filter === "todas") return true;
    return getEffectiveStatus(t) === filter;
  });

  const handleAddNewTable = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(newTableNumber, 10);
    if (!num || num <= 0) return;
    if (tables.some((t) => t.number === num)) {
      alert(`A Mesa ${num} já está cadastrada!`);
      return;
    }
    if (onAddTable) {
      onAddTable(num);
    }
    setIsNewTableModalOpen(false);
    setNewTableNumber(String(num + 1));
  };

  const handleOpenQr = (tableNum: number) => {
    setQrTableNumber(tableNum);
    setIsQrModalOpen(true);
  };

  const handlePrintTableReceipt = (table: Table) => {
    if (!onPrintReceipt) return;
    // Synthesize an Order object from table comandas to feed the thermal printer
    const allItems = table.comandas.flatMap((c) => c.items);
    const total = table.comandas.reduce((s, c) => s + c.total, 0);

    const dummyOrder: Order = {
      id: `ord-table-${table.number}-${Date.now()}`,
      orderNumber: 200 + table.number,
      type: "mesa",
      tableNumber: table.number,
      customerName: table.comandas.map((c) => c.customerName).join(" & ") || `Mesa ${table.number}`,
      items: allItems,
      subtotal: total,
      deliveryFee: 0,
      discount: 0,
      total: total,
      status: "em_preparo",
      createdAt: "Agora",
    };

    onPrintReceipt(dummyOrder);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      {/* Topo do Mapa: Legenda de Cores, Filtros e Ações */}
      <div className="bg-white rounded-3xl p-5 border border-[#EFE9DF] shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-[#1F2421] flex items-center gap-2">
              <Utensils className="w-5 h-5 text-[#C83E2B]" />
              <span>Mapa de Mesas do Salão ({tables.length} Mesas Cadastradas)</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Controle visual em tempo real por cores: Verde = Livre, Vermelho = Ocupada, Amarelo = Chamando Garçom.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setNewTableNumber(String(Math.max(...tables.map((t) => t.number), 0) + 1));
                setIsNewTableModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C83E2B] hover:bg-[#B03221] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Mesa</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros com Código de Cores Expressivo */}
        <div className="flex items-center gap-2 overflow-x-auto mt-4 pt-3 border-t border-neutral-100 scrollbar-none">
          <button
            onClick={() => setFilter("todas")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === "todas"
                ? "bg-[#1F2421] text-white shadow-xs"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            <span>Todas as Mesas</span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">
              {tables.length}
            </span>
          </button>

          <button
            onClick={() => setFilter("livre")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
              filter === "livre"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>🟢 Livres ({countLivres})</span>
          </button>

          <button
            onClick={() => setFilter("ocupada")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
              filter === "ocupada"
                ? "bg-[#C83E2B] text-white border-[#C83E2B] shadow-xs"
                : "bg-rose-50 text-[#C83E2B] border-rose-200 hover:bg-rose-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>🔴 Ocupadas ({countOcupadas})</span>
          </button>

          <button
            onClick={() => setFilter("chamando_garcom")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
              filter === "chamando_garcom"
                ? "bg-amber-500 text-neutral-950 font-black border-amber-500 shadow-xs"
                : "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>🟡 Chamando Garçom ({countChamando})</span>
          </button>

          {countConta > 0 && (
            <button
              onClick={() => setFilter("pedindo_conta")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                filter === "pedindo_conta"
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100"
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-blue-500" />
              <span>🔵 Pedindo Conta ({countConta})</span>
            </button>
          )}
        </div>
      </div>

      {/* Grade de Mesas e Painel Lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade de Quadrados Compactos Coloridos */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredTables.map((table) => {
              const isSelected = selectedTable?.number === table.number;
              const total = table.comandas.reduce((s, c) => s + c.total, 0);
              const effectiveStatus = getEffectiveStatus(table);

              // Configuração de cores sólida por status
              let headerBg = "bg-emerald-600 text-white";
              let cardBg = "bg-emerald-50/40 border-emerald-300 hover:border-emerald-500";
              let badgeLabel = "LIVRE";
              let pulseClass = "";

              if (effectiveStatus === "ocupada") {
                headerBg = "bg-[#C83E2B] text-white";
                cardBg = "bg-rose-50/40 border-[#C83E2B]/60 hover:border-[#C83E2B]";
                badgeLabel = "OCUPADA";
              } else if (effectiveStatus === "chamando_garcom") {
                headerBg = "bg-amber-500 text-neutral-950 font-black";
                cardBg = "bg-amber-50 border-amber-400 hover:border-amber-500 shadow-md";
                badgeLabel = "🔔 CHAMANDO";
                pulseClass = "animate-pulse";
              } else if (effectiveStatus === "pedindo_conta") {
                headerBg = "bg-blue-600 text-white";
                cardBg = "bg-blue-50 border-blue-400 hover:border-blue-600";
                badgeLabel = "🧾 PEDIU CONTA";
              }

              return (
                <div
                  key={table.id}
                  onClick={() => onSelectTable(table)}
                  className={`rounded-2xl border-2 overflow-hidden transition-all cursor-pointer flex flex-col justify-between h-36 ${cardBg} ${pulseClass} ${
                    isSelected ? "ring-4 ring-[#1F2421] shadow-xl scale-[1.02]" : "shadow-xs"
                  }`}
                >
                  {/* Cabeçalho sólido pintado na cor do status */}
                  <div className={`px-2.5 py-1.5 flex items-center justify-between text-xs font-black ${headerBg}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="tracking-tight">Mesa {table.number}</span>
                      {settings?.enableTableTimer !== false && effectiveStatus !== "livre" && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                            table.openedAt && Math.floor((Date.now() - new Date(table.openedAt).getTime()) / 60000) > 90
                              ? "bg-rose-900 text-rose-100 animate-pulse"
                              : "bg-black/20 text-white"
                          }`}
                          title="Tempo de permanência do cliente no salão"
                        >
                          <Clock className="w-2.5 h-2.5" />
                          <span>
                            {table.openedAt
                              ? Math.max(1, Math.floor((Date.now() - new Date(table.openedAt).getTime()) / 60000))
                              : ((table.number * 17) % 55) + 15}
                            m
                          </span>
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] uppercase font-black">{badgeLabel}</span>
                  </div>

                  {/* Miolo do Quadrado */}
                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      {effectiveStatus === "livre" ? (
                        <p className="text-[11px] font-bold text-emerald-800">
                          Pronta para receber clientes
                        </p>
                      ) : effectiveStatus === "chamando_garcom" ? (
                        <div className="text-[11px] font-bold text-amber-950 line-clamp-2 leading-tight">
                          ⚠️ {table.callReason || "Chamando garçom na mesa"}
                        </div>
                      ) : (
                        <div>
                          <p className="text-[10px] font-bold text-neutral-500 uppercase">
                            {table.comandas.length} {table.comandas.length === 1 ? "Comanda" : "Comandas"}:
                          </p>
                          <p className="text-[11px] font-extrabold text-[#1F2421] truncate">
                            {table.comandas.map((c) => c.customerName).join(", ")}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Rodapé com Valor de Consumo */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-black/5 text-[11px]">
                      <span className="text-neutral-500 font-bold">Consumo:</span>
                      <span
                        className={`font-black ${
                          total > 0 ? "text-[#C83E2B]" : "text-emerald-700 font-bold"
                        }`}
                      >
                        R$ {total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Painel Lateral de Detalhes da Mesa Selecionada */}
        <div className="lg:col-span-1">
          {selectedTable ? (
            <div className="bg-white rounded-3xl p-5 border border-[#EFE9DF] shadow-xs sticky top-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DF]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-[#1F2421]">
                      Mesa {selectedTable.number}
                    </h3>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        selectedTable.status === "livre"
                          ? "bg-emerald-100 text-emerald-800"
                          : selectedTable.status === "ocupada"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {selectedTable.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {selectedTable.comandas.length} comanda(s) ativas no salão
                  </p>
                </div>

                <button
                  onClick={() => handleOpenQr(selectedTable.number)}
                  className="p-2 rounded-xl bg-neutral-100 text-neutral-700 hover:bg-neutral-200 cursor-pointer"
                  title="Exibir QR Code para o Cliente escanear"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>

              {/* Botão de Atender Chamado se estiver chamando */}
              {selectedTable.status === "chamando_garcom" && (
                <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between">
                  <div className="text-xs text-amber-900 font-bold">
                    🔔 Chamado: {selectedTable.callReason || "Cliente solicita presença"}
                  </div>
                  <button
                    onClick={() => onClearTableCall(selectedTable.number)}
                    className="text-xs bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black px-3 py-1.5 rounded-xl cursor-pointer"
                    title="Atender chamado do cliente e desativar o aviso no painel"
                  >
                    Atender
                  </button>
                </div>
              )}

              {/* Lista das Comandas da Mesa */}
              <div className="py-4 space-y-3.5 max-h-[380px] overflow-y-auto">
                {selectedTable.comandas.length === 0 ? (
                  <div className="text-center py-8 text-neutral-400">
                    <Utensils className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-bold">Mesa livre e desocupada.</p>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Aguardando clientes ou abertura pelo garçom.
                    </p>
                  </div>
                ) : (
                  selectedTable.comandas.map((comanda) => (
                    <div
                      key={comanda.id}
                      className="p-3.5 rounded-2xl bg-[#FDFBF7] border border-[#EFE9DF] space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-neutral-800">
                          👤 {comanda.customerName}
                        </span>
                        <span className="font-black text-[#C83E2B]">
                          R$ {comanda.total.toFixed(2)}
                        </span>
                      </div>

                      {/* Itens do Cliente com Opção de Cancelamento pelo Gestor */}
                      <div className="text-xs text-neutral-600 space-y-1.5">
                        {comanda.items.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-white border border-[#EFE9DF]"
                          >
                            <span className="font-medium text-neutral-800">
                              {it.quantity}x {it.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#C83E2B]">
                                R$ {(it.price * it.quantity).toFixed(2)}
                              </span>
                              {onRemoveItemFromComanda && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `Gestor: Confirmar cancelamento de 1x "${it.name}" da comanda de ${comanda.customerName}?`
                                      )
                                    ) {
                                      onRemoveItemFromComanda(
                                        selectedTable.number,
                                        comanda.id,
                                        it.id
                                      );
                                    }
                                  }}
                                  className="p-1 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                                  title="Estornar / Cancelar este item da comanda"
                                >
                                  <Trash2 className="w-3 h-3 text-rose-500" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Botão de Fechar Individual */}
                      <div className="pt-2 border-t border-neutral-200 flex justify-end">
                        <button
                          onClick={() => {
                            if (onRequestCloseComanda) {
                              onRequestCloseComanda(selectedTable.number, comanda);
                            } else {
                              onCloseComanda(selectedTable.number, comanda.id);
                            }
                          }}
                          className="text-xs font-bold bg-[#1F2421] text-white hover:bg-black px-3 py-1.5 rounded-xl cursor-pointer transition-colors shadow-xs"
                          title={`Cobrar e encerrar a comanda individual de ${comanda.customerName}`}
                        >
                          Dar Baixa Comanda (R$ {comanda.total.toFixed(2)})
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Ações Globais da Mesa */}
              {selectedTable.comandas.length > 0 && (
                <div className="pt-3 border-t border-[#EFE9DF] space-y-2">
                  <div className="flex items-center justify-between text-sm font-black text-[#1F2421] mb-2">
                    <span>Total da Mesa:</span>
                    <span className="text-[#C83E2B]">
                      R$ {selectedTable.comandas.reduce((s, c) => s + c.total, 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handlePrintTableReceipt(selectedTable)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold cursor-pointer"
                      title="Imprimir cupom de conferência / pré-conta na bobina térmica"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Pré-Conta</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onFreeTable) {
                          onFreeTable(selectedTable.number);
                        }
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#C83E2B] border border-rose-200 text-xs font-bold cursor-pointer"
                      title="Desocupar a mesa e zerar todas as comandas pendentes"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Liberar Mesa</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 border border-[#EFE9DF] text-center text-neutral-400">
              <p className="text-xs font-bold">Clique em uma mesa para ver os detalhes da conta.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Adicionar Mesa */}
      {isNewTableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-[#EFE9DF] shadow-2xl">
            <h3 className="text-base font-black text-[#1F2421] mb-1">Cadastrar Nova Mesa</h3>
            <p className="text-xs text-neutral-500 mb-4">
              Defina o número da nova mesa para o salão do restaurante.
            </p>

            <form onSubmit={handleAddNewTable} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Número da Mesa:
                </label>
                <input
                  type="number"
                  min="1"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full text-sm font-bold px-3.5 py-2.5 rounded-xl border border-[#EFE9DF] outline-none focus:border-[#C83E2B]"
                  placeholder="Ex: 11"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewTableModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-neutral-100 text-neutral-600 text-xs font-bold hover:bg-neutral-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#C83E2B] text-white text-xs font-bold hover:bg-[#B03221] cursor-pointer"
                >
                  Confirmar Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de QR Code da Mesa Selecionada */}
      {isQrModalOpen && (
        <TableQrModal tableNumber={qrTableNumber} onClose={() => setIsQrModalOpen(false)} />
      )}
    </div>
  );
}
