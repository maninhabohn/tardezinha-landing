export interface UtmParams {
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
}

export function getUtmParams(): UtmParams {
  if (typeof window === 'undefined') {
    return { utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null }
  }
  const params = new URLSearchParams(window.location.search)
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
  }
}

// Formato que o CRM whatsapp-webhook.extrairUtmDoTexto reconhece: [utm:src/med/campaign/content]
export function getUtmSuffix(): string {
  const utm = getUtmParams()
  if (!utm.utm_source && !utm.utm_medium && !utm.utm_campaign && !utm.utm_content) return ''
  const parts = [utm.utm_source, utm.utm_medium, utm.utm_campaign, utm.utm_content].map(
    (p) => (p ?? '').replace(/[/\]]/g, '-'),
  )
  while (parts.length > 1 && !parts[parts.length - 1]) parts.pop()
  return ` [utm:${parts.join('/')}]`
}
