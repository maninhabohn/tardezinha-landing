import { EVENT_ADDRESS, GOOGLE_MAPS_URL } from '../lib/contact'

export function Local() {
  return (
    <section className="bg-sdb-purple-dark px-6 py-20 text-white">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-2 inline-block rounded-full bg-sdb-pink px-4 py-1 text-sm font-bold text-white uppercase">
          Local
        </p>
        <h2 className="font-display text-4xl text-sdb-yellow sm:text-5xl">
          Onde a festa acontece
        </h2>

        <div className="mt-10 inline-block rounded-3xl bg-white/10 p-8 backdrop-blur">
          <p className="text-4xl">📍</p>
          <p className="mt-4 font-display text-xl leading-relaxed">
            {EVENT_ADDRESS}
          </p>

          <a
            href={GOOGLE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-sdb-yellow px-6 py-3 font-display text-sdb-purple transition hover:scale-105"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
            </svg>
            Ver no Google Maps
          </a>
        </div>
      </div>
    </section>
  )
}
