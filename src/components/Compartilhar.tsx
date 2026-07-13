import { useState } from 'react'

const SHARE_TEXT =
  'Olha que legal essa Tardezinha de Férias — 30/07 em Xangri-lá. Vou levar a galera! 🏖️'
const SHARE_TITLE = 'Tardezinha de Férias Show de Bola — 30/07/2026'

export function Compartilhar() {
  const [feedback, setFeedback] = useState<'idle' | 'copied' | 'error'>('idle')

  const handleShare = async () => {
    const url = window.location.href

    // Tenta a Web Share API primeiro (mobile mostra o menu nativo do SO)
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ url, title: SHARE_TITLE, text: SHARE_TEXT })
        return
      } catch {
        // Usuario cancelou — silencio
        return
      }
    }

    // Fallback desktop: copia pro clipboard
    try {
      await navigator.clipboard.writeText(url)
      setFeedback('copied')
      setTimeout(() => setFeedback('idle'), 2500)
    } catch {
      setFeedback('error')
      setTimeout(() => setFeedback('idle'), 2500)
    }
  }

  const label =
    feedback === 'copied'
      ? '✓ Link copiado!'
      : feedback === 'error'
        ? 'Erro ao copiar'
        : 'Compartilhar'

  return (
    <section className="bg-sdb-pink-soft px-6 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-4xl">💌</p>
        <h2 className="mt-2 font-display text-3xl text-sdb-purple sm:text-4xl">
          Conhece alguém que ia amar?
        </h2>
        <p className="mt-3 text-sdb-text/70">
          Manda o link pros pais da turma, pros amigos da família, pro grupo do
          prédio. Quanto mais gente, mais animado.
        </p>

        <button
          type="button"
          onClick={handleShare}
          className="mt-6 inline-flex items-center gap-3 rounded-full bg-sdb-purple px-8 py-4 font-display text-lg text-white shadow-xl transition hover:scale-105 hover:bg-sdb-purple-dark"
        >
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          {label}
        </button>
      </div>
    </section>
  )
}
