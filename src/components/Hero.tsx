import {
  EVENT_DATE_LABEL,
  EVENT_TIME_LABEL,
  whatsappLink,
} from '../lib/contact'
import { Logo } from './Logo'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-sdb-yellow px-6 pt-8 pb-16 sm:pt-12">
      {/* Bolhas decorativas atras */}
      <div
        aria-hidden
        className="absolute -top-16 -left-16 h-48 w-48 rounded-full bg-sdb-pink/40 blur-2xl"
      />
      <div
        aria-hidden
        className="absolute -right-16 top-32 h-56 w-56 rounded-full bg-sdb-purple/30 blur-3xl"
      />

      <div className="relative mx-auto max-w-3xl text-center">
        {/* Logo */}
        <Logo size={240} className="mb-6" />

        {/* Kicker — pre-titulo */}
        <p className="font-display text-sm uppercase tracking-[0.25em] text-sdb-pink">
          Salve a data · 29 de maio
        </p>

        {/* Titulo principal */}
        <h1 className="mt-3 font-display text-5xl leading-[0.95] text-sdb-purple sm:text-7xl drop-shadow-[2px_2px_0_rgba(0,0,0,0.1)]">
          TARDEZINHA
          <br />
          <span className="text-sdb-purple-dark">SHOW DE BOLA</span>
        </h1>

        {/* Descricao emocional — foco nos pais */}
        <p className="mx-auto mt-8 max-w-xl text-lg text-sdb-text/85 sm:text-xl">
          Pra criançada, é a tarde do ano. Pra você, é a tarde{' '}
          <strong className="text-sdb-purple">sem correria</strong>: mesa pra
          família, bar à disposição e a certeza de levar pra casa um filho{' '}
          <strong className="text-sdb-purple">cansado, feliz e dormindo cedo</strong>.
        </p>

        {/* Data e horario — cartao destaque */}
        <div className="mx-auto mt-10 inline-block rotate-[-2deg] rounded-2xl bg-white px-8 py-5 shadow-xl ring-4 ring-sdb-orange/40">
          <p className="font-display text-3xl text-sdb-orange sm:text-4xl">
            {EVENT_DATE_LABEL}
          </p>
          <p className="mt-1 font-display text-xl text-sdb-orange/80 sm:text-2xl">
            {EVENT_TIME_LABEL}
          </p>
        </div>

        {/* Selo de idade */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-sdb-orange px-5 py-2 text-sm font-bold text-white uppercase shadow-md">
          <span>🎉</span>
          Crianças a partir de 4 anos
        </div>

        {/* CTA direto */}
        <div className="mt-10">
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-full bg-emerald-500 px-8 py-4 font-display text-lg text-white shadow-xl ring-4 ring-emerald-200 transition hover:scale-105 hover:bg-emerald-600 sm:text-xl"
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
            QUERO MINHA VAGA
          </a>
          <p className="mt-3 text-sm font-semibold text-sdb-text/70">
            🔥 A última edição lotou. Não fica de fora.
          </p>
        </div>
      </div>
    </section>
  )
}
