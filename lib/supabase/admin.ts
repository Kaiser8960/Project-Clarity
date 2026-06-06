/**
 * Admin Supabase client using the service role key.
 *
 * IMPORTANT: This client BYPASSES Row Level Security entirely.
 * Only use it in server-side API routes after verifying the caller
 * is an authenticated admin via getUserMembership().
 *
 * Why not createServiceClient() from server.ts?
 * createServerClient from @supabase/ssr sends both the service role API key
 * AND the user's cookie-based JWT. PostgreSQL sees the user JWT (authenticated
 * role) and still applies RLS. The plain createClient() below only sends the
 * service role key, so PostgreSQL grants it the service_role context which
 * skips all RLS policies.
 */
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
