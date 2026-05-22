type Beneficio = {
  foto: string
  emoji: string
  titulo: string
  descricao: string
}

// Foto propria do happy hour (em public/fotos/happy-hour.jpg)
const HAPPY_HOUR_FOTO = '/fotos/happy-hour.jpg'

const beneficios: Beneficio[] = [
  {
    foto: '/fotos/mesas.jpg',
    emoji: '🪑',
    titulo: 'Mesas pra família',
    descricao: 'Espaço confortável pra ficar curtindo junto com a galera',
  },
  {
    foto: '/fotos/bar.jpg',
    emoji: '🍻',
    titulo: 'Bar disponível',
    descricao: 'Bebidas e petiscos durante toda a tardezinha',
  },
  {
    foto: HAPPY_HOUR_FOTO,
    emoji: '🍷',
    titulo: 'Folga merecida',
    descricao:
      'Ou aproveita pra sair com amigos. A gente devolve seu filho cansado e dormindo cedo.',
  },
]

export function ParaResponsaveis() {
  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="mb-3 inline-block rounded-full bg-sdb-orange px-4 py-1 text-sm font-bold text-white uppercase tracking-wider">
            E pra você que vai junto
          </p>
          <h2 className="font-display text-5xl text-sdb-purple sm:text-6xl">
            Fica ou aproveita:
            <br />
            <span className="text-sdb-pink">você escolhe</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-sdb-text sm:text-xl">
            <strong className="text-sdb-purple">18h às 22h30</strong> — horário
            perfeito pra ficar curtindo aqui com a família, ou sair pra aquele{' '}
            <strong className="text-sdb-purple">happy hour</strong> enquanto a
            gente cuida dos pequenos.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {beneficios.map((b) => (
            <div
              key={b.titulo}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl shadow-xl transition hover:scale-105"
            >
              <img
                src={b.foto}
                alt={b.titulo}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover [filter:sepia(0.08)_saturate(1.2)_contrast(1.05)_brightness(1.05)] transition group-hover:scale-110"
              />

              {/* Overlay escuro pra legibilidade do texto */}
              <div className="absolute inset-0 bg-gradient-to-t from-sdb-purple-dark via-sdb-purple-dark/50 to-transparent" />

              <div className="absolute right-0 bottom-0 left-0 p-6 text-white">
                <div className="text-5xl">{b.emoji}</div>
                <h3 className="mt-3 font-display text-3xl">{b.titulo}</h3>
                <p className="mt-2 text-base text-white">{b.descricao}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
