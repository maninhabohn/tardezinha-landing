import type { PropsWithChildren } from 'react'
import { useReveal } from '../hooks/useReveal'

type RevealProps = PropsWithChildren<{
  /** Delay opcional em ms pra escalonar animacoes */
  delay?: number
  /** Classe extra (geralmente nao precisa) */
  className?: string
}>

/**
 * Aplica um fade-in suave quando o conteudo entra na tela.
 * Usa IntersectionObserver — performance perfeita, zero dependencia.
 */
export function Reveal({ children, delay = 0, className = '' }: RevealProps) {
  const { ref, visible } = useReveal<HTMLDivElement>()

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  )
}
