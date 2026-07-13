// Contatos e dados do evento — centralizado pra facilitar manutencao
// Se algum dado mudar, edita SO aqui que propaga pra toda a landing.

export const WHATSAPP_NUMBER = '5551998181165' // formato internacional, sem + nem espacos
export const WHATSAPP_LABEL = '(51) 99818-1165'
export const INSTAGRAM_HANDLE = 'casashowdebolaoficial'
export const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`

// Data do evento (atualizar aqui pra propagar pra toda a landing)
export const EVENT_DATE_LABEL = '30/07/2026'
export const EVENT_DATE_LONG = '30 DE JULHO'
export const EVENT_DAY_OF_WEEK = 'quinta-feira'
export const EVENT_TIME_LABEL = 'das 18h às 22h30'
export const EVENT_ADDRESS = 'Av. G, 101 — Atlântida, Xangri-Lá — RS, 95588-000'
export const EVENT_THEME = 'Edição de Férias 🏖️'

// Prazo do valor antecipado (ISO, fuso BR -03:00)
export const ANTECIPADO_DEADLINE = '2026-07-28T23:59:59-03:00'

export const GOOGLE_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent('Av. G, 101 - Atlântida, Xangri-lá - RS')

// Mensagens padrao do WhatsApp em "tu"
export const defaultWhatsappMessage = `Oi! Quero ingresso da Tardezinha de Férias ${EVENT_DATE_LABEL}.`

export const whatsappLink = (message: string = defaultWhatsappMessage) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
