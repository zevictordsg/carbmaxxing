import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin client using the service role key -- bypasses Row Level Security.
 *
 * ONLY import this from server-only code that never ships to the client
 * (Route Handlers, webhook handlers, admin server actions). Never import
 * this from a Client Component or anything under "use client".
 */
export function createAdminClient() {
  return createSupabaseClient(
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
