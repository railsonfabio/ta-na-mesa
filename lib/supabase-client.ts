"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * Instância singleton do cliente Supabase para o navegador (@supabase/ssr),
 * apontando diretamente para as variáveis de ambiente do projeto.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}

export const supabase =
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? getSupabaseBrowserClient()
    : (null as unknown as SupabaseClient);

/**
 * Extrai o `store_id` (UUID Multi-Tenant) diretamente da sessão autenticada
 * do lojista no Supabase Auth (`user_metadata.store_id` ou `app_metadata.store_id`),
 * com fallback para a variável de ambiente pública da loja padrão (cardápio do cliente).
 */
export async function resolveActiveStoreId(
  explicitStoreId?: string
): Promise<string | null> {
  if (explicitStoreId) return explicitStoreId;

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return process.env.NEXT_PUBLIC_DEFAULT_STORE_ID || null;
  }

  try {
    const client = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await client.auth.getUser();

    const jwtStoreId =
      (user?.user_metadata?.store_id as string | undefined) ||
      (user?.app_metadata?.store_id as string | undefined);

    if (jwtStoreId) return jwtStoreId;
  } catch {
    // Caso seja acesso anônimo do consumidor final no cardápio digital
  }

  return process.env.NEXT_PUBLIC_DEFAULT_STORE_ID || null;
}
