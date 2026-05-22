// Contatos e dados do evento — centralizado pra facilitar manutencao
// Se algum dado mudar, edita SO aqui que propaga pra toda a landing.

export const WHATSAPP_NUMBER = '5551998181165' // formato internacional, sem + nem espacos
export const WHATSAPP_LABEL = '(51) 99818-1165'
export const INSTAGRAM_HANDLE = 'casashowdebolaoficial'
export const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`

export const EVENT_DATE_LABEL = '29/05/2026'
export const EVENT_TIME_LABEL = 'das 18h às 22h30'
export const EVENT_ADDRESS = 'Av. G, 101 — Atlântida, Xangri-lá — RS, 95588-000'
export const GOOGLE_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent('Av. G, 101 - Atlântida, Xangri-lá - RS, 95588-000')

export const defaultWhatsappMessage = `Olá! Quero confirmar minha presença na Tardezinha Show de Bola do dia ${EVENT_DATE_LABEL}.`

export const whatsappLink = (message: string = defaultWhatsappMessage) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
