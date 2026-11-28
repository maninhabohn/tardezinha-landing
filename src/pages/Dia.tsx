import { useCallback, useEffect, useState } from 'react'
import {
  fetchDia, addExtra, setExtraPago, removerExtra, salvarCombinados, paraCentavos,
  FORMAS_PAGAMENTO, formatBRL, type DiaResult, type DiaTurma, type FormaPagamento,
} from '../lib/tzApi'
import { lerChave, comChave } from '../lib/chave'

// PÁGINA DO DIA (27/11/2026, sugestão da Ana, pedido da Maninha):
// "clica no dia e tem todos os links daquele dia… e uma página da Aline com tudo o que ela pagou,
//  quantas crianças, quantos lanches, o que foi combinado no WhatsApp… e um campo de inserir coisas"
// /dia?k=CHAVE (equipe: só o dia de hoje) · /dia?key=CHAVE (ADM: escolhe a data, edita combinados)
// Extra = item fora do cardápio da turma (ex.: cento de salgadinho). Entra no relatório final.

const SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
function rotuloDia(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number)
  return `${SEMANA[new Date(a, m - 1, d).getDay()]}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
}

export function Dia() {
  const { chave } = lerChave()
  const qs = new URLSearchParams(window.location.search)
  const [ed, setEd] = useState(qs.get('e') ?? '')
  const [d, setD] = useState<DiaResult | null>(null)

  useEffect(() => { document.title = 'Tardezinha do dia (equipe)' }, [])
  const carregar = useCallback(async () => {
    const r = await fetchDia(chave, ed)
    setD(r)
  }, [chave, ed])
  useEffect(() => {
    carregar()
    const t = setInterval(carregar, 30000)
    return () => clearInterval(t)
  }, [carregar])

  if (!d) return <div className="min-h-screen grid place-items-center bg-gray-50 text-gray-400">Carregando…</div>
  if (!d.ok) return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-6 text-center text-gray-600">
      <div><p className="text-4xl mb-3">🔒</p><p className="font-semibold">Só a equipe abre esta página.</p>
        <p className="text-sm text-gray-500 mt-1">Abre pelo link da Central de Links.</p></div>
    </div>
  )

  const adm = !!d.adm
  const links = [
    { nome: 'Recepção / Bar', ico: '🛎️', url: comChave('/painel'), desc: 'Chegou, saiu, lanches, cadastrar na porta.' },
    { nome: 'Cozinha', ico: '🍳', url: comChave('/cozinha'), desc: 'O que preparar (tablet ou TV).' },
    ...(adm ? [
      { nome: 'Lista do dia', ico: '📋', url: comChave('/inscritos'), desc: 'Todos os inscritos, quem pagou, comprovante.' },
      { nome: 'Relatório do dia', ico: '📊', url: comChave(`/fechamento${d.edicao ? `?e=${d.edicao}` : ''}`), desc: 'Quanto entrou, extras, o que falta receber.' },
      { nome: 'Turmas e links', ico: '🎂', url: comChave('/turmas'), desc: 'Criar turma, link da mãe e dos convidados.' },
    ] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="bg-sdb-purple px-4 py-4 text-white shadow-md">
        <p className="text-xs font-bold uppercase tracking-widest text-white/70">Tardezinha · {adm ? 'administração' : 'equipe do dia'} 🔒</p>
        <h1 className="mt-1 text-2xl font-extrabold">📅 {d.dia ? rotuloDia(d.dia) : 'Sem Tardezinha marcada'}</h1>
        {d.horario && <p className="text-sm text-white/85">{d.horario}</p>}
        {adm && (d.edicoes ?? []).length > 0 && (
          <select value={d.edicao} onChange={e => setEd(e.target.value)}
            className="mt-3 w-full rounded-lg bg-white px-3 py-2 text-sm font-bold text-gray-800">
            {(d.edicoes ?? []).map(e => <option key={e.marker} value={e.marker}>{rotuloDia(e.dia)}</option>)}
          </select>
        )}
      </header>

      <div className="mx-auto max-w-2xl px-4">
        <section className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {links.map(l => (
            <a key={l.nome} href={l.url} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm active:scale-[.99]">
              <span className="text-lg font-extrabold text-gray-800">{l.ico} {l.nome}</span>
              <span className="block text-xs text-gray-500">{l.desc}</span>
            </a>
          ))}
        </section>

        {d.avulsos && (
          <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-gray-700 border border-gray-200">
            👨‍👩‍👧 <b>Inscrições avulsas:</b> {d.avulsos.familias} família(s), {d.avulsos.criancas} criança(s), {d.avulsos.pagas} paga(s)
            {d.avulsos.na_porta > 0 && <> · {d.avulsos.na_porta} cadastrada(s) na porta</>}
          </p>
        )}

        <h2 className="mt-6 text-lg font-extrabold text-gray-800">🎂 Aniversários e turmas do dia</h2>
        {(d.turmas ?? []).length === 0 && <p className="mt-2 rounded-xl bg-white p-4 text-sm text-gray-500 border border-gray-200">Nenhuma turma neste dia.</p>}
        {(d.turmas ?? []).map(t => <TurmaCard key={t.id} t={t} chave={chave} adm={adm} onChange={carregar} />)}
      </div>
    </div>
  )
}

function TurmaCard({ t, chave, adm, onChange }: { t: DiaTurma; chave: string; adm: boolean; onChange: () => void }) {
  const mae = t.modelo === 'turma_mae_paga'
  const cobra = mae ? Math.max(t.inscritos, t.piso) * t.preco_entrada_centavos : 0
  const totalExtras = t.extras.reduce((s, x) => s + x.qtd * x.valor_unit_centavos, 0)
  const extrasAbertos = t.extras.filter(x => !x.pago).reduce((s, x) => s + x.qtd * x.valor_unit_centavos, 0)
  const totalLanches = t.lanches.reduce((s, l) => s + l.centavos, 0)

  // combinados (ADM edita)
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(t.combinados ?? '')
  const [pagou, setPagou] = useState(t.mae_pagou_centavos != null ? (t.mae_pagou_centavos / 100).toFixed(2).replace('.', ',') : '')
  const [salvandoC, setSalvandoC] = useState(false)
  async function salvarC() {
    setSalvandoC(true)
    await salvarCombinados(chave, t.id, texto, pagou.trim() ? paraCentavos(pagou) : null)
    setSalvandoC(false); setEditando(false); onChange()
  }

  // extra novo
  const [desc, setDesc] = useState('')
  const [qtd, setQtd] = useState('1')
  const [valor, setValor] = useState('')
  const [jaPago, setJaPago] = useState<'nao' | FormaPagamento>('nao')
  const [quem, setQuem] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const valorCent = paraCentavos(valor)
  const qtdNum = Math.max(parseInt(qtd || '1', 10) || 1, 1)
  async function lancar() {
    if (!desc.trim() || valorCent <= 0) { setErro('Escreve o que foi e o valor.'); return }
    setSalvando(true); setErro('')
    const r = await addExtra(chave, t.id, desc, qtdNum, valorCent, jaPago !== 'nao', jaPago === 'nao' ? null : jaPago, quem)
    setSalvando(false)
    if (!r.ok) { setErro(r.motivo || 'Não salvou. Tenta de novo.'); return }
    setDesc(''); setQtd('1'); setValor(''); setJaPago('nao'); onChange()
  }
  async function receber(id: string, forma: FormaPagamento) { await setExtraPago(chave, id, true, forma); onChange() }
  async function desfazer(id: string) { await setExtraPago(chave, id, false); onChange() }
  async function apagar(id: string, d: string) { if (window.confirm(`Apagar "${d}"?`)) { await removerExtra(chave, id); onChange() } }

  const zap = (t.whatsapp ?? '').replace(/\D/g, '')

  return (
    <section className="mt-3 rounded-2xl border-2 border-purple-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800">{mae ? 'a mãe paga tudo' : 'cada família paga'}</span>
          <h3 className="mt-1 text-xl font-extrabold text-gray-800">🎈 {t.organizadora} · aniversário de {t.aniversariante}</h3>
          <p className="text-sm text-gray-600">{t.horario ?? ''}{adm && zap ? <> · <a className="underline" href={`https://wa.me/${zap}`} target="_blank" rel="noreferrer">WhatsApp da mãe</a></> : null}</p>
        </div>
      </div>

      {/* números */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
        <Num t="crianças" v={`${t.inscritos}`} s={`mínimo ${t.piso} · ${t.chegaram} chegaram`} alerta={t.inscritos === 0} />
        {mae
          ? <Num t="a mãe paga" v={formatBRL(cobra)} s={t.mae_pagou_centavos != null ? `pagou ${formatBRL(t.mae_pagou_centavos)}` : 'pagamento não anotado'} alerta={t.mae_pagou_centavos == null} />
          : <Num t="pagas" v={`${t.pagos} de ${t.inscritos}`} s="cada família no Pix" />}
        <Num t="lanches reservados" v={formatBRL(totalLanches)} s={`${t.lanches.reduce((s, l) => s + l.qtd, 0)} item(ns)`} />
        <Num t="extras" v={formatBRL(totalExtras)} s={extrasAbertos > 0 ? `falta receber ${formatBRL(extrasAbertos)}` : 'nada em aberto'} alerta={extrasAbertos > 0} />
      </div>
      {t.inscritos === 0 && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
          ⚠️ A lista das crianças ainda não chegou. Na porta: Recepção → "Adicionar criança na hora" → Turma de {t.aniversariante}.
        </p>
      )}

      {/* combinados */}
      <div className="mt-3 rounded-xl bg-gray-50 p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-700">💬 Combinado com a {t.organizadora}</p>
          {adm && !editando && <button onClick={() => setEditando(true)} className="text-xs font-bold text-purple-700 underline">editar</button>}
        </div>
        {!editando ? (
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{t.combinados || <span className="text-gray-400">Nada anotado ainda.{adm ? ' Toca em editar e cola o que foi combinado no WhatsApp.' : ''}</span>}</p>
        ) : (
          <div className="mt-2 space-y-2">
            <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={5}
              placeholder="Ex.: refrigerante ela acerta no fim · bolo ela traz · 1 cento de salgadinho R$ 60 · decoração do Homem-Aranha"
              className="w-full rounded-lg border border-gray-300 p-2 text-sm" />
            {mae && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <span className="shrink-0 font-semibold">A mãe já pagou R$</span>
                <input value={pagou} onChange={e => setPagou(e.target.value)} inputMode="decimal" placeholder="0,00"
                  className="w-28 rounded-lg border border-gray-300 px-2 py-1.5" />
              </label>
            )}
            <div className="flex gap-2">
              <button onClick={() => setEditando(false)} className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-600">Cancelar</button>
              <button onClick={salvarC} disabled={salvandoC} className="flex-1 rounded-lg bg-purple-700 py-2 text-sm font-bold text-white">{salvandoC ? 'Salvando…' : 'Salvar'}</button>
            </div>
          </div>
        )}
      </div>

      {/* crianças + lanches */}
      {t.criancas.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-bold text-gray-700">👧 {t.criancas.length} criança(s) na lista</summary>
          <p className="mt-1 text-sm text-gray-700">{t.criancas.join(' · ')}</p>
        </details>
      )}
      {t.lanches.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-bold text-gray-700">🍔 Lanches reservados</p>
          {t.lanches.map((l, i) => <p key={i} className="flex justify-between text-sm text-gray-700"><span>{l.qtd}× {l.item}</span><span>{formatBRL(l.centavos)}</span></p>)}
        </div>
      )}

      {/* extras */}
      <div className="mt-3 rounded-xl border-2 border-dashed border-purple-300 p-3">
        <p className="text-sm font-bold text-purple-800">➕ Extras fora do cardápio</p>
        <p className="text-[11px] text-gray-500">O que a mãe pediu e não está no cardápio do bar (ex.: cento de salgadinho). Entra no relatório.</p>
        {t.extras.map(x => (
          <div key={x.id} className="mt-2 rounded-lg bg-gray-50 px-2 py-2 text-sm">
            <div className="flex items-start justify-between gap-2">
              <span className="text-gray-800"><b>{x.qtd}× {x.descricao}</b> · {formatBRL(x.qtd * x.valor_unit_centavos)}
                <span className="block text-[11px] text-gray-400">{x.quando}{x.lancado_por ? ` · ${x.lancado_por}` : ''}</span></span>
              <button onClick={() => apagar(x.id, x.descricao)} className="shrink-0 rounded border border-red-200 px-1.5 text-xs font-bold text-red-500">✕</button>
            </div>
            {x.pago ? (
              <p className="mt-1 text-xs font-bold text-emerald-700">✓ pago{x.forma ? ` (${FORMAS_PAGAMENTO.find(f => f.id === x.forma)?.rotulo ?? x.forma})` : ''}
                <button onClick={() => desfazer(x.id)} className="ml-2 font-normal text-gray-400 underline">desfazer</button></p>
            ) : (
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <span className="text-xs font-bold text-amber-700">falta receber · recebi em:</span>
                {FORMAS_PAGAMENTO.map(f => (
                  <button key={f.id} onClick={() => receber(x.id, f.id)} className="rounded border border-emerald-500 px-1.5 py-0.5 text-xs font-bold text-emerald-700">{f.rotulo}</button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div className="mt-3 space-y-2">
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="O que foi? (ex.: cento de salgadinho)"
            className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm" />
          <div className="flex gap-2">
            <label className="flex items-center rounded-lg border border-gray-300 px-2">
              <span className="text-xs text-gray-400">qtd</span>
              <input value={qtd} onChange={e => setQtd(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className="w-10 py-2 pl-1 text-sm outline-none" />
            </label>
            <label className="flex flex-1 items-center rounded-lg border border-gray-300 px-2">
              <span className="text-xs text-gray-400">R$ cada</span>
              <input value={valor} onChange={e => setValor(e.target.value)} inputMode="decimal" placeholder="0,00" className="w-full py-2 pl-1 text-sm outline-none" />
            </label>
          </div>
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setJaPago('nao')} className={`rounded-md border px-2 py-1 text-xs font-bold ${jaPago === 'nao' ? 'border-amber-500 bg-amber-500 text-white' : 'border-gray-300 text-gray-600'}`}>ainda não pagou</button>
            {FORMAS_PAGAMENTO.map(f => (
              <button type="button" key={f.id} onClick={() => setJaPago(f.id)} className={`rounded-md border px-2 py-1 text-xs font-bold ${jaPago === f.id ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300 text-gray-600'}`}>pagou {f.rotulo}</button>
            ))}
          </div>
          <input value={quem} onChange={e => setQuem(e.target.value)} placeholder="Quem está lançando? (opcional)"
            className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm" />
          {erro && <p className="rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">{erro}</p>}
          <button onClick={lancar} disabled={salvando} className="w-full rounded-lg bg-purple-700 py-2.5 text-sm font-bold text-white disabled:opacity-50">
            {salvando ? 'Lançando…' : `Lançar extra${valorCent > 0 ? ` · ${formatBRL(valorCent * qtdNum)}` : ''}`}
          </button>
        </div>
      </div>
    </section>
  )
}

function Num({ t, v, s, alerta }: { t: string; v: string; s: string; alerta?: boolean }) {
  return (
    <div className={`rounded-xl border-2 p-2 ${alerta ? 'border-amber-300 bg-amber-50' : 'border-gray-100 bg-gray-50'}`}>
      <p className="text-[10px] font-bold uppercase text-gray-500">{t}</p>
      <p className="text-lg font-extrabold text-gray-800">{v}</p>
      <p className="text-[10px] text-gray-500">{s}</p>
    </div>
  )
}
