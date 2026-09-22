import { useEffect, useState, useCallback } from 'react'
import { fetchPainel, type PainelReserva } from '../lib/tzApi'

// Tela da COZINHA — só leitura. O cozinheiro só OLHA (sem botão).
// Quem marca pronto/entregue é o atendente/bar no painel (/painel).
// Abre num tablet/TV encostado. Atualiza sozinha.

interface Fila {
  pedidoId: string
  senha?: number
  item: string
  qtd: number
  obs: string | null
  familia: string
  turno: string
  status: 'recebido' | 'preparando'
  aguardando: boolean
}

function getKey(): string {
  return new URLSearchParams(window.location.search).get('k') ?? ''
}

export function Cozinha() {
  useEffect(() => { document.title = 'Cozinha — Tardezinha' }, [])
  const key = getKey()
  const [status, setStatus] = useState<'loading' | 'ok' | 'negado'>('loading')
  const [reservas, setReservas] = useState<PainelReserva[]>([])

  const carregar = useCallback(async () => {
    if (!key) { setStatus('negado'); return }
    const res = await fetchPainel(key)
    if (!res.ok) { setStatus('negado'); return }
    setReservas(res.reservas ?? [])
    setStatus('ok')
  }, [key])

  useEffect(() => {
    carregar()
    const t = setInterval(carregar, 12000) // atualiza sozinha
    return () => clearInterval(t)
  }, [carregar])

  if (status === 'loading') {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-300 text-2xl">Carregando cozinha…</div>
  }
  if (status === 'negado') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 text-center">
        <div className="text-gray-300">
          <p className="text-5xl mb-3">🔒</p>
          <p className="text-2xl font-bold">Abre pelo link com a chave da cozinha.</p>
        </div>
      </div>
    )
  }

  // achata os pedidos pendentes (recebido/preparando) de todas as famílias
  const fila: Fila[] = []
  reservas.forEach(r => {
    r.pedidos.forEach(p => {
      // só o que a cozinha prepara (bebidas do bar não entram)
      if ((p.status === 'recebido' || p.status === 'preparando') && p.categoria !== 'bar') {
        fila.push({
          pedidoId: p.id, senha: p.senha, item: p.item, qtd: p.qtd, obs: p.obs,
          familia: r.criancas.map(c => c.nome).join(', ') || r.nome, turno: r.turno, status: p.status,
          // 22/09/2026 (Ana): lanche comprado NA RESERVA so vai pro fogo quando a criança
          // CHEGA. Antes entrava em "Fazer agora" no minuto da reserva e a cozinha fazia
          // lanche pra criança que nem tinha chegado. Quem libera é o "✔ Chegou" do painel.
          aguardando: p.origem === 'reserva' && p.status === 'recebido' && !r.chegou,
        })
      }
    })
  })
  // ordena pela SENHA (ordem de chegada) dentro de cada grupo
  const porSenha = (a: Fila, b: Fila) => (a.senha ?? 0) - (b.senha ?? 0)
  const novos = fila.filter(f => f.status === 'recebido' && !f.aguardando).sort(porSenha)
  const preparando = fila.filter(f => f.status === 'preparando').sort(porSenha)
  const esperando = fila.filter(f => f.aguardando).sort(porSenha)

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-10">
      <header className="sticky top-0 bg-gray-950 px-5 py-3 flex items-center justify-between border-b border-gray-800">
        <h1 className="text-2xl font-extrabold">🍽️ Cozinha · Tardezinha</h1>
        <span className="text-sm text-gray-400">{novos.length} novo(s) · {preparando.length} em preparo · {esperando.length} esperando chegar · atualiza sozinha</span>
      </header>

      {novos.length === 0 && preparando.length === 0 && esperando.length === 0 && (
        <div className="flex items-center justify-center py-32 text-gray-500 text-3xl font-bold">Sem pedidos na fila 🎉</div>
      )}

      <div className="px-4 pt-4 grid gap-6 md:grid-cols-2">
        {/* FAZER AGORA */}
        {novos.length > 0 && (
          <section>
            <h2 className="text-amber-400 text-lg font-extrabold uppercase tracking-wide mb-3">🟡 Fazer agora ({novos.length})</h2>
            <div className="space-y-3">
              {novos.map(f => <FilaCard key={f.pedidoId} f={f} destaque />)}
            </div>
          </section>
        )}
        {/* EM PREPARO */}
        {preparando.length > 0 && (
          <section>
            <h2 className="text-sky-400 text-lg font-extrabold uppercase tracking-wide mb-3">🔵 Em preparo ({preparando.length})</h2>
            <div className="space-y-3">
              {preparando.map(f => <FilaCard key={f.pedidoId} f={f} />)}
            </div>
          </section>
        )}
      </div>

      {/* RESERVADO — a criança ainda não chegou: a cozinha VÊ pra se organizar, mas NÃO faz */}
      {esperando.length > 0 && (
        <section className="px-4 pt-8">
          <h2 className="text-gray-400 text-lg font-extrabold uppercase tracking-wide mb-1">⏳ Reservado — criança ainda não chegou ({esperando.length})</h2>
          <p className="text-gray-500 text-sm mb-3">NÃO fazer ainda. Sobe pro “Fazer agora” sozinho quando a recepção marcar ✔ Chegou.</p>
          <div className="grid gap-3 md:grid-cols-2 opacity-60">
            {esperando.map(f => <FilaCard key={f.pedidoId} f={f} />)}
          </div>
        </section>
      )}

      <p className="text-center text-gray-600 text-sm mt-10">Esta tela é só pra olhar. Quem marca “pronto” é o atendente no painel.</p>
    </div>
  )
}

function FilaCard({ f, destaque = false }: { f: Fila; destaque?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 flex items-center gap-4 ${destaque ? 'bg-amber-500/15 border-2 border-amber-500' : 'bg-gray-800 border border-gray-700'}`}>
      <div className="w-20 text-center shrink-0">
        <div className="text-4xl font-black tabular-nums leading-none">{f.senha != null ? `#${f.senha}` : '—'}</div>
        <div className="text-[11px] uppercase tracking-wide text-gray-400 mt-1">senha</div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-extrabold leading-tight">{f.qtd}× {f.item}</p>
        {f.obs && <p className="text-amber-300 text-sm font-semibold mt-0.5">⚠️ {f.obs}</p>}
        <p className="text-gray-400 text-sm mt-1 truncate">👧 {f.familia} · {f.turno.replace(/^[^|]+\|/, '')}</p>
      </div>
    </div>
  )
}
