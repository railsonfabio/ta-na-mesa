export type OrderType = "mesa" | "delivery" | "retirada";

export type OrderChannel = "tanamesa" | "site_proprio" | "ifood" | "99food" | "keeta" | "api" | "whatsapp";

export type OrderStatus =
  | "pendente"
  | "em_preparo"
  | "a_caminho"
  | "entregue"
  | "cancelado";

export type TableStatus = "livre" | "ocupada" | "chamando_garcom" | "pedindo_conta";

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  options?: {
    name: string;
    choices: { label: string; priceDelta: number }[];
  }[];
  popular?: boolean;
  isAvailable?: boolean;
  prepSector?: "chapa" | "bar";
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  optionsSelected: string[];
  notes?: string;
  assignedToComandaId?: string;
  prepSector?: "chapa" | "bar";
  isReady?: boolean;
}

export interface Comanda {
  id: string;
  tableId: string;
  customerName: string;
  isConnectedViaPhone: boolean;
  status: "aberta" | "paga";
  items: CartItem[];
  total: number;
}

export interface Table {
  id: string;
  number: number;
  status: TableStatus;
  comandas: Comanda[];
  callReason?: string;
  assignedWaiter?: string;
  sector?: string;
  openedAt?: string; // Timestamp de abertura da mesa para cálculo do tempo de permanência
}

export interface Order {
  id: string;
  orderNumber: number;
  type: OrderType;
  tableNumber?: number;
  comandaName?: string;
  customerName: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  acceptedAt?: string;
  channel?: OrderChannel;
  externalOrderId?: string;
  deliveryAddress?: string;
  deliveryNeighborhood?: string;
  paymentMethod?: string;
  pixTxid?: string;
  couponCode?: string;
  courierId?: string;
  courierName?: string;
  courierPhone?: string;
  dispatchedAt?: string;
}

export interface DeliveryCourier {
  id: string;
  name: string;
  phone: string;
  vehicle?: string;
  fixedDailyRate?: number;
  active: boolean;
}

export interface StockItem {
  id: string;
  name: string;
  category: "carnes" | "paes_laticinios" | "hortifruti" | "bebidas" | "embalagens" | "outros";
  quantity: number;
  minQuantity: number;
  unit: "un" | "kg" | "g" | "lt" | "pct";
  unitCost: number;
  supplierName?: string;
  supplierPhone?: string;
  lastUpdated?: string;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  contactName: string;
  phone: string;
  email?: string;
  pixKey?: string;
  deliveryDays?: string;
  notes?: string;
}

export interface FinancialExpense {
  id: string;
  description: string;
  category: "fornecedores" | "aluguel_fixo" | "energia_agua_gas" | "equipe_salarios" | "marketing" | "outros";
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: "pendente" | "pago" | "vencido";
  supplierId?: string;
  paymentMethod?: string;
}
