type Badge = 'novo' | 'queridinho' | 'memoravel' | 'desafio'

type Atracao = {
  foto: string
  titulo: string
  descricao: string
  badge: Badge
}

// ⚠️ MANINHA: quando subir as fotos novas em public/fotos/, troca os caminhos:
//   - tubarao.jpg → /fotos/P1555148.jpg (foto oficial do tubarão)
//   - giro.jpg → /fotos/P1544368.jpg (versão melhor)
//   - escalada-2.jpg → /fotos/P1544553.jpg (versão melhor)
const atracoes: Atracao[] = [
  {
    foto: '/fotos/nerf.jpg',
    titulo: 'Nerf Inflável',
    descricao: 'Arena gigante de tiro ao alvo · atração nova da edição',
    badge: 'novo',
  },
  {
    foto: '/fotos/giro.jpg',
    titulo: 'Giro Radical',
    descricao: 'Adrenalina pura · o brinquedo que a galera sempre pede de volta',
    badge: 'queridinho',
  },
  {
    foto: '/fotos/P1555148.jpg',
    titulo: 'Tubarão Inflável',
    descricao: 'Aquele clássico que vira foto pro feed',
    badge: 'memoravel',
  },
  {
    foto: '/fotos/escalada-2.jpg',
    titulo: 'Escalada',
    descricao: 'O clássico que todo mundo ama',
    badge: 'desafio',
  },
]

const badgeStyle: Record<Badge, { classes: string; text: string }> = {
  novo: {
    classes: 'bg-sdb-orange text-white',
    text: '🆕 Novo',
  },
  queridinho: {
    classes: 'bg-sdb-pink text-white',
    text: '❤️ O queridinho',
  },
  memoravel: {
    classes: 'bg-emerald-500 text-white',
    text: '🦈 O memorável',
  },
  desafio: {
    classes: 'bg-sdb-yellow text-sdb-purple',
    text: '🧗 O desafio',
  },
}

export function Atracoes() {
  return (
    <section className="bg-sdb-purple px-6 py-20 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="mb-2 inline-block rounded-full bg-sdb-yellow px-4 py-1 text-sm font-bold text-sdb-purple uppercase">
            Nesta edição
          </p>
          <h2 className="font-display text-4xl text-sdb-yellow sm:text-5xl">
            A festa fica assim:
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {atracoes.map((item) => {
            const badge = badgeStyle[item.badge]
            return (
              <div
                key={item.titulo}
                className="group relative overflow-hidden rounded-2xl bg-white text-sdb-text shadow-xl transition hover:scale-105"
              >
                <span
                  className={`absolute top-3 left-3 z-10 rounded-full px-3 py-1 text-xs font-bold uppercase shadow-md ${badge.classes}`}
                >
                  {badge.text}
                </span>

                <img
                  src={item.foto}
                  alt={item.titulo}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition group-hover:scale-110 [filter:sepia(0.08)_saturate(1.2)_contrast(1.05)_brightness(1.05)]"
                />

                <div className="p-5 text-center">
                  <h3 className="font-display text-xl text-sdb-purple">
                    {item.titulo}
                  </h3>
                  <p className="mt-1 text-sm text-sdb-text/70">
                    {item.descricao}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Crepe cortesia — destacado separado, NÃO é mais um card de atração */}
        <div className="mx-auto mt-12 max-w-3xl rounded-2xl bg-sdb-yellow/15 p-6 text-center backdrop-blur ring-2 ring-sdb-yellow/30">
          <p className="text-4xl">🥞</p>
          <h3 className="mt-3 font-display text-2xl text-sdb-yellow">
            1 Crepe cortesia
          </h3>
          <p className="mt-2 text-base text-white/90">
            Pra cada criança · comidinhas e bebidas extras à venda no local
          </p>
        </div>
      </div>
    </section>
  )
}
