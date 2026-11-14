import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { reais } from '../lib/pix'

// ADM: relatório final da Tardezinha (10/11/2026 o lado da ENTRADA; 13/11/2026 os GASTOS).
// Desenho aprovado pela Maninha em 13/11: só ADM (Ana e Maninha) vê — /fechamento?key=CHAVE_ADMIN.
// Com a chave da equipe (?k=) o banco recusa (tz_relatorio → tz_admin_ok).
// Gastos: Instagram/Meta rateado por edição (tz_meta_por_edicao), despesas do financeiro com produto
// Tardezinha e o que a Ana lança aqui no dia (tardezinha_gastos). Fim: entrou − gastou = ganhamos.

interface Pessoa { nome: string; criancas: string; whatsapp?: string; centavos?: number; status?: string; pago?: boolean }
interface Dados {
  ok: boolean; edicao: string; dia: string | null; edicoes: { marker: string; dia: string }[]
  familias: number; criancas_inscritas: number; familias_vieram: number; criancas_vieram: number
  pago_antes_centavos: number; lanche_pago_antes_centavos: number; consumo_recebido_centavos: number
  consumo_por_forma: { forma: string; centavos: number }[]
  a_receber: Pessoa[]; entrada_sem_pagar: Pessoa[]; nao_vieram: Pessoa[]
  itens: { item: string; qtd: number; centavos: number }[]
  gastos: {
    meta: { campanha: string; centavos: number; de: string; ate: string }[]
    despesas: { item: string; centavos: number; obs: string | null }[]
    do_dia: { id: string; descricao: string; centavos: number }[]
  }
  meta_centavos: number; despesas_centavos: number; do_dia_centavos: number
  entrou_centavos: number; gastou_centavos: number; resultado_centavos: number
}
const br = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
const FORMA: Record<string, string> = { pix: 'Pix', credito: 'Crédito', debito: 'Débito', dinheiro: 'Dinheiro' }

export function Fechamento() {
  const qs = new URLSearchParams(window.location.search)
  const k = qs.get('key') || qs.get('k') || ''
  const [ed, setEd] = useState(qs.get('e') ?? '')
  const [d, setD] = useState<Dados | null>(null)
  const [negado, setNegado] = useState(false)
  const [gDesc, setGDesc] = useState('')
  const [gValor, setGValor] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { document.title = 'Relatório final — Tardezinha (ADM)' }, [])
  const carregar = useCallback(async () => {
    const { data } = await supabase.rpc('tz_relatorio', { p_key: k, p_edicao: ed || null })
    const r = data as Dados
    if (!r?.ok) { setNegado(true); return }
    setD(r)
  }, [k, ed])
  useEffect(() => { carregar() }, [carregar])

  const gCentavos = Math.round(Number(gValor.replace(/\./g, '').replace(',', '.')) * 100) || 0
  async function lancarGasto() {
    if (!d || !gDesc.trim() || gCentavos <= 0) return
    setSalvando(true)
    await supabase.rpc('tz_gasto_add', { p_key: k, p_edicao: d.edicao, p_descricao: gDesc, p_valor_centavos: gCentavos })
    setSalvando(false)
    setGDesc(''); setGValor('')
    carregar()
  }
  async function removerGasto(id: string, desc: string) {
    if (!window.confirm(`Apagar o gasto "${desc}"?`)) return
    await supabase.rpc('tz_gasto_remover', { p_key: k, p_id: id })
    carregar()
  }

  if (negado) return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-6 text-center text-gray-600">
      <div>
        <p className="text-4xl mb-3">🔒</p>
        <p className="font-semibold">O relatório é só da administração.</p>
        <p className="text-sm text-gray-500 mt-1">Abre pela Página da Tardezinha com o link de ADM (Central de Links do CRM).</p>
      </div>
    </div>
  )
  if (!d) return <div className="min-h-screen grid place-items-center bg-gray-50 text-gray-400">Carregando…</div>

  const aReceber = d.a_receber.reduce((s, p) => s + (p.centavos ?? 0), 0)
  const totalDia = d.consumo_recebido_centavos
  const ganhou = d.resultado_centavos >= 0

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <a href={`/central?key=${k}`} className="text-xs font-semibold text-purple-700 underline">← Página da Tardezinha</a>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-extrabold text-purple-800">Relatório final</h1>
          <select value={d.edicao} onChange={e => setEd(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-bold">
            {d.edicoes.map(e => <option key={e.marker} value={e.marker}>Tardezinha {br(e.dia)}</option>)}
          </select>
        </div>
        <p className="mt-1 text-sm text-gray-500">Quanto entrou, quanto gastou e quanto ganhamos. No dia, confere antes de fechar o caixa.</p>

        {/* Resultado */}
        <div className={`mt-5 rounded-2xl border-2 p-4 ${ganhou ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'}`}>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[11px] font-bold text-gray-500">ENTROU</p>
              <p className="text-lg font-extrabold text-gray-800">{reais(d.entrou_centavos)}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500">GASTOU</p>
              <p className="text-lg font-extrabold text-gray-800">− {reais(d.gastou_centavos)}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500">{ganhou ? 'GANHAMOS' : 'FICOU NEGATIVO'}</p>
              <p className={`text-2xl font-extrabold ${ganhou ? 'text-emerald-700' : 'text-red-600'}`}>{reais(Math.abs(d.resultado_centavos))}</p>
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-gray-500">
            Entrou = inscrições pagas antes ({reais(d.pago_antes_centavos)}) + bar no dia ({reais(totalDia)}).
            {aReceber > 0 && <> Ainda falta receber {reais(aReceber)} de lanche.</>}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Bloco titulo="Crianças que vieram" valor={`${d.criancas_vieram} de ${d.criancas_inscritas}`} sub={`${d.familias_vieram} de ${d.familias} famílias`} />
          <Bloco titulo="Recebido no dia (bar)" valor={reais(totalDia)} sub={d.consumo_por_forma.map(f => `${FORMA[f.forma] ?? f.forma} ${reais(f.centavos)}`).join(' · ') || '—'} />
          <Bloco titulo="Pago antes (inscrições)" valor={reais(d.pago_antes_centavos)} sub={d.lanche_pago_antes_centavos > 0 ? `inclui ${reais(d.lanche_pago_antes_centavos)} de lanche da turma` : 'entradas pagas pelo Pix'} />
          <Bloco titulo="Ainda a receber" valor={reais(aReceber)} sub={`${d.a_receber.length} família(s) com lanche aberto`} alerta={aReceber > 0} />
        </div>

        {/* Gastos */}
        <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-baseline justify-between">
            <p className="font-bold text-gray-800">💸 Gastos desta edição</p>
            <p className="font-extrabold text-gray-800">{reais(d.gastou_centavos)}</p>
          </div>

          <p className="mt-3 text-xs font-bold text-gray-500">📱 INSTAGRAM / META · {reais(d.meta_centavos)}</p>
          {d.gastos.meta.length === 0
            ? <p className="text-sm text-gray-400">Nenhum anúncio da Tardezinha rodou antes desta edição.</p>
            : d.gastos.meta.map((m, i) => (
              <div key={i} className="flex justify-between gap-2 py-1 text-sm">
                <span className="min-w-0 text-gray-700">{m.campanha}<span className="block text-[11px] text-gray-400">de {br(m.de)} a {br(m.ate)}</span></span>
                <span className="shrink-0 text-gray-600">{reais(m.centavos)}</span>
              </div>
            ))}
          <p className="text-[10px] text-gray-400">Os dias de anúncio entre uma edição e a anterior contam pra edição seguinte.</p>

          {d.gastos.despesas.length > 0 && (
            <>
              <p className="mt-3 text-xs font-bold text-gray-500">🧾 DO FINANCEIRO · {reais(d.despesas_centavos)}</p>
              {d.gastos.despesas.map((x, i) => (
                <div key={i} className="flex justify-between gap-2 py-1 text-sm">
                  <span className="text-gray-700">{x.item}{x.obs && <span className="block text-[11px] text-gray-400">{x.obs}</span>}</span>
                  <span className="shrink-0 text-gray-600">{reais(x.centavos)}</span>
                </div>
              ))}
            </>
          )}

          <p className="mt-3 text-xs font-bold text-gray-500">🛒 GASTOS DO DIA · {reais(d.do_dia_centavos)}</p>
          {d.gastos.do_dia.length === 0 && <p className="text-sm text-gray-400">Nada lançado ainda (comida, monitor extra, gelo…).</p>}
          {d.gastos.do_dia.map(x => (
            <div key={x.id} className="flex items-center justify-between gap-2 py-1 text-sm">
              <span className="text-gray-700">{x.descricao}</span>
              <span className="flex shrink-0 items-center gap-2 text-gray-600">
                {reais(x.centavos)}
                <button onClick={() => removerGasto(x.id, x.descricao)} className="rounded border border-red-200 px-1.5 text-xs font-bold text-red-500" title="Apagar">✕</button>
              </span>
            </div>
          ))}
          <div className="mt-2 flex gap-2">
            <input value={gDesc} onChange={e => setGDesc(e.target.value)} placeholder="O que foi? (ex.: monitor extra)"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm" />
            <div className="flex shrink-0 items-center rounded-lg border border-gray-300 px-2">
              <span className="text-sm text-gray-400">R$</span>
              <input value={gValor} onChange={e => setGValor(e.target.value)} inputMode="decimal" placeholder="0,00"
                className="w-16 py-2 pl-1 text-sm outline-none" />
            </div>
            <button onClick={lancarGasto} disabled={salvando || !gDesc.trim() || gCentavos <= 0}
              className="shrink-0 rounded-lg bg-purple-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-40">
              {salvando ? '…' : 'Lançar'}
            </button>
          </div>
        </div>

        <Lista titulo="💰 Lanche sem pagar" vazio="Ninguém devendo lanche. ✓" alerta>
          {d.a_receber.map((p, i) => <Linha key={i} p={p} dir={reais(p.centavos ?? 0)} />)}
        </Lista>
        <Lista titulo="🎟️ Veio e a entrada não está paga" vazio="Todas as entradas de quem veio estão pagas. ✓" alerta>
          {d.entrada_sem_pagar.map((p, i) => <Linha key={i} p={p} dir={p.status ?? ''} />)}
        </Lista>
        <Lista titulo="🙈 Inscritas que não vieram" vazio="Todo mundo veio.">
          {d.nao_vieram.map((p, i) => <Linha key={i} p={p} dir={p.pago ? 'pagou' : 'não pagou'} />)}
        </Lista>
        <Lista titulo="🍟 O que mais saiu" vazio="Nenhum pedido.">
          {d.itens.map((it, i) => (
            <div key={i} className="flex justify-between gap-2 py-1.5 text-sm"><span>{it.qtd}× {it.item}</span><span className="text-gray-500">{reais(it.centavos)}</span></div>
          ))}
        </Lista>
      </div>
    </div>
  )
}

function Bloco({ titulo, valor, sub, alerta }: { titulo: string; valor: string; sub: string; alerta?: boolean }) {
  return (
    <div className={`rounded-xl border-2 bg-white p-3 ${alerta ? 'border-amber-400' : 'border-gray-200'}`}>
      <p className="text-xs font-bold text-gray-500">{titulo}</p>
      <p className={`text-2xl font-extrabold ${alerta ? 'text-amber-600' : 'text-purple-800'}`}>{valor}</p>
      <p className="text-[11px] text-gray-400">{sub}</p>
    </div>
  )
}

function Lista({ titulo, vazio, alerta, children }: { titulo: string; vazio: string; alerta?: boolean; children: ReactNode[] }) {
  return (
    <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
      <p className="mb-2 font-bold text-gray-800">{titulo}</p>
      {children.length === 0
        ? <p className={`text-sm ${alerta ? 'text-emerald-600' : 'text-gray-400'}`}>{vazio}</p>
        : <div className="divide-y divide-gray-100">{children}</div>}
    </div>
  )
}

function Linha({ p, dir }: { p: Pessoa; dir: string }) {
  const zap = (p.whatsapp ?? '').replace(/\D/g, '')
  return (
    <div className="flex items-center justify-between gap-2 py-2 text-sm">
      <div className="min-w-0">
        <p className="font-semibold text-gray-800">{p.criancas}</p>
        <p className="text-xs text-gray-400">{p.nome}{zap && <> · <a className="underline" href={`https://wa.me/${zap}`} target="_blank" rel="noreferrer">WhatsApp</a></>}</p>
      </div>
      <span className="shrink-0 font-bold text-gray-700">{dir}</span>
    </div>
  )
}
