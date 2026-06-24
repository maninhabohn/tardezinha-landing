// Galeria — fotos do espaco que NAO aparecem no destaque.
// Pra adicionar/remover, edite esse array.
const fotos = [
  // Tematicas que sobraram (escalada original vai aqui, escalada-2 esta nas Atracoes)
  'basquete.jpg',
  'escalada.jpg',
  // Fotos curadas
  'IMG_2403.jpg',
  'IMG_2581.jpg',
  'P1544687.jpg',
  // Fotos do dia-a-dia
  'IMG-20250604-WA0044.jpg',
  'IMG-20250604-WA0045.jpg',
  'IMG-20250711-WA0207.jpg',
  'IMG-20250711-WA0217.jpg',
  'IMG-20250713-WA0067.jpg',
  'IMG-20250713-WA0167.jpg',
  'IMG-20250713-WA0179.jpg',
  'IMG-20250713-WA0183.jpg',
  'IMG-20250923-WA0055.jpg',
  'IMG-20251019-WA0265.jpg',
  'IMG-20260130-WA0052.jpg',
  'IMG20250629160754.jpg',
  'IMG20250629164336.jpg',
]

// Rotacoes deterministicas pra dar aquele visual "fotos jogadas na mesa"
const rotacoes = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-3', 'rotate-3']

export function Galeria() {
  return (
    <section className="bg-sdb-pink-soft px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="mb-2 inline-block rounded-full bg-sdb-purple px-4 py-1 text-sm font-bold text-white uppercase">
            Galeria
          </p>
          <h2 className="font-display text-4xl text-sdb-purple sm:text-5xl">
            O que rola aqui
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sdb-text/70">
            Um pedacinho do que tu pode esperar na Tardezinha.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3 sm:gap-7 lg:grid-cols-4">
          {fotos.map((nome, i) => (
            <div
              key={nome}
              className={`group relative bg-white p-2 pb-6 shadow-[0_8px_20px_rgba(0,0,0,0.15)] transition hover:scale-110 hover:rotate-0 hover:shadow-2xl hover:z-10 ${rotacoes[i % rotacoes.length]}`}
            >
              <img
                src={`/fotos/${nome}`}
                alt={`Foto ${i + 1} do espaço Show de Bola`}
                loading="lazy"
                className="aspect-square w-full object-cover [filter:sepia(0.08)_saturate(1.2)_contrast(1.05)_brightness(1.05)]"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
