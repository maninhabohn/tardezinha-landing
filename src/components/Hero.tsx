import { Link } from 'react-router-dom'
import { EVENTS } from '../lib/contact'
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
          🏖️ Edição de Férias · Julho 2026
        </p>

        {/* Titulo principal */}
        <h1 className="mt-3 font-display text-5xl leading-[0.95] text-sdb-purple sm:text-7xl drop-shadow-[2px_2px_0_rgba(0,0,0,0.1)]">
          TARDEZINHA
          <br />
          <span className="text-sdb-purple-dark">SHOW DE BOLA</span>
        </h1>

        {/* Subtítulo edição de férias */}
        <p className="mt-4 font-display text-xl text-sdb-orange sm:text-2xl">
          Férias escolares + mais de 20 brinquedos + 4 horas de diversão.
        </p>

        {/* Jargão âncora da campanha — DESTAQUE */}
        <div className="mx-auto mt-6 max-w-2xl">
          <p className="font-display text-2xl leading-tight text-sdb-purple-dark sm:text-3xl">
            <span className="block">4 horas pra ti.</span>
            <span className="block">4 horas pra criançada.</span>
            <span className="block text-sdb-pink">A família agradece.</span>
          </p>
        </div>

        {/* Descrição complementar */}
        <p className="mx-auto mt-6 max-w-xl text-base text-sdb-text/85 sm:text-lg">
          Férias escolares — deixa a criançada com a gente e vai pro happy hour, pro jantar, pro beach tênis. A gente cuida. Tu busca um filho{' '}
          <strong className="text-sdb-purple">cansado, alimentado e feliz</strong>.
        </p>

        {/* Datas — 2 cards lado a lado */}
        <div className="mx-auto mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          {EVENTS.map((ev) => (
            <div
              key={ev.id}
              className="inline-block rotate-[-1deg] rounded-2xl bg-white px-7 py-5 shadow-xl ring-4 ring-sdb-orange/40"
            >
              <p className="font-display text-xl text-sdb-orange sm:text-2xl">
                🏖️ {ev.date} ({ev.dayOfWeek.slice(0, 4)})
              </p>
              {ev.sessions.map((s, i) => (
                <p key={i} className="mt-1 font-display text-lg text-sdb-orange/80 sm:text-xl">
                  {s.time}
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* Selo de idade */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-sdb-orange px-5 py-2 text-sm font-bold text-white uppercase shadow-md">
          <span>🎉</span>
          A partir de 5 anos sem acompanhante
        </div>

        {/* CTA direto */}
        <div className="mt-10">
          <Link
            to="/reservar"
            className="inline-flex items-center gap-3 rounded-full bg-sdb-pink px-8 py-4 font-display text-lg text-white shadow-xl ring-4 ring-sdb-pink/30 transition hover:scale-105 hover:bg-sdb-purple sm:text-xl"
          >
            🎟️ GARANTIR MINHA VAGA
          </Link>
          <p className="mt-3 text-sm font-semibold text-sdb-text/70">
            🔥 A última edição esgotou. Não fica de fora.
          </p>
        </div>
      </div>
    </section>
  )
}
