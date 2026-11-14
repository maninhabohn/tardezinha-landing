import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { supabase, isSupabaseConfigured } from './lib/supabase'

// 13/11/2026: antes de montar a página, lê as edições ABERTAS no banco (aprovadas pela Maninha na aba
// "Nova edição"). O App só é importado DEPOIS, porque lib/contact.ts monta a lista de datas na hora
// em que é carregado. Se o banco demorar mais de 2,5 s ou falhar, a página segue com as datas do código.
async function carregarEdicoesDoBanco() {
  if (!isSupabaseConfigured()) return
  try {
    const consulta = supabase.rpc('tardezinha_edicoes_publicas').then(({ data }) => {
      if (Array.isArray(data)) window.__TZ_EDICOES_BANCO = data
    })
    await Promise.race([consulta, new Promise(r => setTimeout(r, 2500))])
  } catch { /* segue com as datas do código */ }
}

carregarEdicoesDoBanco().then(async () => {
  const { default: App } = await import('./App.tsx')
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
})
