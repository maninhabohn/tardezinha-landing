import { useEffect, useRef, useState } from 'react'

/**
 * Observa um elemento e retorna `visible: true` quando ele entra na tela.
 * Usado pra disparar animacoes de fade-in conforme o usuario rola a pagina.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.15,
) {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Se o navegador nao suporta, ja deixa visivel (sem animacao)
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, visible }
}
