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

export const DEFAULT_PILOT_STORE_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Extrai o `store_id` (UUID Multi-Tenant) diretamente da sessão autenticada
 * do lojista no Supabase Auth (`user_metadata.store_id` ou `app_metadata.store_id`),
 * com fallback garantido para a variável de ambiente pública ou o UUID oficial da loja piloto.
 */
export async function resolveActiveStoreId(
  explicitStoreId?: string
): Promise<string | null> {
  if (explicitStoreId) return explicitStoreId;

  const fallbackStoreId =
    process.env.NEXT_PUBLIC_DEFAULT_STORE_ID || DEFAULT_PILOT_STORE_ID;

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return fallbackStoreId;
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
  } catch (err) {
    console.warn("[Supabase Auth] Acesso sem sessão ativa, usando fallback store_id:", fallbackStoreId, err);
  }

  return fallbackStoreId;
}
