import { useEffect, useState, useCallback, useMemo } from 'react'
import { fetchPainel, type PainelReserva } from '../lib/tzApi'

// Relatório ENXUTO de inscritos — pra equipe saber QUANTOS, sem o resto.
// O Admin (/admin/tardezinha-stats) tem tudo: alergia, autorização de imagem,
// canal, receita, CSV, mudar status. Aqui é só o número e a lista de nomes.
// Protegido pela MESMA chave do painel (?k=CHAVE), validada no banco.

const PAGO = new Set(['pago', 'confirmado'])

const MESES: Record<string, string> = {
  jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06',
  jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12',
}

// '16ago|14h–18h' → { data: '16/08', turno: '14h–18h' }
function partesDoTurno(marker: string): { data: string; turno: string } {
  const [dataRaw = '', turno = ''] = marker.split('|')
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
  const key = new URLSearchParams(window.location.search).get('k') ?? ''

  const [status, setStatus] = useState<'loading' | 'ok' | 'negado'>('loading')
  const [reservas, setReservas] = useState<PainelReserva[]>([])
  const [atualizadoEm, setAtualizadoEm] = useState<string>('')

  const carregar = useCallback(async () => {
    if (!key) { setStatus('negado'); return }
    const res = await fetchPainel(key)
    if (!res.ok) { setStatus('negado'); return }
    setReservas(res.reservas ?? [])
    setAtualizadoEm(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
    setStatus('ok')
  }, [key])

  useEffect(() => {
    carregar()
    const t = setInterval(carregar, 60000) // sozinho de minuto em minuto
    return () => clearInterval(t)
  }, [carregar])

  const resumo = useMemo(() => {
    const criancas = reservas.reduce((n, r) => n + (r.qtd_criancas ?? 0), 0)
    const pagas = reservas.filter(r => PAGO.has(r.status)).length
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
          <p className="text-lg font-semibold text-gray-700">Acesso restrito à equipe.</p>
          <p className="text-sm text-gray-500 mt-1">Abre pelo link com a chave — o mesmo da Central de Links.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Tardezinha · equipe</p>
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

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Numero valor={resumo.inscricoes} label="Inscrições" cor="bg-purple-100 text-purple-900" />
          <Numero valor={resumo.criancas} label="Crianças" cor="bg-amber-100 text-amber-900" />
          <Numero valor={resumo.pagas} label="Pagas" cor="bg-emerald-100 text-emerald-900" />
          <Numero valor={resumo.aguardando} label="A receber" cor="bg-rose-100 text-rose-900" />
        </div>

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

        <h2 className="mt-6 mb-2 text-sm font-bold uppercase tracking-wide text-gray-400">
          Quem se inscreveu ({lista.length})
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
              return (
                <div key={r.id} className="flex items-center gap-3 border-b px-4 py-3 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-800">{r.nome}</p>
                    <p className="text-xs text-gray-500">
                      {r.qtd_criancas} criança(s) · {partesDoTurno(r.turno).turno}
                    </p>
                  </div>
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
          Só o básico. Ficha completa, canal, alergia e CSV ficam no Admin.
        </p>
      </div>
    </div>
  )
}
