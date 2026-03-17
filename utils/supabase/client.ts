// Supabase Client Utility
import { createBrowserClient } from '@supabase/ssr'
import { createDemoSupabaseClient, isDemoSupabaseEnabled } from './demo-client'
import { resolveDatabaseProvider } from '@/lib/config/database'

type BrowserSupabaseClient = ReturnType<typeof createBrowserClient>;

export function createClient() {
  const provider = resolveDatabaseProvider()

  if (isDemoSupabaseEnabled() || provider === 'demo') {
    return createDemoSupabaseClient() as unknown as BrowserSupabaseClient
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
