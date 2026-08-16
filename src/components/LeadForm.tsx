import { useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { whatsappLink, trackWhatsappLead, INSCRICOES_ABERTAS } from '../lib/contact'
import { getUtmParams } from '../lib/utm'

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }

// Edicao atual — atualizar quando virar a proxima
const EDICAO = '2026-08-16'

function sanitize(value: string) {
  return value.trim().slice(0, 200)
}

export function LeadForm() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [criancas, setCriancas] = useState('')
  const [email, setEmail] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validacao basica
    const nomeClean = sanitize(nome)
    const whatsappClean = sanitize(whatsapp)
    const criancasNum = Number(criancas)
    const emailClean = email.trim() ? sanitize(email) : null

    if (!nomeClean || !whatsappClean || !criancasNum) {
      setStatus({ kind: 'error', message: 'Preenche nome, WhatsApp e quantas crianças.' })
      return
    }
    if (criancasNum < 1 || criancasNum > 10) {
      setStatus({ kind: 'error', message: 'Quantidade de crianças entre 1 e 10.' })
      return
    }

    setStatus({ kind: 'submitting' })

    const utm = getUtmParams()
    const { error } = await supabase.from('tardezinha_leads').insert({
      edicao: EDICAO,
      nome: nomeClean,
      whatsapp: whatsappClean,
      criancas_qtde: criancasNum,
      email: emailClean,
      user_agent: navigator.userAgent.slice(0, 500),
      referer: document.referrer.slice(0, 500) || null,
      ...utm,
    })

    if (error) {
      console.error('[LeadForm] erro ao salvar:', error.message)
      setStatus({ kind: 'error', message: 'Algo deu errado. Tenta de novo ou chama direto no WhatsApp.' })
      return
    }

    setStatus({ kind: 'success' })

    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Lead')
    }

    // Redireciona pro WhatsApp pre-preenchido (whatsappLink ja anexa [utm:...] se houver)
    const plural = criancasNum > 1 ? 's' : ''
    const msgTexto = INSCRICOES_ABERTAS
      ? `Oi! Quero ingresso da Tardezinha de Domingo. Sou ${nomeClean} e levo ${criancasNum} criança${plural}.`
      : `Oi! Quero saber da data nova da Tardezinha. Sou ${nomeClean} e levo ${criancasNum} criança${plural}.`
    setTimeout(() => {
      window.location.href = whatsappLink(msgTexto)
    }, 1500)
  }

  const isSubmitting = status.kind === 'submitting'

  // Fallback gracioso: se Supabase nao tiver configurado, mostra CTA direto pro WhatsApp
  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-3xl bg-white p-6 text-center shadow-lg sm:p-8">
        <p className="text-5xl">📱</p>
        <h3 className="mt-3 font-display text-2xl text-sdb-purple sm:text-3xl">
          {INSCRICOES_ABERTAS ? 'Garante tua vaga agora' : 'Quer saber da próxima Tardezinha?'}
        </h3>
        <p className="mt-2 text-sm text-sdb-text/70">
          {INSCRICOES_ABERTAS
            ? 'Chama no WhatsApp que a gente fecha rapidinho.'
            : 'Chama no WhatsApp que a gente te avisa da data nova.'}
        </p>
        <a
          href={whatsappLink(
            INSCRICOES_ABERTAS
              ? 'Oi! Quero ingresso da Tardezinha de Domingo.'
              : 'Oi! Quero saber da data nova da Tardezinha.',
          )}
          target="_blank"
          rel="noopener noreferrer"
          onClick={trackWhatsappLead}
          className="mt-6 inline-block w-full rounded-full bg-emerald-500 px-6 py-4 font-display text-lg text-white shadow-lg transition hover:scale-[1.02] hover:bg-emerald-600 sm:w-auto sm:px-12"
        >
          💬 Falar no WhatsApp
        </a>
      </div>
    )
  }

  if (status.kind === 'success') {
    return (
      <div className="rounded-3xl bg-emerald-50 border-2 border-emerald-300 p-8 text-center">
        <p className="text-5xl">✅</p>
        <h3 className="mt-3 font-display text-2xl text-emerald-800">
          Beleza! Tô te levando pro WhatsApp agora.
        </h3>
        <p className="mt-2 text-base text-emerald-700">
          {INSCRICOES_ABERTAS ? (
            <>Manda <strong>"oi"</strong> que a gente fecha tua vaga em 5 minutos.</>
          ) : (
            <>Tá anotado. Assim que a data nova sair, tu é a primeira a saber.</>
          )}
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl bg-white p-6 shadow-lg sm:p-8"
      noValidate
    >
      <div className="text-center">
        <h3 className="font-display text-2xl text-sdb-purple sm:text-3xl">
          {INSCRICOES_ABERTAS
            ? 'Garante tua vaga em 30 segundos'
            : 'Quer saber da próxima Tardezinha?'}
        </h3>
        <p className="mt-2 text-sm text-sdb-text/70">
          {INSCRICOES_ABERTAS
            ? 'A gente te chama no WhatsApp pra fechar.'
            : 'Deixa teu contato que a gente te avisa assim que a data nova sair.'}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="nome" className="mb-1 block text-sm font-semibold text-sdb-purple">
            Teu nome
          </label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className="w-full rounded-xl border-2 border-sdb-purple/15 bg-white px-4 py-3 text-base focus:border-sdb-purple focus:outline-none"
            placeholder="Como tu se chama?"
            maxLength={100}
          />
        </div>

        <div>
          <label htmlFor="whatsapp" className="mb-1 block text-sm font-semibold text-sdb-purple">
            WhatsApp com DDD
          </label>
          <input
            id="whatsapp"
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            required
            pattern="[0-9 ()+\-]+"
            className="w-full rounded-xl border-2 border-sdb-purple/15 bg-white px-4 py-3 text-base focus:border-sdb-purple focus:outline-none"
            placeholder="(51) 99999-9999"
            maxLength={20}
          />
        </div>

        <div>
          <label htmlFor="criancas" className="mb-1 block text-sm font-semibold text-sdb-purple">
            Quantas crianças?
          </label>
          <input
            id="criancas"
            type="number"
            value={criancas}
            onChange={(e) => setCriancas(e.target.value)}
            required
            min={1}
            max={10}
            className="w-full rounded-xl border-2 border-sdb-purple/15 bg-white px-4 py-3 text-base focus:border-sdb-purple focus:outline-none"
            placeholder="1, 2, 3..."
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-semibold text-sdb-purple">
            Email <span className="font-normal text-sdb-text/50">(opcional)</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border-2 border-sdb-purple/15 bg-white px-4 py-3 text-base focus:border-sdb-purple focus:outline-none"
            placeholder="pra futuras edições"
            maxLength={150}
          />
        </div>
      </div>

      {status.kind === 'error' && (
        <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          ⚠️ {status.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full rounded-full bg-emerald-500 px-6 py-4 font-display text-lg text-white shadow-lg transition hover:scale-[1.02] hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting
          ? 'Enviando...'
          : INSCRICOES_ABERTAS
            ? 'Quero garantir minha vaga →'
            : 'Me avisa da próxima →'}
      </button>

      <p className="mt-3 text-center text-xs text-sdb-text/50">
        Teus dados são usados só pra te avisar das próximas edições.
      </p>
    </form>
  )
}
