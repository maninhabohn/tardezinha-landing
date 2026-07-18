import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

const ADMIN_KEY = (import.meta.env.VITE_ADMIN_KEY ?? '').replace(/^﻿/, '').trim()

interface Crianca {
  id: string
  nome_completo: string
  data_nascimento: string
  tem_alergia_restricao: boolean
  alergia_restricao_detalhes: string | null
  tem_necessidade_especial: boolean
  necessidade_especial_detalhes: string | null
  autorizou_imagem: boolean
  autorizou_audio: boolean
}

interface Reserva {
  id: string
  nome_responsavel: string
  whatsapp_raw: string
  email: string | null
  cidade: string
  qtd_criancas: number
  qtd_adultos_extra: number
  status: string
  como_conheceu: string
  ja_veio_tardezinha: boolean
  valor_total_centavos: number | null
  created_at: string
  contatado_at: string | null
  edicao: string | null
  criancas: Crianca[] | null
}

// ─── Edições disponíveis (fonte única) ───────────────────────────────────────
// Marker no banco → label bonito no admin + status (próxima/passada)
interface EdicaoInfo {
  marker: string       // valor exato em tardezinha_reservas.edicao
  label: string        // exibição no botão
  data: string         // YYYY-MM-DD pra ordenar/comparar com hoje
  passada: boolean     // calculado no runtime
}
const HOJE_ISO = new Date().toISOString().slice(0, 10)
function edicaoInfo(marker: string): EdicaoInfo {
  // Formatos conhecidos: "23jul|18h–22h", "30jul|14h–18h", "30jul|18h–22h", "tardezinha-2026-07-03"
  if (marker.startsWith('23jul')) {
    const sess = marker.split('|')[1] ?? ''
    return { marker, label: `23/07 · ${sess}`, data: '2026-07-23', passada: '2026-07-23' < HOJE_ISO }
  }
  if (marker.startsWith('30jul')) {
    const sess = marker.split('|')[1] ?? ''
    return { marker, label: `30/07 · ${sess}`, data: '2026-07-30', passada: '2026-07-30' < HOJE_ISO }
  }
  if (marker.includes('2026-07-03') || marker.includes('2026-07-09')) {
    return { marker, label: 'Histórico · Junina 09/07', data: '2026-07-09', passada: true }
  }
  return { marker, label: marker, data: '', passada: false }
}

interface Stats {
  total_reservas: number
  total_criancas: number
  por_status: { status: string; total: number }[] | null
  por_canal: { como_conheceu: string; total: number }[] | null
  por_cidade: { cidade: string; total: number }[] | null
  recorrentes: number
  com_alergia: number
  com_necessidade: number
  autorizou_imagem: number
  autorizou_audio: number
  receita_pago_centavos: number
  idades: { idade: number; total: number }[] | null
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-blue-100 text-blue-800' },
  em_negociacao: { label: 'Em negociação', color: 'bg-yellow-100 text-yellow-800' },
  pago: { label: 'Pago ✅', color: 'bg-green-100 text-green-800' },
  confirmado: { label: 'Confirmado', color: 'bg-emerald-100 text-emerald-800' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
  no_show: { label: 'No-show', color: 'bg-gray-200 text-gray-700' },
}

function calcAge(isoDate: string): number {
  const birth = new Date(isoDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function formatBRL(centavos: number) {
  return `R$ ${(centavos / 100).toFixed(2).replace('.', ',')}`
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function exportCSV(reservas: Reserva[]) {
  const rows: string[][] = [
    ['Nome', 'WhatsApp', 'Email', 'Cidade', 'Crianças', 'Adultos Extra', 'Status', 'Canal', 'Recorrente', 'Valor (R$)', 'Data Inscrição'],
  ]
  for (const r of reservas) {
    rows.push([
      r.nome_responsavel,
      r.whatsapp_raw,
      r.email || '',
      r.cidade,
      String(r.qtd_criancas),
      String(r.qtd_adultos_extra),
      r.status,
      r.como_conheceu,
      r.ja_veio_tardezinha ? 'Sim' : 'Não',
      r.valor_total_centavos ? (r.valor_total_centavos / 100).toFixed(2) : '',
      new Date(r.created_at).toLocaleDateString('pt-BR'),
    ])
  }
  const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tardezinha-reservas-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function AdminStats() {
  useEffect(() => { document.title = 'Controle de Inscrições — Admin Tardezinha de Férias' }, [])
  const params = new URLSearchParams(window.location.search)
  const key = params.get('key') || ''

  const [authed, setAuthed] = useState(false)
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [edicaoAtiva, setEdicaoAtiva] = useState<string>('__futuras__')

  const load = useCallback(async () => {
    if (key !== ADMIN_KEY) {
      setError('Chave inválida.')
      setLoading(false)
      return
    }
    setAuthed(true)
    setLoading(true)

    const reservasRes = await supabase.rpc('admin_get_reservas', { admin_key: key })

    if (reservasRes.error) {
      setError(`Erro reservas: ${reservasRes.error.message}`)
    } else {
      setReservas(reservasRes.data || [])
    }

    setLoading(false)
  }, [key])

  useEffect(() => { load() }, [load])

  // ── Edições disponíveis, calculadas a partir das reservas ─────────────────
  const edicoes = useMemo(() => {
    const markers = new Set<string>()
    for (const r of reservas) if (r.edicao) markers.add(r.edicao)
    return Array.from(markers).map(edicaoInfo).sort((a, b) => a.data.localeCompare(b.data))
  }, [reservas])

  // ── Reservas filtradas por edição selecionada ─────────────────────────────
  const reservasFiltradas = useMemo(() => {
    if (edicaoAtiva === '__todas__') return reservas
    if (edicaoAtiva === '__futuras__') {
      return reservas.filter(r => {
        if (!r.edicao) return false
        return !edicaoInfo(r.edicao).passada
      })
    }
    if (edicaoAtiva === '__historico__') {
      return reservas.filter(r => {
        if (!r.edicao) return false
        return edicaoInfo(r.edicao).passada
      })
    }
    return reservas.filter(r => r.edicao === edicaoAtiva)
  }, [reservas, edicaoAtiva])

  // ── Stats calculados client-side em cima do filtro ────────────────────────
  const stats: Stats = useMemo(() => {
    const rs = reservasFiltradas
    const por_status_map = new Map<string, number>()
    const por_canal_map  = new Map<string, number>()
    const por_cidade_map = new Map<string, number>()
    const idades_map     = new Map<number, number>()
    let receita = 0, alergia = 0, necessidade = 0, autImg = 0, autAudio = 0
    let totalCriancas = 0, recorrentes = 0
    for (const r of rs) {
      por_status_map.set(r.status, (por_status_map.get(r.status) ?? 0) + 1)
      por_canal_map.set(r.como_conheceu, (por_canal_map.get(r.como_conheceu) ?? 0) + 1)
      por_cidade_map.set(r.cidade, (por_cidade_map.get(r.cidade) ?? 0) + 1)
      if (r.status === 'pago' && r.valor_total_centavos) receita += r.valor_total_centavos
      if (r.ja_veio_tardezinha) recorrentes++
      totalCriancas += r.qtd_criancas
      for (const c of r.criancas ?? []) {
        if (c.tem_alergia_restricao) alergia++
        if (c.tem_necessidade_especial) necessidade++
        if (c.autorizou_imagem) autImg++
        if (c.autorizou_audio) autAudio++
        const idade = calcAge(c.data_nascimento)
        idades_map.set(idade, (idades_map.get(idade) ?? 0) + 1)
      }
    }
    return {
      total_reservas: rs.length,
      total_criancas: totalCriancas,
      por_status: Array.from(por_status_map.entries()).map(([status, total]) => ({ status, total })),
      por_canal: Array.from(por_canal_map.entries()).map(([como_conheceu, total]) => ({ como_conheceu, total })),
      por_cidade: Array.from(por_cidade_map.entries()).map(([cidade, total]) => ({ cidade, total })),
      recorrentes,
      com_alergia: alergia,
      com_necessidade: necessidade,
      autorizou_imagem: autImg,
      autorizou_audio: autAudio,
      receita_pago_centavos: receita,
      idades: Array.from(idades_map.entries()).map(([idade, total]) => ({ idade, total })).sort((a, b) => a.idade - b.idade),
    }
  }, [reservasFiltradas])

  async function updateStatus(reservaId: string, novoStatus: string, valorCentavos?: number) {
    const { error: err } = await supabase.rpc('admin_update_reserva_status', {
      admin_key: key,
      reserva_uuid: reservaId,
      novo_status: novoStatus,
      valor_centavos: valorCentavos ?? null,
    })
    if (err) {
      alert(`Erro: ${err.message}`)
      return
    }
    load()
  }

  if (!authed && !loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-sm">
          <p className="text-5xl mb-3">🔒</p>
          <p className="text-lg font-bold text-gray-800">{error || 'Acesso negado'}</p>
          <p className="mt-2 text-sm text-gray-500">Precisa da chave correta na URL.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-purple-800 text-white px-4 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Tardezinha Férias — Admin</h1>
            <p className="text-sm text-purple-200">Painel de reservas</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => load()}
              className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm hover:bg-purple-500 transition"
            >
              🔄 Atualizar
            </button>
            <button
              onClick={() => exportCSV(reservasFiltradas)}
              className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm hover:bg-purple-500 transition"
            >
              📥 CSV
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="mx-auto max-w-5xl px-4 mt-4">
          <div className="bg-red-100 border border-red-400 text-red-700 rounded-lg p-3 text-sm">{error}</div>
        </div>
      )}

      {/* ─── Filtro por edição ─── */}
      <div className="mx-auto max-w-5xl px-4 mt-4">
        <div className="bg-white rounded-xl shadow-sm p-3 flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-gray-500 mr-1">📅 Edição:</span>
          <EdicaoBtn
            label={`🔮 Próximas (${reservas.filter(r => r.edicao && !edicaoInfo(r.edicao).passada).length})`}
            active={edicaoAtiva === '__futuras__'}
            onClick={() => setEdicaoAtiva('__futuras__')}
          />
          {edicoes.filter(e => !e.passada).map(e => (
            <EdicaoBtn
              key={e.marker}
              label={`${e.label} (${reservas.filter(r => r.edicao === e.marker).length})`}
              active={edicaoAtiva === e.marker}
              onClick={() => setEdicaoAtiva(e.marker)}
            />
          ))}
          {edicoes.some(e => e.passada) && (
            <EdicaoBtn
              label={`📦 Histórico (${reservas.filter(r => r.edicao && edicaoInfo(r.edicao).passada).length})`}
              active={edicaoAtiva === '__historico__'}
              onClick={() => setEdicaoAtiva('__historico__')}
            />
          )}
          <EdicaoBtn
            label={`Tudo (${reservas.length})`}
            active={edicaoAtiva === '__todas__'}
            onClick={() => setEdicaoAtiva('__todas__')}
          />
        </div>
      </div>

      {/* Cards de resumo */}
      {stats && (
        <div className="mx-auto max-w-5xl px-4 mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card label="Reservas" value={stats.total_reservas} />
          <Card label="Crianças" value={stats.total_criancas} />
          <Card label="Recorrentes" value={stats.recorrentes} />
          <Card label="Receita (pago)" value={formatBRL(stats.receita_pago_centavos)} />
          <Card label="Com alergia" value={stats.com_alergia} />
          <Card label="Com necessidade" value={stats.com_necessidade} />
          <Card label="Autorizou imagem" value={stats.autorizou_imagem} />
          <Card label="Autorizou áudio" value={stats.autorizou_audio} />
        </div>
      )}

      {/* Status breakdown */}
      {stats?.por_status && (
        <div className="mx-auto max-w-5xl px-4 mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {stats.por_status.map(s => {
            const cfg = STATUS_LABELS[s.status] || { label: s.status, color: 'bg-gray-100 text-gray-700' }
            return (
              <div key={s.status} className={`rounded-xl p-3 text-center ${cfg.color}`}>
                <p className="text-2xl font-bold">{s.total}</p>
                <p className="text-xs font-semibold">{cfg.label}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Canal breakdown */}
      {stats?.por_canal && (
        <div className="mx-auto max-w-5xl px-4 mt-6">
          <h2 className="font-bold text-gray-700 mb-2">📣 Por canal</h2>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            {stats.por_canal.map(c => (
              <div key={c.como_conheceu} className="flex items-center justify-between py-1 border-b last:border-0">
                <span className="text-sm">{c.como_conheceu}</span>
                <span className="text-sm font-bold">{c.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Idades */}
      {stats?.idades && stats.idades.length > 0 && (
        <div className="mx-auto max-w-5xl px-4 mt-6">
          <h2 className="font-bold text-gray-700 mb-2">🎂 Idades</h2>
          <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-2">
            {stats.idades.map(a => (
              <span key={a.idade} className="rounded-full bg-purple-100 text-purple-800 px-3 py-1 text-sm font-bold">
                {a.idade} anos: {a.total}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabela de reservas */}
      <div className="mx-auto max-w-5xl px-4 mt-8 pb-12">
        <h2 className="font-bold text-gray-700 mb-3">📋 Reservas ({reservasFiltradas.length})</h2>

        <div className="space-y-3">
          {reservasFiltradas.map(r => {
            const expanded = expandedId === r.id
            const statusCfg = STATUS_LABELS[r.status] || { label: r.status, color: 'bg-gray-100 text-gray-700' }

            return (
              <div key={r.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpandedId(expanded ? null : r.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">{r.nome_responsavel}</p>
                    <p className="text-xs text-gray-500">{r.cidade} · {r.qtd_criancas} criança(s) · {formatDateTime(r.created_at)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>
                  <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
                </div>

                {expanded && (
                  <div className="border-t px-4 py-4 bg-gray-50/50 space-y-4">
                    {/* Info do responsável */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-bold text-gray-600">WhatsApp:</span>{' '}
                        <a href={`https://wa.me/${r.whatsapp_raw?.replace(/\D/g, '')}`} target="_blank" rel="noopener" className="text-green-600 underline">
                          {r.whatsapp_raw}
                        </a>
                      </div>
                      {r.email && <div><span className="font-bold text-gray-600">Email:</span> {r.email}</div>}
                      <div><span className="font-bold text-gray-600">Canal:</span> {r.como_conheceu}</div>
                      <div><span className="font-bold text-gray-600">Recorrente:</span> {r.ja_veio_tardezinha ? 'Sim' : 'Não'}</div>
                      <div><span className="font-bold text-gray-600">Adultos extra:</span> {r.qtd_adultos_extra}</div>
                      {r.valor_total_centavos && (
                        <div><span className="font-bold text-gray-600">Valor:</span> {formatBRL(r.valor_total_centavos)}</div>
                      )}
                    </div>

                    {/* Crianças */}
                    {r.criancas && r.criancas.length > 0 && (
                      <div>
                        <p className="font-bold text-sm text-gray-700 mb-2">👧 Crianças:</p>
                        <div className="space-y-2">
                          {r.criancas.map(c => (
                            <div key={c.id} className="rounded-lg bg-white border p-3 text-sm">
                              <p className="font-bold">{c.nome_completo} — {calcAge(c.data_nascimento)} anos</p>
                              {c.tem_alergia_restricao && <p className="text-red-600">⚠️ Alergia: {c.alergia_restricao_detalhes}</p>}
                              {c.tem_necessidade_especial && <p className="text-orange-600">🧡 Necessidade: {c.necessidade_especial_detalhes}</p>}
                              <p className="text-xs text-gray-500 mt-1">
                                📷 Imagem: {c.autorizou_imagem ? '✅' : '❌'} · 🎙️ Áudio: {c.autorizou_audio ? '✅' : '❌'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ações de status */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      {r.status !== 'em_negociacao' && (
                        <StatusBtn label="Em negociação" onClick={() => updateStatus(r.id, 'em_negociacao')} color="bg-yellow-500" />
                      )}
                      {r.status !== 'pago' && (
                        <StatusBtn
                          label="Marcar Pago"
                          onClick={() => {
                            const valor = prompt('Valor TOTAL em reais (ex: 90.00):')
                            if (!valor) return
                            const centavos = Math.round(parseFloat(valor) * 100)
                            if (isNaN(centavos) || centavos <= 0) { alert('Valor inválido'); return }
                            updateStatus(r.id, 'pago', centavos)
                          }}
                          color="bg-green-600"
                        />
                      )}
                      {r.status !== 'cancelado' && (
                        <StatusBtn label="Cancelar" onClick={() => { if (confirm('Cancelar esta reserva?')) updateStatus(r.id, 'cancelado') }} color="bg-red-500" />
                      )}
                      {r.status !== 'no_show' && (
                        <StatusBtn label="No-show" onClick={() => updateStatus(r.id, 'no_show')} color="bg-gray-500" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {reservasFiltradas.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">📭</p>
              <p>Nenhuma reserva nessa edição ainda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EdicaoBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
        active
          ? 'bg-purple-700 text-white shadow'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  )
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm text-center">
      <p className="text-2xl font-bold text-purple-800">{value}</p>
      <p className="text-xs font-semibold text-gray-500 mt-1">{label}</p>
    </div>
  )
}

function StatusBtn({ label, onClick, color }: { label: string; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg ${color} px-3 py-1.5 text-xs text-white font-bold hover:opacity-80 transition`}
    >
      {label}
    </button>
  )
}
