import { useState, useEffect, type FormEvent } from 'react'
import { Logo } from '../components/Logo'
import { DateBanner } from '../components/DateBanner'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { whatsappLink, EVENTS } from '../lib/contact'
import { getUtmParams } from '../lib/utm'
import { fetchPrefill, fetchCardapio, formatBRL, type CardapioItem } from '../lib/tzApi'

interface CriancaForm {
  nome: string
  dataNascimento: string
  temAlergia: boolean
  alergiaDetalhes: string
  temNecessidade: boolean
  necessidadeDetalhes: string
  desejo: string
  autorizouImagem: boolean
  autorizouAudio: boolean
  ativo: boolean   // confirmação: criança vai nesta edição?
  nova: boolean    // adicionada agora (vs vinda do histórico)
}

interface Autorizado { nome: string; cpf: string }

const criancaVazia = (nova = true): CriancaForm => ({
  nome: '', dataNascimento: '', temAlergia: false, alergiaDetalhes: '',
  temNecessidade: false, necessidadeDetalhes: '', desejo: '',
  autorizouImagem: true, autorizouAudio: true, ativo: true, nova,
})

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
function maskCpf(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}
function maskDate(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}
function parseDateBR(v: string): string | null {
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  const [, dd, mm, yyyy] = m
  const d = new Date(`${yyyy}-${mm}-${dd}`)
  if (isNaN(d.getTime())) return null
  return `${yyyy}-${mm}-${dd}`
}
function calcAge(isoDate: string): number {
  const birth = new Date(isoDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const SESSION_OPTIONS = EVENTS.flatMap(ev =>
  ev.sessions.map(s => ({
    value: `${ev.id}|${s.label}`,
    label: `${ev.date} (${ev.dayOfWeek.slice(0, 4)}) — ${s.label}`,
    eventDate: ev.date,
    sessionLabel: s.label,
    soldOut: !!s.soldOut,
  }))
)
const ALGUM_ESGOTADO = SESSION_OPTIONS.some(o => o.soldOut)

const CANAIS = [
  { value: 'instagram', label: 'Instagram (@casashowdebolaoficial)' },
  { value: 'panfleto', label: 'Panfleto' },
  { value: 'anuncio_meta', label: 'Anúncio no Facebook/Instagram' },
  { value: 'indicacao_amigo', label: 'Indicação de alguém' },
  { value: 'ja_cliente_showdebola', label: 'Já sou cliente Show de Bola' },
  { value: 'outro', label: 'Outro' },
]

const TERMO_TEXTO = `DECLARO QUE:
• Sou responsável legal pela(s) criança(s) inscrita(s)
• Estou ciente que a participação ocorre por minha conta e risco
• A Casa de Festas Show de Bola mantém monitoria, brinquedos vistoriados, kit de primeiros socorros e estrutura segura
• Não responsabilizo a Show de Bola por acidentes resultantes do uso incorreto dos brinquedos pela criança ou imprudência`

type Modo = 'escolha' | 'confirmar_cpf' | 'form'

export function Reservar() {
  useEffect(() => { document.title = 'Inscrição — Tardezinha de Férias' }, [])

  const tokenUrl = new URLSearchParams(window.location.search).get('c') ?? ''

  const [modo, setModo] = useState<Modo>(tokenUrl ? 'confirmar_cpf' : 'escolha')
  const [retornante, setRetornante] = useState(false)
  const [step, setStep] = useState<'form' | 'enviando' | 'confirmacao'>('form')

  // desbloqueio por CPF
  const [cpfUnlock, setCpfUnlock] = useState('')
  const [unlockErro, setUnlockErro] = useState('')
  const [unlockLoading, setUnlockLoading] = useState(false)
  const [nomeSaudacao, setNomeSaudacao] = useState('')

  // form
  const [sessaoEscolhida, setSessaoEscolhida] = useState('')
  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [cpf, setCpf] = useState('')
  const [email, setEmail] = useState('')
  const [cidade, setCidade] = useState('')
  const [qtdCriancas, setQtdCriancas] = useState(1)
  const [qtdAdultos, setQtdAdultos] = useState(0)
  const [criancas, setCriancas] = useState<CriancaForm[]>([criancaVazia()])
  const [autorizados, setAutorizados] = useState<Autorizado[]>([{ nome: '', cpf: '' }])
  const [comoConheceu, setComoConheceu] = useState('')
  const [outroOrigem, setOutroOrigem] = useState('')
  const [jaVeio, setJaVeio] = useState<boolean | null>(null)
  const [aceitouTermo, setAceitouTermo] = useState(false)
  const [mostraTermo, setMostraTermo] = useState(false)
  const [erro, setErro] = useState('')
  const [whatsappUrl, setWhatsappUrl] = useState('')

  // cardápio (lanche)
  const [cardapio, setCardapio] = useState<CardapioItem[]>([])
  const [lanche, setLanche] = useState<Record<string, number>>({})

  const selectedOption = SESSION_OPTIONS.find(o => o.value === sessaoEscolhida)

  // Carrega cardápio uma vez
  useEffect(() => { fetchCardapio().then(setCardapio) }, [])

  // Se veio com token no link, tenta abrir direto (sem CPF p/ quem não tem CPF)
  useEffect(() => {
    if (!tokenUrl) return
    let cancelado = false
    ;(async () => {
      const res = await fetchPrefill(tokenUrl)
      if (cancelado) return
      if (res.encontrado) {
        aplicarPrefill(res)
      } else if (res.motivo === 'cpf') {
        setModo('confirmar_cpf') // precisa do CPF
      } else {
        setUnlockErro('Esse link não é válido. Faz tua inscrição como primeira vez ou fala com a gente.')
        setModo('escolha')
      }
    })()
    return () => { cancelado = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenUrl])

  function aplicarPrefill(res: Awaited<ReturnType<typeof fetchPrefill>>) {
    const r = res.responsavel
    if (r) {
      setNome(r.nome ?? '')
      setWhatsapp(maskPhone(r.whatsapp ?? ''))
      setCpf(r.cpf ? maskCpf(r.cpf) : '')
      setEmail(r.email ?? '')
      setCidade(r.cidade ?? '')
      setNomeSaudacao((r.nome ?? '').split(' ')[0])
    }
    const kids = (res.criancas ?? []).map<CriancaForm>(c => ({
      nome: c.nome_completo ?? '',
      dataNascimento: c.data_nascimento ?? '',
      temAlergia: !!c.tem_alergia,
      alergiaDetalhes: c.alergia_detalhes ?? '',
      temNecessidade: !!c.tem_necessidade,
      necessidadeDetalhes: c.necessidade_detalhes ?? '',
      desejo: c.desejo ?? '',
      autorizouImagem: c.autorizou_imagem ?? true,
      autorizouAudio: c.autorizou_audio ?? true,
      ativo: true,
      nova: false,
    }))
    setCriancas(kids.length ? kids : [criancaVazia()])
    setJaVeio(true)
    setComoConheceu('ja_cliente_showdebola')
    setRetornante(true)
    setModo('form')
    setStep('form')
  }

  async function handleUnlock(e: FormEvent) {
    e.preventDefault()
    setUnlockErro('')
    if (cpfUnlock.replace(/\D/g, '').length < 11) { setUnlockErro('Digita o CPF completo.'); return }
    setUnlockLoading(true)
    const res = await fetchPrefill(tokenUrl, cpfUnlock)
    setUnlockLoading(false)
    if (res.encontrado) {
      aplicarPrefill(res)
    } else {
      setUnlockErro('CPF não confere com esse cadastro. Confere o número ou fala com a gente.')
    }
  }

  // ---- crianças ----
  function handleQtdChange(n: number) {
    setQtdCriancas(n)
    setCriancas(prev => {
      if (n > prev.length) return [...prev, ...Array.from({ length: n - prev.length }, () => criancaVazia())]
      return prev.slice(0, n)
    })
  }
  function updateCrianca(i: number, field: keyof CriancaForm, value: string | boolean) {
    setCriancas(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }
  function addCrianca() {
    setCriancas(prev => [...prev, criancaVazia()])
  }
  function removeCrianca(i: number) {
    setCriancas(prev => prev.filter((_, idx) => idx !== i))
  }

  // ---- autorizados ----
  function updateAutorizado(i: number, field: keyof Autorizado, value: string) {
    setAutorizados(prev => prev.map((a, idx) => idx === i
      ? { ...a, [field]: field === 'cpf' ? maskCpf(value) : value } : a))
  }
  function addAutorizado() { setAutorizados(prev => [...prev, { nome: '', cpf: '' }]) }
  function removeAutorizado(i: number) { setAutorizados(prev => prev.filter((_, idx) => idx !== i)) }

  // ---- lanche ----
  function setLancheQtd(id: string, qtd: number) {
    setLanche(prev => ({ ...prev, [id]: Math.max(0, qtd) }))
  }
  const lancheTotal = cardapio.reduce((s, it) => s + (lanche[it.id] ?? 0) * (it.preco_centavos ?? 0), 0)

  function ativas() { return criancas.filter(c => c.ativo) }

  function validate(): string | null {
    if (!sessaoEscolhida) return 'Escolhe a data e o turno que tu quer ir'
    if (!nome.trim()) return 'Preenche teu nome'
    if (whatsapp.replace(/\D/g, '').length < 10) return 'WhatsApp precisa ter DDD + número'
    if (!cidade.trim()) return 'Preenche tua cidade'

    const ativasList = ativas()
    if (ativasList.length === 0) return 'Marca pelo menos uma criança pra esta edição'
    for (let i = 0; i < criancas.length; i++) {
      const c = criancas[i]
      if (!c.ativo) continue
      if (!c.nome.trim()) return `Preenche o nome da criança ${i + 1}`
      if (!parseDateBR(c.dataNascimento)) return `Data de nascimento da criança ${i + 1} tá inválida (DD/MM/AAAA)`
      if (c.temAlergia && !c.alergiaDetalhes.trim()) return `Descreve a alergia da criança ${i + 1}`
      if (c.temNecessidade && !c.necessidadeDetalhes.trim()) return `Descreve a necessidade especial da criança ${i + 1}`
    }
    if (!comoConheceu) return 'Conta pra gente como conheceu a Tardezinha'
    if (comoConheceu === 'outro' && !outroOrigem.trim()) return 'Diz pra gente como conheceu'
    if (jaVeio === null) return 'Diz se já veio em alguma Tardezinha antes'
    if (!aceitouTermo) return 'Tu precisa aceitar o termo de responsabilidade'
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setErro(err); return }
    setErro('')
    setStep('enviando')

    if (!isSupabaseConfigured()) {
      setErro('Sistema temporariamente indisponível. Chama no WhatsApp!')
      setStep('form')
      return
    }

    const ativasList = ativas()
    const whatsappNorm = '55' + whatsapp.replace(/\D/g, '')
    const utm = getUtmParams()
    const reservaId = crypto.randomUUID()

    // texto do "quem busca" a partir dos autorizados preenchidos
    const autorizadosValidos = autorizados.filter(a => a.nome.trim())
    const quemBuscaTxt = autorizadosValidos
      .map(a => a.cpf.trim() ? `${a.nome.trim()} — CPF ${a.cpf.trim()}` : a.nome.trim())
      .join('; ')

    const { error: errReserva } = await supabase
      .from('tardezinha_reservas')
      .insert({
        id: reservaId,
        nome_responsavel: nome.trim(),
        whatsapp_normalizado: whatsappNorm,
        whatsapp_raw: whatsapp,
        cpf_responsavel: cpf.replace(/\D/g, '') || null,
        email: email.trim() || null,
        cidade: cidade.trim(),
        quem_busca_criancas: quemBuscaTxt || null,
        como_conheceu: comoConheceu,
        como_conheceu_outro: comoConheceu === 'outro' ? outroOrigem.trim() : null,
        ja_veio_tardezinha: jaVeio,
        qtd_criancas: ativasList.length,
        qtd_adultos_extra: qtdAdultos,
        aceitou_termo_responsabilidade: aceitouTermo,
        edicao: sessaoEscolhida,
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        user_agent: navigator.userAgent,
      })

    if (errReserva) {
      console.error(errReserva)
      setErro('Deu ruim salvando. Tenta de novo ou chama no WhatsApp.')
      setStep('form')
      return
    }

    // crianças ativas
    const criancasPayload = ativasList.map(c => ({
      reserva_id: reservaId,
      nome_completo: c.nome.trim(),
      data_nascimento: parseDateBR(c.dataNascimento)!,
      tem_alergia_restricao: c.temAlergia,
      alergia_restricao_detalhes: c.temAlergia ? c.alergiaDetalhes.trim() : null,
      tem_necessidade_especial: c.temNecessidade,
      necessidade_especial_detalhes: c.temNecessidade ? c.necessidadeDetalhes.trim() : null,
      desejo_favorito: c.desejo.trim() || null,
      autorizou_imagem: c.autorizouImagem,
      autorizou_audio: c.autorizouAudio,
    }))
    const { error: errCriancas } = await supabase
      .from('tardezinha_reserva_criancas').insert(criancasPayload)
    if (errCriancas) console.error('Erro ao salvar crianças:', errCriancas)

    // autorizados a retirar (controle de porta)
    if (autorizadosValidos.length) {
      const { error: errAut } = await supabase
        .from('tardezinha_autorizados')
        .insert(autorizadosValidos.map(a => ({
          reserva_id: reservaId,
          nome: a.nome.trim(),
          cpf: a.cpf.replace(/\D/g, '') || null,
        })))
      if (errAut) console.error('Erro ao salvar autorizados:', errAut)
    }

    // lanche reservado (só reserva — paga na saída)
    const pedidos = cardapio
      .filter(it => (lanche[it.id] ?? 0) > 0)
      .map(it => ({
        reserva_id: reservaId,
        cardapio_id: it.id,
        item_nome: it.nome,
        preco_unit_centavos: it.preco_centavos ?? 0,
        qtd: lanche[it.id],
        origem: 'reserva',
        status: 'recebido',
        turno: sessaoEscolhida,
      }))
    if (pedidos.length) {
      const { error: errPed } = await supabase.from('tardezinha_pedidos').insert(pedidos)
      if (errPed) console.error('Erro ao salvar lanche:', errPed)
    }

    // mensagem WhatsApp
    const ehGrupo = ativasList.length >= 6
    const valorPorCrianca = ehGrupo ? 38 : 45
    const totalEstimado = ativasList.length * valorPorCrianca
    const idadesStr = ativasList.map(c => {
      const dt = parseDateBR(c.dataNascimento)!
      return `${c.nome.split(' ')[0]} (${calcAge(dt)} anos)`
    }).join(', ')
    const linhaValorGrupo = ehGrupo ? `\n👥 *Valor grupo (6+): R$ ${valorPorCrianca},00 por criança*` : ''
    const linhaLanche = pedidos.length
      ? `\n🍽️ Lanche reservado (paga na saída): ${pedidos.map(p => `${p.qtd}× ${p.item_nome}`).join(', ')}`
      : ''
    const saudacao = retornante ? 'Oi! Quero confirmar minha presença' : 'Oi! Acabei de garantir minha vaga'
    const msg = `${saudacao} na Tardezinha de Férias ${selectedOption?.eventDate} (${selectedOption?.sessionLabel}).\n\n📝 Nome: ${nome.trim()}\n👧 Crianças: ${idadesStr}${linhaValorGrupo}\n💰 Estimativa ingresso: R$ ${totalEstimado.toFixed(2).replace('.', ',')}${linhaLanche}\n\nTô pronta pra fechar o Pix!`
    setWhatsappUrl(whatsappLink(msg))

    if (typeof window.fbq === 'function') window.fbq('track', 'Lead')
    setStep('confirmacao')
  }

  // ====================== TELAS ======================

  // Enviando
  if (step === 'enviando') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-12 h-12 border-4 border-sdb-purple border-t-transparent rounded-full" />
          <p className="mt-4 text-xl font-semibold text-gray-700">Salvando tua reserva...</p>
        </div>
      </div>
    )
  }

  // Confirmação final
  if (step === 'confirmacao') {
    return (
      <div className="min-h-screen bg-gray-50">
        <DateBanner />
        <div className="mx-auto max-w-lg px-4 py-12 text-center">
          <p className="text-6xl mb-4">✨</p>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {retornante ? 'Presença confirmada!' : 'Tu tá na lista da Tardezinha!'}
          </h1>
          <p className="text-lg text-gray-600 mb-8">A equipe vai te chamar no WhatsApp pra fechar o Pix.</p>
          <a
            href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-2xl bg-emerald-500 px-8 py-5 text-xl font-bold text-white shadow-xl transition hover:scale-105 hover:bg-emerald-600"
          >
            💬 Falar com a Show de Bola
          </a>
          <div className="mt-10 rounded-2xl bg-white p-6 text-left shadow-md border border-gray-200">
            <p className="text-lg font-bold text-gray-800 mb-3">Enquanto isso, anota:</p>
            <p className="mb-1 text-gray-700">🏖️ <strong>{selectedOption?.label}</strong> · Edição de Férias</p>
            <p className="mb-1 text-gray-700">📍 Av. G, 101 — Atlântida, Xangri-Lá — RS</p>
            <p className="mt-4 text-sm text-gray-500 font-semibold">Pix em até 24h pra garantir a vaga.</p>
          </div>
          <a href="/" className="mt-8 inline-block text-sm text-sdb-purple underline">← Voltar pro site</a>
        </div>
      </div>
    )
  }

  // Tela de escolha (sem link / sem token)
  if (modo === 'escolha') {
    return (
      <div className="min-h-screen bg-gray-50">
        <DateBanner />
        <div className="bg-amber-50 border-b border-amber-200 px-4 pt-6 pb-6 text-center">
          <Logo size={100} className="mb-3" />
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">Tardezinha de Férias 🏖️</h1>
          <p className="mt-2 text-base text-gray-600">É tua primeira vez ou tu já é da casa?</p>
        </div>
        <div className="mx-auto max-w-lg px-4 py-8 space-y-5">

          {/* 1ª VEZ — bem nítido */}
          <button
            onClick={() => { setRetornante(false); setModo('form'); setCriancas([criancaVazia()]) }}
            className="block w-full rounded-2xl bg-sdb-purple p-7 text-center text-white shadow-lg transition hover:bg-sdb-purple-dark active:scale-[0.99]"
          >
            <p className="text-2xl font-extrabold tracking-wide">🎈 É MINHA 1ª VEZ</p>
            <p className="text-sm text-white/90 mt-1.5">Faz tua inscrição completa — leva uns minutinhos.</p>
          </button>

          <div className="flex items-center gap-3 text-xs font-semibold text-gray-400">
            <span className="h-px flex-1 bg-gray-200" /> OU <span className="h-px flex-1 bg-gray-200" />
          </div>

          {/* JÁ É DA CASA — cara de privilégio */}
          <div className="rounded-2xl border-2 border-sdb-purple bg-gradient-to-br from-sdb-purple/10 to-emerald-50 p-6 text-center">
            <span className="inline-block rounded-full bg-sdb-purple px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">Cliente Tardezinha 💚</span>
            <p className="mt-3 text-xl font-extrabold text-gray-800">Já sou da casa</p>
            <p className="text-sm text-gray-600 mt-1">
              Tu tem <strong>acesso rápido</strong>: pelo teu link o cadastro já abre pronto —
              é só conferir e confirmar. A gente te manda no WhatsApp 💚
            </p>
            <a
              href={whatsappLink('Oi! Já sou cliente e quero confirmar minha presença na Tardezinha de quinta. Pode me mandar o link?')}
              target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-block rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow"
            >Quero meu link de acesso rápido →</a>
          </div>
        </div>
      </div>
    )
  }

  // Tela de desbloqueio por CPF (veio com token, precisa confirmar CPF)
  if (modo === 'confirmar_cpf') {
    return (
      <div className="min-h-screen bg-gray-50">
        <DateBanner />
        <div className="mx-auto max-w-md px-4 py-10">
          <div className="text-center mb-6">
            <Logo size={90} className="mb-3" />
            <h1 className="text-2xl font-bold text-gray-800">Que bom te ver de novo! 💚</h1>
            <p className="mt-2 text-gray-600">
              Confirma teu <strong>CPF</strong> pra abrir teu cadastro e garantir a vaga de quinta.
            </p>
          </div>
          <form onSubmit={handleUnlock} className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
            {unlockErro && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-300 p-3 text-red-700 text-sm font-semibold">
                ⚠️ {unlockErro}
              </div>
            )}
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">CPF do responsável</span>
              <input
                type="text" inputMode="numeric" autoFocus
                value={cpfUnlock}
                onChange={e => setCpfUnlock(maskCpf(e.target.value))}
                placeholder="000.000.000-00"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none"
              />
            </label>
            <button
              type="submit" disabled={unlockLoading}
              className="mt-4 w-full rounded-xl bg-sdb-purple py-4 text-lg font-bold text-white shadow-lg transition hover:bg-sdb-purple-dark disabled:opacity-50"
            >{unlockLoading ? 'Abrindo...' : 'Abrir meu cadastro →'}</button>
          </form>
          <button
            onClick={() => { setRetornante(false); setModo('form'); setCriancas([criancaVazia()]) }}
            className="mt-4 w-full text-center text-sm text-sdb-purple underline"
          >Prefiro preencher do zero</button>
        </div>
      </div>
    )
  }

  // ====================== FORM ======================
  return (
    <div className="min-h-screen bg-gray-50">
      <DateBanner />

      <div className="bg-amber-50 border-b border-amber-200 px-4 pt-6 pb-6 text-center">
        <Logo size={100} className="mb-3" />
        <h1 className="text-2xl font-bold text-gray-800 leading-tight sm:text-3xl">
          {retornante
            ? <>Confirma tua vaga,<br />{nomeSaudacao || 'de novo'} 💚</>
            : <>Garante tua vaga na<br />Tardezinha de Férias 🏖️</>}
        </h1>
        <p className="mt-2 text-base text-gray-600">
          {retornante
            ? 'Teu cadastro já tá aqui — é só conferir, marcar quem vai e confirmar.'
            : 'Férias escolares + 4 horas de diversão. Tu descansa, a criançada brinca.'}
        </p>
        <div className="mt-3 inline-block rounded-lg bg-sdb-purple/10 px-5 py-2">
          <p className="text-lg text-sdb-purple-dark font-bold">R$45 antecipado · R$50 na hora · Adulto não paga</p>
          <p className="mt-1 text-sm text-sdb-purple-dark/80">👥 Grupo com 6+ crianças: R$38 antecipado</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-lg px-4 py-8">
        {erro && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-300 p-4 text-red-700 font-semibold text-sm">⚠️ {erro}</div>
        )}

        {/* Data e turno */}
        <fieldset className="mb-6 rounded-xl bg-white border-2 border-sdb-purple/30 p-5 shadow-sm">
          <legend className="text-base font-bold text-sdb-purple px-2">📅 Qual data e turno?</legend>
          {ALGUM_ESGOTADO && (
            <div className="mt-2 rounded-lg bg-amber-50 border border-amber-300 p-3 text-sm font-semibold text-amber-800">
              ⚠️ O turno da <strong>tarde (14h–18h) esgotou!</strong> Corre que ainda tem vaga no turno da <strong>noite (18h–22h)</strong> 🌙
            </div>
          )}
          <div className="mt-3 space-y-2">
            {SESSION_OPTIONS.map(opt => (
              <label key={opt.value}
                className={`flex items-center gap-3 rounded-lg border-2 p-4 transition ${opt.soldOut ? 'cursor-not-allowed border-gray-200 bg-gray-100 opacity-70' : sessaoEscolhida === opt.value ? 'cursor-pointer border-sdb-purple bg-sdb-purple/5' : 'cursor-pointer border-gray-200 hover:border-sdb-purple/30'}`}>
                <input type="radio" name="sessao" value={opt.value}
                  disabled={opt.soldOut}
                  checked={sessaoEscolhida === opt.value}
                  onChange={() => setSessaoEscolhida(opt.value)}
                  className="accent-sdb-purple w-5 h-5" />
                <span className={`text-base font-semibold ${opt.soldOut ? 'text-gray-400' : 'text-gray-800'}`}>
                  {opt.label}
                  {opt.soldOut && <span className="ml-2 align-middle rounded-full bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5">ESGOTADO</span>}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Responsável */}
        <fieldset className="mb-6 rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
          <legend className="text-base font-bold text-gray-700 px-2">👤 Responsável</legend>
          <label className="block mt-3">
            <span className="text-sm font-semibold text-gray-700">Teu nome completo *</span>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Como tu te chama?"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none" />
          </label>
          <label className="block mt-3">
            <span className="text-sm font-semibold text-gray-700">WhatsApp com DDD *</span>
            <input type="tel" value={whatsapp} onChange={e => setWhatsapp(maskPhone(e.target.value))} placeholder="(51) 99999-9999"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none" />
          </label>
          <label className="block mt-3">
            <span className="text-sm font-semibold text-gray-700">CPF <span className="font-normal text-gray-400">(opcional)</span></span>
            <input type="text" value={cpf} onChange={e => setCpf(maskCpf(e.target.value))} placeholder="000.000.000-00"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none" />
          </label>
          <label className="block mt-3">
            <span className="text-sm font-semibold text-gray-700">Email <span className="font-normal text-gray-400">(opcional)</span></span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="teu@email.com"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none" />
          </label>
          <label className="block mt-3">
            <span className="text-sm font-semibold text-gray-700">Cidade *</span>
            <input type="text" value={cidade} onChange={e => setCidade(e.target.value)} placeholder="De onde tu vem?"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none" />
          </label>
        </fieldset>

        {/* Crianças */}
        <fieldset className="mb-6 rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
          <legend className="text-base font-bold text-gray-700 px-2">👧 Crianças</legend>

          {retornante ? (
            <p className="mt-2 text-sm text-gray-500">Marca quem vai nesta edição. Pode adicionar criança nova também.</p>
          ) : (
            <div className="mt-3 flex gap-4">
              <label className="flex-1">
                <span className="text-sm font-semibold text-gray-700">Quantas crianças vão?</span>
                <select value={qtdCriancas} onChange={e => handleQtdChange(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:outline-none">
                  {Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                </select>
              </label>
              <label className="flex-1">
                <span className="text-sm font-semibold text-gray-700">Adultos extra além de ti?</span>
                <select value={qtdAdultos} onChange={e => setQtdAdultos(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:outline-none">
                  {Array.from({ length: 6 }, (_, i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </label>
            </div>
          )}

          {criancas.map((c, i) => (
            <div key={i} className={`mt-5 rounded-lg border p-4 ${c.ativo ? 'border-gray-200 bg-gray-50' : 'border-gray-200 bg-gray-100 opacity-60'}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-sdb-purple">
                  👧 {c.nome.trim() ? c.nome.trim().split(' ')[0] : `Criança ${i + 1}`}
                  {!c.nova && <span className="ml-2 text-[10px] font-normal text-gray-400">(da última edição)</span>}
                </p>
                {retornante && (
                  <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                    <input type="checkbox" checked={c.ativo} onChange={e => updateCrianca(i, 'ativo', e.target.checked)} className="accent-sdb-purple w-4 h-4" />
                    Vai nesta edição
                  </label>
                )}
              </div>

              {c.ativo && (
                <>
                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700">Nome completo *</span>
                    <input type="text" value={c.nome} onChange={e => updateCrianca(i, 'nome', e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:outline-none bg-white" />
                  </label>
                  <label className="block mt-3">
                    <span className="text-sm font-semibold text-gray-700">Data de nascimento *</span>
                    <input type="text" value={c.dataNascimento} onChange={e => updateCrianca(i, 'dataNascimento', maskDate(e.target.value))} placeholder="DD/MM/AAAA"
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:outline-none bg-white" />
                  </label>

                  <div className="mt-3">
                    <span className="text-sm font-semibold text-gray-700">Tem alergia ou restrição alimentar?</span>
                    <div className="flex gap-4 mt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" checked={c.temAlergia === true} onChange={() => updateCrianca(i, 'temAlergia', true)} className="accent-sdb-purple" /> Sim
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" checked={c.temAlergia === false} onChange={() => updateCrianca(i, 'temAlergia', false)} className="accent-sdb-purple" /> Não
                      </label>
                    </div>
                    {c.temAlergia && (
                      <textarea value={c.alergiaDetalhes} onChange={e => updateCrianca(i, 'alergiaDetalhes', e.target.value)} placeholder="Qual alergia ou restrição?" rows={2}
                        className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-sdb-purple focus:outline-none bg-white" />
                    )}
                  </div>

                  <div className="mt-3">
                    <span className="text-sm font-semibold text-gray-700">Alguma necessidade especial ou orientação importante?</span>
                    <div className="flex gap-4 mt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" checked={c.temNecessidade === true} onChange={() => updateCrianca(i, 'temNecessidade', true)} className="accent-sdb-purple" /> Sim
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" checked={c.temNecessidade === false} onChange={() => updateCrianca(i, 'temNecessidade', false)} className="accent-sdb-purple" /> Não
                      </label>
                    </div>
                    {c.temNecessidade && (
                      <textarea value={c.necessidadeDetalhes} onChange={e => updateCrianca(i, 'necessidadeDetalhes', e.target.value)} placeholder="Conta pra equipe ficar preparada" rows={2}
                        className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-sdb-purple focus:outline-none bg-white" />
                    )}
                  </div>

                  <div className="mt-3 rounded-lg bg-sdb-purple/5 p-3">
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-700">🎯 O que {c.nome.trim() ? c.nome.trim().split(' ')[0] : 'a criança'} mais ama brincar? <span className="font-normal text-gray-400">(opcional)</span></span>
                      <input type="text" value={c.desejo} onChange={e => updateCrianca(i, 'desejo', e.target.value)} placeholder="Nerf, escalada, tobogã..."
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:outline-none bg-white" />
                    </label>
                  </div>

                  <div className="mt-4 rounded-lg bg-gray-100 p-3">
                    <p className="text-xs font-bold text-gray-600 mb-2">⚖️ AUTORIZAÇÕES PRA ESTA CRIANÇA</p>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={c.autorizouImagem} onChange={e => updateCrianca(i, 'autorizouImagem', e.target.checked)} className="mt-0.5 accent-sdb-purple" />
                      <span className="text-sm text-gray-700">Autorizo uso de <strong>imagem</strong></span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer mt-2">
                      <input type="checkbox" checked={c.autorizouAudio} onChange={e => updateCrianca(i, 'autorizouAudio', e.target.checked)} className="mt-0.5 accent-sdb-purple" />
                      <span className="text-sm text-gray-700">Autorizo uso de <strong>áudio</strong></span>
                    </label>
                  </div>
                </>
              )}

              {(retornante || criancas.length > 1) && c.nova && (
                <button type="button" onClick={() => removeCrianca(i)} className="mt-3 text-xs text-red-500 underline">Remover criança</button>
              )}
            </div>
          ))}

          {retornante && (
            <button type="button" onClick={addCrianca} className="mt-4 w-full rounded-lg border-2 border-dashed border-sdb-purple/40 py-3 text-sm font-semibold text-sdb-purple">
              + Adicionar criança
            </button>
          )}
        </fieldset>

        {/* Lanche (data-driven) */}
        {cardapio.length > 0 && (
          <fieldset className="mb-6 rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
            <legend className="text-base font-bold text-gray-700 px-2">🍽️ Quer deixar lanche reservado?</legend>
            <p className="mt-2 text-sm text-gray-500">Opcional. Tu reserva agora e <strong>paga no dia, no bar</strong>. Ajuda a cozinha a se preparar.</p>
            <div className="mt-3 space-y-2">
              {cardapio.map(it => {
                const q = lanche[it.id] ?? 0
                return (
                  <div key={it.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{it.nome}</p>
                      <p className="text-xs text-gray-500">{it.preco_centavos != null ? formatBRL(it.preco_centavos) : 'a confirmar'}{it.descricao ? ` · ${it.descricao}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button type="button" onClick={() => setLancheQtd(it.id, q - 1)} className="h-8 w-8 rounded-full border border-gray-300 text-lg font-bold text-gray-600">−</button>
                      <span className="w-6 text-center font-semibold">{q}</span>
                      <button type="button" onClick={() => setLancheQtd(it.id, q + 1)} className="h-8 w-8 rounded-full border border-gray-300 text-lg font-bold text-gray-600">+</button>
                    </div>
                  </div>
                )
              })}
            </div>
            {lancheTotal > 0 && (
              <p className="mt-3 text-right text-sm font-semibold text-gray-700">Lanche reservado: {formatBRL(lancheTotal)} <span className="font-normal text-gray-400">(paga no bar, no dia)</span></p>
            )}
          </fieldset>
        )}

        {/* Retirada — controle de porta */}
        <fieldset className="mb-6 rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
          <legend className="text-base font-bold text-gray-700 px-2">🔐 Quem pode retirar a criança</legend>
          <p className="mt-2 text-sm text-gray-500">Nome e CPF de quem tem autorização pra buscar. É comum uma pessoa levar e outra buscar.</p>
          {autorizados.map((a, i) => (
            <div key={i} className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-500">Autorizado {i + 1}</p>
                {autorizados.length > 1 && (
                  <button type="button" onClick={() => removeAutorizado(i)} className="text-xs text-red-500 underline">Remover</button>
                )}
              </div>
              <input type="text" value={a.nome} onChange={e => updateAutorizado(i, 'nome', e.target.value)} placeholder="Nome completo"
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-sdb-purple focus:outline-none bg-white" />
              <input type="text" inputMode="numeric" value={a.cpf} onChange={e => updateAutorizado(i, 'cpf', e.target.value)} placeholder="CPF (000.000.000-00)"
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-sdb-purple focus:outline-none bg-white" />
            </div>
          ))}
          <button type="button" onClick={addAutorizado} className="mt-3 text-sm font-semibold text-sdb-purple underline">+ Adicionar outra pessoa</button>
        </fieldset>

        {/* Origem */}
        <fieldset className="mb-6 rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
          <legend className="text-base font-bold text-gray-700 px-2">📣 Como nos conheceu</legend>
          <div className="mt-3">
            <span className="text-sm font-semibold text-gray-700">Como conheceu a Tardezinha? *</span>
            <div className="mt-2 space-y-2">
              {CANAIS.map(c => (
                <label key={c.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="canal" checked={comoConheceu === c.value} onChange={() => setComoConheceu(c.value)} className="accent-sdb-purple" />
                  <span className="text-sm">{c.label}</span>
                </label>
              ))}
            </div>
            {comoConheceu === 'outro' && (
              <input type="text" value={outroOrigem} onChange={e => setOutroOrigem(e.target.value)} placeholder="Conta pra gente..."
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-sdb-purple focus:outline-none" />
            )}
          </div>
          <div className="mt-4">
            <span className="text-sm font-semibold text-gray-700">Já veio em alguma Tardezinha antes? *</span>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="jaVeio" checked={jaVeio === true} onChange={() => setJaVeio(true)} className="accent-sdb-purple" /> Sim
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="jaVeio" checked={jaVeio === false} onChange={() => setJaVeio(false)} className="accent-sdb-purple" /> Não
              </label>
            </div>
          </div>
        </fieldset>

        {/* Termo */}
        <fieldset className="mb-6 rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
          <legend className="text-base font-bold text-gray-700 px-2">📋 Termo de responsabilidade</legend>
          <div className="mt-3 rounded-lg border border-gray-300 bg-gray-50 p-4">
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={aceitouTermo} onChange={e => setAceitouTermo(e.target.checked)} className="mt-0.5 accent-sdb-purple w-5 h-5" />
              <span className="text-sm font-semibold text-gray-700">Aceito o TERMO DE RESPONSABILIDADE *</span>
            </label>
            <button type="button" onClick={() => setMostraTermo(!mostraTermo)} className="mt-2 text-xs text-sdb-purple underline">
              {mostraTermo ? 'Ocultar termo' : 'Ver termo completo'}
            </button>
            {mostraTermo && (
              <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-500 bg-white rounded-lg p-3 border border-gray-200">{TERMO_TEXTO}</pre>
            )}
          </div>
        </fieldset>

        <button type="submit" disabled={!aceitouTermo}
          className="w-full rounded-xl bg-sdb-purple py-4 text-lg font-bold text-white shadow-lg transition hover:bg-sdb-purple-dark disabled:opacity-40 disabled:hover:bg-sdb-purple">
          {retornante ? 'CONFIRMAR PRESENÇA →' : 'GARANTIR MINHA VAGA →'}
        </button>
        <p className="mt-2 text-center text-xs text-gray-400">Teus dados são usados só pra organizar a Tardezinha e te avisar das próximas edições.</p>
      </form>
    </div>
  )
}
