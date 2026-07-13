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
      'A festa rola normal. Nossa Casa de Festas tem 500m² de área coberta — chuva não atrapalha em nada. ☔',
  },
  {
    pergunta: 'Como faço pra confirmar e pagar?',
    resposta:
      'É só clicar no botão verde e chamar no WhatsApp. Pagamento via Pix — rápido e prático.',
  },
  {
    pergunta: 'Tem valor especial pra grupo?',
    resposta:
      'Sim. Pra grupos (irmãos, amigos, turma da escola), temos valor especial. Fala com a gente no WhatsApp que combinamos.',
  },
  {
    pergunta: 'Tem onde estacionar?',
    resposta:
      'Sim! A rua é bem tranquila e sempre tem vaga na porta. 🚗',
  },
  {
    pergunta: 'Posso ficar acompanhando ou tenho que sair?',
    resposta:
      'Tu escolhe — mas a Tardezinha foi pensada pra tu APROVEITAR teu tempo fora. A criançada fica em boas mãos com a equipe de monitoria. Volta às 22h30 pra buscar.',
  },
  {
    pergunta: 'Crianças menores de 5 anos podem ir?',
    resposta:
      'A partir de 5 anos a criança fica sem acompanhante com a equipe de monitoria. Menores de 5 podem participar desde que acompanhados de um responsável o tempo todo.',
  },
  {
    pergunta: 'E se minha criança não pode comer crepe (alergia)?',
    resposta:
      'Sem problema. O crepe é uma cortesia opcional. Avisa a gente na hora da confirmação que a equipe adapta.',
  },
  {
    pergunta: 'E se eu quiser que a criançada coma mais coisas além do crepe?',
    resposta:
      'A lanchonete da casa funciona durante toda a Tardezinha — tem lanches e bebidas à venda no local. Tu paga só o que a criançada consumir além do crepe cortesia.',
  },
  {
    pergunta: 'Posso cancelar se acontecer algum imprevisto?',
    resposta:
      'Sim. Cancelamentos com até 48h de antecedência geram crédito pra próxima edição da Tardezinha. Tu não perde o valor pago — só transfere pro próximo evento.',
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
            A gente respondeu as perguntas mais comuns aqui embaixo. Se a tua não tá listada, é só chamar no WhatsApp.
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
            href={whatsappLink('Oi! Tenho uma dúvida sobre a Tardezinha Show de Bola.')}
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
