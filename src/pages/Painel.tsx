import { useEffect, useState, useCallback } from 'react'
import {
  fetchPainel, setPedidoStatus, addPedido, fetchCardapio, setCheckin,
  formatBRL, type PainelReserva, type CardapioItem, type PainelPedido,
} from '../lib/tzApi'

// Painel da cozinha + fica de saída. Sem login — protegido por ?k=CHAVE.
// A chave é validada no banco (RPC). Link é SÓ da equipe (mostra dado pessoal).

const STATUS_NEXT: Record<string, PainelPedido['status'] | null> = {
  recebido: 'preparando',
  preparando: 'entregue',
  entregue: 'finalizado',
  finalizado: null,
  cancelado: null,
}
const STATUS_LABEL: Record<string, string> = {
  recebido: '🟡 Recebido',
  preparando: '🔵 Preparando',
  entregue: '🟢 Entregue',
  finalizado: '⚪ Concluído',
  cancelado: '⚫ Cancelado',
}
const STATUS_BTN: Record<string, string> = {
  recebido: 'bg-amber-50 text-amber-700 border-amber-200',
  preparando: 'bg-sky-50 text-sky-700 border-sky-200',
  entregue: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  finalizado: 'bg-gray-100 text-gray-400 border-gray-200',
  cancelado: 'bg-gray-100 text-gray-400 border-gray-200',
}

function getKey(): string {
  return new URLSearchParams(window.location.search).get('k') ?? ''
}

export function Painel() {
  useEffect(() => { document.title = 'Painel — Tardezinha (equipe)' }, [])
  const key = getKey()

  const [status, setStatus] = useState<'loading' | 'ok' | 'negado'>('loading')
  const [reservas, setReservas] = useState<PainelReserva[]>([])
  const [cardapio, setCardapio] = useState<CardapioItem[]>([])
  const [turnoFiltro, setTurnoFiltro] = useState<string>('todos')

  const carregar = useCallback(async () => {
    if (!key) { setStatus('negado'); return }
    const res = await fetchPainel(key)
    if (!res.ok) { setStatus('negado'); return }
    setReservas(res.reservas ?? [])
    setStatus('ok')
  }, [key])

  useEffect(() => {
    carregar()
    fetchCardapio().then(setCardapio)
    const t = setInterval(carregar, 20000) // atualiza sozinho a cada 20s
    return () => clearInterval(t)
  }, [carregar])

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Carregando painel…</div>
  }
  if (status === 'negado') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-lg font-semibold text-gray-700">Acesso restrito à equipe.</p>
          <p className="text-sm text-gray-500 mt-1">Abre pelo link com a chave que a Jack te passou.</p>
        </div>
      </div>
    )
  }

  const turnos = Array.from(new Set(reservas.map(r => r.turno))).sort()
  const visiveis = turnoFiltro === 'todos' ? reservas : reservas.filter(r => r.turno === turnoFiltro)

  const totalCriancas = visiveis.reduce((s, r) => s + (r.qtd_criancas ?? 0), 0)
  const totalChegaram = visiveis.filter(r => r.chegou).length
  const pedidosPendentes = visiveis.reduce(
    (s, r) => s + r.pedidos.filter(p => p.status === 'recebido' || p.status === 'preparando').length, 0)

  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-sdb-purple text-white px-4 py-3 shadow-md">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold leading-tight">Painel da Tardezinha</h1>
            <p className="text-xs text-white/80">Cozinha + fica de saída · equipe</p>
          </div>
          <button onClick={carregar} className="rounded-lg bg-white/20 px-3 py-2 text-sm font-semibold active:scale-95">
            ↻ Atualizar
          </button>
        </div>
        {/* KPIs */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-white/10 py-2">
            <p className="text-xl font-bold">{totalChegaram}<span className="text-sm text-white/70">/{visiveis.length}</span></p>
            <p className="text-[11px] text-white/80">chegaram</p>
          </div>
          <div className="rounded-lg bg-white/10 py-2">
            <p className="text-xl font-bold">{totalCriancas}</p>
            <p className="text-[11px] text-white/80">crianças</p>
          </div>
          <div className="rounded-lg bg-white/10 py-2">
            <p className="text-xl font-bold">{pedidosPendentes}</p>
            <p className="text-[11px] text-white/80">pedidos abertos</p>
          </div>
        </div>
      </header>

      {/* Filtro de turno */}
      {turnos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3">
          <button
            onClick={() => setTurnoFiltro('todos')}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${turnoFiltro === 'todos' ? 'bg-sdb-purple text-white' : 'bg-white text-gray-600 border border-gray-300'}`}
          >Todos</button>
          {turnos.map(t => (
            <button
              key={t}
              onClick={() => setTurnoFiltro(t)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${turnoFiltro === t ? 'bg-sdb-purple text-white' : 'bg-white text-gray-600 border border-gray-300'}`}
            >{t}</button>
          ))}
        </div>
      )}

      {/* Lista de famílias */}
      <div className="space-y-3 px-4">
        {visiveis.length === 0 && (
          <p className="py-10 text-center text-gray-400">Nenhuma reserva neste turno ainda.</p>
        )}
        {visiveis.map(r => (
          <FamiliaCard key={r.id} r={r} cardapio={cardapio} chave={key} onChange={carregar} />
        ))}
      </div>

      {/* Link rápido pra tela da cozinha */}
      {visiveis.length > 0 && (
        <div className="mt-6 px-4 text-center">
          <a href={`/cozinha?k=${key}`} className="text-sm font-semibold text-sdb-purple underline">
            🍽️ Abrir a Tela da Cozinha →
          </a>
        </div>
      )}
    </div>
  )
}

function FamiliaCard({
  r, cardapio, chave, onChange,
}: {
  r: PainelReserva
  cardapio: CardapioItem[]
  chave: string
  onChange: () => void
}) {
  const [aberto, setAberto] = useState(false)
  const [addItem, setAddItem] = useState<string>(cardapio[0]?.id ?? '')
  const [addQtd, setAddQtd] = useState(1)
  const [salvando, setSalvando] = useState(false)
  const [chegLoad, setChegLoad] = useState(false)

  const pago = r.status === 'pago'
  const pedidosAbertosFam = r.pedidos.filter(p => p.status === 'recebido' || p.status === 'preparando').length

  async function toggleChegou() {
    setChegLoad(true)
    await setCheckin(chave, r.id, !r.chegou)
    setChegLoad(false)
    onChange()
  }

  async function mudarStatus(p: PainelPedido) {
    const next = STATUS_NEXT[p.status]
    if (!next) return
    await setPedidoStatus(chave, p.id, next)
    onChange()
  }

  async function cancelarPedido(p: PainelPedido) {
    if (!window.confirm(`Cancelar ${p.qtd}× ${p.item}? (pra trocar, cancela e adiciona o certo)`)) return
    await setPedidoStatus(chave, p.id, 'cancelado')
    onChange()
  }

  async function adicionar() {
    const item = cardapio.find(c => c.id === addItem)
    if (!item) return
    setSalvando(true)
    await addPedido(chave, r.id, item.nome, item.preco_centavos ?? 0, addQtd)
    setSalvando(false)
    setAddQtd(1)
    onChange()
  }

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
      {/* Cabeçalho da família */}
      <div className={`flex items-stretch ${r.chegou ? 'bg-emerald-50' : ''}`}>
        <button onClick={() => setAberto(a => !a)} className="flex-1 min-w-0 flex items-center justify-between gap-3 p-4 text-left">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-gray-800 truncate">{r.nome}</p>
              {pago
                ? <span className="rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5">✅ PAGO</span>
                : <span className="rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5">⏳ PENDENTE</span>}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{r.turno} · {r.qtd_criancas} criança(s)</p>
          </div>
          {pedidosAbertosFam > 0 && (
            <div className="shrink-0">
              <span className="rounded-full bg-sdb-purple/10 text-sdb-purple text-xs font-bold px-2.5 py-1 whitespace-nowrap">🍽️ {pedidosAbertosFam}</span>
            </div>
          )}
        </button>
        <button
          onClick={toggleChegou}
          disabled={chegLoad}
          className={`shrink-0 w-[74px] flex flex-col items-center justify-center gap-0.5 border-l text-xs font-bold transition disabled:opacity-50 ${r.chegou ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-500 border-gray-200 active:bg-gray-50'}`}
        >
          <span className="text-lg leading-none">{r.chegou ? '🟢' : '✔'}</span>
          {r.chegou ? 'Na casa' : 'Chegou'}
        </button>
      </div>

      {aberto && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Crianças */}
          <div>
            <p className="text-xs font-bold text-gray-500 mb-1">CRIANÇAS</p>
            <div className="flex flex-wrap gap-1.5">
              {r.criancas.map((c, i) => (
                <span key={i} className={`rounded-full px-2.5 py-1 text-xs ${c.status === 'ativo' ? 'bg-sdb-purple/10 text-sdb-purple-dark' : 'bg-gray-100 text-gray-400 line-through'}`}>
                  {c.nome.split(' ')[0]}
                </span>
              ))}
              {r.criancas.length === 0 && <span className="text-xs text-gray-400">—</span>}
            </div>
          </div>

          {/* Autorizados a retirar — controle de porta */}
          <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-3">
            <p className="text-xs font-bold text-amber-700 mb-1.5">🔐 SÓ PODE RETIRAR A CRIANÇA</p>
            {r.autorizados.length === 0 ? (
              <p className="text-xs text-amber-700/70">Ninguém cadastrado — confirma com o responsável antes de liberar.</p>
            ) : (
              <ul className="space-y-1">
                {r.autorizados.map((a, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-semibold text-gray-800">{a.nome}</span>
                    <span className="text-xs text-gray-500">{a.cpf ? `CPF ${a.cpf}` : 'sem CPF'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pedidos */}
          <div>
            <p className="text-xs font-bold text-gray-500 mb-1">PEDIDOS</p>
            {r.pedidos.length === 0 && <p className="text-xs text-gray-400">Sem pedidos.</p>}
            <div className="space-y-1.5">
              {r.pedidos.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800">
                      <strong>{p.qtd}×</strong> {p.item}
                      {p.preco_unit_centavos > 0 && <span className="text-gray-400"> · {formatBRL(p.preco_unit_centavos * p.qtd)}</span>}
                      {p.origem === 'evento' && <span className="ml-1 text-[10px] text-amber-600">(no dia)</span>}
                    </p>
                    {p.obs && <p className="text-[11px] text-gray-400">{p.obs}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => mudarStatus(p)}
                      disabled={!STATUS_NEXT[p.status]}
                      className={`rounded-md border px-2 py-1 text-xs font-semibold disabled:opacity-70 ${STATUS_BTN[p.status] ?? 'bg-white border-gray-300'}`}
                    >
                      {STATUS_LABEL[p.status]}
                    </button>
                    <button
                      onClick={() => cancelarPedido(p)}
                      title="Cancelar / trocar pedido"
                      className="rounded-md border border-red-200 text-red-500 px-2 py-1 text-xs font-bold hover:bg-red-50 active:scale-95"
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Adicionar item ao vivo */}
          {cardapio.length > 0 && (
            <div className="rounded-lg bg-sdb-purple/5 p-3">
              <p className="text-xs font-bold text-sdb-purple mb-2">+ Adicionar consumo no dia</p>
              <div className="flex gap-2">
                <select
                  value={addItem}
                  onChange={e => setAddItem(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm"
                >
                  {cardapio.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}{c.preco_centavos != null ? ` · ${formatBRL(c.preco_centavos)}` : ''}</option>
                  ))}
                </select>
                <input
                  type="number" min={1} value={addQtd}
                  onChange={e => setAddQtd(Math.max(1, Number(e.target.value)))}
                  className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-sm text-center"
                />
                <button
                  onClick={adicionar} disabled={salvando}
                  className="rounded-lg bg-sdb-purple px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                >{salvando ? '…' : 'Add'}</button>
              </div>
            </div>
          )}

          <p className="text-[11px] text-gray-400 text-center">💰 Pagamento do lanche é no bar, na hora. A portaria não recebe dinheiro.</p>
        </div>
      )}
    </div>
  )
}
