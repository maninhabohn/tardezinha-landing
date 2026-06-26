import {
  EVENT_DATE_LONG,
  EVENT_DAY_OF_WEEK,
  EVENT_TIME_LABEL,
} from '../lib/contact'

export function DateBanner() {
  return (
    <div className="sticky top-0 z-50 bg-sdb-purple-dark px-4 py-2.5 text-center shadow-lg">
      <p className="font-display text-sm font-bold tracking-wide text-sdb-yellow sm:text-base">
        <span className="inline-block">
          {EVENT_DATE_LONG} · {EVENT_DAY_OF_WEEK}
        </span>
        <span className="mx-2 hidden text-white/50 sm:inline">|</span>
        <br className="sm:hidden" />
        <span className="inline-block text-white/90">{EVENT_TIME_LABEL}</span>
      </p>
    </div>
  )
}
