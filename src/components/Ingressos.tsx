import { whatsappLink } from '../lib/contact'

const grupoMessage =
  'Olá! Quero saber sobre os valores especiais para grupos na Tardezinha Show de Bola do dia 29/05/2026.'

export function Ingressos() {
  return (
    <section className="bg-sdb-yellow px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="mb-2 inline-block rounded-full bg-sdb-pink px-4 py-1 text-sm font-bold text-white uppercase">
            Ingresso
          </p>
          <h2 className="font-display text-4xl text-sdb-purple sm:text-5xl">
            Garanta sua vaga
          </h2>
          <p className="mt-3 text-sdb-text/70">
            Cabe no bolso. Vai bombar.
          </p>
        </div>

        {/* Cards de preco */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {/* Antecipado */}
          <div className="relative rounded-3xl bg-sdb-purple p-8 text-center text-white shadow-2xl ring-4 ring-sdb-purple-dark/20">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sdb-yellow px-4 py-1 text-xs font-bold text-sdb-purple uppercase">
              Recomendado
            </span>
            <p className="font-display text-lg uppercase tracking-wide text-sdb-yellow">
              Antecipado
            </p>
            <p className="mt-3 font-display text-6xl">
              R$ <span className="text-sdb-yellow">45</span>
              <span className="text-3xl">,00</span>
            </p>
            <p className="mt-3 text-sm text-white/80">
              Economize garantindo já
            </p>
          </div>

          {/* Na hora */}
          <div className="rounded-3xl border-4 border-sdb-purple/20 bg-white p-8 text-center text-sdb-text shadow-xl">
            <p className="font-display text-lg uppercase tracking-wide text-sdb-pink">
              Na hora
            </p>
            <p className="mt-3 font-display text-6xl text-sdb-purple">
              R$ 50<span className="text-3xl">,00</span>
            </p>
            <p className="mt-3 text-sm text-sdb-text/70">
              Sujeito a disponibilidade
            </p>
          </div>
        </div>

        {/* Grupos + vagas */}
        <div className="mt-10 rounded-2xl bg-white p-6 text-center shadow-lg">
          <p className="font-display text-xl text-sdb-purple">
            🎟️ Valores especiais para grupos
          </p>
          <p className="mt-2 text-sm text-sdb-text/70">
            Trazendo a turma? Fale com a gente para um valor diferenciado.
          </p>
          <a
            href={whatsappLink(grupoMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded-full bg-sdb-purple px-6 py-2 text-sm font-bold text-white transition hover:bg-sdb-purple-dark"
          >
            Consultar valor de grupo
          </a>
        </div>

        {/* Aviso de vagas com social proof */}
        <div className="mt-8 text-center">
          <p className="font-display text-2xl text-sdb-pink uppercase animate-pulse">
            🔥 A última edição esgotou
          </p>
          <p className="mt-2 text-sm font-semibold text-sdb-text/70">
            As vagas vão rápido — não fica pra próxima.
          </p>
        </div>
      </div>
    </section>
  )
}
