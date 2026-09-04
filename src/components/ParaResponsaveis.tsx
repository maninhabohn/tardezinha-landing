type Opcao = {
  emoji: string
  titulo: string
  descricao: string
}

const opcoes: Opcao[] = [
  {
    emoji: '🍻',
    titulo: 'Happy Hour',
    descricao: 'Começa cedo, termina no horário',
  },
  {
    emoji: '☕',
    titulo: 'Café da Tarde',
    descricao: 'Quentinho, sentado, sem pressa',
  },
  {
    emoji: '😴',
    titulo: 'Cochilo da Tarde',
    descricao: 'O luxo de dormir de tarde',
  },
  {
    emoji: '👯',
    titulo: 'Rolê dos Amigos',
    descricao: 'Tipo gente, sem interrupção',
  },
]

export function ParaResponsaveis() {
  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="mb-3 inline-block rounded-full bg-sdb-orange px-4 py-1 text-sm font-bold text-white uppercase tracking-wider">
            E pra ti, mãe e pai
          </p>
          <h2 className="font-display text-5xl text-sdb-purple sm:text-6xl">
            A TARDE
            <br />
            <span className="text-sdb-pink">É TUA</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-sdb-text sm:text-xl">
            Deixa a criançada com a gente.{' '}
            <strong className="text-sdb-purple">Vai viver tua tarde.</strong>
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-base text-sdb-text/80">
            São <strong>4 horas</strong> com a criançada brincando à vontade — mais de 20 brinquedos liberados, equipe de monitoria de olho, pipoca e água cortesia. Tu? Tu vai pra onde quiser.
          </p>
        </div>

        {/* 4 cards de opções */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {opcoes.map((opcao) => (
            <div
              key={opcao.titulo}
              className="group relative overflow-hidden rounded-2xl border-2 border-sdb-purple/15 bg-sdb-yellow-soft p-6 text-center shadow-md transition hover:scale-105 hover:border-sdb-purple/40 hover:shadow-xl"
            >
              <div className="text-5xl">{opcao.emoji}</div>
              <h3 className="mt-4 font-display text-2xl text-sdb-purple">
                {opcao.titulo}
              </h3>
              <p className="mt-2 text-sm text-sdb-text/70">{opcao.descricao}</p>
            </div>
          ))}
        </div>

        {/* Promessa final */}
        <div className="mx-auto mt-12 max-w-3xl rounded-3xl bg-sdb-purple p-8 text-center text-white shadow-2xl">
          <p className="font-display text-2xl sm:text-3xl">
            Tu busca no final do turno e pega um filho
            <br />
            <strong className="text-sdb-yellow">cansado, alimentado e feliz</strong>.
          </p>
          <p className="mt-4 text-lg italic text-white/85">
            A família agradece.
          </p>
        </div>
      </div>
    </section>
  )
}
