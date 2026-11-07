import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { reais } from '../lib/pix'

// EQUIPE: as turmas (Tardezinha de Grupo, cada família paga a sua) num lugar só.
// Abre com a mesma chave do painel: /turmas?k=CHAVE (validada no banco em tz_painel_ok).

const BASE = 'https://tardezinha.showdebolars.com.br'

interface Insc { id: string; crianca: string; responsavel: string; whatsapp: string; status: string; total_centavos: number; notas: string; restricao: string | null }
interface TurmaT {
  id: string; token: string; aniversariante_nome: string; organizadora_nome: string; organizadora_whatsapp: string
  evento_data: string; horario: string | null; lista_fecha_em: string; piso_criancas: number; status: string
  aviso_responsavel: boolean; preco_entrada_centavos: number; inscricoes: Insc[]
}
const br = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

export function Turmas() {
  const k = new URLSearchParams(window.location.search).get('k') ?? ''
  const [turmas, setTurmas] = useState<TurmaT[] | null>(null)
  const [negado, setNegado] = useState(false)
  const [copiado, setCopiado] = useState('')
  const [nova, setNova] = useState({ aniv: '', org: '', whats: '', data: '', horario: '', piso: 12 })
  const [msg, setMsg] = useState('')

  useEffect(() => { document.title = 'Turmas — Tardezinha (equipe)' }, [])
  const carregar = useCallback(async () => {
    const { data } = await supabase.rpc('tz_turmas_lista', { p_key: k })
    const r = data as { ok: boolean; turmas: TurmaT[] }
    if (!r?.ok) { setNegado(true); return }
    setTurmas(r.turmas)
  }, [k])
  useEffect(() => { carregar() }, [carregar])

  async function copiar(t: TurmaT) {
    const url = `${BASE}/turma/${t.token}`
    try { await navigator.clipboard.writeText(url) } catch { /* segue */ }
    setCopiado(t.id); setTimeout(() => setCopiado(''), 1600)
  }
  async function marcar(id: string, status: string) {
    if (status === 'cancelado' && !confirm('Cancelar esta inscrição?')) return
    await supabase.rpc('tz_turma_marcar', { p_key: k, p_reserva_id: id, p_status: status })
    carregar()
  }
  async function criar(e: FormEvent) {
    e.preventDefault(); setMsg('')
    const { data } = await supabase.rpc('tz_turma_criar', {
      p_key: k, p_aniversariante: nova.aniv, p_organizadora: nova.org, p_whatsapp: nova.whats,
      p_evento_data: nova.data, p_horario: nova.horario, p_piso: nova.piso,
    })
    const r = data as { ok: boolean; motivo?: string }
    if (!r?.ok) { setMsg(r?.motivo || 'Não deu pra criar.'); return }
    setNova({ aniv: '', org: '', whats: '', data: '', horario: '', piso: 12 })
    setMsg('Turma criada. O link está na lista abaixo.')
    carregar()
  }

  if (negado) return <div className="min-h-screen grid place-items-center bg-gray-50 p-6 text-center text-gray-600">Link sem a chave da equipe. Abre pela Central de Links do CRM.</div>
  if (!turmas) return <div className="min-h-screen grid place-items-center bg-gray-50 text-gray-500">Carregando…</div>

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Tardezinha · equipe 🔒</p>
        <h1 className="text-3xl font-extrabold text-gray-800">Turmas</h1>
        <p className="mt-1 text-sm text-gray-500">Cada família se inscreve e paga pelo link da turma. O comprovante no 1165 marca <b>pago</b> sozinho em até 1 hora. 7 dias antes e no dia que a lista fecha, a lista vai pra pauta da Ana.</p>

        {turmas.length === 0 && <p className="mt-6 rounded-xl bg-white p-4 text-gray-500">Nenhuma turma ainda.</p>}

        {turmas.map(t => {
          const pagas = t.inscricoes.filter(i => i.status === 'pago')
          const falta = Math.max(t.piso_criancas - pagas.length, 0)
          return (
            <section key={t.id} className="mt-5 rounded-2xl bg-white p-5 shadow-sm border border-gray-200">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-800">Turma de {t.aniversariante_nome}</h2>
                  <p className="text-sm text-gray-600">{br(t.evento_data)}{t.horario ? ` · ${t.horario}` : ''} · responsável {t.organizadora_nome} ({t.organizadora_whatsapp})</p>
                  <p className="text-sm text-gray-600">Lista fecha <b>{br(t.lista_fecha_em)}</b> · aviso pra responsável: {t.aviso_responsavel ? 'ligado' : 'desligado'}</p>
                </div>
                <button onClick={() => copiar(t)} className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-bold text-white">{copiado === t.id ? 'Copiado ✓' : 'Copiar link da turma'}</button>
              </div>
              <p className={`mt-3 rounded-lg px-3 py-2 text-sm font-bold ${falta === 0 ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'}`}>
                {pagas.length} de {t.piso_criancas} pagas{falta > 0 ? ` · faltam ${falta} (${reais(falta * t.preco_entrada_centavos)} se a responsável completar)` : ' · fechou!'}
              </p>
              <ul className="mt-3 divide-y divide-gray-100">
                {t.inscricoes.map(i => (
                  <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <div>
                      <span className="font-semibold text-gray-800">{i.crianca}</span>
                      <span className="text-gray-500"> · {i.responsavel} · {i.whatsapp} · {reais(i.total_centavos)}</span>
                      {i.restricao && <span className="ml-1 rounded bg-rose-100 px-1.5 text-rose-800">restrição: {i.restricao}</span>}
                      {i.notas?.includes('⚠️') && <div className="text-amber-700">⚠️ comprovante não bateu com o valor: conferir</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      {i.status === 'pago'
                        ? <span className="rounded-full bg-green-100 px-2.5 py-1 font-bold text-green-800">pago</span>
                        : <>
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 font-bold text-amber-800">falta pagar</span>
                            <button onClick={() => marcar(i.id, 'pago')} className="rounded-lg border border-green-600 px-2 py-1 text-green-700">marcar pago</button>
                          </>}
                      <button onClick={() => marcar(i.id, 'cancelado')} className="text-xs text-gray-400 underline">cancelar</button>
                    </div>
                  </li>
                ))}
                {t.inscricoes.length === 0 && <li className="py-2 text-sm text-gray-500">Ninguém se inscreveu ainda.</li>}
              </ul>
            </section>
          )
        })}

        <form onSubmit={criar} className="mt-8 rounded-2xl bg-white p-5 shadow-sm border border-gray-200 space-y-3">
          <h2 className="text-lg font-extrabold text-gray-800">Criar turma nova</h2>
          <p className="text-xs text-gray-500">Só depois que a data estiver confirmada na agenda e o sinal de R$ 200 pago.</p>
          {msg && <p className="rounded-lg bg-purple-50 p-2 text-sm font-semibold text-purple-800">{msg}</p>}
          <input required value={nova.aniv} onChange={e => setNova({ ...nova, aniv: e.target.value })} className="w-full rounded-lg border-2 border-gray-200 p-3" placeholder="Quem faz aniversário" />
          <input required value={nova.org} onChange={e => setNova({ ...nova, org: e.target.value })} className="w-full rounded-lg border-2 border-gray-200 p-3" placeholder="Nome da responsável" />
          <input required value={nova.whats} onChange={e => setNova({ ...nova, whats: e.target.value })} className="w-full rounded-lg border-2 border-gray-200 p-3" placeholder="WhatsApp da responsável com DDD" />
          <div className="grid grid-cols-2 gap-3">
            <input required type="date" value={nova.data} onChange={e => setNova({ ...nova, data: e.target.value })} className="rounded-lg border-2 border-gray-200 p-3" />
            <input value={nova.horario} onChange={e => setNova({ ...nova, horario: e.target.value })} className="rounded-lg border-2 border-gray-200 p-3" placeholder="Horário (ex.: 15h às 19h)" />
          </div>
          <button className="w-full rounded-xl bg-purple-700 py-3 font-bold text-white">Criar turma e gerar o link</button>
        </form>
      </div>
    </div>
  )
}
