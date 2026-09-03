// Contatos e dados do evento — centralizado pra facilitar manutencao
// Se algum dado mudar, edita SO aqui que propaga pra toda a landing.

export const WHATSAPP_NUMBER = '5551998181165' // formato internacional, sem + nem espacos
export const WHATSAPP_LABEL = '(51) 99818-1165'
export const INSTAGRAM_HANDLE = 'casashowdebolaoficial'
export const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`

// Edicoes de ferias — multiplas datas
export interface EventSession {
  time: string   // "das 18h às 22h"
  label: string  // "18h–22h"
  soldOut?: boolean // turno esgotado — desabilita a escolha e mostra aviso
}

export interface TardezinhaEvent {
  id: string
  date: string        // "23/07/2026"
  dateLong: string    // "23 DE JULHO"
  dayOfWeek: string
  sessions: EventSession[]
  antecipadoDeadline: string // ISO
}

export const EVENTS: TardezinhaEvent[] = [
  {
    id: '16ago',
    date: '16/08/2026',
    dateLong: '16 DE AGOSTO',
    dayOfWeek: 'domingo',
    sessions: [
      { time: 'das 14h às 18h', label: '14h–18h', soldOut: false },
    ],
    antecipadoDeadline: '2026-08-14T23:59:59-03:00',
  },
]

// ⛔ KILL SWITCH DAS INSCRICOES
// A edicao de 16/08/2026 foi ADIADA: WhatsApp da Casa de Festas bloqueado (o canal que
// convida e fecha a Tardezinha) + chuva forte na madrugada = poucas criancas inscritas.
// Vira pra `true` quando a proxima data estiver definida em EVENTS acima.
export const INSCRICOES_ABERTAS = false

// 01/09/2026 (Jack): SEPARADO do de cima de proposito.
// A venda de ingresso avulso (/reservar) depende de ter uma edicao marcada em EVENTS -- e nao tem.
// Ja a FESTA DE GRUPO (/grupo) funciona sem data marcada: a mae PEDE o domingo e a casa abre.
// Por isso /grupo abre agora e /reservar segue fechado. Um interruptor so obrigaria a escolher
// entre deixar dinheiro na mesa ou vender ingresso pra data que nao existe.
export const GRUPO_ABERTO = true

// Enquanto o WhatsApp estiver bloqueado, os botoes de "Falar no WhatsApp" levam pro vazio.
// Voltar pra `true` assim que o numero estiver respondendo de novo.
// 01/09/2026: numero DESBLOQUEADO -- conferido no banco (456 mensagens enviadas em 24h).
export const WHATSAPP_ATIVO = true

// 02/09/2026 (Jack): deixou de ser "aviso de edicao adiada" e virou a OFERTA que esta aberta.
// A landing dizia "edicao de 16/08 adiada" desde agosto, enquanto a campanha do Meta rodava
// vendendo "a mae abre a data" — a peca prometia uma coisa e a pagina dizia outra.
// Nao ha data fixa pra vender, e inventar uma seria pior. Entao a home lidera com o GRUPO,
// que e o que de fato esta aberto (/grupo).
export const AVISO_FECHADO = {
  tarja: 'A data quem escolhe é tu',
  titulo: 'A próxima Tardezinha, tu que marca',
  texto:
    'Não tem data fixa no calendário agora — e isso é de propósito. A partir de 12 crianças a casa ' +
    'abre um domingo pra tua turma: 500m², mais de 20 brinquedos, sem tela, das 14h às 18h. ' +
    'A edição é aberta — vão ter outras crianças brincando junto, e é isso que mantém o preço em pé. ' +
    'Com 6 ou mais, já garante o preço de grupo numa edição que já exista.',
  chamada:
    'R$ 38 por criança, e adulto acompanhante não paga.',
}

// Compatibilidade — dados do evento mais proximo (pra componentes simples)
export const EVENT_DATE_LABEL = EVENTS[0].date
export const EVENT_DATE_LONG = EVENTS[0].dateLong
export const EVENT_DAY_OF_WEEK = EVENTS[0].dayOfWeek
export const EVENT_TIME_LABEL = EVENTS[0].sessions[0].time
export const EVENT_ADDRESS = 'Av. G, 101 — Atlântida, Xangri-Lá — RS, 95588-000'
export const EVENT_THEME = 'Tardezinha de Domingo'

// Prazo do antecipado — mais proximo
export const ANTECIPADO_DEADLINE = EVENTS[0].antecipadoDeadline

export const GOOGLE_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent('Av. G, 101 - Atlântida, Xangri-lá - RS')

// Mensagens padrao do WhatsApp em "tu"
export const defaultWhatsappMessage = `Oi! Quero ingresso da Tardezinha de Domingo.`

import { getUtmSuffix } from './utm'

export function trackWhatsappLead() {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Lead')
  }
}

// Anexa [utm:src/med/campaign/content] no texto quando a landing recebeu UTM.
// O whatsapp-webhook do CRM extrai automaticamente esse marker (extrairUtmDoTexto)
// e preenche clientes.utm_* — sem isso, não temos como comparar canais.
export const whatsappLink = (message: string = defaultWhatsappMessage) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message + getUtmSuffix())}`
