import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { supabase } from '../lib/supabase'
import { WHATSAPP_NUMBER } from '../lib/contact'
import { reais } from '../lib/pix'

// Página da MÃE (turma em que ela paga todos os amiguinhos, 09/11/2026).
// Só leitura: ela vê quem confirmou presença, quando quiser, sem robô mandar mensagem.
// O link dela é outro (token_mae) — os convidados não enxergam a lista.

interface Conf { crianca: string; responsavel: string; restricao: boolean }
interface Lista {
  ok: boolean; aniversariante: string; organizadora: string; evento_data: string; horario: string | null
  lista_fecha_em: string; piso: number; preco_entrada_centavos: number; link_convidados: string; confirmados: Conf[]
}
const BASE = 'https://tardezinha.showdebolars.com.br'
const br = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
const hojeISO = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
const diasAte = (iso: string) => Math.round((new Date(iso + 'T12:00:00').getTime() - new Date(hojeISO() + 'T12:00:00').getTime()) / 86400000)

export function ListaTurma() {
  const { token = '' } = useParams()
  const [d, setD] = useState<Lista | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => { document.title = 'Lista da festa — Tardezinha Show de Bola' }, [])
  const carregar = useCallback(async () => {
    const { data } = await supabase.rpc('tz_turma_acompanhar', { p_token: token })
    setD(data as Lista); setCarregando(false)
  }, [token])
  useEffect(() => { carregar() }, [carregar])

  async function copiarLink() {
    if (!d) return
    try { await navigator.clipboard.writeText(`${BASE}/turma/${d.link_convidados}`) } catch { /* segue */ }
    setCopiado(true); setTimeout(() => setCopiado(false), 1800)
  }

  if (carregando) return <div className="min-h-screen grid place-items-center bg-gray-50 text-gray-500">Carregando…</div>
  if (!d?.ok) return (
    <div className="min-h-screen grid place-items-center bg-gray-50 px-6 text-center">
      <div><Logo size={90} className="mb-4" />
        <p className="text-lg font-semibold text-gray-700">Não achamos esta lista.</p>
        <a className="mt-4 inline-block font-bold text-sdb-purple underline" href={`https://wa.me/${WHATSAPP_NUMBER}`}>Chamar no WhatsApp</a>
      </div>
    </div>
  )

  const n = d.confirmados.length
  const dias = diasAte(d.evento_data)
  const aberta = hojeISO() <= d.lista_fecha_em
  const cobra = Math.max(n, d.piso)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-sdb-purple px-4 pt-6 pb-6 text-center text-white">
        <Logo size={80} className="mb-2" />
        <p className="text-xs font-bold uppercase tracking-widest text-sdb-yellow-soft">Tardezinha · Show de Bola</p>
        <h1 className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl">Festa de {d.aniversariante}</h1>
        <p className="mt-2 text-base text-white/85">{br(d.evento_data)}{d.horario ? ` · ${d.horario}` : ''}{dias >= 0 ? ` · faltam ${dias} dia(s)` : ''}</p>
      </div>

      <div className="mx-auto max-w-md px-4 py-6 space-y-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-200 text-center">
          <p className="text-5xl font-extrabold text-sdb-purple">{n}</p>
          <p className="font-semibold text-gray-700">criança(s) confirmada(s)</p>
          <p className="mt-2 text-sm text-gray-500">
            {aberta ? <>A lista fecha <b>{br(d.lista_fecha_em)}</b>.</> : <>A lista fechou em {br(d.lista_fecha_em)}.</>}
            {' '}Mínimo de {d.piso} crianças.
          </p>
          <p className="mt-2 text-sm text-gray-700">
            Valor {aberta ? 'até agora' : 'final'}: <b>{reais(cobra * d.preco_entrada_centavos)}</b>
            <span className="text-gray-500"> ({cobra} × {reais(d.preco_entrada_centavos)}{n < d.piso ? `, mínimo de ${d.piso}` : ''})</span>
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-200">
          <p className="text-sm font-bold uppercase tracking-wide text-sdb-purple">Quem confirmou</p>
          {n === 0 && <p className="mt-2 text-gray-500">Ninguém ainda. Manda o link no grupo dos convidados.</p>}
          <ol className="mt-2 space-y-1.5">
            {d.confirmados.map((c, i) => (
              <li key={i} className="flex gap-2 text-gray-800">
                <span className="w-6 text-right font-bold text-gray-400">{i + 1}.</span>
                <span><b>{c.crianca}</b> <span className="text-gray-500">· resp. {c.responsavel}</span>
                  {c.restricao && <span className="ml-1 rounded bg-rose-100 px-1.5 text-xs text-rose-800">restrição alimentar</span>}</span>
              </li>
            ))}
          </ol>
        </div>

        {aberta && (
          <button type="button" onClick={copiarLink} className="w-full rounded-xl bg-sdb-purple py-3 text-base font-bold text-white">
            {copiado ? 'Link copiado ✓' : 'Copiar o link dos convidados'}
          </button>
        )}
        <button type="button" onClick={carregar} className="w-full rounded-xl border-2 border-sdb-purple py-3 text-base font-bold text-sdb-purple">Atualizar a lista</button>
        <p className="text-center text-xs text-gray-500">Dúvida? <a className="font-bold underline" href={`https://wa.me/${WHATSAPP_NUMBER}`}>Chama a equipe no WhatsApp</a></p>
      </div>
    </div>
  )
}
