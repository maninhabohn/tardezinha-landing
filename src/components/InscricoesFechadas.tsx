import { Logo } from './Logo'
import { DateBanner } from './DateBanner'
import { LeadForm } from './LeadForm'
import { AVISO_FECHADO, whatsappLink, trackWhatsappLead } from '../lib/contact'

const avisoMessage = 'Oi! Vi que a Tardezinha de 16/08 foi adiada. Quero saber da data nova.'

// Tela que substitui os formularios (/reservar e /grupo) enquanto INSCRICOES_ABERTAS = false.
export function InscricoesFechadas() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DateBanner />

      <div className="mx-auto max-w-lg px-4 py-10 text-center">
        <Logo size={120} className="mb-6" />

        <div className="rounded-3xl border-2 border-sdb-purple/15 bg-white p-7 shadow-lg">
          <p className="text-5xl">🌧️</p>
          <h1 className="mt-4 font-display text-3xl text-sdb-purple">
            {AVISO_FECHADO.titulo}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-sdb-text/80">
            {AVISO_FECHADO.texto}
          </p>
          <p className="mt-4 text-base font-semibold text-sdb-purple">
            {AVISO_FECHADO.chamada}
          </p>

          <a
            href={whatsappLink(avisoMessage)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={trackWhatsappLead}
            className="mt-6 inline-block w-full rounded-full bg-emerald-500 px-6 py-4 font-display text-lg text-white shadow-lg transition hover:scale-[1.02] hover:bg-emerald-600 sm:w-auto sm:px-10"
          >
            💬 Falar no WhatsApp
          </a>
        </div>

        <div className="mt-8 text-left">
          <LeadForm />
        </div>

        <a href="/" className="mt-8 inline-block text-sm text-sdb-purple underline">
          ← Voltar pro site
        </a>
      </div>
    </div>
  )
}
