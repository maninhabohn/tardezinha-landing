import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { reais } from '../lib/pix'

// EQUIPE: fechamento do dia da Tardezinha (10/11/2026, pedido da revisão de 07/11).
// Quantas crianças vieram, quanto entrou (antes e no dia), quem ainda deve, o que mais saiu.
// Abre com a mesma chave do painel: /fechamento?k=CHAVE (validada no banco em tz_painel_ok, RPC tz_fechamento).

interface Pessoa { nome: string; criancas: string; whatsapp?: string; centavos?: number; status?: string; pago?: boolean }
interface Dados {
  ok: boolean; edicao: string; dia: string | null; edicoes: { marker: string; dia: string }[]
  familias: number; criancas_inscritas: number; familias_vieram: number; criancas_vieram: number
  pago_antes_centavos: number; lanche_pago_antes_centavos: number; consumo_recebido_centavos: number
  consumo_por_forma: { forma: string; centavos: number }[]
  a_receber: Pessoa[]; entrada_sem_pagar: Pessoa[]; nao_vieram: Pessoa[]
  itens: { item: string; qtd: number; centavos: number }[]
}
const br = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
const FORMA: Record<string, string> = { pix: 'Pix', credito: 'Crédito', debito: 'Débito', dinheiro: 'Dinheiro' }

export function Fechamento() {
  const k = new URLSearchParams(window.location.search).get('k') ?? ''
  const [ed, setEd] = useState(new URLSearchParams(window.location.search).get('e') ?? '')
  const [d, setD] = useState<Dados | null>(null)
  const [negado, setNegado] = useState(false)

  useEffect(() => { document.title = 'Fechamento do dia — Tardezinha (equipe)' }, [])
  const carregar = useCallback(async () => {
    const { data } = await supabase.rpc('tz_fechamento', { p_key: k, p_edicao: ed || null })
    const r = data as Dados
    if (!r?.ok) { setNegado(true); return }
    setD(r)
  }, [k, ed])
  useEffect(() => { carregar() }, [carregar])

  if (negado) return <div className="min-h-screen grid place-items-center bg-gray-50 p-6 text-center text-gray-600">Link sem a chave da equipe. Abre pela Central de Links do CRM.</div>
  if (!d) return <div className="min-h-screen grid place-items-center bg-gray-50 text-gray-400">Carregando…</div>

  const aReceber = d.a_receber.reduce((s, p) => s + (p.centavos ?? 0), 0)
  const totalDia = d.consumo_recebido_centavos

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-extrabold text-purple-800">Fechamento do dia</h1>
          <select value={d.edicao} onChange={e => setEd(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-bold">
            {d.edicoes.map(e => <option key={e.marker} value={e.marker}>Tardezinha {br(e.dia)}</option>)}
          </select>
        </div>
        <p className="mt-1 text-sm text-gray-500">Confere no fim da tarde, antes de fechar o caixa.</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Bloco titulo="Crianças que vieram" valor={`${d.criancas_vieram} de ${d.criancas_inscritas}`} sub={`${d.familias_vieram} de ${d.familias} famílias`} />
          <Bloco titulo="Recebido no dia (bar)" valor={reais(totalDia)} sub={d.consumo_por_forma.map(f => `${FORMA[f.forma] ?? f.forma} ${reais(f.centavos)}`).join(' · ') || '—'} />
          <Bloco titulo="Pago antes (inscrições)" valor={reais(d.pago_antes_centavos)} sub={d.lanche_pago_antes_centavos > 0 ? `inclui ${reais(d.lanche_pago_antes_centavos)} de lanche da turma` : 'entradas pagas pelo Pix'} />
          <Bloco titulo="Ainda a receber" valor={reais(aReceber)} sub={`${d.a_receber.length} família(s) com lanche aberto`} alerta={aReceber > 0} />
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
