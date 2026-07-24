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

const SELOS_META = 3
const EDICAO_LABELS: Record<string, string> = {
  '09jul': '09/07',
  '23jul': '23/07',
  '30jul': '30/07',
}

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
    document.title = 'Passaporte da Tardezinha — Show de Bola'
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
      <header className="passaporte-header">
        <Logo />
        <h1>Passaporte da Tardezinha</h1>
        <p className="passaporte-sub">
          A cada edição que tu participa, ganha um selo.
          <br />
          <strong>Juntou {SELOS_META}? O próximo ingresso é cortesia!</strong>
        </p>
      </header>

      {status === 'idle' || status === 'loading' || status === 'not-found' || status === 'error' ? (
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
              {status === 'loading' ? 'Buscando...' : '🔍 Ver meu passaporte'}
            </button>
          </form>

          {status === 'not-found' && (
            <div className="passaporte-msg info">
              <p>
                Não encontrei inscrições com esse número.
                <br />
                Confere se é o mesmo WhatsApp que usou no formulário, ou{' '}
                <a
                  href={whatsappLink('Oi! Quero saber sobre o Passaporte da Tardezinha.')}
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
      ) : null}

      {status === 'found' && data && (
        <section className="passaporte-resultado">
          <div className="passaporte-card">
            <div className="passaporte-card-header">
              <span className="passaporte-emoji">🎫</span>
              <div>
                <h2>Olá, {firstName}!</h2>
                <p className="passaporte-contagem">
                  {ganhou
                    ? '🎉 Tu completou o passaporte!'
                    : `${data.total_edicoes} de ${SELOS_META} selos`}
                </p>
              </div>
            </div>

            <div className="selos-grid">
              {Array.from({ length: SELOS_META }).map((_, i) => {
                const preenchido = i < data.total_edicoes
                const edicaoId = data.edicoes[i]
                return (
                  <div key={i} className={`selo ${preenchido ? 'selo-ativo' : 'selo-vazio'}`}>
                    <div className="selo-circulo">
                      {preenchido ? '✓' : `${i + 1}`}
                    </div>
                    <span className="selo-label">
                      {preenchido
                        ? EDICAO_LABELS[edicaoId] ?? edicaoId
                        : `Edição ${i + 1}`}
                    </span>
                  </div>
                )
              })}
            </div>

            {ganhou ? (
              <div className="passaporte-premio">
                <div className="premio-badge">🎁</div>
                <h3>Ingresso cortesia liberado!</h3>
                <p>
                  Na próxima edição da Tardezinha, tu tem 1 ingresso grátis.
                  <br />
                  Fala com a equipe pra garantir.
                </p>
                <a
                  href={whatsappLink(`Oi! Completei o Passaporte da Tardezinha e quero resgatar meu ingresso cortesia! Meu telefone: ${telefone}`)}
                  onClick={trackWhatsappLead}
                  className="passaporte-cta premio"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Resgatar meu ingresso 🎉
                </a>
              </div>
            ) : (
              <div className="passaporte-proximo">
                <p>
                  {faltam === 1
                    ? 'Falta só mais 1 edição pro ingresso cortesia!'
                    : `Faltam ${faltam} edições pro ingresso cortesia.`}
                </p>
                <a
                  href="/reservar"
                  className="passaporte-cta"
                >
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
          Passaporte da Tardezinha · Casa de Festas Show de Bola
          <br />
          Atlântida · Xangri-Lá · RS
        </p>
      </footer>
    </div>
  )
}
