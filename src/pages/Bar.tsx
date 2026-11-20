// 20/11/2026 — Tela do BAR (pedido da Maninha na Tardezinha: "muita informação, rola, abre, rola mais").
// O bar só faz 3 coisas: entregar o que está na fila, lançar consumo, cobrar.
// Usa as MESMAS funções do banco que o /painel (mesma chave ?k=) — nada novo no banco, só outra tela.
import { useEffect, useState, useCallback } from 'react'
import {
  fetchPainel, fetchCardapio, setPedidoStatus, addPedido, setConsumoPago, liberarPedido, liberarPedidoParcial, formatBRL,
  FORMAS_PAGAMENTO,
  type PainelReserva, type PainelPedido, type CardapioItem, type FormaPagamento,
} from '../lib/tzApi'
import { lerChave } from '../lib/chave'

const PROXIMO: Record<string, PainelPedido['status'] | null> = {
  recebido: 'preparando', preparando: 'entregue', entregue: null, finalizado: null, cancelado: null,
}
const ROTULO: Record<string, string> = {
  recebido: '🟡 Recebido', preparando: '🔵 Preparando → entregar', entregue: '🟢 Entregue',
}
const COR: Record<string, string> = {
  recebido: 'bg-amber-50 text-amber-800 border-amber-300',
  preparando: 'bg-sky-50 text-sky-800 border-sky-300',
  entregue: 'bg-emerald-50 text-emerald-800 border-emerald-300',
}

function nomeCurto(n: string): string {
  const p = n.trim().split(/\s+/)
  return p.length > 1 ? `${p[0]} ${p[p.length - 1]}` : p[0]
}
function nomeFamilia(r: PainelReserva): string {
  const n = r.criancas.map(c => c.nome).filter(Boolean)
  return n.length ? n.map(nomeCurto).join(' · ') : r.nome
}
const esperandoPedir = (p: PainelPedido) => p.origem === 'reserva' && p.status === 'recebido' && p.liberado === false
const aReceber = (r: PainelReserva) => (r.consumo_pago ? 0 : r.consumo_centavos)

export function Bar() {
  useEffect(() => { document.title = 'Bar — Tardezinha' }, [])
  const { chave } = lerChave()
  const [status, setStatus] = useState<'loading' | 'ok' | 'negado'>('loading')
  const [reservas, setReservas] = useState<PainelReserva[]>([])
  const [cardapio, setCardapio] = useState<CardapioItem[]>([])
  const [busca, setBusca] = useState('')
  const [aberta, setAberta] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    if (!chave) { setStatus('negado'); return }
    const res = await fetchPainel(chave)
    if (!res.ok) { setStatus('negado'); return }
    setReservas(res.reservas ?? [])
    setStatus('ok')
  }, [chave])

  useEffect(() => {
    carregar()
    fetchCardapio().then(setCardapio)
    const t = setInterval(carregar, 15000)
    return () => clearInterval(t)
  }, [carregar])

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center text-gray-500">Carregando…</div>
  if (status === 'negado') return <div className="min-h-screen flex items-center justify-center text-gray-600 p-6 text-center">🔒 Abre pelo link com a chave da equipe.</div>

  // FILA: o que falta entregar (mesma conta do 'pedidos abertos' do painel) (lanche reservado que a família ainda não pediu fica fora)
  const fila = reservas.flatMap(r => r.pedidos
    .filter(p => (p.status === 'recebido' || p.status === 'preparando') && !esperandoPedir(p))
    .map(p => ({ p, r })))
    .sort((a, b) => (a.p.senha ?? 9999) - (b.p.senha ?? 9999))

  const q = busca.trim().toLowerCase()
  const qDig = q.replace(/\D/g, '')
  const familias = reservas
    .filter(r => r.chegou || r.consumo_centavos > 0)
    .filter(r => !q
      || r.nome.toLowerCase().includes(q)
      || r.criancas.some(c => c.nome.toLowerCase().includes(q))
      || (qDig.length >= 3 && (r.whatsapp || '').replace(/\D/g, '').includes(qDig)))
    .sort((a, b) => (aReceber(b) > 0 ? 1 : 0) - (aReceber(a) > 0 ? 1 : 0)
      || nomeFamilia(a).localeCompare(nomeFamilia(b), 'pt-BR'))
  const totalReceber = reservas.reduce((s, r) => s + aReceber(r), 0)

  async function avancar(p: PainelPedido) {
    const n = PROXIMO[p.status]; if (!n) return
    await setPedidoStatus(chave, p.id, n); carregar()
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      <header className="sticky top-0 z-10 bg-sdb-purple text-white px-4 py-3 shadow-md">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-xl leading-none">Bar da Tardezinha</p>
            <p className="text-xs opacity-80 mt-1">{fila.length} na fila · {formatBRL(totalReceber)} a receber</p>
          </div>
          <button onClick={carregar} className="rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold active:bg-white/25">↻ Atualizar</button>
        </div>
      </header>

      {/* 1. FILA */}
      <section className="px-4 pt-4">
        <p className="text-xs font-bold text-gray-500 mb-2">FILA DE PEDIDOS {fila.length === 0 && '— vazia'}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {fila.map(({ p, r }) => (
            <div key={p.id} className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-3 py-2 shadow-sm">
              <span className="shrink-0 rounded-lg bg-gray-800 text-white text-sm font-bold px-2 py-1">#{p.senha ?? '–'}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-800 truncate">{p.qtd}× {p.item}</p>
                <p className="text-xs text-gray-500 truncate">{nomeFamilia(r)}{p.obs ? ` · ${p.obs}` : ''}</p>
              </div>
              <button onClick={() => avancar(p)}
                className={`shrink-0 rounded-lg border px-2.5 py-2 text-xs font-bold active:scale-95 ${COR[p.status]}`}>
                {ROTULO[p.status]}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-gray-400">Toque no status pra avançar: Recebido → Preparando → Entregue (sai da fila).</p>
      </section>

      {/* 2. FAMÍLIAS: lançar e cobrar */}
      <section className="px-4 pt-5">
        <p className="text-xs font-bold text-gray-500 mb-2">LANÇAR E COBRAR</p>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="🔎 Nome da criança, responsável ou telefone…"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base focus:border-sdb-purple focus:outline-none" />
        <div className="mt-2 space-y-2">
          {familias.map(r => (
            <LinhaFamilia key={r.id} r={r} chave={chave} cardapio={cardapio}
              aberta={aberta === r.id} onToggle={() => setAberta(aberta === r.id ? null : r.id)} onChange={carregar} />
          ))}
          {familias.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Ninguém encontrado.</p>}
        </div>
      </section>
    </div>
  )
}

function LinhaFamilia({ r, chave, cardapio, aberta, onToggle, onChange }: {
  r: PainelReserva; chave: string; cardapio: CardapioItem[]; aberta: boolean; onToggle: () => void; onChange: () => void
}) {
  const [carrinho, setCarrinho] = useState<Record<string, number>>({})
  const [outroDesc, setOutroDesc] = useState('')
  // 20/11 (Maninha): sabor do crepe vai junto do pedido (aparece na fila e na cozinha)
  const [obsItem, setObsItem] = useState<Record<string, string>>({})
  const [outroValor, setOutroValor] = useState('')
  const [salvando, setSalvando] = useState(false)
  const receber = aReceber(r)
  const reservados = r.pedidos.filter(esperandoPedir)
  const consumidos = r.pedidos.filter(p => p.status !== 'cancelado' && !esperandoPedir(p))
  const itensCarrinho = cardapio.filter(c => carrinho[c.id])
  const totalCarrinho = itensCarrinho.reduce((s, c) => s + (c.preco_centavos ?? 0) * carrinho[c.id], 0)
  const outroCent = Math.round(Number(outroValor.replace(/\./g, '').replace(',', '.')) * 100) || 0

  function mais(id: string, d: number) {
    setCarrinho(c => { const n = Math.max(0, (c[id] ?? 0) + d); const x = { ...c }; if (n) x[id] = n; else delete x[id]; return x })
  }
  async function lancar() {
    if (!itensCarrinho.length && outroCent <= 0) return
    setSalvando(true)
    for (const c of itensCarrinho) await addPedido(chave, r.id, c.nome, c.preco_centavos ?? 0, carrinho[c.id], obsItem[c.id]?.trim() || undefined)
    if (outroCent > 0) await addPedido(chave, r.id, outroDesc.trim() || 'valor no local', outroCent, 1, undefined, true)
    setCarrinho({}); setObsItem({}); setOutroDesc(''); setOutroValor(''); setSalvando(false)
    onChange()
  }
  async function pago(forma: FormaPagamento) {
    if (!window.confirm(`Recebi ${formatBRL(r.consumo_centavos)} de ${nomeFamilia(r)} no ${FORMAS_PAGAMENTO.find(f => f.id === forma)?.rotulo}?`)) return
    setSalvando(true); await setConsumoPago(chave, r.id, true, forma); setSalvando(false); onChange()
  }
  async function desfazerPago() {
    if (!window.confirm('Desfazer o pagamento? (volta pra "a receber")')) return
    setSalvando(true); await setConsumoPago(chave, r.id, false); setSalvando(false); onChange()
  }
  async function cancelar(p: PainelPedido) {
    if (!window.confirm(`Cancelar ${p.qtd}× ${p.item}?`)) return
    await setPedidoStatus(chave, p.id, 'cancelado'); onChange()
  }

  return (
    <div className={`rounded-xl bg-white border-2 ${aberta ? 'border-sdb-purple' : 'border-transparent'} shadow-sm`}>
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left">
        <div className="min-w-0">
          <p className="font-bold text-gray-800 truncate">{nomeFamilia(r)}</p>
          <p className="text-xs text-gray-500 truncate">resp. {r.nome}{r.saiu ? ' · 👋 já saiu' : ''}{reservados.length ? ` · 🍽️ ${reservados.length} reservado` : ''}</p>
        </div>
        {receber > 0
          ? <span className="shrink-0 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold px-3 py-1.5">{formatBRL(receber)}</span>
          : <span className="shrink-0 text-xs text-gray-400">{r.consumo_pago && r.consumo_centavos > 0 ? '✓ pago' : 'nada a pagar'}</span>}
      </button>

      {aberta && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {reservados.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-sky-700">LANCHE RESERVADO — mandar quando a família pedir</p>
              {reservados.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-sky-50 px-3 py-2">
                  <span className="text-sm">{p.qtd}× {p.item}</span>
                  <div className="flex gap-1.5 shrink-0">
                    {p.qtd > 1 && (
                      <button onClick={async () => { await liberarPedidoParcial(chave, p.id, 1); onChange() }}
                        className="rounded-lg border-2 border-emerald-500 bg-white text-emerald-700 px-3 py-1.5 text-xs font-bold active:scale-95">🍽️ Pedir 1</button>
                    )}
                    <button onClick={async () => { await liberarPedido(chave, p.id); onChange() }}
                      className="rounded-lg bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold active:scale-95">🍽️ {p.qtd > 1 ? `Pedir os ${p.qtd}` : 'Pedir agora'}</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-gray-500 mb-2">TOCA NO QUE PEDIRAM</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {cardapio.map(c => (
                <div key={c.id} className={`rounded-lg border ${carrinho[c.id] ? 'border-sdb-purple bg-sdb-purple/5' : 'border-gray-200'} flex`}>
                  <button onClick={() => mais(c.id, 1)} className="flex-1 text-left px-2.5 py-2 active:bg-gray-50 min-w-0">
                    <span className="block text-sm font-semibold text-gray-800 leading-tight">{c.nome}</span>
                    <span className="block text-xs text-gray-500">{c.preco_centavos != null ? formatBRL(c.preco_centavos) : ''}</span>
                  </button>
                  {carrinho[c.id] ? (
                    <div className="flex flex-col items-center justify-center px-1.5 border-l border-sdb-purple/30">
                      <span className="text-sm font-extrabold text-sdb-purple">{carrinho[c.id]}</span>
                      <button onClick={() => mais(c.id, -1)} className="text-xs text-gray-500 px-1">−</button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            {itensCarrinho.filter(c => /crepe/i.test(c.nome)).map(c => (
              <div key={c.id} className="mt-2 rounded-lg border-2 border-amber-300 bg-amber-50 p-2">
                <p className="text-xs font-bold text-amber-800 mb-1">🥞 Sabor do {c.nome}{carrinho[c.id] > 1 ? ` (${carrinho[c.id]} crepes)` : ''}</p>
                <input value={obsItem[c.id] ?? ''} onChange={e => setObsItem(o => ({ ...o, [c.id]: e.target.value }))}
                  placeholder={carrinho[c.id] > 1 ? 'ex.: 1 Nutella, 1 frango com catupiry' : 'ex.: Nutella com morango'}
                  className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-base focus:outline-none focus:border-amber-500" />
              </div>
            ))}
            <div className="mt-2 flex gap-2">
              <input value={outroDesc} onChange={e => setOutroDesc(e.target.value)} placeholder="Outro (o quê?)"
                className="flex-1 min-w-0 rounded-lg border border-gray-300 px-2 py-2 text-sm" />
              <div className="flex shrink-0 items-center rounded-lg border border-gray-300 px-2">
                <span className="text-sm text-gray-400">R$</span>
                <input value={outroValor} onChange={e => setOutroValor(e.target.value)} inputMode="decimal" placeholder="0,00"
                  className="w-16 py-2 pl-1 text-sm outline-none" />
              </div>
            </div>
            {(itensCarrinho.length > 0 || outroCent > 0) && (
              <button onClick={lancar} disabled={salvando}
                className="mt-2 w-full rounded-lg bg-sdb-purple py-3 text-sm font-bold text-white disabled:opacity-50 active:scale-[0.99]">
                {salvando ? 'Lançando…' : `Lançar ${formatBRL(totalCarrinho + outroCent)}`}
              </button>
            )}
          </div>

          {consumidos.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1">JÁ LANÇADO</p>
              {consumidos.map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-50">
                  <span className="text-gray-700">{p.qtd}× {p.item} <span className="text-gray-400">· {formatBRL(p.preco_unit_centavos * p.qtd)}</span>
                    {p.ja_pago && <span className="ml-1 text-[10px] font-bold text-emerald-700">já pago</span>}{p.obs && <span className="block text-[11px] text-amber-700">{p.obs}</span>}</span>
                  {!r.consumo_pago && <button onClick={() => cancelar(p)} className="text-red-400 text-xs px-2">✕</button>}
                </div>
              ))}
            </div>
          )}

          {(r.ja_pago_centavos ?? 0) > 0 && (
            <p className="text-center text-xs font-bold text-emerald-700">✓ {formatBRL(r.ja_pago_centavos ?? 0)} já pago antes (turma) · não cobrar</p>
          )}
          {r.consumo_centavos > 0 && (r.consumo_pago ? (
            <button onClick={desfazerPago} disabled={salvando}
              className="w-full rounded-lg bg-gray-100 py-2.5 text-xs font-bold text-gray-500">✓ Pago {formatBRL(r.consumo_centavos)} · desfazer</button>
          ) : (
            <div className="rounded-lg bg-emerald-50 border-2 border-emerald-300 p-3 text-center">
              <p className="text-xs text-gray-500">Cobrar</p>
              <p className="text-3xl font-extrabold text-emerald-700">{formatBRL(r.consumo_centavos)}</p>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {FORMAS_PAGAMENTO.map(f => (
                  <button key={f.id} onClick={() => pago(f.id)} disabled={salvando}
                    className="rounded-lg bg-emerald-500 py-3 text-xs font-bold text-white disabled:opacity-50 active:scale-95">{f.rotulo}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
