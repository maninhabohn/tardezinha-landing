import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// ADM: Nova edição da Tardezinha (13/11/2026, desenho aprovado pela Maninha).
// A Ana informa o dia e o horário → a edição nasce DESLIGADA, "aguardando aprovação da Maninha".
// Só a chave da Maninha (dona) aprova; aí a data abre ao público sozinha:
//   - o site passa a vender (main.tsx lê tardezinha_edicoes_publicas ao abrir, sem publicar código)
//   - a Thelma aprende a data (gatilho tz_edicoes_regra)
//   - o painel do dia passa a mostrar quando chegar a vez dela
// Antes era manual (skill tardezinha-datas: código + publicar + SQL).

interface Edicao {
  marker: string; dia: string; inicio: string; fim: string; ativa: boolean
  aprovacao: 'aguardando' | 'aprovada' | 'recusada'; pedida_por: string | null; pedida_em: string | null; inscritos: number
}
interface Conferir { item: string; ok: boolean; detalhe: string }
interface Dados { ok: boolean; pode_aprovar: boolean; edicoes: Edicao[]; conferir: Conferir[] }

const h = (x: string) => x.replace(/h00$/, 'h') // '15h00' → '15h'
const SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
function rotulo(iso: string) {
  const [a, m, d] = iso.split('-').map(Number)
  return `${SEMANA[new Date(a, m - 1, d).getDay()]}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${a}`
}
// o que o conferidor do banco diz, em português da casa
const ITEM: Record<string, string> = {
  'edicoes pela frente': 'Datas abertas no site',
  'agenda tem, banco nao': 'Na agenda e não no sistema',
  'banco tem, agenda nao': 'No sistema e não na agenda',
  'Thelma': 'A atendente (Thelma) sabe das datas',
  'painel da equipe': 'Painel do dia na edição certa',
  'robo ligado com data vencida': 'Robô falando de data velha',
  'reserva com data errada': 'Inscrição com data errada',
}

export function NovaEdicao() {
  const k = new URLSearchParams(window.location.search).get('key') ?? ''
  const [d, setD] = useState<Dados | null>(null)
  const [negado, setNegado] = useState(false)
  const [dia, setDia] = useState('')
  const [inicio, setInicio] = useState('15:00')
  const [fim, setFim] = useState('19:00')
  const [obs, setObs] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { document.title = 'Nova edição — Tardezinha (ADM)' }, [])
  const carregar = useCallback(async () => {
    const { data } = await supabase.rpc('tz_edicoes_adm', { p_key: k })
    const r = data as Dados
    if (!r?.ok) { setNegado(true); return }
    setD(r)
  }, [k])
  useEffect(() => { carregar() }, [carregar])

  async function pedir() {
    if (!dia) return
    setSalvando(true); setMsg(null)
    const { data } = await supabase.rpc('tz_edicao_pedir', { p_key: k, p_dia: dia, p_inicio: inicio, p_fim: fim, p_obs: obs || null })
    setSalvando(false)
    const r = data as { ok: boolean; motivo?: string }
    if (r?.ok) {
      setMsg({ ok: true, texto: `Pronto! ${rotulo(dia)} está aguardando a Maninha aprovar. Ainda NÃO aparece no site.` })
      setDia(''); setObs('')
      carregar()
    } else setMsg({ ok: false, texto: r?.motivo ?? 'Não deu certo. Tenta de novo.' })
  }

  async function decidir(e: Edicao, aprovar: boolean) {
    const pergunta = aprovar
      ? `Abrir a Tardezinha de ${rotulo(e.dia)}, das ${h(e.inicio)} às ${h(e.fim)}, AO PÚBLICO?\n\nO site passa a vender e a atendente passa a oferecer essa data.`
      : `Recusar a Tardezinha de ${rotulo(e.dia)}?`
    if (!window.confirm(pergunta)) return
    const { data } = await supabase.rpc('tz_edicao_aprovar', { p_key: k, p_marker: e.marker, p_aprovar: aprovar })
    const r = data as { ok: boolean; motivo?: string }
    setMsg(r?.ok
      ? { ok: true, texto: aprovar ? `✅ ${rotulo(e.dia)} aberta ao público.` : `${rotulo(e.dia)} recusada.` }
      : { ok: false, texto: r?.motivo ?? 'Não deu certo.' })
    carregar()
  }

  if (negado) return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-6 text-center text-gray-600">
      <div><p className="text-4xl mb-3">🔒</p><p className="font-semibold">Nova edição é só da administração.</p>
        <p className="text-sm text-gray-500 mt-1">Abre pela Página da Tardezinha com o link de ADM.</p></div>
    </div>
  )
  if (!d) return <div className="min-h-screen grid place-items-center bg-gray-50 text-gray-400">Carregando…</div>

  const aguardando = d.edicoes.filter(e => e.aprovacao === 'aguardando')
  const abertas = d.edicoes.filter(e => e.aprovacao === 'aprovada' && e.ativa)
  const recusadas = d.edicoes.filter(e => e.aprovacao === 'recusada')
  const problemas = d.conferir.filter(c => !c.ok)

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <a href={`/central?key=${k}`} className="text-xs font-semibold text-purple-700 underline">← Página da Tardezinha</a>
        <h1 className="mt-2 text-2xl font-extrabold text-purple-800">🗓️ Nova edição</h1>
        <p className="mt-1 text-sm text-gray-500">
          Informa o dia → fica <strong>aguardando a Maninha aprovar</strong> → só depois do OK dela abre no site.
        </p>

        {msg && (
          <p className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>{msg.texto}</p>
        )}

        {/* Aguardando */}
        {aguardando.length > 0 && (
          <section className="mt-5 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
            <p className="font-bold text-amber-900">⏳ Aguardando aprovação da Maninha</p>
            {aguardando.map(e => (
              <div key={e.marker} className="mt-3 rounded-xl bg-white p-3">
                <p className="font-bold text-gray-800">{rotulo(e.dia)} · das {h(e.inicio)} às {h(e.fim)}</p>
                <p className="text-xs text-gray-500">pedida em {e.pedida_em}{e.pedida_por?.includes(' · ') ? ` — ${e.pedida_por.split(' · ').slice(1).join(' · ')}` : ''}</p>
                {d.pode_aprovar ? (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button onClick={() => decidir(e, true)} className="rounded-lg bg-emerald-600 py-2.5 text-sm font-bold text-white active:scale-95">✅ Aprovar e abrir</button>
                    <button onClick={() => decidir(e, false)} className="rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-bold text-gray-600 active:scale-95">Recusar</button>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-amber-800">Só a Maninha aprova (pelo link dela). Enquanto isso, a data não aparece no site.</p>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Pedir */}
        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-4">
          <p className="font-bold text-gray-800">➕ Pedir uma data nova</p>
          <label className="mt-3 block text-xs font-bold text-gray-500">DIA
            <input type="date" value={dia} onChange={e => setDia(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-800" />
          </label>
          {dia && <p className="mt-1 text-xs text-purple-700 font-semibold">{rotulo(dia)}</p>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="block text-xs font-bold text-gray-500">COMEÇA
              <input type="time" value={inicio} onChange={e => setInicio(e.target.value)} step={1800}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-800" />
            </label>
            <label className="block text-xs font-bold text-gray-500">TERMINA
              <input type="time" value={fim} onChange={e => setFim(e.target.value)} step={1800}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-800" />
            </label>
          </div>
          <label className="mt-3 block text-xs font-bold text-gray-500">RECADO PRA MANINHA (opcional)
            <input value={obs} onChange={e => setObs(e.target.value)} placeholder="ex.: turma da Aline fechou esse dia"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </label>
          <button onClick={pedir} disabled={!dia || salvando}
            className="mt-4 w-full rounded-xl bg-purple-700 py-3 text-sm font-bold text-white disabled:opacity-40 active:scale-95">
            {salvando ? 'Mandando…' : 'Mandar pra Maninha aprovar'}
          </button>
          <p className="mt-2 text-[11px] text-gray-400">Lembra de marcar na agenda da casa com o título “Tardezinha”. O preço é o de sempre (R$ 45 antecipado · R$ 50 no dia · grupo 6+ R$ 40).</p>
        </section>

        {/* Abertas */}
        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-4">
          <p className="font-bold text-gray-800">✅ Abertas no site</p>
          {abertas.length === 0 && <p className="mt-1 text-sm text-gray-400">Nenhuma data pela frente.</p>}
          {abertas.map(e => (
            <div key={e.marker} className="flex justify-between gap-2 border-b py-2 text-sm last:border-0">
              <span className="font-semibold text-gray-700">{rotulo(e.dia)} · {h(e.inicio)}–{h(e.fim)}</span>
              <span className="text-gray-500">{e.inscritos} inscrição(ões)</span>
            </div>
          ))}
          {recusadas.length > 0 && (
            <p className="mt-2 text-xs text-gray-400">Recusadas nos últimos 7 dias: {recusadas.map(e => rotulo(e.dia)).join(', ')}</p>
          )}
        </section>

        {/* Conferência */}
        <section className={`mt-5 rounded-2xl border p-4 ${problemas.length ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
          <p className="font-bold text-gray-800">{problemas.length ? '⚠️ Conferência: tem coisa pra acertar' : '✓ Conferência: tudo batendo'}</p>
          <ul className="mt-2 space-y-1 text-sm">
            {d.conferir.filter(c => c.item !== 'edicoes pela frente').map(c => (
              <li key={c.item} className="flex justify-between gap-2">
                <span className="text-gray-700">{c.ok ? '✓' : '✗'} {ITEM[c.item] ?? c.item}</span>
                {!c.ok && <span className="text-right text-xs font-semibold text-red-700">{c.detalhe}</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
