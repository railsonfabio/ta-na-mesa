"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { ProductItem } from "../lib/types";
import { CATEGORIES } from "../lib/mock-data";
import {
  Utensils,
  Plus,
  Search,
  Check,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Flame,
  ShoppingBag,
  Sparkles,
  AlertTriangle,
  X,
  Pencil,
  Trash2,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface MenuManagerTabProps {
  products: ProductItem[];
  onUpdateProductPrice?: (productId: string, newPrice: number) => void;
  onToggleProductAvailability?: (productId: string) => void;
  onAddProduct?: (product: ProductItem) => void;
  onEditProduct?: (product: ProductItem) => void;
  onDeleteProduct?: (productId: string) => void;
  onBulkUpdateProducts?: (newProducts: ProductItem[]) => void;
}

export function MenuManagerTab({
  products,
  onUpdateProductPrice,
  onToggleProductAvailability,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onBulkUpdateProducts,
}: MenuManagerTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todas");
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [importResult, setImportResult] = useState<{
    total: number;
    updated: number;
    added: number;
    duplicates: number;
    fileName: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryTabsRef = useRef<HTMLDivElement>(null);

  // New product form states
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("hotdogs");
  const [newPrice, setNewPrice] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newEmoji, setNewEmoji] = useState("🌭");

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === "todas" || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const availableCount = products.filter((p) => p.isAvailable !== false).length;
  const pausedCount = products.filter((p) => p.isAvailable === false).length;

  const handleStartEditPrice = (product: ProductItem) => {
    setEditingPriceId(product.id);
    setTempPrice(product.price.toFixed(2));
  };

  const handleSavePrice = (productId: string) => {
    const parsed = parseFloat(tempPrice.replace(",", "."));
    if (!isNaN(parsed) && parsed > 0 && onUpdateProductPrice) {
      onUpdateProductPrice(productId, parsed);
    }
    setEditingPriceId(null);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(newPrice.replace(",", "."));
    if (!newName.trim() || isNaN(parsed) || parsed <= 0) {
      alert("Preencha o nome e um preço válido.");
      return;
    }

    const newItem: ProductItem = {
      id: `prod-${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
      price: parsed,
      description: newDesc.trim() || "Item fresco preparado na hora.",
      image: newEmoji || "🍽️",
      popular: false,
      isAvailable: true,
    };

    if (onAddProduct) {
      onAddProduct(newItem);
    }

    // Reset form
    setNewName("");
    setNewPrice("");
    setNewDesc("");
    setIsAddModalOpen(false);
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    if (confirm(`⚠️ Tem certeza que deseja excluir "${productName}" definitivamente do cardápio?`)) {
      if (onDeleteProduct) onDeleteProduct(productId);
    }
  };

  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name.trim()) return;
    if (onEditProduct) onEditProduct(editingProduct);
    setEditingProduct(null);
  };

  // Exportar todos os produtos para planilha Excel (.xlsx) já sem duplicidades
  const handleExportExcel = () => {
    try {
      const seenNames = new Set<string>();
      const uniqueProducts = products.filter((p) => {
        const key = p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
        if (seenNames.has(key)) return false;
        seenNames.add(key);
        return true;
      });

      const exportData = uniqueProducts.map((p) => ({
        ID: p.id,
        Nome: p.name,
        Categoria: p.category,
        "Preço (R$)": p.price,
        Descrição: p.description,
        "Emoji/Ícone": p.image || "🍽️",
        Disponível: p.isAvailable !== false ? "SIM" : "NÃO",
        "Mais Pedido": p.popular ? "SIM" : "NÃO",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Cardápio Tá na Mesa");

      // Auto-width das colunas para visualização perfeita
      ws["!cols"] = [
        { wch: 12 }, // ID
        { wch: 35 }, // Nome
        { wch: 16 }, // Categoria
        { wch: 12 }, // Preço
        { wch: 50 }, // Descrição
        { wch: 14 }, // Emoji
        { wch: 12 }, // Disponível
        { wch: 14 }, // Mais Pedido
      ];

      XLSX.writeFile(wb, "cardapio_ta_na_mesa.xlsx");
    } catch (err) {
      alert("Erro ao exportar planilha: " + String(err));
    }
  };

  // Importar planilha Excel / CSV com Deduplicação e Atualização em Massa
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rows = XLSX.utils.sheet_to_json<any>(ws);

        if (!rows || rows.length === 0) {
          alert("A planilha importada está vazia ou sem linhas legíveis.");
          return;
        }

        let updatedCount = 0;
        let addedCount = 0;
        let duplicateCount = 0;

        let workingProducts = [...products];
        const seenInFile = new Set<string>();

        for (const row of rows) {
          const cleanRow: Record<string, any> = {};
          for (const key of Object.keys(row)) {
            const normalizedKey = key
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .trim();
            cleanRow[normalizedKey] = row[key];
          }

          const rawName = String(
            cleanRow["nome"] || cleanRow["name"] || cleanRow["produto"] || cleanRow["item"] || ""
          ).trim();

          if (!rawName) continue;

          // Chave canônica para deduplicação
          const canonicalName = rawName
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .trim();

          // Deduplicação intra-planilha (remove repetidos do mesmo arquivo)
          if (seenInFile.has(canonicalName)) {
            duplicateCount++;
            continue;
          }
          seenInFile.add(canonicalName);

          const id = String(cleanRow["id"] || cleanRow["codigo"] || "").trim();
          const category = String(cleanRow["categoria"] || cleanRow["category"] || "burgers").toLowerCase().trim();

          let rawPrice = cleanRow["preco (r$)"] || cleanRow["preco"] || cleanRow["valor"] || cleanRow["price"] || 0;
          if (typeof rawPrice === "string") {
            let cleanPriceStr = rawPrice.replace(/R\$/gi, "").trim();
            if (cleanPriceStr.includes(",") && cleanPriceStr.includes(".")) {
              cleanPriceStr = cleanPriceStr.replace(/\./g, "").replace(",", ".");
            } else if (cleanPriceStr.includes(",")) {
              cleanPriceStr = cleanPriceStr.replace(",", ".");
            }
            rawPrice = parseFloat(cleanPriceStr) || 0;
          }
          const price = typeof rawPrice === "number" && !isNaN(rawPrice) && rawPrice > 0 ? rawPrice : 15.0;

          const description = String(
            cleanRow["descricao"] || cleanRow["description"] || cleanRow["ingredientes"] || "Item fresco preparado na hora."
          ).trim();

          const image = String(
            cleanRow["emoji/icone"] || cleanRow["emoji"] || cleanRow["icone"] || cleanRow["imagem"] || cleanRow["image"] || "🍽️"
          ).trim();

          const rawDisp = String(cleanRow["disponivel"] || cleanRow["ativo"] || "SIM").toUpperCase();
          const isAvailable = !rawDisp.includes("N") && !rawDisp.includes("NAO") && !rawDisp.includes("NÃO");

          const rawPop = String(cleanRow["mais pedido"] || cleanRow["popular"] || cleanRow["destaque"] || "NAO").toUpperCase();
          const popular = rawPop.includes("S") || rawPop.includes("SIM") || rawPop.includes("TRUE");

          // Verifica se já existe por ID ou Nome canônico
          const existingIdx = workingProducts.findIndex((p) => {
            if (id && p.id === id) return true;
            const pCanon = p.name
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/\s+/g, " ")
              .trim();
            return pCanon === canonicalName;
          });

          if (existingIdx >= 0) {
            // Atualiza produto existente (Edição em massa)
            workingProducts[existingIdx] = {
              ...workingProducts[existingIdx],
              name: rawName,
              category: category || workingProducts[existingIdx].category,
              price,
              description: description || workingProducts[existingIdx].description,
              image: image || workingProducts[existingIdx].image,
              isAvailable,
              popular,
            };
            updatedCount++;
          } else {
            // Insere novo produto
            const newProd: ProductItem = {
              id: id || `prod-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              name: rawName,
              category: category || "burgers",
              price,
              description,
              image,
              isAvailable,
              popular,
            };
            workingProducts.push(newProd);
            addedCount++;
          }
        }

        // Deduplicação final por nome em toda a lista
        const finalUnique: ProductItem[] = [];
        const finalSeen = new Set<string>();
        for (const item of workingProducts) {
          const cName = item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
          if (!finalSeen.has(cName)) {
            finalSeen.add(cName);
            finalUnique.push(item);
          } else {
            duplicateCount++;
          }
        }

        // Dispara sincronização
        if (onBulkUpdateProducts) {
          onBulkUpdateProducts(finalUnique);
        }

        setImportResult({
          fileName: file.name,
          total: rows.length,
          updated: updatedCount,
          added: addedCount,
          duplicates: duplicateCount,
        });
      } catch (error) {
        alert("Erro ao ler o arquivo Excel: " + String(error));
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      {/* Topo do Gestor de Cardápio */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#EFE9DF] shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🌭</span>
              <h2 className="text-base sm:text-lg font-black text-[#1F2421]">
                Gestão do Cardápio & Pausa Rápida (Esgotado)
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Altere preços em 1 clique e pause produtos que esgotaram com o interruptor liga/desliga (sincroniza na hora no celular do cliente e garçom).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Exportar Planilha Excel com todos os produtos como guia */}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              title="Baixar planilha Excel (.xlsx) com todos os produtos cadastrados para editar preços ou usar como guia oficial"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>📥 Baixar Excel / Guia</span>
            </button>

            {/* Input oculto para upload de Excel */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />

            {/* Importar Planilha Excel com Deduplicação Automática */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1F2421] hover:bg-black text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              title="Subir planilha preenchida: atualiza preços e dados em massa, adiciona novos itens e exclui repetidos automaticamente"
            >
              <Upload className="w-3.5 h-3.5 text-[#F4A261]" />
              <span>📤 Subir Planilha Excel</span>
            </button>

            {/* Adicionar Item Individual */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C83E2B] hover:bg-[#B03221] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="Cadastrar um novo item manualmente através do formulário na tela"
            >
              <Plus className="w-4 h-4" />
              <span>+ Novo Item</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="flex flex-col md:flex-row gap-3 mt-5 pt-4 border-t border-neutral-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar item no cardápio (ex: Catupiry, Smash, Guaraná)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-[#EFE9DF] bg-[#FDFBF7] outline-none focus:border-[#C83E2B]"
            />
          </div>

          <div className="relative flex items-center gap-1.5 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => categoryTabsRef.current?.scrollBy({ left: -240, behavior: "smooth" })}
              className="flex-shrink-0 w-7 h-7 rounded-xl bg-white border border-[#EFE9DF] hover:border-[#C83E2B] hover:text-[#C83E2B] text-neutral-600 flex items-center justify-center shadow-2xs transition-all cursor-pointer"
              title="Rolar categorias para a esquerda"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div
              ref={categoryTabsRef}
              onWheel={(e) => {
                if (categoryTabsRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                  categoryTabsRef.current.scrollLeft += e.deltaY;
                }
              }}
              className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scroll-smooth flex-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-neutral-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300 hover:[&::-webkit-scrollbar-thumb]:bg-[#C83E2B]/60 [&::-webkit-scrollbar-thumb]:rounded-full"
            >
              <button
                onClick={() => setSelectedCategory("todas")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === "todas"
                    ? "bg-[#1F2421] text-white shadow-xs"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                Todos ({products.length})
              </button>

              {CATEGORIES.map((cat) => {
                const count = products.filter((p) => p.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={(e) => {
                      setSelectedCategory(cat.id);
                      e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                      selectedCategory === cat.id
                        ? "bg-[#C83E2B] text-white border-[#C83E2B] shadow-xs"
                        : "bg-[#FDFBF7] text-neutral-700 border-[#EFE9DF] hover:bg-neutral-100"
                    }`}
                  >
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => categoryTabsRef.current?.scrollBy({ left: 240, behavior: "smooth" })}
              className="flex-shrink-0 w-7 h-7 rounded-xl bg-white border border-[#EFE9DF] hover:border-[#C83E2B] hover:text-[#C83E2B] text-neutral-600 flex items-center justify-center shadow-2xs transition-all cursor-pointer"
              title="Rolar categorias para a direita"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Resumo de Disponibilidade */}
        <div className="flex items-center gap-3 mt-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <strong className="text-emerald-700">{availableCount} Ativos</strong> no cardápio
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-neutral-400" />
            <strong className="text-neutral-600">{pausedCount} Pausados</strong> (Esgotados)
          </span>
        </div>
      </div>

      {/* Lista de Produtos do Cardápio */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => {
          const isAvailable = product.isAvailable !== false;
          const isEditing = editingPriceId === product.id;

          return (
            <div
              key={product.id}
              className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between shadow-xs ${
                isAvailable
                  ? "border-[#EFE9DF] hover:border-neutral-300"
                  : "border-neutral-200 bg-neutral-50/70 opacity-80"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#FDFBF7] border border-[#EFE9DF] overflow-hidden flex items-center justify-center flex-shrink-0">
                    {product.image && (product.image.startsWith("http") || product.image.startsWith("/")) ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">{product.image}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm font-black text-[#1F2421] truncate">
                        {product.name}
                      </h3>
                      {product.popular && (
                        <span className="text-[10px] font-bold bg-[#FEF6EC] text-[#D97706] px-1.5 py-0.2 rounded border border-[#FBD9B0]">
                          Favorito
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase text-neutral-400">
                      {product.category}
                    </span>
                  </div>

                  {/* Toggle Interruptor Liga / Desliga */}
                  <button
                    onClick={() => {
                      if (onToggleProductAvailability) {
                        onToggleProductAvailability(product.id);
                      }
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                      isAvailable
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                        : "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                    }`}
                    title={isAvailable ? "Clique para pausar este item (Esgotado)" : "Clique para reativar"}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isAvailable ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                      }`}
                    />
                    <span>{isAvailable ? "Ativo" : "Esgotado"}</span>
                  </button>
                </div>

                <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Linha de Preço e Ação Rápida */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-500">Preço:</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold">R$</span>
                      <input
                        type="text"
                        value={tempPrice}
                        onChange={(e) => setTempPrice(e.target.value)}
                        className="w-16 text-xs font-black px-1.5 py-1 rounded-lg border border-[#C83E2B] bg-white outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSavePrice(product.id)}
                        className="p-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                        title="Salvar novo preço"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingPriceId(null)}
                        className="p-1 rounded-lg bg-neutral-200 text-neutral-600 hover:bg-neutral-300 cursor-pointer"
                        title="Cancelar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-[#1F2421]">
                        R$ {product.price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleStartEditPrice(product)}
                        className="p-1 text-neutral-400 hover:text-[#C83E2B] rounded hover:bg-neutral-100 cursor-pointer"
                        title="Editar preço do lanche"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isAvailable
                        ? "bg-neutral-100 text-neutral-600"
                        : "bg-neutral-200 text-neutral-500 line-through"
                    }`}
                    title={isAvailable ? "Item ativo e visível no cardápio online e salão" : "Item pausado (esgotado na cozinha)"}
                  >
                    {isAvailable ? "Disponível" : "Esgotado"}
                  </span>

                  <button
                    onClick={() => setEditingProduct({ ...product })}
                    className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer transition-colors"
                    title={`Editar todos os dados de "${product.name}" (nome, categoria, descrição, valor, emoji)`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteProduct(product.id, product.name)}
                    className="p-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition-colors"
                    title={`Excluir "${product.name}" definitivamente do cardápio`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para Cadastrar Novo Lanche */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#EFE9DF] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DF] mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🍔</span>
                <h3 className="text-base font-black text-[#1F2421]">Cadastrar Novo Item</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-full hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Nome do Produto / Lanche:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Hot Dog Vulcão de Queijo"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-[#EFE9DF] outline-none focus:border-[#C83E2B]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Categoria:
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-[#EFE9DF] outline-none bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Preço (R$):
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    placeholder="22.00"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-[#EFE9DF] outline-none focus:border-[#C83E2B]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Emoji / Ícone:
                  </label>
                  <input
                    type="text"
                    value={newEmoji}
                    onChange={(e) => setNewEmoji(e.target.value)}
                    className="w-full text-center text-lg py-1.5 rounded-xl border border-[#EFE9DF] outline-none"
                    placeholder="🌭"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Sugestões:
                  </label>
                  <div className="flex gap-1.5 pt-1">
                    {["🌭", "🍔", "🍟", "🥪", "🥤", "🎁"].map((em) => (
                      <button
                        type="button"
                        key={em}
                        onClick={() => setNewEmoji(em)}
                        className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-base flex items-center justify-center cursor-pointer"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Ingredientes & Descrição:
                </label>
                <textarea
                  rows={2}
                  placeholder="Pão brioche selado, duas salsichas grelhadas, queijo especial..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE9DF] outline-none focus:border-[#C83E2B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 text-neutral-600 text-xs font-bold hover:bg-neutral-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C83E2B] text-white text-xs font-bold hover:bg-[#B03221] cursor-pointer"
                >
                  Salvar no Cardápio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Editar Item Existente */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#EFE9DF] shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DF] mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-neutral-100 text-neutral-800">
                  <Pencil className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-[#1F2421]">Editar Item do Cardápio</h3>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-xl hover:bg-neutral-100 cursor-pointer"
                title="Fechar sem salvar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Nome do Produto / Lanche:
                </label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE9DF] font-bold outline-none focus:border-[#C83E2B]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Categoria:
                  </label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE9DF] bg-white outline-none focus:border-[#C83E2B]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Preço (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE9DF] font-bold outline-none focus:border-[#C83E2B]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Ingredientes & Descrição:
                </label>
                <textarea
                  rows={2}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#EFE9DF] outline-none focus:border-[#C83E2B]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Emoji ou Ícone do Item:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingProduct.image}
                    onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                    className="w-16 text-center text-xl py-1 rounded-xl border border-[#EFE9DF] outline-none focus:border-[#C83E2B]"
                  />
                  <div className="flex items-center gap-1">
                    {["🌭", "🍔", "🥟", "🍕", "🍟", "🥤", "🍨"].map((em) => (
                      <button
                        type="button"
                        key={em}
                        onClick={() => setEditingProduct({ ...editingProduct, image: em })}
                        className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-base flex items-center justify-center cursor-pointer"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.popular || false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, popular: e.target.checked })}
                    className="rounded text-[#C83E2B]"
                  />
                  <span>Destacar como "Mais Pedido / Favorito"</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 text-neutral-600 text-xs font-bold hover:bg-neutral-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C83E2B] text-white text-xs font-bold hover:bg-[#B03221] cursor-pointer shadow-xs"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Relatório de Importação em Massa Excel */}
      {importResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#EFE9DF] shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DF]">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                </span>
                <div>
                  <h3 className="text-base font-black text-[#1F2421]">Importação Excel Concluída</h3>
                  <p className="text-[11px] text-neutral-500 font-mono truncate max-w-[220px]">{importResult.fileName}</p>
                </div>
              </div>
              <button
                onClick={() => setImportResult(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-xl hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                <span className="text-[10px] font-bold uppercase text-blue-700 block">Atualizados</span>
                <span className="text-xl font-black text-blue-900 mt-0.5 block">{importResult.updated}</span>
                <span className="text-[9px] text-blue-600">Preços / Dados</span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-emerald-700 block">Novos Itens</span>
                <span className="text-xl font-black text-emerald-900 mt-0.5 block">{importResult.added}</span>
                <span className="text-[9px] text-emerald-600">Inseridos</span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] font-bold uppercase text-amber-700 block">Repetidos</span>
                <span className="text-xl font-black text-amber-900 mt-0.5 block">{importResult.duplicates}</span>
                <span className="text-[9px] text-amber-600">Excluídos (Deduplicados)</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 space-y-1">
              <p className="font-bold text-neutral-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Deduplicação & Sincronização Automática:
              </p>
              <p className="text-[11px] text-neutral-500">
                O sistema comparou os itens existentes com a planilha. Todas as repetições foram eliminadas e o cardápio (incluindo o Bot WhatsApp IA e os celulares dos clientes) já está 100% atualizado!
              </p>
            </div>

            <button
              onClick={() => setImportResult(null)}
              className="w-full py-2.5 rounded-xl bg-[#1F2421] hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              OK, Entendido!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
