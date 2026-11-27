import { useEffect, useState, useCallback, useMemo } from 'react'
import { fetchPainel, formatBRL, abrirComprovante, type PainelReserva, type PainelEdicao, type PainelTurma } from '../lib/tzApi'

// 27/11/2026: "Felipe pago — é a criança ou o responsável?" A mãe escreveu o nome do filho no
// campo do responsável. Agora a linha mostra a CRIANÇA em destaque e avisa quando os nomes batem.
function nomeTrocado(resp: string, criancas: string[]): boolean {
  const n = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
  const r = n(resp)
  return !!r && criancas.some(c => { const cc = n(c); return cc === r || cc.startsWith(r + ' ') })
}

// Inscritos — ADM (Ana e Maninha). 13/11/2026, desenho aprovado pela Maninha: junta o /inscritos
// (só a edição atual) com o filtro de edição do /admin/tardezinha-stats. Total, crianças, pagantes,
// a receber e por turno, ESCOLHENDO A EDIÇÃO. Abre com a chave de ADM: /inscritos?key=CHAVE.
// Com a chave da equipe do dia (?k=) mostra o cadeado: número e edição anterior não são da equipe.
// A ficha completa (alergia, imagem, canal, planilha, mudar status) segue no /admin/tardezinha-stats.

const PAGO = new Set(['pago', 'confirmado'])

const MESES: Record<string, string> = {
  jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06',
  jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12',
}

// '16ago|14h–18h' → { data: '16/08', turno: '14h–18h' }
function partesDoTurno(marker: string): { data: string; turno: string } {
  // inscrição de turma grava só o dia ('14nov'), sem horário: aparece como "turmas"
  const [dataRaw = '', turno = 'turmas'] = marker.split('|')
  const m = dataRaw.match(/^(\d{1,2})([a-z]{3})$/i)
  const data = m && MESES[m[2].toLowerCase()]
    ? `${m[1].padStart(2, '0')}/${MESES[m[2].toLowerCase()]}`
    : dataRaw
  return { data, turno }
}

function whatsappLink(numero: string | null): string | null {
  const limpo = (numero ?? '').replace(/\D/g, '')
  if (limpo.length < 10) return null
  return `https://wa.me/${limpo.startsWith('55') ? limpo : `55${limpo}`}`
}

function Numero({ valor, label, cor }: { valor: number; label: string; cor: string }) {
  return (
    <div className={`rounded-2xl p-4 text-center ${cor}`}>
      <p className="text-3xl font-extrabold leading-none sm:text-4xl">{valor}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
    </div>
  )
}

export function Inscritos() {
  useEffect(() => { document.title = 'Inscritos — Tardezinha (equipe)' }, [])
  const qs = new URLSearchParams(window.location.search)
  const key = qs.get('key') || qs.get('k') || ''
  const [edicao, setEdicao] = useState('')
  const [edicoes, setEdicoes] = useState<PainelEdicao[]>([])

  const [status, setStatus] = useState<'loading' | 'ok' | 'negado'>('loading')
  const [reservas, setReservas] = useState<PainelReserva[]>([])
  const [turmas, setTurmas] = useState<PainelTurma[]>([])
  const [atualizadoEm, setAtualizadoEm] = useState<string>('')
  const [abrindo, setAbrindo] = useState('')

  async function verComprovante(id: string) {
    setAbrindo(id)
    const r = await abrirComprovante(key, id)
    setAbrindo('')
    if (r.ok && r.url) window.open(r.url, '_blank', 'noopener')
    else alert('Não consegui abrir o comprovante: ' + (r.motivo || 'tenta de novo'))
  }

  const carregar = useCallback(async () => {
    if (!key) { setStatus('negado'); return }
    const res = await fetchPainel(key, edicao)
    if (!res.ok || !res.adm) { setStatus('negado'); return }
    setReservas(res.reservas ?? [])
    setTurmas(res.turmas ?? [])
    setEdicoes(res.edicoes ?? [])
    if (!edicao && res.edicao) setEdicao(res.edicao)
    setAtualizadoEm(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
    setStatus('ok')
  }, [key, edicao])

  useEffect(() => {
    carregar()
    const t = setInterval(carregar, 60000) // sozinho de minuto em minuto
    return () => clearInterval(t)
  }, [carregar])

  const resumo = useMemo(() => {
    const criancas = reservas.reduce((n, r) => n + (r.qtd_criancas ?? 0), 0)
    const pagas = reservas.filter(r => PAGO.has(r.status)).length
    const aReceberEntradas = reservas.filter(r => !PAGO.has(r.status)).reduce((n, r) => n + (r.entrada_ref_centavos ?? 0), 0)
    const aReceberLanche = reservas.filter(r => !r.consumo_pago).reduce((n, r) => n + (r.consumo_centavos ?? 0), 0)
    const turnos = new Map<string, { inscricoes: number; criancas: number }>()
    for (const r of reservas) {
      const t = turnos.get(r.turno) ?? { inscricoes: 0, criancas: 0 }
      t.inscricoes += 1
      t.criancas += r.qtd_criancas ?? 0
      turnos.set(r.turno, t)
    }
    return {
      inscricoes: reservas.length,
      criancas,
      pagas,
      aguardando: reservas.length - pagas,
      aReceberEntradas,
      aReceberLanche,
      turnos: Array.from(turnos.entries()).sort((a, b) => a[0].localeCompare(b[0])),
    }
  }, [reservas])

  const data = reservas.length ? partesDoTurno(reservas[0].turno).data : ''

  const lista = useMemo(
    () => [...reservas].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [reservas]
  )

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Carregando…</div>
  }
  if (status === 'negado') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-lg font-semibold text-gray-700">Inscritos é só da administração.</p>
          <p className="text-sm text-gray-500 mt-1">Abre pela Página da Tardezinha com o link de ADM (Central de Links do CRM).</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <a href={`/central?key=${key}`} className="text-xs font-semibold text-purple-700 underline">← Página da Tardezinha</a>
        <header className="mt-2 mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Tardezinha · administração</p>
            <h1 className="mt-1 text-2xl font-extrabold text-gray-800 sm:text-3xl">
              Inscritos {data && <span className="text-gray-400">· {data}</span>}
            </h1>
            {atualizadoEm && (
              <p className="mt-1 text-xs text-gray-400">Atualizado às {atualizadoEm} · sozinho a cada 1 min</p>
            )}
          </div>
          <button
            onClick={() => carregar()}
            className="shrink-0 rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 shadow-sm active:scale-95"
          >
            🔄 Atualizar
          </button>
        </header>

        {edicoes.length > 0 && (
          <label className="mb-4 flex items-center gap-2 text-sm">
            <span className="font-semibold text-gray-600">Edição:</span>
            <select value={edicao} onChange={e => setEdicao(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-800">
              {edicoes.map(e => <option key={e.marker} value={e.marker}>Tardezinha {e.dia.slice(8, 10)}/{e.dia.slice(5, 7)}/{e.dia.slice(0, 4)}</option>)}
            </select>
          </label>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Numero valor={resumo.inscricoes} label="Inscrições" cor="bg-purple-100 text-purple-900" />
          <Numero valor={resumo.criancas} label="Crianças" cor="bg-amber-100 text-amber-900" />
          <Numero valor={resumo.pagas} label="Pagas" cor="bg-emerald-100 text-emerald-900" />
          <Numero valor={resumo.aguardando} label="Sem pagar" cor="bg-rose-100 text-rose-900" />
        </div>
        {(resumo.aReceberEntradas > 0 || resumo.aReceberLanche > 0) && (
          <p className="mt-3 rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-800">
            💰 A receber: <strong>{formatBRL(resumo.aReceberEntradas)}</strong> de entrada
            {resumo.aReceberLanche > 0 && <> · <strong>{formatBRL(resumo.aReceberLanche)}</strong> de lanche</>}
          </p>
        )}

        {resumo.turnos.length > 1 && (
          <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Por turno</p>
            {resumo.turnos.map(([marker, t]) => (
              <div key={marker} className="flex items-center justify-between border-b py-1.5 last:border-0">
                <span className="text-sm font-semibold text-gray-700">{partesDoTurno(marker).turno}</span>
                <span className="text-sm text-gray-500">
                  {t.inscricoes} inscrição(ões) · <strong className="text-gray-700">{t.criancas}</strong> criança(s)
                </span>
              </div>
            ))}
          </div>
        )}

        {turmas.length > 0 && (
          <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Turmas de aniversário nesta data</p>
            {turmas.map(t => (
              <div key={t.token} className="flex items-center gap-3 border-b py-2 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800">🎈 Turma do {t.aniversariante} <span className="font-normal text-gray-500">· {t.organizadora}</span></p>
                  <p className={`text-xs ${t.inscritos < t.piso ? 'text-rose-700' : 'text-gray-500'}`}>
                    {t.inscritos} de {t.piso} nomes na lista{t.modelo === 'turma_mae_paga' ? ' · a mãe paga todos' : ''}
                    {t.inscritos === 0 && ' · lista ainda não veio'}
                  </p>
                </div>
                <a href={`/turma/${t.token}`} target="_blank" rel="noopener noreferrer"
                  className="shrink-0 rounded-lg bg-purple-100 px-2.5 py-1.5 text-xs font-bold text-purple-800 active:scale-95">
                  ➕ Colocar nome
                </a>
              </div>
            ))}
          </div>
        )}

        <h2 className="mt-6 mb-2 text-sm font-bold uppercase tracking-wide text-gray-400">
          Todos os inscritos do dia — avulsos e turmas ({lista.length})
        </h2>

        {lista.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
            Ninguém inscrito ainda nesta edição.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            {lista.map(r => {
              const pago = PAGO.has(r.status)
              const zap = whatsappLink(r.whatsapp)
              const kids = (r.criancas ?? []).map(c => c.nome).filter(Boolean)
              const trocado = nomeTrocado(r.nome, kids)
              return (
                <div key={r.id} className="flex items-center gap-3 border-b px-4 py-3 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800">👧 {kids.length ? kids.join(', ') : `${r.qtd_criancas} criança(s)`}</p>
                    <p className="text-xs text-gray-500">
                      Responsável: {r.nome}
                      {r.turma ? <> · 🎈 Turma do {r.turma}</> : <> · {partesDoTurno(r.turno).turno}</>}
                    </p>
                    {trocado && (
                      <p className="text-xs font-semibold text-amber-700">⚠️ Escreveram o nome da criança no lugar do responsável</p>
                    )}
                  </div>
                  {r.tem_comprovante && (
                    <button onClick={() => verComprovante(r.id)} disabled={abrindo === r.id}
                      className="shrink-0 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-sm active:scale-95" title="Ver comprovante">
                      {abrindo === r.id ? '…' : '🧾'}
                    </button>
                  )}
                  {zap && (
                    <a
                      href={zap}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-lg bg-gray-100 px-2.5 py-1.5 text-sm active:scale-95"
                      title="Abrir conversa no WhatsApp"
                    >
                      💬
                    </a>
                  )}
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      pago ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {pago ? 'Pago' : 'A receber'}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          Ficha completa (alergia, imagem, canal, planilha) → <a className="underline" href={`/admin/tardezinha-stats?key=${key}`}>Ficha completa</a>
        </p>
      </div>
    </div>
  )
}
