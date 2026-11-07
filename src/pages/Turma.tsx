import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { Logo } from '../components/Logo'
import { supabase } from '../lib/supabase'
import { WHATSAPP_NUMBER, WHATSAPP_LABEL } from '../lib/contact'
import { pixCopiaECola, reais } from '../lib/pix'

// Inscrição da TURMA (modelo de 06/11/2026): cada família inscreve e paga a própria criança
// pelo link da turma. O comprovante vai pro 1165 e o sistema marca "pago" sozinho
// (gatilho tz_turma_baixa_pagamento, que cruza o telefone de quem mandou com o valor).

interface Item { id: string; nome: string; descricao: string | null; preco_centavos: number }
interface Info {
  ok: boolean; aniversariante: string; organizadora: string; evento_data: string; horario: string | null
  lista_fecha_em: string; aberta: boolean; preco_entrada_centavos: number; piso: number
  pagas: number; inscritas: number; itens: Item[]
}
interface Feito { codigo: string; total_centavos: number; lanches: string }

const dataBR = (iso: string) => {
  const d = new Date(iso + 'T12:00:00')
  const dia = d.toLocaleDateString('pt-BR', { weekday: 'long' })
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)}, ${iso.slice(8, 10)}/${iso.slice(5, 7)}`
}

export function Turma() {
  const { token = '' } = useParams()
  const [info, setInfo] = useState<Info | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [resp, setResp] = useState('')
  const [whats, setWhats] = useState('')
  const [crianca, setCrianca] = useState('')
  const [nasc, setNasc] = useState('')
  const [temRestricao, setTemRestricao] = useState(false)
  const [restricao, setRestricao] = useState('')
  const [imagem, setImagem] = useState(true)
  const [qtd, setQtd] = useState<Record<string, number>>({})
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [feito, setFeito] = useState<Feito | null>(null)
  const [qr, setQr] = useState('')
  const [copiado, setCopiado] = useState(false)

  useEffect(() => { document.title = 'Inscrição da turma — Tardezinha Show de Bola' }, [])
  useEffect(() => {
    supabase.rpc('tz_turma_info', { p_token: token }).then(({ data }) => {
      setInfo(data as Info); setCarregando(false)
    })
  }, [token])

  const total = useMemo(() => {
    if (!info) return 0
    return info.preco_entrada_centavos + info.itens.reduce((s, i) => s + (qtd[i.id] || 0) * i.preco_centavos, 0)
  }, [info, qtd])

  const pix = feito ? pixCopiaECola(feito.total_centavos, 'TZ' + feito.codigo) : ''
  useEffect(() => {
    if (pix) QRCode.toDataURL(pix, { width: 520, margin: 1 }).then(setQr)
  }, [pix])

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!resp.trim() || !crianca.trim()) { setErro('Preenche o teu nome e o nome da criança.'); return }
    if (whats.replace(/\D/g, '').length < 10) { setErro('Confere o WhatsApp com DDD.'); return }
    if (temRestricao && !restricao.trim()) { setErro('Conta pra gente qual é a restrição alimentar.'); return }
    setErro(''); setEnviando(true)
    const itens = Object.entries(qtd).filter(([, q]) => q > 0).map(([id, q]) => ({ id, qtd: q }))
    const { data, error } = await supabase.rpc('tz_turma_inscrever', {
      p_token: token, p_resp_nome: resp, p_whatsapp: whats, p_crianca_nome: crianca,
      p_nascimento: nasc || null, p_restricao: temRestricao ? restricao : null,
      p_itens: itens, p_autorizou_imagem: imagem,
    })
    setEnviando(false)
    const r = data as { ok: boolean; motivo?: string } & Feito
    if (error || !r?.ok) { setErro(r?.motivo || 'Não deu pra salvar. Tenta de novo ou chama no WhatsApp.'); return }
    setFeito(r)
    window.scrollTo({ top: 0 })
  }

  async function copiar() {
    try { await navigator.clipboard.writeText(pix) } catch { /* segue */ }
    setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }

  if (carregando) return <div className="min-h-screen grid place-items-center bg-gray-50 text-gray-500">Carregando…</div>

  if (!info?.ok) return (
    <div className="min-h-screen grid place-items-center bg-gray-50 px-6 text-center">
      <div><Logo size={90} className="mb-4" />
        <p className="text-lg font-semibold text-gray-700">Não achamos esta turma.</p>
        <a className="mt-4 inline-block font-bold text-sdb-purple underline" href={`https://wa.me/${WHATSAPP_NUMBER}`}>Chamar no WhatsApp</a>
      </div>
    </div>
  )

  const cabecalho = (
    <div className="bg-sdb-purple px-4 pt-6 pb-6 text-center text-white">
      <Logo size={90} className="mb-2" />
      <p className="text-xs font-bold uppercase tracking-widest text-sdb-yellow-soft">Tardezinha · Show de Bola</p>
      <h1 className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl">Turma de aniversário de {info.aniversariante}</h1>
      <p className="mt-2 text-base text-white/85">{dataBR(info.evento_data)}{info.horario ? ` · ${info.horario}` : ''}</p>
      <p className="mt-1 text-sm text-white/70">Av. G, 101 · Atlântida, Xangri-lá</p>
    </div>
  )

  if (feito) {
    const msg = `Comprovante · Tardezinha da turma de ${info.aniversariante} · criança: ${crianca.trim()} · ${reais(feito.total_centavos)} · código ${feito.codigo}`
    return (
      <div className="min-h-screen bg-gray-50">
        {cabecalho}
        <div className="mx-auto max-w-md px-4 py-6">
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm font-bold uppercase tracking-wide text-sdb-purple">Passo 1 de 2 · Pagar</p>
            <p className="mt-1 text-gray-700">Abre o app do banco, escolhe <b>Pix com QR Code</b> ou <b>Pix copia e cola</b>. O valor já vem preenchido:</p>
            <p className="mt-3 text-center text-4xl font-extrabold text-sdb-purple">{reais(feito.total_centavos)}</p>
            <p className="text-center text-sm text-gray-500">Entrada{feito.lanches ? ` + ${feito.lanches}` : ''} · {crianca.trim()}</p>
            {qr && <img src={qr} alt="QR Code do Pix" className="mx-auto mt-4 w-60 h-60" />}
            <button type="button" onClick={copiar}
              className="mt-4 w-full rounded-xl bg-sdb-purple py-3 text-base font-bold text-white">
              {copiado ? 'Copiado ✓' : 'Copiar o Pix copia e cola'}
            </button>
            <p className="mt-2 text-center text-xs text-gray-500">Recebedor: SHOW DE BOLA</p>
          </div>

          <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm font-bold uppercase tracking-wide text-sdb-purple">Passo 2 de 2 · Mandar o comprovante</p>
            <p className="mt-1 text-gray-700">Manda o comprovante <b>deste mesmo WhatsApp</b> ({whats}). A inscrição confirma sozinha em até 1 hora.</p>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`}
              className="mt-4 block w-full rounded-xl bg-green-600 py-3 text-center text-base font-bold text-white">
              Mandar comprovante no WhatsApp
            </a>
            <p className="mt-2 text-center text-xs text-gray-500">{WHATSAPP_LABEL} · código {feito.codigo}</p>
          </div>

          {feito.lanches && (
            <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 border border-amber-200">
              <b>Sobre o lanche:</b> ele fica no nome da criança. É só pedir no bar na hora que quiser comer.
              Se algum item não estiver disponível no dia, a gente troca por outro do mesmo valor.
            </div>
          )}
          <p className="mt-6 text-center text-xs text-gray-500">Tem mais uma criança? Recarrega a página e faz outra inscrição.</p>
        </div>
      </div>
    )
  }

  if (!info.aberta) return (
    <div className="min-h-screen bg-gray-50">{cabecalho}
      <div className="mx-auto max-w-md px-4 py-8 text-center">
        <p className="text-lg font-semibold text-gray-700">A lista desta turma já fechou.</p>
        <a className="mt-4 inline-block font-bold text-sdb-purple underline" href={`https://wa.me/${WHATSAPP_NUMBER}`}>Chamar no WhatsApp</a>
      </div>
    </div>
  )

  const fecha = `${info.lista_fecha_em.slice(8, 10)}/${info.lista_fecha_em.slice(5, 7)}`
  return (
    <div className="min-h-screen bg-gray-50">
      {cabecalho}
      <form onSubmit={enviar} className="mx-auto max-w-md px-4 py-6 space-y-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-200 text-gray-700">
          <p><b>{reais(info.preco_entrada_centavos)}</b> a entrada da criança. 4 horas de brinquedos com a nossa equipe.</p>
          <p className="mt-1">Adulto não paga entrada.</p>
          <p className="mt-1">Inscrição e pagamento <b>até {fecha}</b>. Depois disso, entrada na porta.</p>
        </div>

        {erro && <div className="rounded-xl bg-red-50 border border-red-300 p-3 text-sm font-semibold text-red-700">⚠️ {erro}</div>}

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-200 space-y-3">
          <label className="block"><span className="text-sm font-bold text-gray-700">Nome da criança</span>
            <input value={crianca} onChange={e => setCrianca(e.target.value)} className="mt-1 w-full rounded-lg border-2 border-gray-200 p-3" placeholder="Nome e sobrenome" /></label>
          <label className="block"><span className="text-sm font-bold text-gray-700">Data de nascimento (opcional)</span>
            <input type="date" value={nasc} onChange={e => setNasc(e.target.value)} className="mt-1 w-full rounded-lg border-2 border-gray-200 p-3" /></label>
          <label className="block"><span className="text-sm font-bold text-gray-700">Teu nome (responsável)</span>
            <input value={resp} onChange={e => setResp(e.target.value)} className="mt-1 w-full rounded-lg border-2 border-gray-200 p-3" /></label>
          <label className="block"><span className="text-sm font-bold text-gray-700">Teu WhatsApp com DDD</span>
            <input value={whats} onChange={e => setWhats(e.target.value)} inputMode="tel" className="mt-1 w-full rounded-lg border-2 border-gray-200 p-3" placeholder="(51) 99999-9999" />
            <span className="text-xs text-gray-500">O comprovante precisa sair deste número.</span></label>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-200">
          <p className="text-sm font-bold text-gray-700">Quer deixar o lanche pago? (opcional)</p>
          <p className="text-xs text-gray-500">Não entra comida nem bebida de fora. Quem não quiser agora compra no bar durante a tarde.</p>
          <div className="mt-3 space-y-2">
            {info.itens.map(i => (
              <div key={i.id} className="flex items-center justify-between gap-3 rounded-lg border-2 border-gray-200 p-3">
                <div><p className="font-semibold text-gray-800">{i.nome} · {reais(i.preco_centavos)}</p>
                  {i.descricao && <p className="text-xs text-gray-500">{i.descricao}</p>}</div>
                <div className="flex items-center gap-2">
                  <button type="button" className="h-9 w-9 rounded-full border-2 border-sdb-purple text-sdb-purple font-bold"
                    onClick={() => setQtd(q => ({ ...q, [i.id]: Math.max(0, (q[i.id] || 0) - 1) }))}>−</button>
                  <span className="w-5 text-center font-bold">{qtd[i.id] || 0}</span>
                  <button type="button" className="h-9 w-9 rounded-full bg-sdb-purple text-white font-bold"
                    onClick={() => setQtd(q => ({ ...q, [i.id]: Math.min(5, (q[i.id] || 0) + 1) }))}>+</button>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">O lanche fica no nome da criança: ela pede no bar quando quiser. Se algum item faltar no dia, a gente troca por outro do mesmo valor.</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-200 space-y-3">
          <label className="flex items-start gap-3"><input type="checkbox" checked={temRestricao} onChange={e => setTemRestricao(e.target.checked)} className="mt-1 h-5 w-5 accent-sdb-purple" />
            <span className="text-sm text-gray-700">A criança tem <b>restrição alimentar</b> (alergia, intolerância, autismo). Ela pode trazer a comida dela, só dela, sem custo.</span></label>
          {temRestricao && <input value={restricao} onChange={e => setRestricao(e.target.value)} className="w-full rounded-lg border-2 border-gray-200 p-3" placeholder="Conta pra gente qual é" />}
          <label className="flex items-start gap-3"><input type="checkbox" checked={imagem} onChange={e => setImagem(e.target.checked)} className="mt-1 h-5 w-5 accent-sdb-purple" />
            <span className="text-sm text-gray-700">Autorizo foto e vídeo da criança nas redes da casa.</span></label>
        </div>

        <div className="sticky bottom-0 -mx-4 bg-gray-50/95 px-4 pb-4 pt-2">
          <button disabled={enviando} className="w-full rounded-xl bg-sdb-purple py-4 text-lg font-extrabold text-white disabled:opacity-60">
            {enviando ? 'Salvando…' : `Continuar pro Pix · ${reais(total)}`}
          </button>
        </div>
      </form>
    </div>
  )
}
