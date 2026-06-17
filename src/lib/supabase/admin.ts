import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service-role key.
// NEVER import this into a Client Component — it bypasses RLS.
// Used by API route handlers and Server Components for all DB access.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  // Surfaced at request time rather than build time so the app still scaffolds.
  console.warn(
    "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
      "Copy .env.example to .env.local and fill in your Supabase credentials.",
  );
}

export const supabaseAdmin = createClient(url ?? "", serviceKey ?? "", {
  auth: { persistSession: false, autoRefreshToken: false },
});
