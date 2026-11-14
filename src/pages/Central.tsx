import { useEffect, useState } from 'react'

// Página da Tardezinha — desenho aprovado pela Maninha em 13/11/2026
// (00-CEREBRO/tardezinha/PAGINA-TARDEZINHA-DESENHO-2026-11-13.md, pasta JACK SHOW DE BOLA).
//
//   /central              → só os links públicos (inscrição, site...)
//   /central?k=CHAVE      → EQUIPE DO DIA (Leti, recepção, cozinha, monitores): Recepção/Bar e Cozinha.
//                           "O que é de edições anteriores, números e afins NÃO aparece pra quem está
//                           só trabalhando no evento" (Maninha, 13/11).
//   /central?key=CHAVE    → ADM (Ana e Maninha): tudo — inscritos, relatório final, turmas, nova edição.
//
// As chaves NÃO ficam no código: vêm no link. Quem decide o que cada chave enxerga é o BANCO
// (tz_nivel) — aqui é só montar os cartões; cada tela confere a chave de novo.
// Compatível com o link antigo /central?k=X&a=Y (a = chave do admin).

const BASE = 'https://tardezinha.showdebolars.com.br'

interface Cartao {
  nome: string
  desc: string
  ico: string
  url: string
  grad: string
  emBreve?: boolean
}

const G = {
  verde: 'linear-gradient(150deg,#12b57e,#0a7d58)',
  marrom: 'linear-gradient(150deg,#b5642c,#7d3f17)',
  roxo: 'linear-gradient(150deg,#6d5bd0,#43349b)',
  verdeEsc: 'linear-gradient(150deg,#2e7d32,#1b5e20)',
  lilas: 'linear-gradient(150deg,#9b4dca,#6a1b9a)',
  laranja: 'linear-gradient(150deg,#f5763f,#d64a20)',
  azul: 'linear-gradient(150deg,#3b7bf0,#2350c4)',
  cinza: 'linear-gradient(150deg,#8a8f99,#5d626b)',
  amarelo: 'linear-gradient(150deg,#F6B71E,#D98A00)',
  rosa: 'linear-gradient(150deg,#ec5ba6,#c62f80)',
}

function publicos(): Cartao[] {
  return [
    { nome: 'Inscrição', desc: 'Pra mandar pra família: ela se inscreve e paga.', ico: '🎟️', url: `${BASE}/reservar`, grad: G.amarelo },
    { nome: 'Grupos', desc: 'Grupo de 6+ crianças, turma, aniversário.', ico: '👨‍👩‍👧‍👦', url: `${BASE}/grupo`, grad: G.lilas },
    { nome: 'Álbum de Figurinhas', desc: 'O álbum da criança — a fidelização.', ico: '🏅', url: `${BASE}/passaporte`, grad: G.rosa },
    { nome: 'Site', desc: 'A página pública do evento.', ico: '🏖️', url: `${BASE}/`, grad: G.laranja },
  ]
}

function doDia(param: string, chave: string): Cartao[] {
  return [
    { nome: 'Recepção / Bar', desc: 'Chegou, saiu, quem pode retirar, lanches e "recebi em…".', ico: '🛎️', url: `/painel?${param}=${chave}`, grad: G.verde },
    { nome: 'Cozinha', desc: 'O que preparar. Põe num tablet ou TV.', ico: '🍳', url: `/cozinha?${param}=${chave}`, grad: G.marrom },
  ]
}

function daAdm(a: string): Cartao[] {
  return [
    { nome: 'Inscritos', desc: 'Quantos, crianças, pagantes, a receber, por turno — escolhe a edição.', ico: '🧾', url: `/inscritos?key=${a}`, grad: G.roxo },
    { nome: 'Relatório final', desc: 'Quanto entrou, quanto gastou (Instagram e do dia) e quanto ganhamos.', ico: '📊', url: `/fechamento?key=${a}`, grad: G.verdeEsc },
    { nome: 'Turmas e links', desc: 'Criar turma "a mãe paga todos" ou "cada família paga" e pegar o link.', ico: '🎂', url: `/turmas?key=${a}`, grad: G.lilas },
    { nome: 'Nova edição', desc: 'Informa o dia → fica aguardando a Maninha aprovar → abre ao público.', ico: '🗓️', url: `/nova-edicao?key=${a}`, grad: G.azul },
    { nome: 'Convidar famílias', desc: 'Chamar quem já veio. Só sai com o OK da Maninha.', ico: '💌', url: `/convidar?key=${a}`, grad: G.cinza, emBreve: true },
    { nome: 'Ficha completa', desc: 'Alergia, autorização de imagem, canal, planilha.', ico: '🗂️', url: `/admin/tardezinha-stats?key=${a}`, grad: G.azul },
  ]
}

export function Central() {
  const params = new URLSearchParams(window.location.search)
  const adm = params.get('key') || params.get('a') || ''
  const k = params.get('k') ?? ''
  const nivel: 'publico' | 'equipe' | 'adm' = adm ? 'adm' : k ? 'equipe' : 'publico'
  useEffect(() => {
    document.title = nivel === 'publico' ? 'Links — Tardezinha' : 'Página da Tardezinha'
  }, [nivel])
  const [copiado, setCopiado] = useState<string | null>(null)

  async function copiar(url: string, nome: string) {
    try { await navigator.clipboard.writeText(url) } catch { /* segue */ }
    setCopiado(nome)
    setTimeout(() => setCopiado(null), 1600)
  }

  const secoes: { titulo: string; sub?: string; cartoes: Cartao[]; equipe?: boolean }[] = []
  if (nivel === 'adm') {
    secoes.push({ titulo: '🎈 No dia do evento', sub: 'O que a equipe usa na tarde.', cartoes: doDia('key', adm), equipe: true })
    secoes.push({ titulo: '🔐 Administração', sub: 'Só Ana e Maninha. Números, edições anteriores e relatório.', cartoes: daAdm(adm), equipe: true })
    secoes.push({ titulo: '📣 Pra mandar pra cliente', cartoes: publicos() })
  } else if (nivel === 'equipe') {
    secoes.push({ titulo: '🎈 Hoje', sub: 'Só a Tardezinha do dia.', cartoes: doDia('k', k), equipe: true })
    secoes.push({ titulo: '📣 Pra mandar pra cliente', cartoes: publicos().filter(c => c.nome !== 'Grupos') })
  } else {
    secoes.push({ titulo: 'Links', cartoes: publicos() })
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Show de Bola · {nivel === 'adm' ? 'administração' : nivel === 'equipe' ? 'equipe do dia' : 'Tardezinha'}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold text-gray-800 sm:text-4xl">🎈 Tardezinha</h1>
          <p className="mt-2 text-gray-500 text-sm sm:text-base">
            Toca no cartão pra <strong>abrir</strong>{nivel !== 'publico' ? '. Os 🔒 são só da equipe — não manda pra cliente.' : ', ou em copiar pra mandar o link.'}
          </p>
        </header>

        {secoes.map(sec => (
          <section key={sec.titulo} className="mb-8">
            <h2 className="text-lg font-extrabold text-gray-700">{sec.titulo}</h2>
            {sec.sub && <p className="text-xs text-gray-400">{sec.sub}</p>}
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {sec.cartoes.map(c => (
                <div key={c.nome} className={`relative rounded-2xl p-5 text-white shadow-lg overflow-hidden flex flex-col min-h-[140px] ${c.emBreve ? 'opacity-80' : ''}`} style={{ background: c.grad }}>
                  {sec.equipe && (
                    <span className="absolute right-3 top-3 rounded-full bg-black/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                      {c.emBreve ? '⏳ em breve' : '🔒 equipe'}
                    </span>
                  )}
                  <span className="text-3xl drop-shadow">{c.ico}</span>
                  <a href={c.url} target={sec.equipe ? undefined : '_blank'} rel="noopener noreferrer" className="mt-auto block">
                    <span className="block text-xl font-extrabold leading-tight underline-offset-2 hover:underline">{c.nome}</span>
                    <span className="mt-1 block text-sm text-white/90">{c.desc}</span>
                  </a>
                  {!sec.equipe && (
                    <button
                      onClick={() => copiar(c.url, c.nome)}
                      className="mt-3 self-start rounded-lg bg-black/25 px-3 py-1.5 text-xs font-bold hover:bg-black/35 active:scale-95"
                    >
                      {copiado === c.nome ? 'Copiado! ✓' : 'Copiar link ⧉'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        {nivel === 'publico' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            🔒 As telas da equipe só aparecem abrindo pelo link com a chave (Central de Links do CRM).
          </div>
        )}

        <footer className="mt-10 text-center text-xs text-gray-400">
          Tardezinha Show de Bola · Casa de Festas · Atlântida · Xangri-Lá
        </footer>
      </div>
    </div>
  )
}
