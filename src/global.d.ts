interface Window {
  fbq?: (...args: unknown[]) => void
  // 13/11/2026: edições abertas no BANCO (tardezinha_edicoes_publicas), lidas no main.tsx antes da página montar
  __TZ_EDICOES_BANCO?: { marker: string; dia: string; inicio: string; fim: string }[]
}
