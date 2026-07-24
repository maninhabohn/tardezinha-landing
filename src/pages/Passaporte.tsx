import { useState, useEffect } from 'react'
import { Logo } from '../components/Logo'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { whatsappLink, trackWhatsappLead } from '../lib/contact'

interface PassaporteData {
  encontrado: boolean
  total_edicoes: number
  edicoes: string[]
  nome: string | null
}

const SELOS_META = 4

const EDICAO_LABELS: Record<string, string> = {
  '09jul': '09/07',
  '23jul': '23/07',
  '30jul': '30/07',
}

const FIGURINHAS = [
  { foto: '/fotos/giro.jpg', nome: 'Giro Radical' },
  { foto: '/fotos/nerf.jpg', nome: 'Nerf Inflável' },
  { foto: '/fotos/toboga-mario.jpg', nome: 'Tobogã do Mario' },
  { foto: '/fotos/escalada-2.jpg', nome: 'Escalada' },
]

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  return digits.length === 11 ? `55${digits}` : digits
}

export function Passaporte() {
  useEffect(() => {
    document.title = 'Álbum de Figurinhas — Tardezinha Show de Bola'
  }, [])

  const [telefone, setTelefone] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'not-found' | 'error'>('idle')
  const [data, setData] = useState<PassaporteData | null>(null)

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault()
    const digits = telefone.replace(/\D/g, '')
    if (digits.length < 10) return

    setStatus('loading')

    if (!isSupabaseConfigured()) {
      setStatus('error')
      return
    }

    const { data: result, error } = await supabase.rpc('consultar_passaporte', {
      telefone: normalizePhone(telefone),
    })

    if (error) {
      console.error('Erro ao consultar passaporte:', error)
      setStatus('error')
      return
    }

    const parsed = result as PassaporteData
    if (!parsed.encontrado || parsed.total_edicoes === 0) {
      setStatus('not-found')
    } else {
      setData(parsed)
      setStatus('found')
    }
  }

  const firstName = data?.nome?.split(' ')[0] ?? ''
  const faltam = data ? Math.max(0, SELOS_META - data.total_edicoes) : 0
  const ganhou = data ? data.total_edicoes >= SELOS_META : false

  return (
    <div className="passaporte-page">
      {/* Header */}
      <header className="passaporte-header">
        <Logo size={56} className="passaporte-logo" />
        <h1>Álbum de Figurinhas</h1>
        <p className="passaporte-sub">Tardezinha Show de Bola</p>
      </header>

      {/* Campaign banner — sempre visível */}
      <div className="passaporte-campaign">
        <span className="campaign-tag">Campanha de fidelização</span>
        <p className="campaign-text">
          Colecione <strong>4 presenças</strong> e ganhe{' '}
          <strong>1 ingresso cortesia!</strong>
        </p>
      </div>

      {/* Busca */}
      {(status === 'idle' || status === 'loading' || status === 'not-found' || status === 'error') && (
        <section className="passaporte-busca">
          <form onSubmit={handleBuscar}>
            <label htmlFor="tel-passaporte">Digita o WhatsApp que usou na inscrição:</label>
            <input
              id="tel-passaporte"
              type="tel"
              placeholder="(51) 99999-9999"
              value={telefone}
              onChange={e => setTelefone(maskPhone(e.target.value))}
              required
              autoFocus
            />
            <button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Buscando...' : 'Ver meu álbum'}
            </button>
          </form>

          {status === 'not-found' && (
            <div className="passaporte-msg info">
              <p>
                Não encontrei inscrições com esse número.
                <br />
                Confere se é o mesmo WhatsApp que usou no formulário, ou{' '}
                <a
                  href={whatsappLink('Oi! Quero saber sobre o Álbum de Figurinhas da Tardezinha.')}
                  onClick={trackWhatsappLead}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  fala com a gente
                </a>.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="passaporte-msg erro">
              <p>Ops, deu um erro. Tenta de novo daqui a pouquinho.</p>
            </div>
          )}
        </section>
      )}

      {/* Resultado */}
      {status === 'found' && data && (
        <section className="passaporte-resultado">
          {/* Card principal */}
          <div className="passaporte-card">
            {/* Greeting */}
            <div className="passaporte-greet">
              <div>
                <p className="greet-name">Oi, {firstName}!</p>
                <p className="greet-sub">
                  {ganhou ? 'Álbum completo!' : 'Teu álbum tá quase completo'}
                </p>
              </div>
            </div>

            {/* Selos de presença */}
            <div className="presenca-section">
              <p className="presenca-label">Presenças confirmadas</p>
              <div className="presenca-row">
                {Array.from({ length: SELOS_META }).map((_, i) => {
                  const preenchido = i < data.total_edicoes
                  const edicaoId = data.edicoes[i]
                  return (
                    <div key={i} className={`selo-presenca ${preenchido ? 'selo-ativo' : 'selo-vazio'}`}>
                      <div className="selo-circulo">
                        {preenchido ? '⭐' : `${i + 1}`}
                      </div>
                      <span className="selo-data">
                        {preenchido
                          ? EDICAO_LABELS[edicaoId] ?? edicaoId
                          : 'Próxima'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="progress-section">
              <div className="progress-labels">
                <span>Progresso</span>
                <strong>{data.total_edicoes} / {SELOS_META}{ganhou ? ' ✓' : ''}</strong>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${ganhou ? 'fill-completo' : ''}`}
                  style={{ width: `${Math.min(100, (data.total_edicoes / SELOS_META) * 100)}%` }}
                />
              </div>
            </div>

            <div className="section-divider" />

            {/* Figurinhas dos brinquedos */}
            <div className="figurinhas-section">
              <p className="figurinhas-label">Figurinhas das atrações</p>
              <div className="figurinhas-grid">
                {FIGURINHAS.map((fig, i) => {
                  const colada = i < data.total_edicoes
                  return (
                    <div key={fig.nome} className={`figurinha ${colada ? 'fig-colada' : 'fig-preview'}`}>
                      <img src={fig.foto} alt={fig.nome} loading="lazy" />
                      {colada ? (
                        <>
                          <span className="fig-check">✓</span>
                          <span className="fig-tag">Colada!</span>
                          <div className="fig-badge">
                            <p className="fig-name">{fig.nome}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="fig-overlay">
                            <span className="fig-lock">🔒</span>
                            <span className="fig-soon">Em breve</span>
                          </div>
                          <div className="fig-badge">
                            <p className="fig-name">{fig.nome}</p>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* CTA / Prêmio */}
            {ganhou ? (
              <div className="premio-box">
                <div className="premio-icon">🎁</div>
                <h3 className="premio-title">Álbum completo!</h3>
                <p className="premio-desc">
                  Teu próximo ingresso é por nossa conta. Fala com a equipe pra resgatar.
                </p>
                <a
                  href={whatsappLink(`Oi! Completei o Álbum de Figurinhas da Tardezinha e quero resgatar meu ingresso cortesia! Meu telefone: ${telefone}`)}
                  onClick={trackWhatsappLead}
                  className="premio-cta"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Resgatar ingresso cortesia 🎉
                </a>
              </div>
            ) : (
              <div className="passaporte-proximo">
                <p className="proximo-texto">
                  {faltam === 1
                    ? 'Falta só mais 1 presença pro ingresso cortesia!'
                    : `Faltam ${faltam} presenças pro ingresso cortesia.`}
                </p>
                <a href="/reservar" className="passaporte-cta">
                  Garantir vaga na próxima edição →
                </a>
              </div>
            )}
          </div>

          <button
            className="passaporte-outro"
            onClick={() => {
              setStatus('idle')
              setData(null)
              setTelefone('')
            }}
          >
            Consultar outro número
          </button>
        </section>
      )}

      <footer className="passaporte-footer">
        <p>
          Álbum de Figurinhas · Tardezinha Show de Bola
          <br />
          Atlântida · Xangri-Lá · RS
        </p>
      </footer>
    </div>
  )
}
