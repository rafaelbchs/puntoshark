import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase credentials")
}

// Create a Supabase client with proper typing
// Using non-null assertion (!) since we check for undefined above
export const supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!)

// For server-side operations requiring elevated permissions
export function getServiceSupabase(): SupabaseClient<Database> {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseServiceKey) {
    throw new Error("Missing Supabase service key")
  }

  return createClient<Database>(supabaseUrl!, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

