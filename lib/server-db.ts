import fs from "fs";
import path from "path";
import { Table, Order, ProductItem, StockItem, Supplier, FinancialExpense, DeliveryCourier } from "./types";
import {
  INITIAL_TABLES,
  INITIAL_ORDERS,
  PRODUCTS,
  DEMO_SIMULATION_TABLES,
  DEMO_SIMULATION_ORDERS,
  INITIAL_STOCK,
  INITIAL_SUPPLIERS,
  INITIAL_EXPENSES,
} from "./mock-data";
import { CustomerReview } from "./store";

export interface DeliverySetting {
  neighborhood: string;
  fee: number;
  estimatedMinutes: string;
  active: boolean;
}

export interface StoreCoupon {
  code: string;
  discountPercent?: number;
  discountFixed?: number;
  freeDelivery?: boolean;
  minOrderValue?: number;
  maxDeliverySubsidy?: number;
  active: boolean;
}

export interface StoreSettings {
  storeName: string;
  logoUrl?: string;
  isOpen: boolean;
  minOrderValue: number;
  deliveryType: "bairro" | "fixa";
  fixedDeliveryFee: number;
  neighborhoods: DeliverySetting[];
  coupons: StoreCoupon[];
  couriers?: DeliveryCourier[];
  aloPartnerMinOrder?: number;
  aloPartnerMaxSubsidy?: number;
  pixKey?: string;
  phone?: string;
  address?: string;
  openingHours?: string;
  // Módulos Corporativos Inspirados no Colibri / Totvs (Toggles Opcionais)
  enableBlindCashClose?: boolean; // Fechamento de Caixa Cego (Auditoria física sem viés)
  enableTableTimer?: boolean;     // Contador de Permanência na Mesa / Modo Rodízio
  enableTvOrderPanel?: boolean;   // Painel de Chamada de Senhas para TV (/painel-senhas)
  thermalPrintWidth?: "80mm" | "58mm"; // Largura da Bobina Térmica
  enableAutoPrintOnAccept?: boolean;   // Impressão térmica automática ao aceitar pedido no PDV
  enablePersistentSoundAlert?: boolean; // Campainha persistente (estilo iFood) enquanto houver pedido pendente
}

export interface AppDatabaseState {
  version: number;
  lastUpdated: string;
  tables: Table[];
  orders: Order[];
  products: ProductItem[];
  reviews: CustomerReview[];
  settings: StoreSettings;
  stock: StockItem[];
  suppliers: Supplier[];
  expenses: FinancialExpense[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Brasa & Burger Grill",
  logoUrl: "/demo_restaurant_logo.svg",
  isOpen: true,
  minOrderValue: 15.0,
  deliveryType: "bairro",
  fixedDeliveryFee: 8.0,
  openingHours: "Terça a Domingo das 18h às 23h30",
  address: "Av. Eng. Roberto Freire, 2150 - Ponta Negra, Natal/RN",
  phone: "(84) 99876-5432",
  pixKey: "financeiro@a2isolutions.com.br",
  enableBlindCashClose: false, // Default desativado (opcional pelo lojista)
  enableTableTimer: true,      // Default ativo para controle visual de salão
  enableTvOrderPanel: true,    // Default ativo para exibir rota /painel-senhas
  thermalPrintWidth: "80mm",   // Default 80mm
  enableAutoPrintOnAccept: false,
  enablePersistentSoundAlert: true,
  aloPartnerMinOrder: 35.0,
  aloPartnerMaxSubsidy: 8.0,
  couriers: [
    {
      id: "mot-1",
      name: "Carlos Motoboy (Fixo)",
      phone: "84998112233",
      vehicle: "Honda CG 160 • QXZ-4B21",
      fixedDailyRate: 50,
      active: true,
    },
    {
      id: "mot-2",
      name: "Júnior Express",
      phone: "84998223344",
      vehicle: "Yamaha Factor 150 • RNT-8A90",
      fixedDailyRate: 50,
      active: true,
    },
    {
      id: "mot-3",
      name: "Roberto Entregas",
      phone: "84998334455",
      vehicle: "Honda Pop 110i • NTL-1C45",
      fixedDailyRate: 40,
      active: true,
    },
  ],
  neighborhoods: [
    { neighborhood: "Ponta Negra", fee: 5.0, estimatedMinutes: "25-40 min", active: true },
    { neighborhood: "Capim Macio", fee: 7.0, estimatedMinutes: "30-45 min", active: true },
    { neighborhood: "Neópolis / Pirangi", fee: 8.0, estimatedMinutes: "35-50 min", active: true },
    { neighborhood: "Candelária", fee: 10.0, estimatedMinutes: "40-55 min", active: true },
    { neighborhood: "Lagoa Nova", fee: 10.0, estimatedMinutes: "45-60 min", active: true },
    { neighborhood: "Tirol / Petrópolis", fee: 12.0, estimatedMinutes: "45-60 min", active: true },
    { neighborhood: "Retirada no Balcão (Takeaway)", fee: 0.0, estimatedMinutes: "20-30 min", active: true },
  ],
  coupons: [
    { code: "PRIMEIRACOMPRA", discountPercent: 10, minOrderValue: 30, active: true },
    { code: "FRETEGRATIS", freeDelivery: true, minOrderValue: 35, maxDeliverySubsidy: 8, active: true },
    { code: "QUERO10", discountPercent: 10, minOrderValue: 25, active: true },
  ],
};

let memoryState: AppDatabaseState | null = null;
type Listener = (state: AppDatabaseState, notification?: string) => void;
const listeners: Set<Listener> = new Set();

export function subscribeToDb(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(state: AppDatabaseState, notification?: string) {
  listeners.forEach((listener) => {
    try {
      listener(state, notification);
    } catch {
      // Ignore listener error
    }
  });
}

function deduplicateProductsList(products: ProductItem[]): ProductItem[] {
  if (!Array.isArray(products)) return PRODUCTS;
  const map = new Map<string, ProductItem>();

  for (const item of products) {
    if (!item || !item.name) continue;
    const key = item.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const existing = map.get(key);
    if (!existing) {
      map.set(key, item);
    } else {
      // Preserva o item que possui URL de imagem real (http) ou ID original curto
      const existingHasPhoto = existing.image?.startsWith("http");
      const newHasPhoto = item.image?.startsWith("http");
      if (!existingHasPhoto && newHasPhoto) {
        map.set(key, { ...item, price: existing.price, isAvailable: existing.isAvailable });
      }
    }
  }

  return Array.from(map.values());
}

function mergeOrdersSafely(currentOrders: Order[], incomingOrders?: Order[]): Order[] {
  if (!incomingOrders) return currentOrders;
  if (incomingOrders.length === 0) return [];

  const statusRank: Record<string, number> = {
    pendente: 1,
    em_preparo: 2,
    a_caminho: 3,
    entregue: 4,
    cancelado: 5,
  };

  const map = new Map<string, Order>();

  // Primeiro carrega os pedidos que acabaram de chegar do cliente/PDV
  for (const ord of incomingOrders) {
    if (ord && ord.id) {
      map.set(ord.id, ord);
    }
  }

  // Garante que nenhum pedido recém-criado por outro aparelho no servidor seja perdido por race condition
  for (const existing of currentOrders) {
    if (!existing || !existing.id) continue;
    const incoming = map.get(existing.id);
    if (!incoming) {
      map.set(existing.id, existing);
    } else {
      // Se ambos existem, preserva o status mais avançado e dados de entregador atribuído
      const existingRank = statusRank[existing.status] || 1;
      const incomingRank = statusRank[incoming.status] || 1;
      const chosenStatus = incomingRank >= existingRank ? incoming.status : existing.status;

      map.set(existing.id, {
        ...existing,
        ...incoming,
        status: chosenStatus,
        courierId: incoming.courierId || existing.courierId,
        courierName: incoming.courierName || existing.courierName,
        courierPhone: incoming.courierPhone || existing.courierPhone,
        dispatchedAt: incoming.dispatchedAt || existing.dispatchedAt,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => (b.orderNumber || 0) - (a.orderNumber || 0));
}

export function getDb(): AppDatabaseState {
  if (memoryState) return memoryState;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.products)) {
        parsed.products = deduplicateProductsList(parsed.products);
      }
      if (!parsed.stock || parsed.stock.length === 0) parsed.stock = INITIAL_STOCK;
      if (!parsed.suppliers || parsed.suppliers.length === 0) parsed.suppliers = INITIAL_SUPPLIERS;
      if (!parsed.expenses || parsed.expenses.length === 0) parsed.expenses = INITIAL_EXPENSES;
      parsed.settings = {
        ...DEFAULT_SETTINGS,
        ...(parsed.settings || {}),
        couriers:
          parsed.settings?.couriers && parsed.settings.couriers.length > 0
            ? parsed.settings.couriers
            : DEFAULT_SETTINGS.couriers,
      };
      memoryState = parsed;
      return memoryState!;
    }
  } catch (err) {
    console.error("Erro lendo db.json local:", err);
  }

  // Initial state fallback
  memoryState = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    tables: INITIAL_TABLES,
    orders: INITIAL_ORDERS,
    products: PRODUCTS,
    reviews: [
      {
        id: "rev-1",
        customerName: "Fábio Barbosa",
        rating: 5,
        tags: ["Comida Quentinha", "Atendimento Rápido"],
        comment: "Excelente hambúrguer e atendimento rápido!",
        createdAt: "Ontem às 21:30",
      },
    ],
    settings: DEFAULT_SETTINGS,
    stock: INITIAL_STOCK,
    suppliers: INITIAL_SUPPLIERS,
    expenses: INITIAL_EXPENSES,
  };

  saveDb(memoryState);
  return memoryState;
}

export function saveDb(newState: Partial<AppDatabaseState>, notification?: string): AppDatabaseState {
  const current = getDb();
  const updated: AppDatabaseState = {
    ...current,
    ...newState,
    orders: newState.orders ? mergeOrdersSafely(current.orders, newState.orders) : current.orders,
    products: newState.products ? deduplicateProductsList(newState.products) : current.products,
    version: current.version + 1,
    lastUpdated: new Date().toISOString(),
  };

  memoryState = updated;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(updated, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro salvando db.json:", err);
  }

  notifyListeners(updated, notification);
  return updated;
}

export function resetDbClean(notification?: string): AppDatabaseState {
  const current = getDb();
  const cleanState: AppDatabaseState = {
    ...current,
    tables: INITIAL_TABLES.map((t) => ({ ...t, status: "livre" as const, comandas: [] })),
    orders: [],
    version: current.version + 1,
    lastUpdated: new Date().toISOString(),
  };

  memoryState = cleanState;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(cleanState, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro resetando db.json:", err);
  }

  notifyListeners(cleanState, notification || "🧹 Salão limpo! Todas as 10 mesas livres e pedidos zerados.");
  return cleanState;
}

export function seedDbDemo(notification?: string): AppDatabaseState {
  const current = getDb();
  const demoState: AppDatabaseState = {
    ...current,
    tables: JSON.parse(JSON.stringify(DEMO_SIMULATION_TABLES)),
    orders: JSON.parse(JSON.stringify(DEMO_SIMULATION_ORDERS)),
    version: current.version + 1,
    lastUpdated: new Date().toISOString(),
  };

  memoryState = demoState;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(demoState, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro semeando dados de teste em db.json:", err);
  }

  notifyListeners(demoState, notification || "🧪 Simulação carregada! Mesas e pedidos de teste ativos.");
  return demoState;
}
