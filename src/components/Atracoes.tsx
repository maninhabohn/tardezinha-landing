type Badge = 'novo' | 'queridinho' | 'classico'

type Atracao = {
  foto: string
  titulo: string
  descricao: string
  badge: Badge
}

const atracoes: Atracao[] = [
  {
    foto: '/fotos/nerf.jpg',
    titulo: 'Nerf Inflável',
    descricao: 'Arena gigante pra mira certeira',
    badge: 'novo',
  },
  {
    foto: '/fotos/giro.jpg',
    titulo: 'Giro Radical',
    descricao: 'Adrenalina pra galera corajosa',
    badge: 'queridinho',
  },
  {
    foto: '/fotos/crepe.jpg',
    titulo: '1 Crepe Grátis',
    descricao: 'Cortesia pra cada criança · mais à venda no local',
    badge: 'novo',
  },
  {
    foto: '/fotos/escalada-2.jpg',
    titulo: 'Escalada',
    descricao: 'O clássico que todo mundo ama',
    badge: 'classico',
  },
]

const badgeStyle: Record<Badge, { classes: string; text: string }> = {
  novo: {
    classes: 'bg-sdb-orange text-white',
    text: '🔥 Novo',
  },
  queridinho: {
    classes: 'bg-sdb-pink text-white',
    text: '🧡 O queridinho',
  },
  classico: {
    classes: 'bg-sdb-yellow text-sdb-purple',
    text: '⭐ Clássico',
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
                {/* Badge no canto */}
                <span
                  className={`absolute top-3 left-3 z-10 rounded-full px-3 py-1 text-xs font-bold uppercase shadow-md ${badge.classes}`}
                >
                  {badge.text}
                </span>

                {/* Foto */}
                <img
                  src={item.foto}
                  alt={item.titulo}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition group-hover:scale-110 [filter:sepia(0.08)_saturate(1.2)_contrast(1.05)_brightness(1.05)]"
                />

                {/* Texto */}
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
      </div>
    </section>
  )
}
