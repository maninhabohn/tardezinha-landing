import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] Variaveis VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY ausentes. ' +
      'Cria um arquivo .env na raiz do projeto (veja .env.example).',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
