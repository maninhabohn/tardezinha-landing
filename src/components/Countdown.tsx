import { useEffect, useState } from 'react'
import { ANTECIPADO_DEADLINE } from '../lib/contact'

function getDiff() {
  return new Date(ANTECIPADO_DEADLINE).getTime() - Date.now()
}

/**
 * Mostra "Antecipado acaba em Xd Yh" ate o deadline.
 * Apos o prazo, nao renderiza nada (some).
 */
export function Countdown() {
  const [diff, setDiff] = useState<number>(() => getDiff())

  useEffect(() => {
    // Atualiza a cada minuto (suficiente — nao precisa segundo)
    const interval = setInterval(() => setDiff(getDiff()), 60_000)
    return () => clearInterval(interval)
  }, [])

  if (diff <= 0) return null

  const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
  const horas = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutos = Math.floor((diff / (1000 * 60)) % 60)

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-sdb-yellow px-4 py-2 text-sm font-bold text-sdb-purple shadow-md ring-2 ring-sdb-orange/40">
      <span>⏰</span>
      Antecipado acaba em{' '}
      <strong>
        {dias > 0 && `${dias}d `}
        {horas}h {dias === 0 && `${minutos}min`}
      </strong>
    </div>
  )
}

/** Retorna true se o prazo do antecipado ja passou. */
export function antecipadoExpirou() {
  return getDiff() <= 0
}
