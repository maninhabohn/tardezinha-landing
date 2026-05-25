import { useState } from 'react'
import { whatsappLink } from '../lib/contact'

type FaqItem = {
  pergunta: string
  resposta: string
}

const faqs: FaqItem[] = [
  {
    pergunta: 'E se chover no dia?',
    resposta:
      'A festa rola normal! Nossa Casa de Festas tem 500m² de área coberta — então chuva não atrapalha em nada. ☔',
  },
  {
    pergunta: 'Como faço pra confirmar e pagar?',
    resposta:
      'É só clicar no botão verde e chamar no WhatsApp. O pagamento é via Pix — rápido e prático.',
  },
  {
    pergunta: 'Tem desconto pra mais de uma criança?',
    resposta:
      'Sim! Pra grupos (irmãos, amigos, turma da escola), temos valores especiais. Fala com a gente no WhatsApp que combinamos.',
  },
  {
    pergunta: 'Tem estacionamento?',
    resposta:
      'Sim, tem estacionamento no local. Sem complicação pra estacionar. 🅿️',
  },
  {
    pergunta: 'Posso ficar acompanhando ou tenho que sair?',
    resposta:
      'Você escolhe! Temos mesas e bar pra você curtir junto, ou pode aproveitar a folga e voltar no horário marcado pra buscar. Nossa equipe cuida da criançada.',
  },
  {
    pergunta: 'Crianças menores de 4 anos podem ir?',
    resposta:
      'Por questões de segurança das atrações (giro radical, escalada, etc), as atrações principais são a partir de 4 anos. Menores de 4 anos podem participar desde que acompanhados de um responsável o tempo todo.',
  },
  {
    pergunta: 'E se minha criança não pode comer crepe (alergia, etc)?',
    resposta:
      'Sem problema! O crepe é uma cortesia opcional. Avise a gente na hora da confirmação que adaptamos.',
  },
  {
    pergunta: 'Posso cancelar se acontecer algum imprevisto?',
    resposta:
      'Sim! Cancelamentos com até 48h de antecedência geram crédito pra próxima edição da Tardezinha. Você não perde o valor pago — só transfere pro próximo evento.',
  },
]

function Item({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-sdb-purple/15 bg-white shadow-sm transition hover:border-sdb-purple/40">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
        aria-expanded={isOpen}
      >
        <span className="font-display text-lg text-sdb-purple sm:text-xl">
          {item.pergunta}
        </span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sdb-purple text-xl text-white transition-transform ${
            isOpen ? 'rotate-45' : ''
          }`}
          aria-hidden
        >
          +
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-base text-sdb-text/80">{item.resposta}</p>
        </div>
      </div>
    </div>
  )
}

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="bg-sdb-yellow-soft px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="mb-2 inline-block rounded-full bg-sdb-purple px-4 py-1 text-sm font-bold text-white uppercase tracking-wider">
            Dúvidas frequentes
          </p>
          <h2 className="font-display text-4xl text-sdb-purple sm:text-5xl">
            Ainda tá em dúvida?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sdb-text/70">
            A gente respondeu as perguntas mais comuns aqui embaixo. Se a sua
            não tá listada, é só chamar no WhatsApp.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {faqs.map((item, i) => (
            <Item
              key={item.pergunta}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>

        {/* CTA final */}
        <div className="mt-10 rounded-2xl bg-white p-6 text-center shadow-md">
          <p className="text-sdb-text/80">
            Tem outra dúvida? Chama no WhatsApp que a gente responde rapidinho.
          </p>
          <a
            href={whatsappLink('Olá! Tenho uma dúvida sobre a Tardezinha Show de Bola.')}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded-full bg-sdb-purple px-6 py-3 font-display text-white transition hover:bg-sdb-purple-dark hover:scale-105"
          >
            💬 Tirar dúvida no WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
