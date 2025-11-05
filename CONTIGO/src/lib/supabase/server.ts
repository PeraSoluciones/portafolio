import { createServerClient as _createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Cliente de Supabase para Server Components y Server Actions
 * Usa cookies() de next/headers y solo debe usarse en Server Components y Server Actions
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

export function createAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY is not set in .env.local'
    );
  }
  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
