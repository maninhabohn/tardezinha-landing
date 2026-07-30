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
    id: '30jul',
    date: '30/07/2026',
    dateLong: '30 DE JULHO',
    dayOfWeek: 'quinta-feira',
    sessions: [
      { time: 'das 14h às 18h', label: '14h–18h', soldOut: true },
      { time: 'das 18h às 22h', label: '18h–22h' },
    ],
    antecipadoDeadline: '2026-07-28T23:59:59-03:00',
  },
]

// Compatibilidade — dados do evento mais proximo (pra componentes simples)
export const EVENT_DATE_LABEL = EVENTS[0].date
export const EVENT_DATE_LONG = EVENTS[0].dateLong
export const EVENT_DAY_OF_WEEK = EVENTS[0].dayOfWeek
export const EVENT_TIME_LABEL = EVENTS[0].sessions[0].time
export const EVENT_ADDRESS = 'Av. G, 101 — Atlântida, Xangri-Lá — RS, 95588-000'
export const EVENT_THEME = 'Edição de Férias 🏖️'

// Prazo do antecipado — mais proximo
export const ANTECIPADO_DEADLINE = EVENTS[0].antecipadoDeadline

export const GOOGLE_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent('Av. G, 101 - Atlântida, Xangri-lá - RS')

// Mensagens padrao do WhatsApp em "tu"
export const defaultWhatsappMessage = `Oi! Quero ingresso da Tardezinha de Férias.`

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
