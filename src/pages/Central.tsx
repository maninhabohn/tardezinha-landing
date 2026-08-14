import { useEffect, useState } from 'react'

// Central de links da Tardezinha — página "da casa" (sem depender do Claude).
// /central mostra os links públicos; /central?k=CHAVE mostra também os da equipe
// (Painel, Cozinha, Admin) com a chave embutida. A chave só é válida de verdade
// nas próprias páginas (elas checam no banco) — aqui é só pra montar os links.

const BASE = 'https://tardezinha.showdebolars.com.br'
// O Admin usa uma chave PRÓPRIA (?key=), diferente da chave do painel (?k=).
// Sem ela a página abre em "Chave inválida" — era o link quebrado da central.
const ADMIN_KEY = (import.meta.env.VITE_ADMIN_KEY ?? '').replace(/^﻿/, '').trim()

interface LinkCard {
  nome: string
  desc: string
  ico: string
  url: string
  grad: string
  team?: boolean
}

function buildCards(k: string): LinkCard[] {
  const publicos: LinkCard[] = [
    { nome: 'Inscrição', desc: 'Cliente se inscreve e confirma presença.', ico: '🎟️', url: `${BASE}/reservar`, grad: 'linear-gradient(150deg,#F6B71E,#D98A00)' },
    { nome: 'Grupos', desc: 'Inscrição de grupo / turma / aniversário.', ico: '👨‍👩‍👧‍👦', url: `${BASE}/grupo`, grad: 'linear-gradient(150deg,#7d33a6,#54206f)' },
    { nome: 'Álbum', desc: 'Álbum de figurinhas — a fidelização.', ico: '🏅', url: `${BASE}/passaporte`, grad: 'linear-gradient(150deg,#ec5ba6,#c62f80)' },
    { nome: 'Site', desc: 'A página pública do evento.', ico: '🏖️', url: `${BASE}/`, grad: 'linear-gradient(150deg,#f5763f,#d64a20)' },
  ]
  if (!k) return publicos
  const equipe: LinkCard[] = [
    { nome: 'Inscritos', desc: 'Quantos já se inscreveram + a lista de nomes. Só o básico.', ico: '🧾', url: `${BASE}/inscritos?k=${k}`, grad: 'linear-gradient(150deg,#6d5bd0,#43349b)', team: true },
    { nome: 'Painel · Bar/Recepção', desc: 'Recepção confere · Bar recebe pedido. Uso no dia.', ico: '🛎️', url: `${BASE}/painel?k=${k}`, grad: 'linear-gradient(150deg,#12b57e,#0a7d58)', team: true },
    { nome: 'Tela da Cozinha', desc: 'Só leitura — o que preparar. Põe num tablet/TV.', ico: '🍳', url: `${BASE}/cozinha?k=${k}`, grad: 'linear-gradient(150deg,#b5642c,#7d3f17)', team: true },
    { nome: 'Admin · Inscritos', desc: 'Lista de inscritos + números das inscrições.', ico: '📊', url: `${BASE}/admin/tardezinha-stats?key=${ADMIN_KEY}`, grad: 'linear-gradient(150deg,#3b7bf0,#2350c4)', team: true },
  ]
  return [...publicos, ...equipe]
}

export function Central() {
  useEffect(() => { document.title = 'Central de Links — Tardezinha' }, [])
  const k = new URLSearchParams(window.location.search).get('k') ?? ''
  const cards = buildCards(k)
  const [copiado, setCopiado] = useState<string | null>(null)

  async function copiar(url: string, nome: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(nome)
      setTimeout(() => setCopiado(null), 1600)
    } catch {
      setCopiado(nome)
      setTimeout(() => setCopiado(null), 1600)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Show de Bola · Tardezinha</p>
          <h1 className="mt-1 text-3xl font-extrabold text-gray-800 sm:text-4xl">Central de Links</h1>
          <p className="mt-2 text-gray-500 text-sm sm:text-base">
            Toca no cartão pra <strong>abrir</strong>, ou no botão <strong>copiar</strong> pra mandar o link.
            {k && ' Os marcados 🔒 são só da equipe — não manda pra cliente.'}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cards.map(c => (
            <div key={c.nome} className="relative rounded-2xl p-5 text-white shadow-lg overflow-hidden flex flex-col min-h-[150px]" style={{ background: c.grad }}>
              {c.team && (
                <span className="absolute right-3 top-3 rounded-full bg-black/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">🔒 Equipe</span>
              )}
              <span className="text-3xl drop-shadow">{c.ico}</span>
              <a href={c.url} target="_blank" rel="noopener noreferrer" className="mt-auto block">
                <span className="block text-xl font-extrabold leading-tight underline-offset-2 hover:underline">{c.nome}</span>
                <span className="mt-1 block text-sm text-white/90">{c.desc}</span>
              </a>
              <button
                onClick={() => copiar(c.url, c.nome)}
                className="mt-3 self-start rounded-lg bg-black/25 px-3 py-1.5 text-xs font-bold hover:bg-black/35 active:scale-95"
              >
                {copiado === c.nome ? 'Copiado! ✓' : 'Copiar link ⧉'}
              </button>
            </div>
          ))}
        </div>

        {!k && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            🔒 Os links da <strong>equipe</strong> (Painel, Cozinha, Admin) só aparecem abrindo com a chave — pelo link que a Jack passou (<code>/central?k=…</code>).
          </div>
        )}

        <footer className="mt-10 text-center text-xs text-gray-400">
          Tardezinha Show de Bola · Casa de Festas · Atlântida · Xangri-Lá
        </footer>
      </div>
    </div>
  )
}
