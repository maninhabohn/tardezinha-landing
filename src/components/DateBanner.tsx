import { EVENTS, EVENT_THEME } from '../lib/contact'

const FLAG_COLORS = ['#ffe600', '#ec4899', '#16a34a', '#2563eb', '#f97316', '#dc2626']

function Bandeirinhas() {
  return (
    <div className="absolute top-0 left-0 w-full overflow-hidden h-5 pointer-events-none" aria-hidden>
      <svg viewBox="0 0 600 20" className="w-full h-5" preserveAspectRatio="none">
        <line x1="0" y1="3" x2="600" y2="5" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        {Array.from({ length: 20 }).map((_, i) => (
          <polygon
            key={i}
            points={`${i * 30 + 5},4 ${i * 30 + 20},4 ${i * 30 + 12.5},16`}
            fill={FLAG_COLORS[i % FLAG_COLORS.length]}
            opacity="0.7"
          />
        ))}
      </svg>
    </div>
  )
}

export function DateBanner() {
  return (
    <div className="sticky top-0 z-50 bg-sdb-purple-dark px-4 py-3 text-center shadow-lg relative">
      <Bandeirinhas />
      <p className="font-display text-sm font-bold tracking-wide text-sdb-yellow sm:text-base pt-1">
        <span className="inline-block">
          🏖️ {EVENT_THEME}
        </span>
        <span className="mx-2 hidden text-white/50 sm:inline">|</span>
        <br className="sm:hidden" />
        <span className="inline-block text-white/90">
          {EVENTS.map((ev, i) => (
            <span key={ev.id}>
              {i > 0 && ' · '}
              {ev.dateLong} ({ev.dayOfWeek.slice(0, 4)})
            </span>
          ))}
        </span>
      </p>
    </div>
  )
}
