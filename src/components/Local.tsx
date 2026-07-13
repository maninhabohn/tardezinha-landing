import { EVENT_ADDRESS, GOOGLE_MAPS_URL } from '../lib/contact'

// ⚠️ MANINHA: pra gerar um link "oficial" de embed do Google Maps:
//   1. maps.google.com → busca "Av G 101 Atlantida Xangri-la"
//   2. Compartilhar → Incorporar mapa → Copiar HTML
//   3. Cola o src AQUI (substitui a URL abaixo)
// A URL abaixo funciona como fallback sem API key.
const MAPA_EMBED_URL =
  'https://www.google.com/maps?q=' +
  encodeURIComponent('Av. G, 101 - Atlântida, Xangri-lá - RS, 95588-000') +
  '&output=embed'

export function Local() {
  return (
    <section className="bg-sdb-purple-dark px-6 py-20 text-white">
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-2 inline-block rounded-full bg-sdb-pink px-4 py-1 text-sm font-bold text-white uppercase">
          Local
        </p>
        <h2 className="font-display text-4xl text-sdb-yellow sm:text-5xl">
          Onde a diversão acontece 🏖️
        </h2>

        <div className="mt-10 rounded-3xl bg-white/10 p-6 backdrop-blur sm:p-8">
          <p className="text-4xl">📍</p>
          <p className="mt-4 font-display text-xl leading-relaxed">
            {EVENT_ADDRESS}
          </p>

          {/* Diferenciais */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-sdb-orange/20 px-4 py-2 text-sm font-semibold text-sdb-yellow ring-2 ring-sdb-orange/40">
              ☔ 500m² de área coberta · chova ou faça sol
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-200 ring-2 ring-emerald-500/40">
              🚗 Rua tranquila com vaga na porta
            </span>
          </div>

          {/* Mapa embedado */}
          <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-xl">
            <iframe
              src={MAPA_EMBED_URL}
              width="100%"
              height="360"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização Casa de Festas Show de Bola"
            />
          </div>

          <div className="mt-6">
            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-sdb-yellow px-6 py-3 font-display text-sdb-purple transition hover:scale-105"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
              </svg>
              Abrir no Google Maps
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
