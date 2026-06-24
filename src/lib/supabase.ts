import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const configured = Boolean(supabaseUrl && supabaseAnonKey)

if (!configured) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY ausentes. ' +
      'O formulario de leads nao vai funcionar ate as envs serem configuradas no Vercel.',
  )
}

// Cria um client mesmo sem envs (com placeholder) pra nao quebrar a app.
// O form de lead vai falhar de forma controlada se nao estiver configurado.
let client: SupabaseClient
try {
  client = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key',
  )
} catch (err) {
  console.error('[Supabase] erro ao criar client:', err)
  // Re-cria com placeholder garantido
  client = createClient('https://placeholder.supabase.co', 'placeholder-anon-key')
}

export const supabase = client

/** Retorna true se as variaveis de ambiente do Supabase estao configuradas. */
export const isSupabaseConfigured = () => configured
