"use client";

import React, { useState } from "react";
import { StockItem, Supplier, FinancialExpense, Order } from "../lib/types";
import { INITIAL_STOCK, INITIAL_SUPPLIERS, INITIAL_EXPENSES, RESTAURANT_INFO } from "../lib/mock-data";
import { StoreSettings } from "../lib/server-db";
import {
  Package,
  Truck,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  MessageCircle,
  ExternalLink,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CreditCard,
  Building2,
  Receipt,
  Sparkles,
  TrendingUp,
  Percent,
  Copy,
  Clock,
  Trash2,
  Pencil,
  X,
} from "lucide-react";

interface InventoryAndFinanceTabProps {
  orders?: Order[];
  settings?: StoreSettings;
  stock?: StockItem[];
  suppliers?: Supplier[];
  expenses?: FinancialExpense[];
  onUpdateStock?: (newStock: StockItem[]) => void;
  onUpdateSuppliers?: (newSuppliers: Supplier[]) => void;
  onUpdateExpenses?: (newExpenses: FinancialExpense[]) => void;
}

export function InventoryAndFinanceTab({
  orders = [],
  settings,
  stock: initialStockProp,
  suppliers: initialSuppliersProp,
  expenses: initialExpensesProp,
  onUpdateStock,
  onUpdateSuppliers,
  onUpdateExpenses,
}: InventoryAndFinanceTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"estoque" | "fornecedores" | "financeiro">("estoque");

  // Dados Locais com Fallback nos Mocks Iniciais e sincronização contínua com o servidor
  const [stockList, setStockList] = useState<StockItem[]>(initialStockProp || INITIAL_STOCK);
  const [supplierList, setSupplierList] = useState<Supplier[]>(initialSuppliersProp || INITIAL_SUPPLIERS);
  const [expenseList, setExpenseList] = useState<FinancialExpense[]>(initialExpensesProp || INITIAL_EXPENSES);

  React.useEffect(() => {
    if (initialStockProp) setStockList(initialStockProp);
  }, [initialStockProp]);

  React.useEffect(() => {
    if (initialSuppliersProp) setSupplierList(initialSuppliersProp);
  }, [initialSuppliersProp]);

  React.useEffect(() => {
    if (initialExpensesProp) setExpenseList(initialExpensesProp);
  }, [initialExpensesProp]);

  // Estados de Filtro e Busca
  const [stockSearch, setStockSearch] = useState("");
  const [stockCategoryFilter, setStockCategoryFilter] = useState<string>("todas");
  const [expenseStatusFilter, setExpenseStatusFilter] = useState<"todas" | "pendente" | "pago">("todas");

  // Modais de Criação
  const [isNewStockModalOpen, setIsNewStockModalOpen] = useState(false);
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false);
  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);

  // Estados para Edição Completa
  const [editingStockItem, setEditingStockItem] = useState<StockItem | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingExpense, setEditingExpense] = useState<FinancialExpense | null>(null);

  // Formulário Novo Insumo
  const [newStockName, setNewStockName] = useState("");
  const [newStockCategory, setNewStockCategory] = useState<StockItem["category"]>("carnes");
  const [newStockQty, setNewStockQty] = useState("");
  const [newStockMin, setNewStockMin] = useState("");
  const [newStockUnit, setNewStockUnit] = useState<StockItem["unit"]>("un");
  const [newStockCost, setNewStockCost] = useState("");
  const [newStockSupplier, setNewStockSupplier] = useState(supplierList[0]?.name || "Fornecedor Local");

  // Formulário Novo Fornecedor
  const [newSupName, setNewSupName] = useState("");
  const [newSupCategory, setNewSupCategory] = useState("");
  const [newSupContact, setNewSupContact] = useState("");
  const [newSupPhone, setNewSupPhone] = useState("");
  const [newSupPix, setNewSupPix] = useState("");
  const [newSupDays, setNewSupDays] = useState("");

  // Formulário Nova Despesa
  const [newExpDesc, setNewExpDesc] = useState("");
  const [newExpAmount, setNewExpAmount] = useState("");
  const [newExpCategory, setNewExpCategory] = useState<FinancialExpense["category"]>("fornecedores");
  const [newExpDueDate, setNewExpDueDate] = useState(new Date().toISOString().split("T")[0]);

  const storeName = settings?.storeName || RESTAURANT_INFO.name;

  // Sincronizar e persistir alterações
  const saveStock = (updated: StockItem[]) => {
    setStockList(updated);
    if (onUpdateStock) onUpdateStock(updated);
    try {
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: updated, notification: "📦 Estoque atualizado no banco de dados." }),
      }).catch(() => {});
    } catch {}
  };

  const saveSuppliers = (updated: Supplier[]) => {
    setSupplierList(updated);
    if (onUpdateSuppliers) onUpdateSuppliers(updated);
    try {
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suppliers: updated, notification: "🚚 Fornecedor atualizado no banco de dados." }),
      }).catch(() => {});
    } catch {}
  };

  const saveExpenses = (updated: FinancialExpense[]) => {
    setExpenseList(updated);
    if (onUpdateExpenses) onUpdateExpenses(updated);
    try {
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenses: updated, notification: "💳 Despesas financeiras atualizadas no banco de dados." }),
      }).catch(() => {});
    } catch {}
  };

  // Ajuste Rápido de Quantidade (+ / -)
  const handleAdjustQuantity = (id: string, delta: number) => {
    const updated = stockList.map((item) => {
      if (item.id === id) {
        const newQty = Math.max(0, Math.round((item.quantity + delta) * 10) / 10);
        return { ...item, quantity: newQty, lastUpdated: "Agora" };
      }
      return item;
    });
    saveStock(updated);
  };

  // Exclusão e Edição de Insumo
  const handleDeleteStock = (id: string) => {
    const item = stockList.find((s) => s.id === id);
    if (!item) return;
    if (confirm(`⚠️ Tem certeza que deseja excluir o insumo "${item.name}" do estoque?`)) {
      const updated = stockList.filter((s) => s.id !== id);
      saveStock(updated);
    }
  };

  const handleSaveEditedStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStockItem || !editingStockItem.name.trim()) return;
    const updated = stockList.map((item) =>
      item.id === editingStockItem.id ? { ...editingStockItem, lastUpdated: "Agora" } : item
    );
    saveStock(updated);
    setEditingStockItem(null);
  };

  // Exclusão e Edição de Fornecedor
  const handleDeleteSupplier = (id: string) => {
    const sup = supplierList.find((s) => s.id === id);
    if (!sup) return;
    if (confirm(`⚠️ Tem certeza que deseja excluir o fornecedor "${sup.name}"?`)) {
      const updated = supplierList.filter((s) => s.id !== id);
      saveSuppliers(updated);
    }
  };

  const handleSaveEditedSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier || !editingSupplier.name.trim()) return;
    const updated = supplierList.map((s) =>
      s.id === editingSupplier.id ? editingSupplier : s
    );
    saveSuppliers(updated);
    setEditingSupplier(null);
  };

  // Exclusão e Edição de Despesa
  const handleDeleteExpense = (id: string) => {
    const exp = expenseList.find((e) => e.id === id);
    if (!exp) return;
    if (confirm(`⚠️ Tem certeza que deseja excluir a despesa "${exp.description}"?`)) {
      const updated = expenseList.filter((e) => e.id !== id);
      saveExpenses(updated);
    }
  };

  const handleSaveEditedExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !editingExpense.description.trim()) return;
    const updated = expenseList.map((e) =>
      e.id === editingExpense.id ? editingExpense : e
    );
    saveExpenses(updated);
    setEditingExpense(null);
  };

  // Disparo de Pedido de Compra no WhatsApp do Fornecedor
  const handleOrderSupplierWhatsApp = (item: StockItem) => {
    const sup = supplierList.find((s) => s.name === item.supplierName) || {
      phone: item.supplierPhone || "(84) 99123-4567",
      contactName: "Equipe Comercial",
    };

    const cleanPhone = sup.phone.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Olá ${sup.contactName} da *${item.supplierName || "Distribuidora"}*! 👋\n\nAqui é do restaurante *${storeName}*.\n\nIdentificamos em nosso sistema que nosso estoque de *${item.name}* está baixo:\n• Restam: *${item.quantity} ${item.unit}* (Estoque Mínimo: ${item.minQuantity} ${item.unit}).\n\nGostaria de solicitar uma cotação/pedido de reposição com entrega para o nosso endereço (${settings?.address || RESTAURANT_INFO.address}).\n\nPodemos confirmar a grade de entrega? Obrigado!`
    );

    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, "_blank");
  };

  // Criação de Novo Insumo
  const handleCreateStockItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStockName.trim()) return;

    const newItem: StockItem = {
      id: `stk-${Date.now()}`,
      name: newStockName.trim(),
      category: newStockCategory,
      quantity: parseFloat(newStockQty.replace(",", ".")) || 0,
      minQuantity: parseFloat(newStockMin.replace(",", ".")) || 10,
      unit: newStockUnit,
      unitCost: parseFloat(newStockCost.replace(",", ".")) || 0,
      supplierName: newStockSupplier,
      lastUpdated: "Hoje",
    };

    saveStock([newItem, ...stockList]);
    setNewStockName("");
    setNewStockQty("");
    setNewStockMin("");
    setNewStockCost("");
    setIsNewStockModalOpen(false);
  };

  // Criação de Novo Fornecedor
  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;

    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name: newSupName.trim(),
      category: newSupCategory || "Alimentos em Geral",
      contactName: newSupContact || "Vendas",
      phone: newSupPhone || "(84) 99999-9999",
      pixKey: newSupPix,
      deliveryDays: newSupDays || "Sob encomenda",
    };

    saveSuppliers([...supplierList, newSup]);
    setNewSupName("");
    setNewSupCategory("");
    setNewSupContact("");
    setNewSupPhone("");
    setNewSupPix("");
    setNewSupDays("");
    setIsNewSupplierModalOpen(false);
  };

  // Criação de Nova Despesa
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(newExpAmount.replace(",", "."));
    if (!newExpDesc.trim() || isNaN(amountVal) || amountVal <= 0) return;

    const newExp: FinancialExpense = {
      id: `exp-${Date.now()}`,
      description: newExpDesc.trim(),
      amount: amountVal,
      category: newExpCategory,
      dueDate: newExpDueDate || new Date().toISOString().split("T")[0],
      status: "pendente",
      paymentMethod: "Boleto / Pix",
    };

    saveExpenses([newExp, ...expenseList]);
    setNewExpDesc("");
    setNewExpAmount("");
    setIsNewExpenseModalOpen(false);
  };

  // Marcar Despesa como Paga
  const handleToggleExpensePaid = (id: string) => {
    const updated = expenseList.map((exp) => {
      if (exp.id === id) {
        const isCurrentlyPaid = exp.status === "pago";
        return {
          ...exp,
          status: (isCurrentlyPaid ? "pendente" : "pago") as FinancialExpense["status"],
          paidDate: isCurrentlyPaid ? undefined : new Date().toISOString().split("T")[0],
        };
      }
      return exp;
    });
    saveExpenses(updated);
  };

  // Métricas de Estoque
  const totalStockItemsCount = stockList.length;
  const lowStockItems = stockList.filter((i) => i.quantity <= i.minQuantity);
  const totalStockAssetValue = stockList.reduce((acc, i) => acc + i.quantity * i.unitCost, 0);

  // Métricas Financeiras & DRE
  const completedOrders = orders.filter((o) => o.status !== "cancelado");
  const grossSalesFromOrders = completedOrders.reduce((sum, o) => sum + o.total, 0);
  // Se não houver pedidos carregados na sessão, utiliza média estimada do turno comercial
  const totalGrossRevenue = grossSalesFromOrders > 0 ? grossSalesFromOrders : 38650.0;

  const totalPaidExpenses = expenseList
    .filter((e) => e.status === "pago")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalPendingExpenses = expenseList
    .filter((e) => e.status === "pendente")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalMonthlyExpenses = totalPaidExpenses + totalPendingExpenses;
  const netEstimatedProfit = totalGrossRevenue - totalMonthlyExpenses;
  const netMarginPercent = totalGrossRevenue > 0 ? (netEstimatedProfit / totalGrossRevenue) * 100 : 0;

  // Filtragem de Estoque
  const filteredStock = stockList.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(stockSearch.toLowerCase());
    const matchesCat = stockCategoryFilter === "todas" || item.category === stockCategoryFilter;
    return matchesSearch && matchesCat;
  });

  // Filtragem de Despesas
  const filteredExpenses = expenseList.filter((e) => {
    if (expenseStatusFilter === "todas") return true;
    return e.status === expenseStatusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 animate-in fade-in">
      {/* Topo: Seletor das 3 Sub-Abas do Backoffice */}
      <div className="bg-white rounded-3xl p-5 border border-[#EFE9DF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">💼</span>
            <h2 className="text-lg font-black text-[#1F2421]">
              Retaguarda do Restaurante: Estoque, Fornecedores & Financeiro
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Gestão completa de insumos, ficha técnica de compras, agenda de fornecedores e DRE de lucro líquido.
          </p>
        </div>

        {/* Botões das Sub-Abas com Tooltips Balão */}
        <div className="flex items-center bg-[#F4EFE6] p-1.5 rounded-2xl gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab("estoque")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeSubTab === "estoque"
                ? "bg-[#C83E2B] text-white shadow-xs"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-white/60"
            }`}
            title="Aba de Estoque: Gerenciar matérias-primas, contagem física (+ / -), estoque mínimo, edição e reposição via WhatsApp"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Estoque de Insumos</span>
            {lowStockItems.length > 0 && (
              <span className="text-[10px] bg-white text-[#C83E2B] px-1.5 py-0.2 rounded-full font-black">
                {lowStockItems.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab("fornecedores")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeSubTab === "fornecedores"
                ? "bg-[#1F2421] text-white shadow-xs"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-white/60"
            }`}
            title="Aba de Fornecedores: Catálogo de distribuidores de bebidas, carnes, hortifrúti, cotação no WhatsApp e chave Pix"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Fornecedores</span>
            <span className="text-[10px] bg-neutral-200 text-neutral-700 px-1.5 py-0.2 rounded-full font-bold">
              {supplierList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("financeiro")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeSubTab === "financeiro"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-white/60"
            }`}
            title="Aba de Financeiro: Contas a pagar, baixa de boletos e DRE em tempo real com apuração de Lucro Líquido"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Contas a Pagar & DRE</span>
            {totalPendingExpenses > 0 && (
              <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full font-bold">
                R$ {totalPendingExpenses.toFixed(0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-ABA 1: CONTROLE DE ESTOQUE & INSUMOS                                  */}
      {/* ========================================================================= */}
      {activeSubTab === "estoque" && (
        <div className="space-y-6">
          {/* Cards Indicadores de Estoque */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-[#EFE9DF] shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-500 uppercase block">Itens em Estoque</span>
                <span className="text-2xl font-black text-[#1F2421] mt-1 block">{totalStockItemsCount} insumos</span>
                <span className="text-[11px] text-neutral-400">Carnes, pães, laticínios e embalagens</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-neutral-100 text-neutral-700 flex items-center justify-center font-bold text-lg">
                📦
              </div>
            </div>

            <div className="bg-rose-50/70 rounded-2xl p-4 border border-rose-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-rose-700 uppercase block">Alerta de Reposição</span>
                <span className="text-2xl font-black text-rose-800 mt-1 block">
                  {lowStockItems.length} {lowStockItems.length === 1 ? "item baixo" : "itens baixos"}
                </span>
                <span className="text-[11px] text-rose-600 font-semibold">Abaixo da margem mínima</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-lg animate-pulse">
                ⚠️
              </div>
            </div>

            <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-emerald-800 uppercase block">Capital Imobilizado</span>
                <span className="text-2xl font-black text-emerald-900 mt-1 block">
                  R$ {totalStockAssetValue.toFixed(2)}
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold">Valor de custo das matérias-primas</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-lg">
                💰
              </div>
            </div>
          </div>

          {/* Barra de Filtros e Busca de Estoque */}
          <div className="bg-white rounded-3xl p-5 border border-[#EFE9DF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Buscar insumo (ex: Blend Bovino, Queijo Cheddar, Pão)..."
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#EFE9DF] bg-[#FDFBF7] text-xs font-medium outline-none focus:ring-2 focus:ring-[#C83E2B]"
                />
              </div>

              <select
                value={stockCategoryFilter}
                onChange={(e) => setStockCategoryFilter(e.target.value)}
                className="text-xs font-bold px-3 py-2 rounded-xl border border-[#EFE9DF] bg-[#FDFBF7] outline-none"
              >
                <option value="todas">Todas as Categorias</option>
                <option value="carnes">Carnes & Blends</option>
                <option value="paes_laticinios">Pães & Laticínios</option>
                <option value="hortifruti">Hortifruti & Batatas</option>
                <option value="bebidas">Bebidas & Refrigerantes</option>
                <option value="embalagens">Embalagens & Descartáveis</option>
              </select>
            </div>

            <button
              onClick={() => setIsNewStockModalOpen(true)}
              className="bg-[#C83E2B] hover:bg-[#B03221] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Insumo</span>
            </button>
          </div>

          {/* Tabela de Insumos de Estoque */}
          <div className="bg-white rounded-3xl border border-[#EFE9DF] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FDFBF7] border-b border-[#EFE9DF] text-[11px] font-black uppercase text-neutral-500 tracking-wider">
                  <tr>
                    <th className="py-3 px-4" title="Nome do ingrediente ou produto de retaguarda">Insumo / Matéria-Prima</th>
                    <th className="py-3 px-4" title="Categoria de armazenamento no estoque">Categoria</th>
                    <th className="py-3 px-4 text-center" title="Saldo físico em estoque. Use - e + para dar baixa ou entrada">Quantidade Atual</th>
                    <th className="py-3 px-4 text-center" title="Estoque mínimo de segurança para emitir alerta de reposição">Estoque Mínimo</th>
                    <th className="py-3 px-4 text-center" title="Status visual: Normal, Atenção ou Crítico">Status</th>
                    <th className="py-3 px-4 text-right" title="Custo unitário pago na aquisição">Custo Unitário</th>
                    <th className="py-3 px-4 text-right" title="Ações de compra, edição e exclusão">Ações & Fornecedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredStock.map((item) => {
                    const isLow = item.quantity <= item.minQuantity;
                    const isCritical = item.quantity <= item.minQuantity * 0.5;

                    return (
                      <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-black text-neutral-900">{item.name}</p>
                          <span className="text-[10px] text-neutral-400">Atualizado: {item.lastUpdated}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 uppercase">
                            {item.category.replace("_", " & ")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-[#FDFBF7] border border-[#EFE9DF] px-2 py-1 rounded-xl">
                            <button
                              onClick={() => handleAdjustQuantity(item.id, -1)}
                              className="w-5 h-5 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-800 flex items-center justify-center font-bold cursor-pointer transition-colors"
                              title="Diminuir 1 unidade (baixa/perda/consumo)"
                            >
                              -
                            </button>
                            <span className="font-black text-sm text-neutral-900 w-14 text-center" title="Saldo atual do estoque">
                              {item.quantity} {item.unit}
                            </span>
                            <button
                              onClick={() => handleAdjustQuantity(item.id, 1)}
                              className="w-5 h-5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-bold cursor-pointer transition-colors"
                              title="Adicionar 1 unidade (entrada/reposição)"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-neutral-500" title="Estoque mínimo de segurança">
                          {item.minQuantity} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isCritical ? (
                            <span className="inline-flex items-center gap-1 font-black text-[10px] bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-300 animate-pulse" title="Estoque em nível crítico (urgente comprar)">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Crítico
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300" title="Estoque atingiu o limite mínimo">
                              Atenção
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full" title="Estoque em nível confortável">
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-neutral-800" title="Custo de aquisição unitário">
                          R$ {item.unitCost.toFixed(2)}
                          <span className="text-[10px] text-neutral-400 font-normal"> /{item.unit}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOrderSupplierWhatsApp(item)}
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer shadow-2xs ${
                                isLow
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                                  : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
                              }`}
                              title={`Fazer pedido de compra/reposição direto no WhatsApp do ${item.supplierName || "fornecedor"}`}
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="hidden xl:inline">WhatsApp</span>
                            </button>

                            <button
                              onClick={() => setEditingStockItem({ ...item })}
                              className="p-1.5 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer transition-colors"
                              title={`Editar dados do insumo "${item.name}" (quantidade, estoque mínimo, custo ou fornecedor)`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteStock(item.id)}
                              className="p-1.5 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition-colors"
                              title={`Excluir "${item.name}" definitivamente do estoque`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-ABA 2: GESTÃO DE FORNECEDORES & AGENDA COMERCIAL                     */}
      {/* ========================================================================= */}
      {activeSubTab === "fornecedores" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-[#1F2421]">
                Catálogo de Fornecedores & Parceiros Homologados
              </h3>
              <p className="text-xs text-neutral-500">
                Acione cotações rápidas, consulte prazos de entrega e chaves Pix de pagamento em 1 clique.
              </p>
            </div>
            <button
              onClick={() => setIsNewSupplierModalOpen(true)}
              className="bg-[#1F2421] hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Fornecedor</span>
            </button>
          </div>

          {/* Grade de Cards de Fornecedores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supplierList.map((sup) => (
              <div
                key={sup.id}
                className="bg-white rounded-3xl p-5 border border-[#EFE9DF] shadow-xs flex flex-col justify-between space-y-4 hover:border-neutral-400 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-neutral-100">
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#C83E2B] tracking-wider block">
                        {sup.category}
                      </span>
                      <h4 className="text-sm font-black text-neutral-900 mt-0.5">{sup.name}</h4>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center font-bold text-xs">
                      🚚
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-neutral-600">
                    <p>
                      <strong>Contato:</strong> {sup.contactName}
                    </p>
                    <p>
                      <strong>WhatsApp:</strong> <span className="font-mono">{sup.phone}</span>
                    </p>
                    {sup.pixKey && (
                      <p className="flex items-center gap-1 text-[11px]">
                        <strong>Chave Pix:</strong>{" "}
                        <code className="bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded font-mono">
                          {sup.pixKey}
                        </code>
                      </p>
                    )}
                    {sup.deliveryDays && (
                      <p className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 mt-2">
                        📅 <strong>Entregas:</strong> {sup.deliveryDays}
                      </p>
                    )}
                    {sup.notes && (
                      <p className="text-[11px] text-neutral-400 italic mt-1">{sup.notes}</p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center gap-1.5">
                  <a
                    href={`https://wa.me/55${sup.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Olá ${sup.contactName}! Aqui é do ${storeName}. Gostaria de consultar a tabela de preços e fazer um novo pedido.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    title={`Abrir conversa no WhatsApp com ${sup.contactName} (${sup.name})`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  {sup.pixKey && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(sup.pixKey || "");
                        alert(`Chave Pix copiada: ${sup.pixKey}`);
                      }}
                      className="p-2 rounded-xl border border-neutral-300 text-neutral-600 hover:bg-neutral-100 cursor-pointer transition-colors"
                      title={`Copiar Chave Pix: ${sup.pixKey}`}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => setEditingSupplier({ ...sup })}
                    className="p-2 rounded-xl border border-neutral-300 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer transition-colors"
                    title={`Editar dados, contato, WhatsApp e Pix de ${sup.name}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteSupplier(sup.id)}
                    className="p-2 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition-colors"
                    title={`Excluir o fornecedor "${sup.name}"`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-ABA 3: CONTAS A PAGAR & DEMONSTRATIVO DE RESULTADO (DRE)               */}
      {/* ========================================================================= */}
      {activeSubTab === "financeiro" && (
        <div className="space-y-6">
          {/* DRE Simplificado do Negócio (Visão do Dono) */}
          <div className="bg-gradient-to-br from-[#1F2421] to-[#2E3830] text-white rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  DRE Operacional Simplificado (Mês Vigente)
                </span>
                <h3 className="text-xl font-black tracking-tight mt-0.5">
                  Demonstrativo de Lucro Líquido & Saúde Financeira
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Margem: {netMarginPercent.toFixed(1)}% Líquida
                </span>
              </div>
            </div>

            {/* Grid DRE */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-neutral-400 block">1. Faturamento Bruto</span>
                <span className="text-2xl font-black text-white mt-1 block">
                  R$ {totalGrossRevenue.toFixed(2)}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">
                  Vendas Salão, Delivery e WhatsApp
                </span>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-neutral-400 block">2. Despesas Pagas</span>
                <span className="text-2xl font-black text-amber-300 mt-1 block">
                  - R$ {totalPaidExpenses.toFixed(2)}
                </span>
                <span className="text-[10px] text-neutral-400 block mt-0.5">Insumos, aluguel, energia quitados</span>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-neutral-400 block">3. Despesas a Vencer</span>
                <span className="text-2xl font-black text-rose-300 mt-1 block">
                  - R$ {totalPendingExpenses.toFixed(2)}
                </span>
                <span className="text-[10px] text-rose-400 font-bold block mt-0.5">Boletos em aberto este mês</span>
              </div>

              <div className="bg-emerald-500/20 p-4 rounded-2xl border border-emerald-400/40">
                <span className="text-xs font-black text-emerald-300 block">4. Lucro Líquido Real</span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block">
                  = R$ {netEstimatedProfit.toFixed(2)}
                </span>
                <span className="text-[10px] text-emerald-300 font-bold block mt-0.5">
                  Resultado positivo em caixa
                </span>
              </div>
            </div>
          </div>

          {/* Barra de Ações de Contas a Pagar */}
          <div className="bg-white rounded-3xl p-5 border border-[#EFE9DF] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-500">Filtrar status:</span>
              <button
                onClick={() => setExpenseStatusFilter("todas")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  expenseStatusFilter === "todas" ? "bg-[#1F2421] text-white" : "bg-neutral-100 text-neutral-600"
                }`}
              >
                Todas ({expenseList.length})
              </button>
              <button
                onClick={() => setExpenseStatusFilter("pendente")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  expenseStatusFilter === "pendente" ? "bg-amber-500 text-neutral-950 font-black" : "bg-neutral-100 text-neutral-600"
                }`}
              >
                Pendentes ({expenseList.filter((e) => e.status === "pendente").length})
              </button>
              <button
                onClick={() => setExpenseStatusFilter("pago")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  expenseStatusFilter === "pago" ? "bg-emerald-600 text-white" : "bg-neutral-100 text-neutral-600"
                }`}
              >
                Pagas ({expenseList.filter((e) => e.status === "pago").length})
              </button>
            </div>

            <button
              onClick={() => setIsNewExpenseModalOpen(true)}
              className="w-full sm:w-auto bg-[#C83E2B] hover:bg-[#B03221] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Lançar Nova Conta</span>
            </button>
          </div>

          {/* Tabela de Contas a Pagar */}
          <div className="bg-white rounded-3xl border border-[#EFE9DF] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FDFBF7] border-b border-[#EFE9DF] text-[11px] font-black uppercase text-neutral-500 tracking-wider">
                  <tr>
                    <th className="py-3 px-4" title="Descrição da despesa ou credor">Descrição da Despesa</th>
                    <th className="py-3 px-4" title="Classificação da despesa no plano de contas">Categoria</th>
                    <th className="py-3 px-4" title="Data limite para quitação do título">Vencimento</th>
                    <th className="py-3 px-4 text-right" title="Valor nominal do documento">Valor R$</th>
                    <th className="py-3 px-4 text-center" title="Forma de pagamento utilizada">Forma</th>
                    <th className="py-3 px-4 text-right" title="Baixa financeira, edição e cancelamento">Status / Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredExpenses.map((exp) => {
                    const isPaid = exp.status === "pago";

                    return (
                      <tr key={exp.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-neutral-900">
                          {exp.description}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 uppercase">
                            {exp.category.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-neutral-600">
                          {exp.dueDate.split("-").reverse().join("/")}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-sm text-[#C83E2B]">
                          R$ {exp.amount.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center text-neutral-500 text-[11px]">
                          {exp.paymentMethod || "Boleto"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleExpensePaid(exp.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isPaid
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                              }`}
                              title={isPaid ? "Despesa quitada. Clique para reabrir como pendente" : "Registrar pagamento e dar baixa nesta conta"}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isPaid ? "Pago ✓" : "Marcar como Pago"}</span>
                            </button>

                            <button
                              onClick={() => setEditingExpense({ ...exp })}
                              className="p-1.5 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer transition-colors"
                              title={`Editar valor, data ou categoria da conta "${exp.description}"`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="p-1.5 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition-colors"
                              title={`Excluir lançamento da despesa "${exp.description}"`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CADASTRAR NOVO INSUMO                                            */}
      {/* ========================================================================= */}
      {isNewStockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 animate-in zoom-in-95">
            <h3 className="text-base font-black text-neutral-900 mb-1">Cadastrar Insumo no Estoque</h3>
            <p className="text-xs text-neutral-500 mb-4">
              Informe a matéria-prima, unidade de medida e limites de alerta de reposição.
            </p>

            <form onSubmit={handleCreateStockItem} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Nome do Insumo:</label>
                <input
                  type="text"
                  placeholder="Ex: Queijo Cheddar Bisnaga 1.5kg"
                  value={newStockName}
                  onChange={(e) => setNewStockName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-bold outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Categoria:</label>
                  <select
                    value={newStockCategory}
                    onChange={(e) => setNewStockCategory(e.target.value as StockItem["category"])}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-bold outline-none"
                  >
                    <option value="carnes">Carnes & Blends</option>
                    <option value="paes_laticinios">Pães & Laticínios</option>
                    <option value="hortifruti">Hortifruti & Batatas</option>
                    <option value="bebidas">Bebidas</option>
                    <option value="embalagens">Embalagens</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Unidade:</label>
                  <select
                    value={newStockUnit}
                    onChange={(e) => setNewStockUnit(e.target.value as StockItem["unit"])}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-bold outline-none"
                  >
                    <option value="un">Unidade (un)</option>
                    <option value="kg">Quilograma (kg)</option>
                    <option value="g">Gramas (g)</option>
                    <option value="lt">Litros (lt)</option>
                    <option value="pct">Pacote (pct)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-neutral-700 block mb-1">Qtd Atual:</label>
                  <input
                    type="text"
                    placeholder="50"
                    value={newStockQty}
                    onChange={(e) => setNewStockQty(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 text-xs font-bold outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-neutral-700 block mb-1">Mínimo:</label>
                  <input
                    type="text"
                    placeholder="20"
                    value={newStockMin}
                    onChange={(e) => setNewStockMin(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 text-xs font-bold outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-neutral-700 block mb-1">Custo (R$):</label>
                  <input
                    type="text"
                    placeholder="4.50"
                    value={newStockCost}
                    onChange={(e) => setNewStockCost(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 text-xs font-bold outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Fornecedor Habitual:</label>
                <select
                  value={newStockSupplier}
                  onChange={(e) => setNewStockSupplier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs outline-none"
                >
                  {supplierList.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewStockModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-neutral-300 text-neutral-600 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#C83E2B] text-white text-xs font-bold cursor-pointer"
                >
                  Salvar Insumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CADASTRAR NOVO FORNECEDOR                                        */}
      {/* ========================================================================= */}
      {isNewSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 animate-in zoom-in-95">
            <h3 className="text-base font-black text-neutral-900 mb-1">Cadastrar Fornecedor</h3>
            <p className="text-xs text-neutral-500 mb-4">
              Armazene o contato do fornecedor para pedidos rápidos pelo WhatsApp.
            </p>

            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Nome da Empresa / Fornecedor:</label>
                <input
                  type="text"
                  placeholder="Ex: Frigorífico Central"
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Categoria de Fornecimento:</label>
                <input
                  type="text"
                  placeholder="Ex: Carnes e Hambúrgueres"
                  value={newSupCategory}
                  onChange={(e) => setNewSupCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Nome do Contato:</label>
                  <input
                    type="text"
                    placeholder="Ex: Carlos (Vendas)"
                    value={newSupContact}
                    onChange={(e) => setNewSupContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">WhatsApp:</label>
                  <input
                    type="text"
                    placeholder="(84) 99999-9999"
                    value={newSupPhone}
                    onChange={(e) => setNewSupPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Chave Pix:</label>
                <input
                  type="text"
                  placeholder="CNPJ, E-mail ou Telefone Pix"
                  value={newSupPix}
                  onChange={(e) => setNewSupPix(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Dias de Entrega:</label>
                <input
                  type="text"
                  placeholder="Ex: Segundas e Quintas"
                  value={newSupDays}
                  onChange={(e) => setNewSupDays(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs outline-none"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewSupplierModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-neutral-300 text-neutral-600 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#1F2421] text-white text-xs font-bold cursor-pointer"
                >
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: LANÇAR NOVA DESPESA / CONTA A PAGAR                              */}
      {/* ========================================================================= */}
      {isNewExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 animate-in zoom-in-95">
            <h3 className="text-base font-black text-neutral-900 mb-1">Lançar Conta a Pagar</h3>
            <p className="text-xs text-neutral-500 mb-4">
              Cadastre boletos de fornecedores, contas de consumo ou despesas fixas.
            </p>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Descrição da Despesa:</label>
                <input
                  type="text"
                  placeholder="Ex: Compra Carnes Frigorífico Potiguar"
                  value={newExpDesc}
                  onChange={(e) => setNewExpDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-bold outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Valor (R$):</label>
                  <input
                    type="text"
                    placeholder="1250.00"
                    value={newExpAmount}
                    onChange={(e) => setNewExpAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-black text-[#C83E2B] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Data de Vencimento:</label>
                  <input
                    type="date"
                    value={newExpDueDate}
                    onChange={(e) => setNewExpDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-bold outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Categoria Financeira:</label>
                <select
                  value={newExpCategory}
                  onChange={(e) => setNewExpCategory(e.target.value as FinancialExpense["category"])}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-bold outline-none"
                >
                  <option value="fornecedores">Fornecedores de Insumos</option>
                  <option value="aluguel_fixo">Aluguel do Ponto</option>
                  <option value="energia_agua_gas">Energia, Água & Gás</option>
                  <option value="equipe_salarios">Equipe & Diárias</option>
                  <option value="marketing">Marketing & Tráfego Pago</option>
                  <option value="outros">Outros Custos</option>
                </select>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewExpenseModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-neutral-300 text-neutral-600 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#C83E2B] text-white text-xs font-bold cursor-pointer"
                >
                  Lançar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL EDIÇÃO: EDITAR INSUMO DE ESTOQUE                                    */}
      {/* ========================================================================= */}
      {editingStockItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-neutral-100 text-neutral-800">
                  <Pencil className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-neutral-900">Editar Insumo</h3>
              </div>
              <button
                onClick={() => setEditingStockItem(null)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                title="Fechar sem salvar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedStock} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Nome do Insumo:</label>
                <input
                  type="text"
                  value={editingStockItem.name}
                  onChange={(e) => setEditingStockItem({ ...editingStockItem, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-bold outline-none focus:ring-2 focus:ring-[#C83E2B]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Categoria:</label>
                  <select
                    value={editingStockItem.category}
                    onChange={(e) => setEditingStockItem({ ...editingStockItem, category: e.target.value as StockItem["category"] })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-bold outline-none"
                  >
                    <option value="carnes">Carnes & Blends</option>
                    <option value="paes_laticinios">Pães & Laticínios</option>
                    <option value="hortifruti">Hortifruti & Batatas</option>
                    <option value="bebidas">Bebidas</option>
                    <option value="embalagens">Embalagens</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Unidade:</label>
                  <select
                    value={editingStockItem.unit}
                    onChange={(e) => setEditingStockItem({ ...editingStockItem, unit: e.target.value as StockItem["unit"] })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-bold outline-none"
                  >
                    <option value="un">Unidade (un)</option>
                    <option value="kg">Quilograma (kg)</option>
                    <option value="g">Gramas (g)</option>
                    <option value="lt">Litros (lt)</option>
                    <option value="pct">Pacote (pct)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-neutral-700 block mb-1">Qtd Atual:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingStockItem.quantity}
                    onChange={(e) => setEditingStockItem({ ...editingStockItem, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 text-xs font-bold outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-neutral-700 block mb-1">Mínimo:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingStockItem.minQuantity}
                    onChange={(e) => setEditingStockItem({ ...editingStockItem, minQuantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 text-xs font-bold outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-neutral-700 block mb-1">Custo (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingStockItem.unitCost}
                    onChange={(e) => setEditingStockItem({ ...editingStockItem, unitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 text-xs font-bold outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Fornecedor Habitual:</label>
                <select
                  value={editingStockItem.supplierName}
                  onChange={(e) => setEditingStockItem({ ...editingStockItem, supplierName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs outline-none"
                >
                  {supplierList.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStockItem(null)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-neutral-600 text-xs font-bold cursor-pointer hover:bg-neutral-50"
                  title="Cancelar e descartar alterações"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#C83E2B] text-white text-xs font-bold cursor-pointer hover:bg-[#b03423] shadow-xs"
                  title="Salvar alterações do insumo"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL EDIÇÃO: EDITAR FORNECEDOR                                           */}
      {/* ========================================================================= */}
      {editingSupplier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-neutral-100 text-neutral-800">
                  <Pencil className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-neutral-900">Editar Fornecedor</h3>
              </div>
              <button
                onClick={() => setEditingSupplier(null)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                title="Fechar sem salvar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedSupplier} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Nome da Empresa / Fornecedor:</label>
                <input
                  type="text"
                  value={editingSupplier.name}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Categoria de Fornecimento:</label>
                <input
                  type="text"
                  value={editingSupplier.category}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Nome do Contato:</label>
                  <input
                    type="text"
                    value={editingSupplier.contactName}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, contactName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">WhatsApp:</label>
                  <input
                    type="text"
                    value={editingSupplier.phone}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Chave Pix:</label>
                <input
                  type="text"
                  value={editingSupplier.pixKey || ""}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, pixKey: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Dias de Entrega:</label>
                <input
                  type="text"
                  value={editingSupplier.deliveryDays || ""}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, deliveryDays: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Observações / Condições:</label>
                <input
                  type="text"
                  value={editingSupplier.notes || ""}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs outline-none"
                  placeholder="Ex: Faturamento 15 dias, pedido mínimo R$ 200"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSupplier(null)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-neutral-600 text-xs font-bold cursor-pointer hover:bg-neutral-50"
                  title="Cancelar e descartar alterações"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#1F2421] text-white text-xs font-bold cursor-pointer hover:bg-black shadow-xs"
                  title="Salvar alterações do fornecedor"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL EDIÇÃO: EDITAR CONTA A PAGAR                                        */}
      {/* ========================================================================= */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-neutral-100 text-neutral-800">
                  <Pencil className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-neutral-900">Editar Despesa</h3>
              </div>
              <button
                onClick={() => setEditingExpense(null)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                title="Fechar sem salvar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedExpense} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Descrição da Despesa:</label>
                <input
                  type="text"
                  value={editingExpense.description}
                  onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-bold outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Valor (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingExpense.amount}
                    onChange={(e) => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-black text-[#C83E2B] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Vencimento:</label>
                  <input
                    type="date"
                    value={editingExpense.dueDate}
                    onChange={(e) => setEditingExpense({ ...editingExpense, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-bold outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Categoria:</label>
                  <select
                    value={editingExpense.category}
                    onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value as FinancialExpense["category"] })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-bold outline-none"
                  >
                    <option value="fornecedores">Fornecedores</option>
                    <option value="aluguel_fixo">Aluguel Fixo</option>
                    <option value="energia_agua_gas">Energia, Água & Gás</option>
                    <option value="equipe_salarios">Equipe & Diárias</option>
                    <option value="marketing">Marketing</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Status:</label>
                  <select
                    value={editingExpense.status}
                    onChange={(e) => setEditingExpense({ ...editingExpense, status: e.target.value as "pendente" | "pago" })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-bold outline-none"
                  >
                    <option value="pendente">Pendente ⏳</option>
                    <option value="pago">Pago ✓</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Forma de Pagamento:</label>
                <input
                  type="text"
                  value={editingExpense.paymentMethod || "Boleto"}
                  onChange={(e) => setEditingExpense({ ...editingExpense, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs outline-none"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-neutral-600 text-xs font-bold cursor-pointer hover:bg-neutral-50"
                  title="Cancelar e descartar alterações"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#C83E2B] text-white text-xs font-bold cursor-pointer hover:bg-[#b03423] shadow-xs"
                  title="Salvar alterações da despesa"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
