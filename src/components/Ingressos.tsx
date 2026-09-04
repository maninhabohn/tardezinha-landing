import { Link } from 'react-router-dom'
import { whatsappLink, trackWhatsappLead, INSCRICOES_ABERTAS, AVISO_FECHADO } from '../lib/contact'
import { Countdown, antecipadoExpirou } from './Countdown'
import { LeadForm } from './LeadForm'

const grupoMessage =
  'Oi! Quero saber sobre os valores especiais pra grupo na Tardezinha.'

export function Ingressos() {
  const expirou = antecipadoExpirou()

  // Inscricoes fechadas: nada de preco, countdown ou "garante tua vaga".
  // Fica so o aviso + a lista de espera pra proxima data.
  if (!INSCRICOES_ABERTAS) {
    return (
      <section id="ingressos" className="bg-sdb-yellow px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl bg-white p-8 text-center shadow-xl">
            <p className="text-5xl">🎈</p>
            <h2 className="mt-4 font-display text-3xl text-sdb-purple sm:text-4xl">
              {AVISO_FECHADO.titulo}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-sdb-text/80">
              {AVISO_FECHADO.texto}
            </p>
            <p className="mt-4 text-base font-semibold text-sdb-purple">
              {AVISO_FECHADO.chamada}
            </p>
            <p className="mt-3 text-sm text-sdb-text/60">
              {AVISO_FECHADO.confirmacao}
            </p>

            {/* 02/09/2026: o caminho que EXISTE. Antes daqui so saia lista de espera —
                a pessoa chegava pela campanha e nao tinha o que fazer. */}
            <Link
              to="/grupo"
              className="mt-6 inline-block rounded-full bg-sdb-purple px-8 py-4 text-base font-bold
                         text-white shadow-lg transition hover:brightness-110 focus:outline-none
                         focus-visible:ring-4 focus-visible:ring-sdb-purple/40"
            >
              Escolher o dia da minha turma
            </Link>
          </div>

          <div className="mt-8">
            <LeadForm />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="ingressos" className="bg-sdb-yellow px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="mb-2 inline-block rounded-full bg-sdb-pink px-4 py-1 text-sm font-bold text-white uppercase">
            🎟️ Ingresso
          </p>
          <h2 className="font-display text-4xl text-sdb-purple sm:text-5xl">
            Garante tua vaga 🎈
          </h2>

          {!expirou && (
            <div className="mt-5 flex justify-center">
              <Countdown />
            </div>
          )}
        </div>

        {/* Cards de preco */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {!expirou && (
            <div className="relative rounded-3xl bg-sdb-purple p-8 text-center text-white shadow-2xl ring-4 ring-sdb-purple-dark/20">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sdb-yellow px-4 py-1 text-xs font-bold text-sdb-purple uppercase">
                Economiza garantindo já
              </span>
              <p className="font-display text-lg uppercase tracking-wide text-sdb-yellow">
                Antecipado
              </p>
              <p className="mt-3 font-display text-6xl">
                R$ <span className="text-sdb-yellow">45</span>
                <span className="text-3xl">,00</span>
              </p>
              <p className="mt-3 text-sm text-white/80">Até 2 dias antes do evento</p>
            </div>
          )}

          <div
            className={`rounded-3xl border-4 border-sdb-purple/20 bg-white p-8 text-center text-sdb-text shadow-xl ${
              expirou ? 'sm:col-span-2' : ''
            }`}
          >
            <p className="font-display text-lg uppercase tracking-wide text-sdb-pink">
              {expirou ? 'Valor único' : 'Na hora'}
            </p>
            <p className="mt-3 font-display text-6xl text-sdb-purple">
              R$ 50<span className="text-3xl">,00</span>
            </p>
            <p className="mt-3 text-sm text-sdb-text/70">
              Sujeito a disponibilidade
            </p>
          </div>
        </div>

        {/* Info adulto + grupo */}
        <div className="mt-6 text-center">
          <p className="text-sm font-semibold text-sdb-text/70">
            👨‍👩‍👧 Adulto não paga entrada — paga apenas consumo no bar
          </p>
          <p className="mt-2 inline-block rounded-full bg-sdb-purple/10 px-4 py-1 text-sm font-bold text-sdb-purple">
            👥 Grupo com 6 crianças ou mais: R$ 38 antecipado por criança
          </p>
        </div>

        {/* CTA reserva */}
        <div className="mt-10 text-center">
          <Link
            to="/reservar"
            className="inline-block rounded-2xl bg-sdb-pink px-10 py-5 font-display text-2xl font-bold text-white shadow-2xl ring-4 ring-sdb-pink/30 transition hover:scale-105 hover:bg-sdb-purple sm:text-3xl"
          >
            GARANTIR MINHA VAGA →
          </Link>
          <p className="mt-3 text-sm text-sdb-text/60">Reserva online · pagamento via Pix</p>
        </div>

        {/* Form de captura de lead */}
        <div className="mt-10">
          <LeadForm />
        </div>

        {/* Grupos */}
        <div className="mt-10 rounded-2xl bg-white p-6 text-center shadow-lg">
          <p className="font-display text-xl text-sdb-purple">
            🎟️ Valores especiais pra grupo
          </p>
          <p className="mt-2 text-sm text-sdb-text/70">
            Tu vai trazer a turma da escolinha, irmãos, amigos? Fala com a gente que combinamos.
          </p>
          <a
            href={whatsappLink(grupoMessage)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={trackWhatsappLead}
            className="mt-4 inline-block rounded-full bg-sdb-purple px-6 py-2 text-sm font-bold text-white transition hover:bg-sdb-purple-dark"
          >
            Consultar valor de grupo →
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
