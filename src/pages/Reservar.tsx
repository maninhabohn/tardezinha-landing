import { useState, type FormEvent } from 'react'
import { Logo } from '../components/Logo'
import { DateBanner } from '../components/DateBanner'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { whatsappLink, EVENT_DATE_LABEL } from '../lib/contact'

interface CriancaForm {
  nome: string
  dataNascimento: string
  temAlergia: boolean
  alergiaDetalhes: string
  temNecessidade: boolean
  necessidadeDetalhes: string
  autorizouImagem: boolean
  autorizouAudio: boolean
}

const criancaVazia = (): CriancaForm => ({
  nome: '',
  dataNascimento: '',
  temAlergia: false,
  alergiaDetalhes: '',
  temNecessidade: false,
  necessidadeDetalhes: '',
  autorizouImagem: true,
  autorizouAudio: true,
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

const CANAIS = [
  { value: 'instagram', label: 'Instagram (@casashowdebolaoficial)' },
  { value: 'panfleto', label: 'Panfleto' },
  { value: 'anuncio_meta', label: 'Anúncio no Facebook/Instagram' },
  { value: 'indicacao_amigo', label: 'Indicação de amigo' },
  { value: 'ja_cliente_showdebola', label: 'Já sou cliente Show de Bola' },
  { value: 'outro', label: 'Outro' },
]

const TERMO_TEXTO = `DECLARO QUE:
• Sou responsável legal pela(s) criança(s) inscrita(s)
• Estou ciente que a participação ocorre por minha conta e risco
• A Casa de Festas Show de Bola mantém monitoria, brinquedos vistoriados, kit de primeiros socorros e estrutura segura
• Não responsabilizo a Show de Bola por acidentes resultantes do uso incorreto dos brinquedos pela criança ou imprudência`

export function Reservar() {
  const [step, setStep] = useState<'form' | 'enviando' | 'confirmacao'>('form')

  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [cpf, setCpf] = useState('')
  const [email, setEmail] = useState('')
  const [cidade, setCidade] = useState('')

  const [qtdCriancas, setQtdCriancas] = useState(1)
  const [qtdAdultos, setQtdAdultos] = useState(0)
  const [criancas, setCriancas] = useState<CriancaForm[]>([criancaVazia()])

  const [comoConheceu, setComoConheceu] = useState('')
  const [outroOrigem, setOutroOrigem] = useState('')
  const [jaVeio, setJaVeio] = useState<boolean | null>(null)

  const [quemBusca, setQuemBusca] = useState('')
  const [aceitouTermo, setAceitouTermo] = useState(false)
  const [mostraTermo, setMostraTermo] = useState(false)

  const [erro, setErro] = useState('')
  const [whatsappUrl, setWhatsappUrl] = useState('')

  function handleQtdChange(n: number) {
    setQtdCriancas(n)
    setCriancas(prev => {
      if (n > prev.length) return [...prev, ...Array.from({ length: n - prev.length }, criancaVazia)]
      return prev.slice(0, n)
    })
  }

  function updateCrianca(i: number, field: keyof CriancaForm, value: string | boolean) {
    setCriancas(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }

  function validate(): string | null {
    if (!nome.trim()) return 'Preenche teu nome'
    const phoneDigits = whatsapp.replace(/\D/g, '')
    if (phoneDigits.length < 10) return 'WhatsApp precisa ter DDD + número'
    if (!cidade.trim()) return 'Preenche tua cidade'

    for (let i = 0; i < criancas.length; i++) {
      const c = criancas[i]
      if (!c.nome.trim()) return `Preenche o nome da criança ${i + 1}`
      const dt = parseDateBR(c.dataNascimento)
      if (!dt) return `Data de nascimento da criança ${i + 1} tá inválida (DD/MM/AAAA)`
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

    const whatsappNorm = '55' + whatsapp.replace(/\D/g, '')
    const params = new URLSearchParams(window.location.search)
    const reservaId = crypto.randomUUID()

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
        quem_busca_criancas: quemBusca.trim() || null,
        como_conheceu: comoConheceu,
        como_conheceu_outro: comoConheceu === 'outro' ? outroOrigem.trim() : null,
        ja_veio_tardezinha: jaVeio,
        qtd_criancas: criancas.length,
        qtd_adultos_extra: qtdAdultos,
        aceitou_termo_responsabilidade: aceitouTermo,
        utm_source: params.get('utm_source') || null,
        utm_medium: params.get('utm_medium') || null,
        utm_campaign: params.get('utm_campaign') || null,
        user_agent: navigator.userAgent,
      })

    if (errReserva) {
      console.error(errReserva)
      setErro('Deu ruim salvando. Tenta de novo ou chama no WhatsApp.')
      setStep('form')
      return
    }

    const criancasPayload = criancas.map(c => ({
      reserva_id: reservaId,
      nome_completo: c.nome.trim(),
      data_nascimento: parseDateBR(c.dataNascimento)!,
      tem_alergia_restricao: c.temAlergia,
      alergia_restricao_detalhes: c.temAlergia ? c.alergiaDetalhes.trim() : null,
      tem_necessidade_especial: c.temNecessidade,
      necessidade_especial_detalhes: c.temNecessidade ? c.necessidadeDetalhes.trim() : null,
      autorizou_imagem: c.autorizouImagem,
      autorizou_audio: c.autorizouAudio,
    }))

    const { error: errCriancas } = await supabase
      .from('tardezinha_reserva_criancas')
      .insert(criancasPayload)

    if (errCriancas) console.error('Erro ao salvar crianças:', errCriancas)

    const valorPorCrianca = 45
    const totalEstimado = criancas.length * valorPorCrianca
    const idadesStr = criancas.map(c => {
      const dt = parseDateBR(c.dataNascimento)!
      return `${c.nome.split(' ')[0]} (${calcAge(dt)} anos)`
    }).join(', ')

    const msg = `Oi! Acabei de garantir minha vaga na Tardezinha ${EVENT_DATE_LABEL}.\n\n📝 Nome: ${nome.trim()}\n👧 Crianças: ${idadesStr}\n💰 Estimativa: R$ ${totalEstimado.toFixed(2).replace('.', ',')}\n\nTô pronta pra fechar o Pix!`
    const url = whatsappLink(msg)
    setWhatsappUrl(url)
    setStep('confirmacao')
  }

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

  if (step === 'confirmacao') {
    return (
      <div className="min-h-screen bg-gray-50">
        <DateBanner />
        <div className="mx-auto max-w-lg px-4 py-12 text-center">
          <p className="text-6xl mb-4">✨</p>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Tu tá na lista da Tardezinha!</h1>
          <p className="text-lg text-gray-600 mb-8">
            A equipe vai te chamar no WhatsApp pra fechar o Pix.
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-2xl bg-emerald-500 px-8 py-5 text-xl font-bold text-white shadow-xl transition hover:scale-105 hover:bg-emerald-600"
          >
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
            Falar com a Show de Bola
          </a>

          <div className="mt-10 rounded-2xl bg-white p-6 text-left shadow-md border border-gray-200">
            <p className="text-lg font-bold text-gray-800 mb-3">Enquanto isso, anota:</p>
            <p className="mb-1 text-gray-700">🎯 <strong>03/07 (sexta)</strong> · 18h às 22h30</p>
            <p className="mb-1">
              📍{' '}
              <a
                href="https://maps.google.com/?q=Av.+G,+101+-+Atlântida,+Xangri-Lá+-+RS,+95588-000"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sdb-purple underline hover:text-sdb-purple-dark"
              >
                Av. G, 101 — Atlântida, Xangri-Lá — RS
              </a>
            </p>
            <p className="mb-1 text-gray-700">🅿️ Estacionamento no local</p>
            <p className="mt-4 text-sm text-gray-500 font-semibold">
              Pix em até 24h pra garantir a vaga.
            </p>
          </div>

          <a href="/" className="mt-8 inline-block text-sm text-sdb-purple underline">
            ← Voltar pro site
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DateBanner />

      {/* Hero compacto */}
      <div className="bg-white border-b border-gray-200 px-4 pt-6 pb-6 text-center">
        <Logo size={100} className="mb-3" />
        <h1 className="text-2xl font-bold text-gray-800 leading-tight sm:text-3xl">
          Garante tua vaga na<br />Tardezinha 03/07
        </h1>
        <p className="mt-2 text-base text-gray-600">
          4 horas pra ti. 4 horas pra criançada.
          <span className="text-sdb-pink font-semibold"> A família agradece.</span>
        </p>
        <div className="mt-3 inline-block rounded-lg bg-sdb-purple/10 px-5 py-2">
          <p className="text-lg text-sdb-purple-dark font-bold">
            R$45 antecipado · R$50 na hora
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mx-auto max-w-lg px-4 py-8">

        {/* Erro global */}
        {erro && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-300 p-4 text-red-700 font-semibold text-sm">
            ⚠️ {erro}
          </div>
        )}

        {/* SEÇÃO 1 — Responsável */}
        <fieldset className="mb-6 rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
          <legend className="text-base font-bold text-gray-700 px-2">
            👤 Responsável
          </legend>

          <label className="block mt-3">
            <span className="text-sm font-semibold text-gray-700">Teu nome completo *</span>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none"
              placeholder="Como tu te chama?"
            />
          </label>

          <label className="block mt-3">
            <span className="text-sm font-semibold text-gray-700">WhatsApp com DDD *</span>
            <input
              type="tel"
              value={whatsapp}
              onChange={e => setWhatsapp(maskPhone(e.target.value))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none"
              placeholder="(51) 99999-9999"
            />
          </label>

          <label className="block mt-3">
            <span className="text-sm font-semibold text-gray-700">CPF <span className="font-normal text-gray-400">(opcional)</span></span>
            <input
              type="text"
              value={cpf}
              onChange={e => setCpf(maskCpf(e.target.value))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none"
              placeholder="000.000.000-00"
            />
          </label>

          <label className="block mt-3">
            <span className="text-sm font-semibold text-gray-700">Email <span className="font-normal text-gray-400">(opcional — pra futuras edições)</span></span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none"
              placeholder="teu@email.com"
            />
          </label>

          <label className="block mt-3">
            <span className="text-sm font-semibold text-gray-700">Cidade *</span>
            <input
              type="text"
              value={cidade}
              onChange={e => setCidade(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none"
              placeholder="De onde tu vem?"
            />
          </label>
        </fieldset>

        {/* SEÇÃO 2 — Crianças */}
        <fieldset className="mb-6 rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
          <legend className="text-base font-bold text-gray-700 px-2">
            👧 Crianças
          </legend>

          <div className="mt-3 flex gap-4">
            <label className="flex-1">
              <span className="text-sm font-semibold text-gray-700">Quantas crianças vão?</span>
              <select
                value={qtdCriancas}
                onChange={e => handleQtdChange(Number(e.target.value))}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none"
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </label>
            <label className="flex-1">
              <span className="text-sm font-semibold text-gray-700">Adultos extra além de ti?</span>
              <select
                value={qtdAdultos}
                onChange={e => setQtdAdultos(Number(e.target.value))}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none"
              >
                {Array.from({ length: 6 }, (_, i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </label>
          </div>

          {criancas.map((c, i) => (
            <div key={i} className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-bold text-sdb-purple mb-3">
                👧 Criança {i + 1} de {criancas.length}
              </p>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Nome completo *</span>
                <input
                  type="text"
                  value={c.nome}
                  onChange={e => updateCrianca(i, 'nome', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none bg-white"
                />
              </label>

              <label className="block mt-3">
                <span className="text-sm font-semibold text-gray-700">Data de nascimento *</span>
                <input
                  type="text"
                  value={c.dataNascimento}
                  onChange={e => updateCrianca(i, 'dataNascimento', maskDate(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none bg-white"
                  placeholder="DD/MM/AAAA"
                />
              </label>

              {/* Alergia */}
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
                  <textarea
                    value={c.alergiaDetalhes}
                    onChange={e => updateCrianca(i, 'alergiaDetalhes', e.target.value)}
                    placeholder="Qual alergia ou restrição?"
                    className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none bg-white"
                    rows={2}
                  />
                )}
              </div>

              {/* Necessidade especial */}
              <div className="mt-3">
                <span className="text-sm font-semibold text-gray-700">Tem alguma necessidade especial ou orientação importante?</span>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" checked={c.temNecessidade === true} onChange={() => updateCrianca(i, 'temNecessidade', true)} className="accent-sdb-purple" /> Sim
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" checked={c.temNecessidade === false} onChange={() => updateCrianca(i, 'temNecessidade', false)} className="accent-sdb-purple" /> Não
                  </label>
                </div>
                {c.temNecessidade && (
                  <textarea
                    value={c.necessidadeDetalhes}
                    onChange={e => updateCrianca(i, 'necessidadeDetalhes', e.target.value)}
                    placeholder="Conta pra gente pra equipe ficar preparada"
                    className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none bg-white"
                    rows={2}
                  />
                )}
              </div>

              {/* Autorizações LGPD */}
              <div className="mt-4 rounded-lg bg-gray-100 p-3">
                <p className="text-xs font-bold text-gray-600 mb-2">⚖️ AUTORIZAÇÕES PRA ESTA CRIANÇA</p>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={c.autorizouImagem}
                    onChange={e => updateCrianca(i, 'autorizouImagem', e.target.checked)}
                    className="mt-0.5 accent-sdb-purple"
                  />
                  <span className="text-sm text-gray-700">Autorizo uso de <strong>imagem</strong> (fotos e vídeos do evento)</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={c.autorizouAudio}
                    onChange={e => updateCrianca(i, 'autorizouAudio', e.target.checked)}
                    className="mt-0.5 accent-sdb-purple"
                  />
                  <span className="text-sm text-gray-700">Autorizo uso de <strong>áudio</strong> (gravações do evento)</span>
                </label>
              </div>
            </div>
          ))}
        </fieldset>

        {/* SEÇÃO 3 — Origem */}
        <fieldset className="mb-6 rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
          <legend className="text-base font-bold text-gray-700 px-2">
            📣 Como nos conheceu
          </legend>

          <div className="mt-3">
            <span className="text-sm font-semibold text-gray-700">Como conheceu a Tardezinha? *</span>
            <div className="mt-2 space-y-2">
              {CANAIS.map(c => (
                <label key={c.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="canal"
                    checked={comoConheceu === c.value}
                    onChange={() => setComoConheceu(c.value)}
                    className="accent-sdb-purple"
                  />
                  <span className="text-sm">{c.label}</span>
                </label>
              ))}
            </div>
            {comoConheceu === 'outro' && (
              <input
                type="text"
                value={outroOrigem}
                onChange={e => setOutroOrigem(e.target.value)}
                placeholder="Conta pra gente..."
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none"
              />
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

        {/* SEÇÃO 4 — Autorização e Logística */}
        <fieldset className="mb-6 rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
          <legend className="text-base font-bold text-gray-700 px-2">
            📋 Autorização e Logística
          </legend>

          <label className="block mt-3">
            <span className="text-sm font-semibold text-gray-700">
              Quem é autorizado a buscar as crianças?
            </span>
            <span className="block text-xs text-gray-400 mt-0.5">
              Coloca nome e CPF da(s) pessoa(s) que pode(m) buscar. É comum 1 responsável levar e outro buscar.
            </span>
            <textarea
              value={quemBusca}
              onChange={e => setQuemBusca(e.target.value)}
              className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none"
              rows={3}
              placeholder="Ex: Maria Silva — CPF 000.000.000-00"
            />
          </label>

          {/* Termo */}
          <div className="mt-5 rounded-lg border border-gray-300 bg-gray-50 p-4">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={aceitouTermo}
                onChange={e => setAceitouTermo(e.target.checked)}
                className="mt-0.5 accent-sdb-purple w-5 h-5"
              />
              <span className="text-sm font-semibold text-gray-700">
                Aceito o TERMO DE RESPONSABILIDADE *
              </span>
            </label>
            <button
              type="button"
              onClick={() => setMostraTermo(!mostraTermo)}
              className="mt-2 text-xs text-sdb-purple underline"
            >
              {mostraTermo ? 'Ocultar termo' : 'Ver termo completo'}
            </button>
            {mostraTermo && (
              <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-500 bg-white rounded-lg p-3 border border-gray-200">
                {TERMO_TEXTO}
              </pre>
            )}
          </div>
        </fieldset>

        {/* Botão submit */}
        <button
          type="submit"
          disabled={!aceitouTermo}
          className="w-full rounded-xl bg-sdb-purple py-4 text-lg font-bold text-white shadow-lg transition hover:bg-sdb-purple-dark disabled:opacity-40 disabled:hover:bg-sdb-purple"
        >
          GARANTIR MINHA VAGA →
        </button>
        <p className="mt-2 text-center text-xs text-gray-400">
          Teus dados são usados só pra organizar a Tardezinha e te avisar das próximas edições.
        </p>
      </form>
    </div>
  )
}
