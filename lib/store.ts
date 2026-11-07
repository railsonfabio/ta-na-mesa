"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import { Table, Order, Comanda, CartItem, ProductItem } from "./types";
import { INITIAL_TABLES, INITIAL_ORDERS, PRODUCTS } from "./mock-data";
import type { StoreSettings } from "./server-db";
import {
  getSupabaseBrowserClient,
  resolveActiveStoreId,
} from "./supabase-client";

const STORAGE_KEYS = {
  TABLES: "tanamesa_tables_v3",
  ORDERS: "tanamesa_orders_v3",
  REVIEWS: "tanamesa_reviews_v3",
  PRODUCTS: "tanamesa_products_v3",
  ACTIVE_STORE_ID: "tanamesa_active_store_id_v3",
};

export interface CustomerReview {
  id: string;
  tableNumber?: number;
  customerName: string;
  rating: number;
  tags: string[];
  comment?: string;
  createdAt: string;
}

// =========================================================================================
// MAPEADORES RELACIONAIS (PostgreSQL Supabase <-> Interfaces Frontend TypeScript)
// =========================================================================================

function mapDbOrderToOrder(row: any, itemRows: any[] = []): Order {
  const items: CartItem[] = itemRows.map((it) => ({
    id: String(it.id),
    productId: String(it.product_id || it.id),
    name: String(it.name || ""),
    price: Number(it.price || 0),
    quantity: Number(it.quantity || 1),
    optionsSelected: Array.isArray(it.options_selected)
      ? it.options_selected
      : [],
    notes: it.notes || undefined,
    prepSector: it.prep_sector === "bar" ? "bar" : "chapa",
    isReady: Boolean(it.is_ready),
  }));

  return {
    id: String(row.id),
    orderNumber: Number(row.order_number || 100),
    type: row.type || "delivery",
    channel: row.channel || "site_proprio",
    externalOrderId: row.external_order_id || undefined,
    tableNumber: row.table_number ? Number(row.table_number) : undefined,
    comandaName: row.comanda_name || undefined,
    customerName: row.customer_name || "Cliente",
    customerPhone: row.customer_phone || undefined,
    items,
    subtotal: Number(row.subtotal || 0),
    deliveryFee: Number(row.delivery_fee || 0),
    discount: Number(row.discount || 0),
    total: Number(row.total || 0),
    status: row.status || "pendente",
    createdAt: row.created_at
      ? new Date(row.created_at).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Agora mesmo",
    acceptedAt: row.accepted_at || undefined,
    deliveryAddress: row.delivery_address || undefined,
    deliveryNeighborhood: row.delivery_neighborhood || undefined,
    paymentMethod: row.payment_method || undefined,
    pixTxid: row.pix_txid || undefined,
    couponCode: row.coupon_code || undefined,
    courierId: row.courier_id || undefined,
    courierName: row.courier_name || undefined,
    courierPhone: row.courier_phone || undefined,
    dispatchedAt: row.dispatched_at || undefined,
  };
}

function mapDbTableAndComandasToTable(
  tableRow: any,
  comandaRows: any[] = [],
  comandaItemRows: any[] = []
): Table {
  const tableComandas = comandaRows.filter(
    (c) =>
      c.table_id === tableRow.id ||
      Number(c.table_number) === Number(tableRow.table_number)
  );

  const mappedComandas: Comanda[] = tableComandas.map((c) => {
    const cItems: CartItem[] = comandaItemRows
      .filter((ci) => ci.comanda_id === c.id)
      .map((ci) => ({
        id: String(ci.id),
        productId: String(ci.product_id || ci.id),
        name: String(ci.name || ""),
        price: Number(ci.price || 0),
        quantity: Number(ci.quantity || 1),
        optionsSelected: Array.isArray(ci.options_selected)
          ? ci.options_selected
          : [],
        notes: ci.notes || undefined,
        prepSector: ci.prep_sector === "bar" ? "bar" : "chapa",
        isReady: Boolean(ci.is_ready),
      }));

    return {
      id: String(c.id),
      tableId: String(tableRow.id || `t-${tableRow.table_number}`),
      customerName: String(c.customer_name || "Cliente"),
      isConnectedViaPhone: Boolean(c.is_connected_via_phone),
      items: cItems,
      total: Number(c.total || 0),
      status: c.status === "paga" ? "paga" : "aberta",
    };
  });

  return {
    id: String(tableRow.id || `t-${tableRow.table_number}`),
    number: Number(tableRow.table_number),
    status: tableRow.status || "livre",
    callReason: tableRow.call_reason || undefined,
    assignedWaiter: tableRow.assigned_waiter || undefined,
    sector: tableRow.sector || "salao",
    openedAt: tableRow.opened_at || undefined,
    comandas: mappedComandas,
  };
}

function mapDbProductToProductItem(row: any): ProductItem {
  return {
    id: String(row.external_code || row.id),
    name: String(row.name || ""),
    category: String(row.category || "lanches"),
    price: Number(row.price || 0),
    description: String(row.description || ""),
    image: String(row.image_url || "🍽️"),
    options: Array.isArray(row.options_json) ? row.options_json : undefined,
    popular: Boolean(row.popular),
    isAvailable: row.is_available !== false,
    prepSector: row.prep_sector === "bar" ? "bar" : "chapa",
  };
}

function mapDbStoreToSettings(
  storeRow: any,
  neighborhoodRows: any[] = [],
  couponRows: any[] = [],
  courierRows: any[] = []
): StoreSettings {
  return {
    storeName: String(storeRow.store_name || "Restaurante Parceiro"),
    logoUrl: storeRow.logo_url || "/demo_restaurant_logo.svg",
    isOpen: storeRow.is_open !== false,
    minOrderValue: Number(storeRow.min_order_value ?? 15),
    deliveryType: storeRow.delivery_type === "fixa" ? "fixa" : "bairro",
    fixedDeliveryFee: Number(storeRow.fixed_delivery_fee ?? 8),
    pixKey: storeRow.pix_key || undefined,
    phone: storeRow.phone || undefined,
    address: storeRow.address || undefined,
    openingHours: storeRow.opening_hours || undefined,
    aloPartnerMinOrder: Number(storeRow.alo_partner_min_order ?? 35),
    aloPartnerMaxSubsidy: Number(storeRow.alo_partner_max_subsidy ?? 8),
    enableBlindCashClose: Boolean(storeRow.enable_blind_cash_close),
    enableTableTimer: storeRow.enable_table_timer !== false,
    enableTvOrderPanel: storeRow.enable_tv_order_panel !== false,
    thermalPrintWidth: storeRow.thermal_print_width === "58mm" ? "58mm" : "80mm",
    enableAutoPrintOnAccept: Boolean(storeRow.enable_auto_print_on_accept),
    enablePersistentSoundAlert: storeRow.enable_persistent_sound_alert !== false,
    neighborhoods: neighborhoodRows.map((n) => ({
      neighborhood: String(n.neighborhood),
      fee: Number(n.fee || 0),
      estimatedMinutes: String(n.estimated_minutes || "30-45 min"),
      active: n.active !== false,
    })),
    coupons: couponRows.map((c) => ({
      code: String(c.code),
      discountPercent:
        c.discount_percent !== null && c.discount_percent !== undefined
          ? Number(c.discount_percent)
          : undefined,
      discountFixed:
        c.discount_fixed !== null && c.discount_fixed !== undefined
          ? Number(c.discount_fixed)
          : undefined,
      freeDelivery: Boolean(c.free_delivery),
      minOrderValue:
        c.min_order_value !== null && c.min_order_value !== undefined
          ? Number(c.min_order_value)
          : undefined,
      maxDeliverySubsidy:
        c.max_delivery_subsidy !== null && c.max_delivery_subsidy !== undefined
          ? Number(c.max_delivery_subsidy)
          : undefined,
      active: c.active !== false,
    })),
    couriers: courierRows.map((cr) => ({
      id: String(cr.id),
      name: String(cr.name),
      phone: String(cr.phone),
      vehicle: cr.vehicle || "Moto Delivery",
      fixedDailyRate: Number(cr.fixed_daily_rate ?? 50),
      active: cr.active !== false,
    })),
  };
}

// =========================================================================================
// LEITURA DIRETA DO ESTADO NO SUPABASE FILTRADO POR `store_id`
// =========================================================================================

export async function fetchStoreOperationalStateFromSupabase(
  storeId: string
): Promise<{
  orders: Order[];
  tables: Table[];
  comandas: Comanda[];
  products: ProductItem[];
  settings?: StoreSettings;
} | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  const supabase = getSupabaseBrowserClient();

  const [
    storeRes,
    neighborhoodsRes,
    couponsRes,
    couriersRes,
    productsRes,
    ordersRes,
    orderItemsRes,
    tablesRes,
    comandasRes,
    comandaItemsRes,
  ] = await Promise.all([
    supabase.from("stores").select("*").eq("id", storeId).maybeSingle(),
    supabase
      .from("store_neighborhoods")
      .select("*")
      .eq("store_id", storeId)
      .order("neighborhood", { ascending: true }),
    supabase.from("store_coupons").select("*").eq("store_id", storeId),
    supabase.from("store_couriers").select("*").eq("store_id", storeId),
    supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: true }),
    supabase
      .from("orders")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false }),
    supabase.from("order_items").select("*").eq("store_id", storeId),
    supabase
      .from("restaurant_tables")
      .select("*")
      .eq("store_id", storeId)
      .order("table_number", { ascending: true }),
    supabase
      .from("comandas")
      .select("*")
      .eq("store_id", storeId)
      .eq("status", "aberta"),
    supabase.from("comanda_items").select("*").eq("store_id", storeId),
  ]);

  if (ordersRes.error && tablesRes.error && storeRes.error) {
    return null;
  }

  const rawOrders = ordersRes.data || [];
  const rawOrderItems = orderItemsRes.data || [];
  const rawTables = tablesRes.data || [];
  const rawComandas = comandasRes.data || [];
  const rawComandaItems = comandaItemsRes.data || [];
  const rawProducts = productsRes.data || [];

  const mappedOrders: Order[] = rawOrders.map((ord) =>
    mapDbOrderToOrder(
      ord,
      rawOrderItems.filter((it) => it.order_id === ord.id)
    )
  );

  const mappedTables: Table[] =
    rawTables.length > 0
      ? rawTables.map((tb) =>
          mapDbTableAndComandasToTable(tb, rawComandas, rawComandaItems)
        )
      : INITIAL_TABLES;

  const allComandas: Comanda[] = mappedTables.flatMap((t) => t.comandas);

  const mappedProducts: ProductItem[] =
    rawProducts.length > 0
      ? rawProducts.map(mapDbProductToProductItem)
      : PRODUCTS;

  const mappedSettings: StoreSettings | undefined = storeRes.data
    ? mapDbStoreToSettings(
        storeRes.data,
        neighborhoodsRes.data || [],
        couponsRes.data || [],
        couriersRes.data || []
      )
    : undefined;

  return {
    orders: mappedOrders,
    tables: mappedTables,
    comandas: allComandas,
    products: mappedProducts,
    settings: mappedSettings,
  };
}

// =========================================================================================
// HOOK OFICIAL DE SINCRONIZAÇÃO EM TEMPO REAL COM SUPABASE REALTIME (`useSyncStore`)
// =========================================================================================

export function useSyncStore(explicitStoreId?: string) {
  const [storeId, setStoreId] = useState<string | null>(
    explicitStoreId || null
  );
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [products, setProducts] = useState<ProductItem[]>(PRODUCTS);
  const [settings, setSettings] = useState<StoreSettings | undefined>(
    undefined
  );
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshFromSupabase = useCallback(async (activeStoreId: string) => {
    const cloudState =
      await fetchStoreOperationalStateFromSupabase(activeStoreId);
    if (cloudState) {
      setOrders(cloudState.orders);
      setTables(cloudState.tables);
      setComandas(cloudState.comandas);
      setProducts(cloudState.products);
      if (cloudState.settings) {
        setSettings(cloudState.settings);
      }
      saveStateToStorage(
        cloudState.tables,
        cloudState.orders,
        undefined,
        cloudState.products
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let isMounted = true;

    async function bootstrapRealtime() {
      const resolvedId = await resolveActiveStoreId(explicitStoreId);
      if (!isMounted) return;

      if (!resolvedId) {
        const local = loadInitialData();
        setOrders(local.orders);
        setTables(local.tables);
        setComandas(local.tables.flatMap((t) => t.comandas));
        setProducts(local.products);
        setReviews(local.reviews);
        setLoading(false);
        return;
      }

      setStoreId(resolvedId);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_STORE_ID, resolvedId);
      }

      // 1. Leitura do estado inicial das tabelas `stores`, `products`, `orders`, `restaurant_tables` e `comandas`
      await refreshFromSupabase(resolvedId);

      // 2. Assinatura dos canais WebSockets do Supabase Realtime (postgres_changes) filtrados por `store_id`
      const supabase = getSupabaseBrowserClient();
      channel = supabase
        .channel(`operacao-loja-${resolvedId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `store_id=eq.${resolvedId}`,
          },
          () => {
            refreshFromSupabase(resolvedId);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "order_items",
            filter: `store_id=eq.${resolvedId}`,
          },
          () => {
            refreshFromSupabase(resolvedId);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "restaurant_tables",
            filter: `store_id=eq.${resolvedId}`,
          },
          () => {
            refreshFromSupabase(resolvedId);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "comandas",
            filter: `store_id=eq.${resolvedId}`,
          },
          () => {
            refreshFromSupabase(resolvedId);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "comanda_items",
            filter: `store_id=eq.${resolvedId}`,
          },
          () => {
            refreshFromSupabase(resolvedId);
          }
        )
        .subscribe();
    }

    bootstrapRealtime();

    return () => {
      isMounted = false;
      if (channel) {
        const supabase = getSupabaseBrowserClient();
        supabase.removeChannel(channel);
      }
    };
  }, [explicitStoreId, refreshFromSupabase]);

  return {
    storeId,
    orders,
    tables,
    comandas,
    products,
    settings,
    reviews,
    loading,
    setOrders,
    setTables,
    setComandas,
    setProducts,
    setSettings,
    setReviews,
    refresh: () =>
      storeId ? refreshFromSupabase(storeId) : Promise.resolve(),
  };
}

// =========================================================================================
// FUNÇÕES DE PERSISTÊNCIA EM NUVEM (SUPABASE) E COMPATIBILIDADE COM AS ROTAS OPERACIONAIS
// =========================================================================================

export function loadInitialData(): {
  tables: Table[];
  orders: Order[];
  reviews: CustomerReview[];
  products: ProductItem[];
} {
  if (typeof window === "undefined") {
    return {
      tables: INITIAL_TABLES,
      orders: INITIAL_ORDERS,
      reviews: [],
      products: PRODUCTS,
    };
  }

  try {
    const savedTables = localStorage.getItem(STORAGE_KEYS.TABLES);
    const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
    const savedReviews = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);

    return {
      tables: savedTables ? JSON.parse(savedTables) : INITIAL_TABLES,
      orders: savedOrders ? JSON.parse(savedOrders) : INITIAL_ORDERS,
      products: savedProducts ? JSON.parse(savedProducts) : PRODUCTS,
      reviews: savedReviews ? JSON.parse(savedReviews) : [],
    };
  } catch {
    return {
      tables: INITIAL_TABLES,
      orders: INITIAL_ORDERS,
      reviews: [],
      products: PRODUCTS,
    };
  }
}

export function saveStateToStorage(
  tables: Table[],
  orders: Order[],
  reviews?: CustomerReview[],
  products?: ProductItem[]
) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    if (reviews) {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    }
    if (products) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    }
  } catch (err) {
    console.error("Erro ao salvar no cache local:", err);
  }
}

/**
 * Grava mutações de `orders`, `restaurant_tables` e `comandas` diretamente no Supabase
 * filtradas pelo `store_id` ativo, disparando eventos WebSocket (`postgres_changes`)
 * automaticamente para todos os terminais conectados (/gestor, /cozinha, /garcom e cliente).
 */
export async function syncStateWithServer(
  tables: Table[],
  orders: Order[],
  reviews?: CustomerReview[],
  products?: ProductItem[],
  _settings?: any,
  _notification?: string,
  _stock?: any[],
  _suppliers?: any[],
  _expenses?: any[],
  explicitStoreId?: string
) {
  saveStateToStorage(tables, orders, reviews, products);
  if (typeof window === "undefined") return;

  if ("BroadcastChannel" in window) {
    try {
      const bc = new BroadcastChannel("tanamesa_realtime_sync");
      bc.postMessage({
        type: "STATE_UPDATE",
        tables,
        orders,
        products,
        reviews,
      });
      bc.close();
    } catch {
      // BroadcastChannel indisponível
    }
  }

  const cachedStoreId = localStorage.getItem(STORAGE_KEYS.ACTIVE_STORE_ID) || undefined;
  const storeId = await resolveActiveStoreId(explicitStoreId || cachedStoreId);
  if (
    !storeId ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return;
  }

  try {
    const supabase = getSupabaseBrowserClient();

    // 1. Upsert das mesas (`restaurant_tables`) da loja
    if (tables && tables.length > 0) {
      const tablePayload = tables.map((t) => ({
        store_id: storeId,
        table_number: t.number,
        status: t.status,
        call_reason: t.callReason || null,
        assigned_waiter: t.assignedWaiter || null,
        sector: t.sector || "salao",
        opened_at: t.openedAt || null,
        updated_at: new Date().toISOString(),
      }));

      await supabase
        .from("restaurant_tables")
        .upsert(tablePayload, { onConflict: "store_id,table_number" });
    }

    // 2. Upsert dos pedidos (`orders`) e seus itens (`order_items`) da loja
    if (orders && orders.length > 0) {
      for (const ord of orders) {
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            ord.id
          );

        const orderPayload: Record<string, any> = {
          store_id: storeId,
          order_number: ord.orderNumber,
          type: ord.type,
          channel: ord.channel || "site_proprio",
          table_number: ord.tableNumber || null,
          comanda_name: ord.comandaName || null,
          customer_name: ord.customerName,
          customer_phone: ord.customerPhone || null,
          subtotal: ord.subtotal ?? ord.total,
          delivery_fee: ord.deliveryFee ?? 0,
          discount: ord.discount ?? 0,
          total: ord.total,
          status: ord.status,
          delivery_address: ord.deliveryAddress || null,
          delivery_neighborhood: ord.deliveryNeighborhood || null,
          payment_method: ord.paymentMethod || null,
          pix_txid:
            ord.pixTxid ||
            (ord.paymentMethod === "pix" ? `PEDIDO${ord.orderNumber}` : null),
          coupon_code: ord.couponCode || null,
          courier_name: ord.courierName || null,
          courier_phone: ord.courierPhone || null,
          accepted_at: ord.acceptedAt || null,
          dispatched_at: ord.dispatchedAt || null,
        };

        if (isUuid) {
          orderPayload.id = ord.id;
        }

        const { data: savedOrder } = await supabase
          .from("orders")
          .upsert(orderPayload)
          .select("id")
          .single();

        if (savedOrder?.id) {
          try {
            const rawMap = localStorage.getItem("tanamesa_tracked_order_uuids_v1");
            const uuidMap = rawMap ? JSON.parse(rawMap) : {};
            uuidMap[String(ord.orderNumber)] = savedOrder.id;
            localStorage.setItem(
              "tanamesa_tracked_order_uuids_v1",
              JSON.stringify(uuidMap)
            );
          } catch {}
        }

        if (savedOrder?.id && ord.items?.length > 0) {
          await supabase
            .from("order_items")
            .delete()
            .eq("order_id", savedOrder.id)
            .eq("store_id", storeId);

          const itemsPayload = ord.items.map((it) => ({
            store_id: storeId,
            order_id: savedOrder.id,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            options_selected: it.optionsSelected || [],
            notes: it.notes || null,
            prep_sector: it.prepSector || "chapa",
            is_ready: Boolean(it.isReady),
          }));

          await supabase.from("order_items").insert(itemsPayload);
        }
      }
    }
  } catch (err) {
    console.error("Erro sincronizando com Supabase:", err);
  }
}

/**
 * Inicializa a escuta Realtime via Supabase WebSockets (`postgres_changes`)
 * nas rotas operacionais (/gestor, /cozinha, /garcom e cardápio do cliente),
 * eliminando a dependência do antigo `store-db.json` local.
 */
export function initRealtimeSync(
  onStateUpdate: (data: {
    tables?: Table[];
    orders?: Order[];
    products?: ProductItem[];
    reviews?: CustomerReview[];
    settings?: any;
    stock?: any[];
    suppliers?: any[];
    expenses?: any[];
    notification?: string;
  }) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  let supabaseChannel: RealtimeChannel | null = null;
  let broadcastChannel: BroadcastChannel | null = null;
  let isDisposed = false;

  resolveActiveStoreId().then(async (storeId) => {
    if (isDisposed || !storeId) return;

    const initial = await fetchStoreOperationalStateFromSupabase(storeId);
    if (initial && !isDisposed) {
      saveStateToStorage(initial.tables, initial.orders, undefined, initial.products);
      onStateUpdate({
        tables: initial.tables,
        orders: initial.orders,
        products: initial.products,
        settings: initial.settings,
      });
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    supabaseChannel = supabase
      .channel(`realtime-sync-${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `store_id=eq.${storeId}`,
        },
        async () => {
          const updated = await fetchStoreOperationalStateFromSupabase(storeId);
          if (updated && !isDisposed) {
            saveStateToStorage(updated.tables, updated.orders);
            onStateUpdate({ tables: updated.tables, orders: updated.orders });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
          filter: `store_id=eq.${storeId}`,
        },
        async () => {
          const updated = await fetchStoreOperationalStateFromSupabase(storeId);
          if (updated && !isDisposed) {
            saveStateToStorage(updated.tables, updated.orders);
            onStateUpdate({ tables: updated.tables, orders: updated.orders });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "restaurant_tables",
          filter: `store_id=eq.${storeId}`,
        },
        async () => {
          const updated = await fetchStoreOperationalStateFromSupabase(storeId);
          if (updated && !isDisposed) {
            saveStateToStorage(updated.tables, updated.orders);
            onStateUpdate({ tables: updated.tables, orders: updated.orders });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comandas",
          filter: `store_id=eq.${storeId}`,
        },
        async () => {
          const updated = await fetchStoreOperationalStateFromSupabase(storeId);
          if (updated && !isDisposed) {
            saveStateToStorage(updated.tables, updated.orders);
            onStateUpdate({ tables: updated.tables, orders: updated.orders });
          }
        }
      )
      .subscribe();
  });

  if ("BroadcastChannel" in window) {
    broadcastChannel = new BroadcastChannel("tanamesa_realtime_sync");
    broadcastChannel.onmessage = (event) => {
      const msg = event.data;
      if (msg.type === "STATE_UPDATE") {
        onStateUpdate({
          tables: msg.tables,
          orders: msg.orders,
          products: msg.products,
          reviews: msg.reviews,
        });
      }
    };
  }

  return () => {
    isDisposed = true;
    if (supabaseChannel) {
      const supabase = getSupabaseBrowserClient();
      supabase.removeChannel(supabaseChannel);
    }
    if (broadcastChannel) {
      broadcastChannel.close();
    }
  };
}

export async function resetCleanStateOnServer(_notification?: string) {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.TABLES);
  }

  const storeId = await resolveActiveStoreId();
  if (
    storeId &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const supabase = getSupabaseBrowserClient();
    await supabase.from("orders").delete().eq("store_id", storeId);
    await supabase.from("comandas").delete().eq("store_id", storeId);
    await supabase
      .from("restaurant_tables")
      .update({ status: "livre", call_reason: null, opened_at: null })
      .eq("store_id", storeId);
  }

  const cleanTables = INITIAL_TABLES.map((t) => ({
    ...t,
    status: "livre" as const,
    callReason: undefined,
    openedAt: undefined,
    comandas: [],
  }));

  return {
    tables: cleanTables,
    orders: [],
    products: PRODUCTS,
    reviews: [],
  };
}

export async function seedDemoStateOnServer(_notification?: string) {
  saveStateToStorage(INITIAL_TABLES, INITIAL_ORDERS);
  return {
    tables: INITIAL_TABLES,
    orders: INITIAL_ORDERS,
    products: PRODUCTS,
    reviews: [],
  };
}

// =========================================================================================
// BLOCO 4: RASTREADOR AO VIVO DO CLIENTE COM ISOLAMENTO RLS (`id` + `customer_phone`)
// =========================================================================================

/**
 * Busca um único pedido rastreado pelo consumidor final (role `anon`) enviando os headers
 * `x-tracked-order-id` e `x-customer-phone` exigidos pela policy `orders_customer_track_select`.
 */
export async function fetchCustomerTrackedOrderFromSupabase(
  orderId: string,
  customerPhone: string
): Promise<Order | null> {
  if (
    !orderId ||
    !customerPhone ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  const cleanPhone = customerPhone.replace(/\D/g, "");
  if (!cleanPhone) return null;

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      orderId
    );
  if (!isUuid) return null;

  try {
    const scopedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: { persistSession: false },
        global: {
          headers: {
            "x-tracked-order-id": orderId,
            "x-customer-phone": cleanPhone,
          },
        },
      }
    );

    const [orderRes, itemsRes] = await Promise.all([
      scopedClient
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle(),
      scopedClient
        .from("order_items")
        .select("*")
        .eq("order_id", orderId),
    ]);

    if (orderRes.error || !orderRes.data) {
      return null;
    }

    return mapDbOrderToOrder(orderRes.data, itemsRes.data || []);
  } catch {
    return null;
  }
}

/**
 * Inscreve o Rastreador ao Vivo do Cliente em um canal WebSocket dedicado ao `orderId`
 * específico do pedido dele, atualizando a barra de progresso animada instantaneamente
 * sempre que o PDV, a Cozinha (KDS) ou o Motoboy mudarem o status no banco.
 */
export function subscribeToCustomerOrderRealtime(
  orderId: string,
  customerPhone: string,
  onOrderUpdate: (updatedOrder: Order) => void
): () => void {
  if (
    typeof window === "undefined" ||
    !orderId ||
    !customerPhone ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return () => {};
  }

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      orderId
    );
  if (!isUuid) return () => {};

  let isDisposed = false;

  // 1. Fetch inicial seguro validando `id` + `customer_phone` no RLS
  fetchCustomerTrackedOrderFromSupabase(orderId, customerPhone).then((ord) => {
    if (ord && !isDisposed) {
      onOrderUpdate(ord);
    }
  });

  // 2. Canal WebSocket Supabase Realtime escutando mutações exclusivas daquele `orderId`
  const supabase = getSupabaseBrowserClient();
  const channel = supabase
    .channel(`rastreador-pedido-${orderId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${orderId}`,
      },
      async (payload) => {
        const refreshed = await fetchCustomerTrackedOrderFromSupabase(
          orderId,
          customerPhone
        );
        if (refreshed && !isDisposed) {
          onOrderUpdate(refreshed);
        } else if (payload.new && !isDisposed) {
          onOrderUpdate(mapDbOrderToOrder(payload.new, []));
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "order_items",
        filter: `order_id=eq.${orderId}`,
      },
      async () => {
        const refreshed = await fetchCustomerTrackedOrderFromSupabase(
          orderId,
          customerPhone
        );
        if (refreshed && !isDisposed) {
          onOrderUpdate(refreshed);
        }
      }
    )
    .subscribe();

  return () => {
    isDisposed = true;
    supabase.removeChannel(channel);
  };
}

