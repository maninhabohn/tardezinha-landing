import { Link } from 'react-router-dom'
import { EVENTS, INSCRICOES_ABERTAS } from '../lib/contact'
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
          🎈 Tardezinha de Domingo · A data quem escolhe é tu
        </p>

        {/* Titulo principal */}
        <h1 className="mt-3 font-display text-5xl leading-[0.95] text-sdb-purple sm:text-7xl drop-shadow-[2px_2px_0_rgba(0,0,0,0.1)]">
          TARDEZINHA
          <br />
          <span className="text-sdb-purple-dark">SHOW DE BOLA</span>
        </h1>

        {/* Subtítulo — domingo à tarde */}
        <p className="mt-4 font-display text-xl text-sdb-orange sm:text-2xl">
          Domingo à tarde + mais de 20 brinquedos + 4 horas de diversão.
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
          Domingo à tarde — deixa a criançada com a gente e recarrega: um café sem pressa, um cochilo, o rolê dos amigos. A gente cuida. Tu busca um filho{' '}
          <strong className="text-sdb-purple">cansado, alimentado e feliz</strong>.
        </p>

        {/* Datas — so quando existe edicao marcada. 04/09/2026: com a campanha
            "escolhe a data" nao ha domingo no calendario, entao entra o card da campanha
            no lugar (antes ficava um card de 16/08 carimbado "Adiada"). */}
        {EVENTS.length === 0 ? (
          <div className="mx-auto mt-10 max-w-xl rotate-[-1deg] rounded-2xl bg-white px-7 py-6 shadow-xl ring-4 ring-sdb-orange/40">
            <p className="font-display text-2xl text-sdb-orange sm:text-3xl">
              🎈 A próxima data é a tua
            </p>
            <p className="mt-3 text-base leading-relaxed text-sdb-text/80">
              Não tem domingo fixo no calendário — e isso é de propósito. A partir de{' '}
              <strong className="text-sdb-purple">12 crianças</strong> a casa abre um domingo
              pra tua turma, das 14h às 18h.
            </p>
          </div>
        ) : (
        <div className="mx-auto mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          {EVENTS.map((ev) => (
            <div
              key={ev.id}
              className="inline-block rotate-[-1deg] rounded-2xl bg-white px-7 py-5 shadow-xl ring-4 ring-sdb-orange/40"
            >
              <p className="font-display text-xl text-sdb-orange sm:text-2xl">
                🎈 {ev.date} ({ev.dayOfWeek.slice(0, 3)})
              </p>
              {ev.sessions.map((s, i) => (
                <p key={i} className="mt-1 font-display text-lg sm:text-xl">
                  <span className={s.soldOut || !INSCRICOES_ABERTAS ? 'text-sdb-text/40 line-through' : 'text-sdb-orange/80'}>{s.time}</span>
                  {s.soldOut && <span className="ml-2 align-middle rounded-full bg-red-100 px-2 py-0.5 font-sans text-xs font-bold text-red-600">ESGOTADO</span>}
                </p>
              ))}
              {!INSCRICOES_ABERTAS && (
                <p className="mt-2 inline-block rounded-full bg-sdb-purple/10 px-3 py-1 font-sans text-xs font-bold uppercase text-sdb-purple">
                  Inscrições em breve
                </p>
              )}
            </div>
          ))}
        </div>
        )}

        {/* Selo de idade */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-sdb-orange px-5 py-2 text-sm font-bold text-white uppercase shadow-md">
          <span>🎉</span>
          A partir de 5 anos sem acompanhante
        </div>

        {/* CTA direto */}
        <div className="mt-10">
          {INSCRICOES_ABERTAS ? (
            <>
              <Link
                to="/reservar"
                className="inline-flex items-center gap-3 rounded-full bg-sdb-pink px-8 py-4 font-display text-lg text-white shadow-xl ring-4 ring-sdb-pink/30 transition hover:scale-105 hover:bg-sdb-purple sm:text-xl"
              >
                🎟️ GARANTIR MINHA VAGA
              </Link>
              <p className="mt-3 text-sm font-semibold text-sdb-text/70">
                🔥 A última edição esgotou. Não fica de fora.
              </p>
            </>
          ) : (
            <>
              <Link
                to="/grupo"
                className="inline-flex items-center gap-3 rounded-full bg-sdb-purple px-8 py-4 font-display text-lg text-white shadow-xl ring-4 ring-sdb-purple/30 transition hover:scale-105 sm:text-xl"
              >
                🎈 ESCOLHER MEU DOMINGO
              </Link>
              <p className="mt-3 text-sm font-semibold text-sdb-text/70">
                A edição nasce da data que a tua turma escolhe.
              </p>
              <p className="mt-3 text-sm">
                <a href="#ingressos" className="font-semibold text-sdb-purple underline">
                  Ainda não juntou a turma? Deixa teu contato →
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
