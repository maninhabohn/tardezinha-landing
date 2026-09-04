import { useState, useEffect, type FormEvent } from 'react'
import { Logo } from '../components/Logo'
import { DateBanner } from '../components/DateBanner'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { EVENTS } from '../lib/contact'
import { getUtmParams } from '../lib/utm'

interface Convidado {
  nome: string
  responsavel: string
  telefone: string
}

const convidadoVazio = (): Convidado => ({ nome: '', responsavel: '', telefone: '' })

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

// 01/09/2026: so oferece edicao que ainda NAO passou. Antes mostrava 16/08, que ja tinha ido.
const hojeISO = new Date().toISOString().slice(0, 10)
const SESSION_OPTIONS = EVENTS.flatMap(ev => {
  const [d, m, a] = ev.date.split('/')
  const iso = `${a}-${m}-${d}`
  if (iso < hojeISO) return []
  return ev.sessions.map(s => ({
    value: `${ev.id}|${s.label}`,
    label: `${ev.date} (${ev.dayOfWeek.slice(0, 4)}) — ${s.label}`,
  }))
})

export function Grupo() {
  useEffect(() => { document.title = 'Inscrição de Grupo — Tardezinha de Domingo' }, [])
  const [step, setStep] = useState<'form' | 'enviando' | 'ok'>('form')

  const [sessao, setSessao] = useState(SESSION_OPTIONS[0]?.value ?? '')
  const [orgNome, setOrgNome] = useState('')
  const [orgWhatsapp, setOrgWhatsapp] = useState('')
  const [aniversariante, setAniversariante] = useState('')
  const [convidados, setConvidados] = useState<Convidado[]>([convidadoVazio()])
  const [observacoes, setObservacoes] = useState('')
  const [autorizouImagem, setAutorizouImagem] = useState(true)
  const [autorizouAudio, setAutorizouAudio] = useState(true)
  const [querOutraData, setQuerOutraData] = useState(SESSION_OPTIONS.length === 0)
  const [dataDesejada, setDataDesejada] = useState('')
  // 03/09/2026 (Maninha): a festa de grupo NAO e so domingo e NAO tem turno fixo.
  // "nao precisa ser domingo, e pode ser em mais de um horario, entao deixa aberta a opcao."
  // Quem confirma e a equipe no WhatsApp, olhando a agenda — o formulario e o PEDIDO.
  const [horarioDesejado, setHorarioDesejado] = useState('')
  const [erro, setErro] = useState('')

  function addConvidado() {
    setConvidados(prev => [...prev, convidadoVazio()])
  }

  function removeConvidado(i: number) {
    setConvidados(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateConvidado(i: number, field: keyof Convidado, value: string) {
    setConvidados(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }

  function validate(): string | null {
    if (querOutraData && !dataDesejada) return 'Escolhe o dia que tu quer'
    if (!querOutraData && !sessao) return 'Escolhe a data e o turno'
    // 01/09/2026 (Maninha): sao DOIS patamares.
    //   6+  -> garante o DESCONTO (R$38 por crianca) numa edicao que ja existe
    //   12+ -> garante a CASA ABERTA (a casa abre um domingo novo pra ela)
    const totalDoGrupo = 1 + convidados.length
    if (querOutraData && totalDoGrupo < 12)
      return 'Pra gente abrir um dia só pra tua turma são 12 crianças (contando o aniversariante). Com 6 ou mais tu já garante o valor de grupo numa data que já existe.'
    if (totalDoGrupo < 6)
      return 'O valor de grupo começa em 6 crianças (contando o aniversariante). Chama a gente no WhatsApp que a gente vê o melhor jeito.'
    if (!orgNome.trim()) return 'Preenche teu nome'
    const digits = orgWhatsapp.replace(/\D/g, '')
    if (digits.length < 10) return 'WhatsApp precisa ter DDD + número'
    if (!aniversariante.trim()) return 'Preenche o nome do aniversariante'
    for (let i = 0; i < convidados.length; i++) {
      const c = convidados[i]
      if (!c.nome.trim()) return `Preenche o nome da criança convidada ${i + 1}`
      if (!c.responsavel.trim()) return `Preenche o responsável da criança ${i + 1}`
      const tel = c.telefone.replace(/\D/g, '')
      if (tel.length < 10) return `Telefone do responsável da criança ${i + 1} tá incompleto`
    }
    return null
  }

  // 01/09/2026 (Jack): isto estava travado em 23/07 e 30/07, com FALLBACK pra 23/07 --
  // qualquer grupo inscrito depois daquelas edicoes era gravado com data de julho.
  // Agora: se a mae escolheu uma edicao existente, sai de EVENTS; se ela pediu um domingo
  // novo (que e o coracao da oferta de grupo), sai da data que ela mesma escolheu.
  function eventoData(edicao: string): string | null {
    if (querOutraData) return dataDesejada || null
    const ev = EVENTS.find(e => edicao.startsWith(e.id))
    if (!ev) return null
    const [d, m, a] = ev.date.split('/')
    return `${a}-${m}-${d}`
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

    const totalCriancas = 1 + convidados.length
    const whatsappNorm = '55' + orgWhatsapp.replace(/\D/g, '')
    const utm = getUtmParams()
    const reservaId = crypto.randomUUID()

    const obsTexto = [
      `GRUPO/ANIVERSÁRIO: ${aniversariante.trim()}`,
      observacoes.trim() ? `Obs: ${observacoes.trim()}` : '',
      convidados.map((c, i) => `Convidado ${i + 1}: ${c.nome.trim()} — Resp: ${c.responsavel.trim()} (${c.telefone.trim()})`).join('\n'),
    ].filter(Boolean).join('\n')

    const { error: errReserva } = await supabase
      .from('tardezinha_reservas')
      .insert({
        id: reservaId,
        nome_responsavel: orgNome.trim(),
        whatsapp_normalizado: whatsappNorm,
        whatsapp_raw: orgWhatsapp,
        qtd_criancas: totalCriancas,
        aceitou_termo_responsabilidade: true,
        edicao: sessao,
        evento_data: eventoData(sessao),
        notas_internas: obsTexto,
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        user_agent: navigator.userAgent,
      })

    if (errReserva) {
      console.error('[Grupo] erro reserva:', errReserva.message)
      setErro('Deu ruim salvando. Tenta de novo ou chama no WhatsApp.')
      setStep('form')
      return
    }

    const todasCriancas = [
      { nome: aniversariante.trim(), responsavel: orgNome.trim(), telefone: orgWhatsapp },
      ...convidados,
    ]

    const criancasPayload = todasCriancas.map(c => ({
      reserva_id: reservaId,
      nome_completo: c.nome.trim(),
      data_nascimento: null,
      tem_alergia_restricao: false,
      alergia_restricao_detalhes: null,
      tem_necessidade_especial: false,
      necessidade_especial_detalhes: null,
      autorizou_imagem: autorizouImagem,
      autorizou_audio: autorizouAudio,
    }))

    const { error: errCriancas } = await supabase
      .from('tardezinha_reserva_criancas')
      .insert(criancasPayload)

    if (errCriancas) console.error('[Grupo] erro crianças:', errCriancas.message)

    // 01/09/2026 (Jack): grava TAMBEM em tardezinha_grupos -- e a tabela que o painel da
    // equipe le (tardezinha_grupo_painel): piso, lista fechando 3 dias antes, quanto a mae paga.
    const dataDoEvento = eventoData(sessao)
    const { error: errGrupo } = await supabase
      .from('tardezinha_grupos')
      .insert({
        edicao: querOutraData ? `pedido:${dataDesejada}${horarioDesejado ? ' ' + horarioDesejado : ''}` : sessao,
        evento_data: dataDoEvento,
        organizadora_nome: orgNome.trim(),
        organizadora_whatsapp: whatsappNorm,
        aniversariante_nome: aniversariante.trim(),
        qtd_criancas: totalCriancas,
        criancas: todasCriancas.map(c => ({
          nome: c.nome.trim(), responsavel: c.responsavel.trim(), telefone: c.telefone,
        })),
        observacoes: observacoes.trim() || null,
        autorizou_imagem: autorizouImagem,
        autorizou_audio: autorizouAudio,
        status: querOutraData ? 'data_pedida' : 'aberto',
      })
    if (errGrupo) console.error('[Grupo] erro tardezinha_grupos:', errGrupo.message)

    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Lead')
    }

    setStep('ok')
  }

  if (step === 'enviando') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-12 h-12 border-4 border-sdb-purple border-t-transparent rounded-full" />
          <p className="mt-4 text-xl font-semibold text-gray-700">Salvando o grupo...</p>
        </div>
      </div>
    )
  }

  if (step === 'ok') {
    return (
      <div className="min-h-screen bg-gray-50">
        <DateBanner />
        <div className="mx-auto max-w-lg px-4 py-12 text-center">
          <p className="text-6xl mb-4">🎉</p>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Grupo inscrito!</h1>
          <p className="text-lg text-gray-600 mb-2">
            {aniversariante.trim().split(' ')[0]} + {convidados.length} convidado{convidados.length > 1 ? 's' : ''} na lista.
          </p>
          <p className="text-base text-gray-500 mb-8">
            A equipe vai te chamar no WhatsApp pra fechar o pagamento.
          </p>

          <div className="rounded-2xl bg-white p-6 text-left shadow-md border border-gray-200">
            <p className="text-lg font-bold text-gray-800 mb-3">Resumo</p>
            <p className="mb-1 text-gray-700">🎂 <strong>Aniversariante:</strong> {aniversariante.trim()}</p>
            <p className="mb-1 text-gray-700">👧 <strong>Total de crianças:</strong> {1 + convidados.length}</p>
            <p className="mb-1 text-gray-700">💰 <strong>Valor por criança:</strong> R$ 38,00 (grupo)</p>
            <p className="mb-1 text-gray-700">💵 <strong>Estimativa total:</strong> R$ {((1 + convidados.length) * 38).toFixed(2).replace('.', ',')}</p>
            <p className="mt-4 text-sm text-gray-500 font-semibold">
              Pix em até 24h pra garantir as vagas.
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
      <div className="bg-sdb-purple border-b border-sdb-purple-dark px-4 pt-6 pb-6 text-center">
        <Logo size={100} className="mb-3" />
        <h1 className="text-2xl font-bold text-white leading-tight sm:text-3xl">
          Inscrição de Grupo 🎂
        </h1>
        <p className="mt-2 text-base text-white/80">
          Aniversário na Tardezinha! Preenche uma vez pra todo o grupo.
        </p>
        <div className="mt-3 inline-block rounded-lg bg-white/15 px-5 py-2">
          <p className="text-lg text-sdb-yellow font-bold">
            R$ 38,00 por criança (a partir de 6)
          </p>
          <p className="mt-1 text-sm text-white/70">
            Adulto não paga entrada
          </p>
          <p className="mt-1 text-sm text-white/70">
            A partir de 12, a gente abre um dia só pra tua turma
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-lg px-4 py-8">

        {erro && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-300 p-4 text-red-700 font-semibold text-sm">
            ⚠️ {erro}
          </div>
        )}

        {/* Data e turno */}
        <fieldset className="mb-6 rounded-xl bg-white border-2 border-sdb-purple/30 p-5 shadow-sm">
          <legend className="text-base font-bold text-sdb-purple px-2">
            {SESSION_OPTIONS.length === 0 ? '📅 Que dia tu quer?' : '📅 Qual data e turno?'}
          </legend>
          <div className="mt-3 space-y-2">
            {SESSION_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 cursor-pointer rounded-lg border-2 p-4 transition ${
                  !querOutraData && sessao === opt.value ? 'border-sdb-purple bg-sdb-purple/5' : 'border-gray-200 hover:border-sdb-purple/30'
                }`}
              >
                <input type="radio" name="sessao" value={opt.value}
                  checked={!querOutraData && sessao === opt.value}
                  onChange={() => { setQuerOutraData(false); setSessao(opt.value) }}
                  className="accent-sdb-purple w-5 h-5" />
                <span className="text-base font-semibold text-gray-800">{opt.label}</span>
              </label>
            ))}

            {/* 01/09/2026: o coracao da oferta de grupo -- a mae PEDE o dia e a casa abre.
                04/09/2026: sem nenhuma edicao no calendario nao existe "outro" dia — o radio
                sozinho so confundia. Ele so aparece quando ha data marcada pra comparar. */}
            {SESSION_OPTIONS.length > 0 && (
              <label
                className={`flex items-center gap-3 cursor-pointer rounded-lg border-2 p-4 transition ${
                  querOutraData ? 'border-sdb-purple bg-sdb-purple/5' : 'border-gray-200 hover:border-sdb-purple/30'
                }`}
              >
                <input type="radio" name="sessao" checked={querOutraData}
                  onChange={() => setQuerOutraData(true)}
                  className="accent-sdb-purple w-5 h-5" />
                <span className="text-base font-semibold text-gray-800">
                  Quero um dia só pra minha turma
                </span>
              </label>
            )}

            {querOutraData && (
              <div className="rounded-lg bg-sdb-purple/5 border border-sdb-purple/20 p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Que dia tu quer?
                </label>
                <input
                  type="date"
                  value={dataDesejada}
                  onChange={e => setDataDesejada(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base focus:border-sdb-purple focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Não precisa ser domingo — pode ser o dia que combinar pra ti.
                </p>

                <label className="block text-sm font-semibold text-gray-700 mt-4 mb-2">
                  E que horário?
                </label>
                <input
                  type="text"
                  value={horarioDesejado}
                  onChange={e => setHorarioDesejado(e.target.value)}
                  placeholder="ex.: das 14h às 18h — ou escreve do teu jeito"
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base focus:border-sdb-purple focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Tem mais de um horário possível. Escreve o que tu prefere que a gente vê aqui.
                </p>

                <p className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
                  <strong>Isso aqui e um pedido, ainda nao e a reserva.</strong> Pra confirmar o dia
                  e o horario, a equipe te chama no WhatsApp e confere a agenda contigo.
                </p>
              </div>
            )}
          </div>
        </fieldset>

        {/* Organizadora */}
        <fieldset className="mb-6 rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
          <legend className="text-base font-bold text-gray-700 px-2">👤 Quem tá organizando</legend>

          <label className="block mt-3">
            <span className="text-sm font-semibold text-gray-700">Teu nome *</span>
            <input type="text" value={orgNome} onChange={e => setOrgNome(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none" placeholder="Nome de quem tá organizando" />
          </label>

          <label className="block mt-3">
            <span className="text-sm font-semibold text-gray-700">Teu WhatsApp com DDD *</span>
            <input type="tel" value={orgWhatsapp} onChange={e => setOrgWhatsapp(maskPhone(e.target.value))} className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none" placeholder="(51) 99999-9999" />
          </label>

          <label className="block mt-3">
            <span className="text-sm font-semibold text-gray-700">Nome do aniversariante *</span>
            <input type="text" value={aniversariante} onChange={e => setAniversariante(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none" placeholder="Quem faz aniversário?" />
          </label>
        </fieldset>

        {/* Convidados */}
        <fieldset className="mb-6 rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
          <legend className="text-base font-bold text-gray-700 px-2">👧 Crianças convidadas</legend>
          <p className="mt-2 text-sm text-gray-500">O aniversariante já tá contado. Adiciona aqui as crianças convidadas.</p>

          {convidados.map((c, i) => (
            <div key={i} className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-sdb-purple">👧 Convidado {i + 1}</p>
                {convidados.length > 1 && (
                  <button type="button" onClick={() => removeConvidado(i)} className="text-xs text-red-500 hover:text-red-700 font-semibold">Remover</button>
                )}
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Nome da criança *</span>
                <input type="text" value={c.nome} onChange={e => updateConvidado(i, 'nome', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none bg-white" />
              </label>

              <label className="block mt-3">
                <span className="text-sm font-semibold text-gray-700">Nome do responsável *</span>
                <input type="text" value={c.responsavel} onChange={e => updateConvidado(i, 'responsavel', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none bg-white" />
              </label>

              <label className="block mt-3">
                <span className="text-sm font-semibold text-gray-700">Telefone do responsável *</span>
                <input type="tel" value={c.telefone} onChange={e => updateConvidado(i, 'telefone', maskPhone(e.target.value))} className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none bg-white" placeholder="(51) 99999-9999" />
              </label>
            </div>
          ))}

          <button
            type="button"
            onClick={addConvidado}
            className="mt-4 w-full rounded-lg border-2 border-dashed border-sdb-purple/30 py-3 text-sm font-bold text-sdb-purple transition hover:bg-sdb-purple/5"
          >
            + Adicionar outra criança
          </button>

          <p className="mt-3 text-center text-sm font-semibold text-gray-600">
            Total: {1 + convidados.length} criança{convidados.length > 0 ? 's' : ''} (aniversariante + {convidados.length} convidado{convidados.length !== 1 ? 's' : ''})
          </p>
        </fieldset>

        {/* Observações + autorizações */}
        <fieldset className="mb-6 rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
          <legend className="text-base font-bold text-gray-700 px-2">📋 Observações e autorizações</legend>

          <label className="block mt-3">
            <span className="text-sm font-semibold text-gray-700">Alergias, restrições ou observações do grupo</span>
            <span className="block text-xs text-gray-400 mt-0.5">Alguma criança tem alergia alimentar, necessidade especial, ou algo que a equipe precisa saber?</span>
            <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-sdb-purple focus:ring-1 focus:ring-sdb-purple focus:outline-none" rows={3} placeholder="Ex: Joãozinho tem alergia a amendoim, Maria usa óculos..." />
          </label>

          <div className="mt-4 rounded-lg bg-gray-100 p-3">
            <p className="text-xs font-bold text-gray-600 mb-2">⚖️ AUTORIZAÇÕES (vale pra todo o grupo)</p>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={autorizouImagem} onChange={e => setAutorizouImagem(e.target.checked)} className="mt-0.5 accent-sdb-purple" />
              <span className="text-sm text-gray-700">Autorizo uso de <strong>imagem</strong> (fotos e vídeos do evento)</span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer mt-2">
              <input type="checkbox" checked={autorizouAudio} onChange={e => setAutorizouAudio(e.target.checked)} className="mt-0.5 accent-sdb-purple" />
              <span className="text-sm text-gray-700">Autorizo uso de <strong>áudio</strong> (gravações do evento)</span>
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          className="w-full rounded-xl bg-sdb-purple py-4 text-lg font-bold text-white shadow-lg transition hover:bg-sdb-purple-dark"
        >
          INSCREVER GRUPO →
        </button>
        <p className="mt-2 text-center text-xs text-gray-400">
          Depois de enviar, a equipe te chama no WhatsApp pra fechar o Pix.
        </p>
      </form>
    </div>
  )
}
