-- =========================================================================================
-- TÁ NA MESA (by A2i Solutions & Alô Classificados)
-- ARQUITETURA OFICIAL MULTI-TENANT PARA SUPABASE / POSTGRESQL
-- =========================================================================================
-- Como executar:
-- 1. Acesse o painel do seu projeto no Supabase (https://supabase.com/dashboard)
-- 2. Abra o menu lateral "SQL Editor" -> "+ New Query"
-- 3. Cole todo este arquivo e clique em "Run" (Ctrl + Enter)
-- =========================================================================================

-- Extensões necessárias para UUIDv4 e buscas textuais
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================================
-- 1. TABELA RAIZ DE TENANTS: RESTAURANTES / ESTABELECIMENTOS (stores)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- Ex: 'brasa-burger-grill' (usado na URL /loja/brasa-burger-grill)
  store_name TEXT NOT NULL,
  logo_url TEXT DEFAULT '/demo_restaurant_logo.svg',
  is_open BOOLEAN NOT NULL DEFAULT true,
  min_order_value NUMERIC(10, 2) NOT NULL DEFAULT 15.00,
  delivery_type TEXT NOT NULL DEFAULT 'bairro' CHECK (delivery_type IN ('bairro', 'fixa')),
  fixed_delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 8.00,
  pix_key TEXT,
  phone TEXT,
  address TEXT,
  opening_hours TEXT,
  -- Regras de Blindagem de Margem da Parceria Alô Classificados (Bloco 1)
  alo_partner_min_order NUMERIC(10, 2) NOT NULL DEFAULT 35.00,
  alo_partner_max_subsidy NUMERIC(10, 2) NOT NULL DEFAULT 8.00,
  -- Módulos Operacionais & Automação de Pico (Bloco 3)
  enable_blind_cash_close BOOLEAN NOT NULL DEFAULT false,
  enable_table_timer BOOLEAN NOT NULL DEFAULT true,
  enable_tv_order_panel BOOLEAN NOT NULL DEFAULT true,
  thermal_print_width TEXT NOT NULL DEFAULT '80mm' CHECK (thermal_print_width IN ('80mm', '58mm')),
  enable_auto_print_on_accept BOOLEAN NOT NULL DEFAULT false,
  enable_persistent_sound_alert BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores(slug);

-- =========================================================================================
-- 2. TAXAS DE ENTREGA POR BAIRRO (store_neighborhoods) — Multi-Tenant por store_id
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.store_neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  neighborhood TEXT NOT NULL,
  fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  estimated_minutes TEXT NOT NULL DEFAULT '30-45 min',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_neighborhoods_store ON public.store_neighborhoods(store_id);

-- =========================================================================================
-- 3. CUPONS PROMOCIONAIS COM TRAVA DE PEDIDO MÍNIMO E TETO (store_coupons)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.store_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_percent NUMERIC(5, 2),
  discount_fixed NUMERIC(10, 2),
  free_delivery BOOLEAN NOT NULL DEFAULT false,
  min_order_value NUMERIC(10, 2) DEFAULT 0.00,
  max_delivery_subsidy NUMERIC(10, 2) DEFAULT 8.00,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, code)
);

CREATE INDEX IF NOT EXISTS idx_store_coupons_store_code ON public.store_coupons(store_id, code);

-- =========================================================================================
-- 4. EQUIPE DE ENTREGADORES / MOTOBOYS DO TURNO (store_couriers) — Bloco 2
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.store_couriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle TEXT DEFAULT 'Moto Delivery',
  fixed_daily_rate NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_couriers_store ON public.store_couriers(store_id);

-- =========================================================================================
-- 5. CARDÁPIO DE PRODUTOS E ROTEAMENTO DE SETOR DE PREPARO (products)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  external_code TEXT, -- Código legado ou SKU (ex: 'bg-1', 'ps-2')
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '🍽️',
  prep_sector TEXT NOT NULL DEFAULT 'chapa' CHECK (prep_sector IN ('chapa', 'bar')),
  options_json JSONB DEFAULT '[]'::jsonb,
  popular BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_store_category ON public.products(store_id, category);
CREATE INDEX IF NOT EXISTS idx_products_store_available ON public.products(store_id, is_available);

-- =========================================================================================
-- 6. MAPA DE MESAS DO SALÃO (restaurant_tables) & CHAMADOS DO GARÇOM (waiter_calls)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'livre' CHECK (status IN ('livre', 'ocupada', 'chamando_garcom', 'pedindo_conta')),
  call_reason TEXT,
  assigned_waiter TEXT,
  sector TEXT DEFAULT 'salao',
  opened_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, table_number)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_tables_store_status ON public.restaurant_tables(store_id, status);

CREATE TABLE IF NOT EXISTS public.waiter_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT 'Atendimento na mesa',
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'atendido')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_waiter_calls_store_status ON public.waiter_calls(store_id, status);

-- =========================================================================================
-- 7. SUBCOMANDAS INDIVIDUAIS POR CLIENTE NA MESA (comandas & comanda_items)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.comandas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES public.restaurant_tables(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  is_connected_via_phone BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'paga')),
  total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_comandas_store_table ON public.comandas(store_id, table_id, status);

CREATE TABLE IF NOT EXISTS public.comanda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  comanda_id UUID NOT NULL REFERENCES public.comandas(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  options_selected JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  prep_sector TEXT NOT NULL DEFAULT 'chapa' CHECK (prep_sector IN ('chapa', 'bar')),
  is_ready BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comanda_items_comanda ON public.comanda_items(comanda_id);

-- =========================================================================================
-- 8. PEDIDOS E ITENS DO PEDIDO COM CHECK INDIVIDUAL KDS (orders & order_items)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_number INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mesa', 'delivery', 'retirada')),
  channel TEXT NOT NULL DEFAULT 'site_proprio' CHECK (channel IN ('tanamesa', 'site_proprio', 'ifood', '99food', 'keeta', 'api', 'whatsapp')),
  external_order_id TEXT,
  table_number INTEGER,
  comanda_id UUID REFERENCES public.comandas(id) ON DELETE SET NULL,
  comanda_name TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_preparo', 'a_caminho', 'entregue', 'cancelado')),
  -- Endereço estruturado via CEP e Pagamento Pix BRCode (Bloco 1)
  delivery_cep TEXT,
  delivery_address TEXT,
  delivery_neighborhood TEXT,
  payment_method TEXT,
  pix_txid TEXT,
  coupon_code TEXT,
  -- Logística e Atribuição de Motoboy (Bloco 2)
  courier_id UUID REFERENCES public.store_couriers(id) ON DELETE SET NULL,
  courier_name TEXT,
  courier_phone TEXT,
  -- Timestamps de SLA Operacional (Bloco 3)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  dispatched_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_store_status ON public.orders(store_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_store_number ON public.orders(store_id, order_number DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(store_id, customer_phone);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  options_selected JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  -- Roteamento KDS Multi-Setor e Check Individual por Item (Etapa A)
  prep_sector TEXT NOT NULL DEFAULT 'chapa' CHECK (prep_sector IN ('chapa', 'bar')),
  is_ready BOOLEAN NOT NULL DEFAULT false,
  ready_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_store_sector ON public.order_items(store_id, prep_sector, is_ready);

-- =========================================================================================
-- 8.1. MÓDULO ERP: ESTOQUE, FORNECEDORES E DESPESAS FINANCEIRAS + AVALIAÇÕES
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('carnes', 'paes_laticinios', 'hortifruti', 'bebidas', 'embalagens', 'outros')),
  quantity NUMERIC(10, 3) NOT NULL DEFAULT 0,
  min_quantity NUMERIC(10, 3) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL CHECK (unit IN ('un', 'kg', 'g', 'lt', 'pct')),
  unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  supplier_name TEXT,
  supplier_phone TEXT,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_items_store ON public.stock_items(store_id);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  pix_key TEXT,
  delivery_days TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_store ON public.suppliers(store_id);

CREATE TABLE IF NOT EXISTS public.financial_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('fornecedores', 'aluguel_fixo', 'energia_agua_gas', 'equipe_salarios', 'marketing', 'outros')),
  amount NUMERIC(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido')),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  payment_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_expenses_store ON public.financial_expenses(store_id, status);

CREATE TABLE IF NOT EXISTS public.customer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  table_number INTEGER,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_reviews_store ON public.customer_reviews(store_id);

-- =========================================================================================
-- 9. ROW LEVEL SECURITY (RLS) — BLINDAGEM MULTI-TENANT CONTRA VAZAMENTO ENTRE LOJISTAS
-- =========================================================================================

-- 9.1. Função oficial de extração do `store_id` diretamente do JWT do Supabase Auth
CREATE OR REPLACE FUNCTION public.current_store_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF(auth.jwt() -> 'user_metadata' ->> 'store_id', '')::uuid,
    NULLIF(auth.jwt() -> 'app_metadata'  ->> 'store_id', '')::uuid
  );
$$;

-- 9.2. Ativação obrigatória de Row Level Security (RLS) em TODAS as tabelas do ecossistema
--      (Tabela raiz `stores` + todas as 14 tabelas operacionais filhas)
ALTER TABLE public.stores               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_neighborhoods  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_coupons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_couriers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiter_calls         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comandas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanda_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_expenses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_reviews     ENABLE ROW LEVEL SECURITY;

-- 9.3. Políticas para a tabela raiz `stores`
-- Leitura pública apenas dos dados de vitrine (cardápio digital precisa carregar a loja pelo slug/id);
-- Escrita (UPDATE/DELETE) restrita exclusivamente ao lojista autenticado dono daquele `store_id`.
DROP POLICY IF EXISTS "stores_public_select" ON public.stores;
CREATE POLICY "stores_public_select"
  ON public.stores
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "stores_tenant_update" ON public.stores;
CREATE POLICY "stores_tenant_update"
  ON public.stores
  FOR UPDATE
  TO authenticated
  USING (id = public.current_store_id())
  WITH CHECK (id = public.current_store_id());

DROP POLICY IF EXISTS "stores_tenant_delete" ON public.stores;
CREATE POLICY "stores_tenant_delete"
  ON public.stores
  FOR DELETE
  TO authenticated
  USING (id = public.current_store_id());

-- 9.4. Políticas para a tabela crítica `orders` (Isolamento estrito entre Lojistas + Rastreador Seguro do Cliente)
-- Lojista autenticado só enxerga, edita ou exclui pedidos cujo `store_id` bate com seu JWT.
DROP POLICY IF EXISTS "orders_tenant_all" ON public.orders;
CREATE POLICY "orders_tenant_all"
  ON public.orders
  FOR ALL
  TO authenticated
  USING (store_id = public.current_store_id())
  WITH CHECK (store_id = public.current_store_id());

-- Clientes no checkout (anon) podem criar pedido para uma loja válida, mas NUNCA listar ou alterar pedidos de outras lojas
DROP POLICY IF EXISTS "orders_customer_insert" ON public.orders;
CREATE POLICY "orders_customer_insert"
  ON public.orders
  FOR INSERT
  TO anon
  WITH CHECK (
    store_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.stores s WHERE s.id = orders.store_id AND s.is_open = true)
  );

-- Funções auxiliares para extrair o ID do pedido e o WhatsApp do cliente enviados pelo Rastreador ao Vivo no navegador
CREATE OR REPLACE FUNCTION public.request_tracked_order_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(
    COALESCE(
      current_setting('request.headers', true)::jsonb ->> 'x-tracked-order-id',
      current_setting('app.tracked_order_id', true)
    ),
    ''
  )::uuid;
$$;

CREATE OR REPLACE FUNCTION public.request_customer_phone()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(
    regexp_replace(
      COALESCE(
        current_setting('request.headers', true)::jsonb ->> 'x-customer-phone',
        current_setting('app.customer_phone', true),
        ''
      ),
      '\D', '', 'g'
    ),
    ''
  );
$$;

-- Política de Leitura (SELECT) para `anon` no Rastreador do Cliente (Bloco 4):
-- O cliente anônimo só consegue ler a linha do pedido se o `id` do pedido E o `customer_phone`
-- baterem exatamente com o que ele está rastreando no navegador.
DROP POLICY IF EXISTS "orders_customer_track_select" ON public.orders;
CREATE POLICY "orders_customer_track_select"
  ON public.orders
  FOR SELECT
  TO anon
  USING (
    id = public.request_tracked_order_id()
    AND customer_phone IS NOT NULL
    AND regexp_replace(customer_phone, '\D', '', 'g') = public.request_customer_phone()
  );

DROP POLICY IF EXISTS "order_items_customer_insert" ON public.order_items;
CREATE POLICY "order_items_customer_insert"
  ON public.order_items
  FOR INSERT
  TO anon
  WITH CHECK (store_id IS NOT NULL AND order_id IS NOT NULL);

DROP POLICY IF EXISTS "order_items_customer_track_select" ON public.order_items;
CREATE POLICY "order_items_customer_track_select"
  ON public.order_items
  FOR SELECT
  TO anon
  USING (order_id = public.request_tracked_order_id());

-- 9.5. Políticas Multi-Tenant para as demais 13 tabelas operacionais
DROP POLICY IF EXISTS "store_neighborhoods_tenant_all" ON public.store_neighborhoods;
CREATE POLICY "store_neighborhoods_tenant_all"
  ON public.store_neighborhoods
  FOR ALL
  TO authenticated
  USING (store_id = public.current_store_id())
  WITH CHECK (store_id = public.current_store_id());

DROP POLICY IF EXISTS "store_neighborhoods_public_select" ON public.store_neighborhoods;
CREATE POLICY "store_neighborhoods_public_select"
  ON public.store_neighborhoods
  FOR SELECT
  TO anon
  USING (active = true);

DROP POLICY IF EXISTS "store_coupons_tenant_all" ON public.store_coupons;
CREATE POLICY "store_coupons_tenant_all"
  ON public.store_coupons
  FOR ALL
  TO authenticated
  USING (store_id = public.current_store_id())
  WITH CHECK (store_id = public.current_store_id());

DROP POLICY IF EXISTS "store_coupons_public_select" ON public.store_coupons;
CREATE POLICY "store_coupons_public_select"
  ON public.store_coupons
  FOR SELECT
  TO anon
  USING (active = true);

DROP POLICY IF EXISTS "store_couriers_tenant_all" ON public.store_couriers;
CREATE POLICY "store_couriers_tenant_all"
  ON public.store_couriers
  FOR ALL
  TO authenticated
  USING (store_id = public.current_store_id())
  WITH CHECK (store_id = public.current_store_id());

DROP POLICY IF EXISTS "products_tenant_all" ON public.products;
CREATE POLICY "products_tenant_all"
  ON public.products
  FOR ALL
  TO authenticated
  USING (store_id = public.current_store_id())
  WITH CHECK (store_id = public.current_store_id());

DROP POLICY IF EXISTS "products_public_select" ON public.products;
CREATE POLICY "products_public_select"
  ON public.products
  FOR SELECT
  TO anon
  USING (is_available = true);

DROP POLICY IF EXISTS "restaurant_tables_tenant_all" ON public.restaurant_tables;
CREATE POLICY "restaurant_tables_tenant_all"
  ON public.restaurant_tables
  FOR ALL
  TO authenticated
  USING (store_id = public.current_store_id())
  WITH CHECK (store_id = public.current_store_id());

DROP POLICY IF EXISTS "waiter_calls_tenant_all" ON public.waiter_calls;
CREATE POLICY "waiter_calls_tenant_all"
  ON public.waiter_calls
  FOR ALL
  TO authenticated
  USING (store_id = public.current_store_id())
  WITH CHECK (store_id = public.current_store_id());

DROP POLICY IF EXISTS "comandas_tenant_all" ON public.comandas;
CREATE POLICY "comandas_tenant_all"
  ON public.comandas
  FOR ALL
  TO authenticated
  USING (store_id = public.current_store_id())
  WITH CHECK (store_id = public.current_store_id());

DROP POLICY IF EXISTS "comanda_items_tenant_all" ON public.comanda_items;
CREATE POLICY "comanda_items_tenant_all"
  ON public.comanda_items
  FOR ALL
  TO authenticated
  USING (store_id = public.current_store_id())
  WITH CHECK (store_id = public.current_store_id());

DROP POLICY IF EXISTS "order_items_tenant_all" ON public.order_items;
CREATE POLICY "order_items_tenant_all"
  ON public.order_items
  FOR ALL
  TO authenticated
  USING (store_id = public.current_store_id())
  WITH CHECK (store_id = public.current_store_id());

DROP POLICY IF EXISTS "stock_items_tenant_all" ON public.stock_items;
CREATE POLICY "stock_items_tenant_all"
  ON public.stock_items
  FOR ALL
  TO authenticated
  USING (store_id = public.current_store_id())
  WITH CHECK (store_id = public.current_store_id());

DROP POLICY IF EXISTS "suppliers_tenant_all" ON public.suppliers;
CREATE POLICY "suppliers_tenant_all"
  ON public.suppliers
  FOR ALL
  TO authenticated
  USING (store_id = public.current_store_id())
  WITH CHECK (store_id = public.current_store_id());

DROP POLICY IF EXISTS "financial_expenses_tenant_all" ON public.financial_expenses;
CREATE POLICY "financial_expenses_tenant_all"
  ON public.financial_expenses
  FOR ALL
  TO authenticated
  USING (store_id = public.current_store_id())
  WITH CHECK (store_id = public.current_store_id());

DROP POLICY IF EXISTS "customer_reviews_tenant_all" ON public.customer_reviews;
CREATE POLICY "customer_reviews_tenant_all"
  ON public.customer_reviews
  FOR ALL
  TO authenticated
  USING (store_id = public.current_store_id())
  WITH CHECK (store_id = public.current_store_id());

-- =========================================================================================
-- 10. CONFIGURAÇÃO E ATIVAÇÃO DO SUPABASE REALTIME (WEBSOCKETS NATIVOS POSTGRESQL)
-- =========================================================================================
-- IMPORTANTE: As instruções abaixo ativam o broadcast imediato via WebSockets (WAL/CDC)
-- para que o PDV (/gestor), o KDS da Cozinha (/cozinha), o App do Garçom (/garcom) e
-- o Rastreador ao Vivo do Cliente conversem em tempo real filtrados por `store_id`.

-- 11.1. Configura REPLICA IDENTITY FULL para enviar o registro completo nos eventos UPDATE/DELETE
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;
ALTER TABLE public.restaurant_tables REPLICA IDENTITY FULL;
ALTER TABLE public.comandas REPLICA IDENTITY FULL;
ALTER TABLE public.comanda_items REPLICA IDENTITY FULL;
ALTER TABLE public.waiter_calls REPLICA IDENTITY FULL;

-- 11.2. Adiciona as tabelas operacionais críticas à publicação oficial `supabase_realtime`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'order_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'restaurant_tables'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_tables;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'comandas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comandas;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'comanda_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comanda_items;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'waiter_calls'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.waiter_calls;
  END IF;
END $$;

-- =========================================================================================
-- GUIA RÁPIDO DE CONEXÃO WEBSOCKET NO FRONTEND (Next.js + @supabase/supabase-js)
-- =========================================================================================
-- 1. Instale o SDK: `pnpm add @supabase/supabase-js`
-- 2. Defina no `.env.local`:
--      NEXT_PUBLIC_SUPABASE_URL="https://SEU_PROJETO.supabase.co"
--      NEXT_PUBLIC_SUPABASE_ANON_KEY="SUA_CHAVE_ANON"
-- 3. Assine o canal isolado por `store_id` (Multi-Tenant):
--
--    const channel = supabase
--      .channel(`operacao-loja-${storeId}`)
--      .on(
--        'postgres_changes',
--        { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` },
--        (payload) => { /* Atualiza PDV, KDS Cozinha e Rastreador do Cliente */ }
--      )
--      .on(
--        'postgres_changes',
--        { event: '*', schema: 'public', table: 'order_items', filter: `store_id=eq.${storeId}` },
--        (payload) => { /* Sincroniza check individual de Chapa / Copa-Bar no KDS */ }
--      )
--      .on(
--        'postgres_changes',
--        { event: '*', schema: 'public', table: 'comandas', filter: `store_id=eq.${storeId}` },
--        (payload) => { /* Sincroniza subcomandas abertas na mesa */ }
--      )
--      .on(
--        'postgres_changes',
--        { event: '*', schema: 'public', table: 'waiter_calls', filter: `store_id=eq.${storeId}` },
--        (payload) => { /* Dispara campainha imediata no celular do Garçom */ }
--      )
--      .subscribe();
-- =========================================================================================
