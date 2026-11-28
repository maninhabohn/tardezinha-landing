// Chamadas às RPCs/tabelas da Tardezinha (confirmação, cardápio, painel).
// Leitura de dado pessoal SEMPRE via RPC SECURITY DEFINER — nunca SELECT direto.
import { supabase } from './supabase'

// ---------- Pré-preenchimento (confirmação de presença) ----------
export interface PrefillCrianca {
  nome_completo: string
  data_nascimento: string | null // DD/MM/YYYY
  tem_alergia: boolean
  alergia_detalhes: string | null
  tem_necessidade: boolean
  necessidade_detalhes: string | null
  desejo: string | null
  autorizou_imagem: boolean
  autorizou_audio: boolean
}

export interface PrefillResponsavel {
  nome: string
  whatsapp: string | null
  cpf: string | null
  email: string | null
  cidade: string | null
}

export interface PrefillResult {
  encontrado: boolean
  motivo?: 'token' | 'cpf'
  exige_cpf?: boolean
  responsavel?: PrefillResponsavel
  criancas?: PrefillCrianca[]
}

export async function fetchPrefill(token: string, cpf?: string): Promise<PrefillResult> {
  const { data, error } = await supabase.rpc('tardezinha_confirmar_prefill', {
    p_token: token,
    p_cpf: cpf ?? null,
  })
  if (error) {
    console.error('[tzApi] prefill:', error)
    return { encontrado: false }
  }
  return data as PrefillResult
}

// ---------- Cardápio (data-driven) ----------
export interface CardapioItem {
  id: string
  nome: string
  descricao: string | null
  preco_centavos: number | null
  ordem: number
}

export async function fetchCardapio(): Promise<CardapioItem[]> {
  const { data, error } = await supabase
    .from('tardezinha_cardapio')
    .select('id,nome,descricao,preco_centavos,ordem')
    .eq('ativo', true)
    .order('ordem', { ascending: true })
  if (error) {
    console.error('[tzApi] cardapio:', error)
    return []
  }
  return (data ?? []) as CardapioItem[]
}

// ---------- Painel da cozinha / fica (gated por chave) ----------
export interface PainelPedido {
  id: string
  senha?: number
  item: string
  qtd: number
  preco_unit_centavos: number
  obs: string | null
  origem: 'reserva' | 'evento' | 'avulso'
  status: 'recebido' | 'preparando' | 'entregue' | 'finalizado' | 'cancelado'
  categoria?: string
  // false = lanche da reserva esperando a familia pedir (nao vai pra cozinha ainda)
  liberado?: boolean
  ja_pago?: boolean
}
export interface PainelCrianca { nome: string; status: string }
export interface PainelAutorizado { nome: string; cpf: string | null }
export interface PainelReserva {
  id: string
  nome: string
  whatsapp: string | null
  turno: string
  status: string
  chegou: boolean
  chegou_hora?: string | null
  // 13/11/2026: "Saiu" (antes so existia "Chegou")
  saiu?: boolean
  saiu_hora?: string | null
  consumo_pago: boolean
  consumo_forma_pagamento?: FormaPagamento | null
  qtd_criancas: number
  entrada_ref_centavos: number
  criancas: PainelCrianca[]
  autorizados: PainelAutorizado[]
  pedidos: PainelPedido[]
  consumo_centavos: number
  ja_pago_centavos?: number
  // 27/11/2026: comprovante guardado na inscrição + de qual turma veio
  tem_comprovante?: boolean
  turma?: string | null
}
export interface PainelEdicao { marker: string; dia: string }
// 27/11/2026: turma aparece mesmo com 0 inscritos (mãe paga e a lista ainda não veio)
export interface PainelTurma {
  aniversariante: string; organizadora: string; modelo: string; piso: number
  horario: string | null; token: string; inscritos: number
}
// adm=false: chave da EQUIPE do dia — o banco manda só a edição do dia e nenhuma outra (edicoes vazio)
export interface PainelResult {
  ok: boolean; reservas?: PainelReserva[]; edicao?: string; edicoes?: PainelEdicao[]
  adm?: boolean; nivel?: 'equipe' | 'adm' | 'dona'; dia?: string | null
  turmas?: PainelTurma[]
}

// 27/11/2026: abre o comprovante (link de 10 min, só ADM). A pasta das fotos é fechada.
export async function abrirComprovante(key: string, reservaId: string): Promise<{ ok: boolean; url?: string; motivo?: string }> {
  const { data, error } = await supabase.functions.invoke('tz-comprovante', { body: { key, reserva: reservaId } })
  if (error) return { ok: false, motivo: 'não abriu' }
  return data as { ok: boolean; url?: string; motivo?: string }
}

// edicao vazia = o banco escolhe a proxima. Edicao passada continua editavel (lancar consumo depois do evento).
export async function fetchPainel(key: string, edicao?: string): Promise<PainelResult> {
  const { data, error } = await supabase.rpc('tardezinha_painel_dados', { p_key: key, p_edicao: edicao || null })
  if (error) {
    console.error('[tzApi] painel:', error)
    return { ok: false }
  }
  return data as PainelResult
}

export async function setPedidoStatus(key: string, pedidoId: string, status: PainelPedido['status']) {
  const { data, error } = await supabase.rpc('tardezinha_pedido_status', {
    p_key: key, p_pedido_id: pedidoId, p_status: status,
  })
  if (error) { console.error('[tzApi] pedido_status:', error); return { ok: false } }
  return data as { ok: boolean }
}

export async function setCheckin(key: string, reservaId: string, chegou: boolean) {
  const { data, error } = await supabase.rpc('tardezinha_checkin', {
    p_key: key, p_reserva_id: reservaId, p_chegou: chegou,
  })
  if (error) { console.error('[tzApi] checkin:', error); return { ok: false } }
  return data as { ok: boolean }
}

// 13/11/2026: marcar que a família SAIU. Devolve quanto ainda falta acertar de lanche.
export async function setSaida(key: string, reservaId: string, saiu: boolean) {
  const { data, error } = await supabase.rpc('tardezinha_saida', {
    p_key: key, p_reserva_id: reservaId, p_saiu: saiu,
  })
  if (error) { console.error('[tzApi] saida:', error); return { ok: false, aberto_centavos: 0 } }
  return data as { ok: boolean; aberto_centavos: number }
}

// 27/11/2026: a porta diz QUEM paga a entrada. Em 20/11 foram 8 entradas sem valor no relatório.
//   paga='porta' → pagou aqui (valor + forma) · paga='turma' → é da turma (turmaToken) · null → ainda não pagou
export interface WalkinPagamento { paga?: 'porta' | 'turma' | null; valorCentavos?: number; forma?: FormaPagamento | null; turmaToken?: string | null }
export async function walkin(
  key: string, turno: string, crianca: string, responsavel?: string, whatsapp?: string, pg: WalkinPagamento = {},
) {
  const { data, error } = await supabase.rpc('tardezinha_walkin', {
    p_key: key, p_turno: turno, p_crianca: crianca,
    p_responsavel: responsavel ?? null, p_whatsapp: whatsapp ?? null,
    p_paga: pg.paga ?? null, p_valor_centavos: pg.valorCentavos ?? null,
    p_forma: pg.forma ?? null, p_turma_token: pg.turmaToken ?? null,
  })
  if (error) { console.error('[tzApi] walkin:', error); return { ok: false } }
  return data as { ok: boolean; id?: string; motivo?: string }
}

// 20/11/2026: criança que já veio → sugere responsável e WhatsApp (só com a chave da equipe)
export type SugestaoCrianca = { crianca: string; responsavel: string; whatsapp: string | null; quando: string; irmaos: string | null }
export async function sugerirCrianca(key: string, busca: string): Promise<SugestaoCrianca[]> {
  if (busca.trim().length < 3) return []
  const { data, error } = await supabase.rpc('tardezinha_sugerir_crianca', { p_key: key, p_busca: busca })
  if (error) { console.error('[tzApi] sugerirCrianca:', error); return [] }
  return (data ?? []) as SugestaoCrianca[]
}

// 20/09/2026 (Leti): o fechamento do bar diz COMO recebeu. Antes, 100% sem forma.
export type FormaPagamento = 'pix' | 'dinheiro' | 'credito' | 'debito'
export const FORMAS_PAGAMENTO: { id: FormaPagamento; rotulo: string }[] = [
  { id: 'pix', rotulo: 'Pix' },
  { id: 'dinheiro', rotulo: 'Dinheiro' },
  { id: 'credito', rotulo: 'Crédito' },
  { id: 'debito', rotulo: 'Débito' },
]

export async function setConsumoPago(key: string, reservaId: string, pago: boolean, forma?: FormaPagamento) {
  const { data, error } = await supabase.rpc('tardezinha_consumo_pago', {
    p_key: key, p_reserva_id: reservaId, p_pago: pago, p_forma: pago ? (forma ?? null) : null,
  })
  if (error) { console.error('[tzApi] consumo_pago:', error); return { ok: false } }
  return data as { ok: boolean }
}

// 22/09/2026: "chegar nao e pedir". O bar aperta "Pedir agora" quando a familia pede o lanche reservado.
export async function liberarPedido(key: string, pedidoId: string, liberar = true) {
  const { data, error } = await supabase.rpc('tardezinha_pedido_liberar', {
    p_key: key, p_pedido_id: pedidoId, p_liberar: liberar,
  })
  if (error) { console.error('[tzApi] pedido_liberar:', error); return { ok: false } }
  return data as { ok: boolean }
}

// 20/11/2026: lanche reservado de 2+ crianças — manda só uma parte pra cozinha (ex.: só o menino comeu)
export async function liberarPedidoParcial(key: string, pedidoId: string, qtd: number) {
  const { data, error } = await supabase.rpc('tardezinha_pedido_liberar_parcial', {
    p_key: key, p_pedido_id: pedidoId, p_qtd: qtd,
  })
  if (error) { console.error('[tzApi] pedido_liberar_parcial:', error); return { ok: false } }
  return data as { ok: boolean; id?: string; motivo?: string }
}

export async function addPedido(
  key: string, reservaId: string, itemNome: string,
  precoCentavos: number, qtd: number, obs?: string, avulso = false,
) {
  // avulso = valor gerado no local, fora do cardapio: entra ja finalizado e do lado do bar
  const { data, error } = await supabase.rpc('tardezinha_pedido_add', {
    p_key: key, p_reserva_id: reservaId, p_item_nome: itemNome,
    p_preco_centavos: precoCentavos, p_qtd: qtd, p_obs: obs ?? null, p_avulso: avulso,
  })
  if (error) { console.error('[tzApi] pedido_add:', error); return { ok: false } }
  return data as { ok: boolean; id?: string }
}

// ---------- Página do dia (27/11/2026, sugestão da Ana) ----------
export interface DiaExtra { id: string; descricao: string; qtd: number; valor_unit_centavos: number; pago: boolean; forma: string | null; lancado_por: string | null; quando: string }
export interface DiaTurma {
  id: string; token: string; aniversariante: string; organizadora: string; whatsapp: string | null
  modelo: string; horario: string | null; piso: number; preco_entrada_centavos: number; lista_fecha_em: string
  combinados: string | null; combinados_em: string | null; mae_pagou_centavos: number | null
  inscritos: number; pagos: number; chegaram: number; criancas: string[]
  lanches: { item: string; qtd: number; centavos: number }[]; extras: DiaExtra[]
}
export interface DiaResult {
  ok: boolean; adm?: boolean; edicao?: string; dia?: string | null; horario?: string | null
  edicoes?: PainelEdicao[]; avulsos?: { familias: number; criancas: number; pagas: number; na_porta: number }
  turmas?: DiaTurma[]
}
export async function fetchDia(key: string, edicao?: string): Promise<DiaResult> {
  const { data, error } = await supabase.rpc('tz_dia', { p_key: key, p_edicao: edicao || null })
  if (error) { console.error('[tzApi] dia:', error); return { ok: false } }
  return data as DiaResult
}
export async function addExtra(key: string, grupo: string, descricao: string, qtd: number, valorUnit: number, pago: boolean, forma?: FormaPagamento | null, quem?: string) {
  const { data, error } = await supabase.rpc('tz_extra_add', {
    p_key: key, p_grupo: grupo, p_descricao: descricao, p_qtd: qtd, p_valor_unit_centavos: valorUnit,
    p_pago: pago, p_forma: forma ?? null, p_quem: quem ?? null,
  })
  if (error) { console.error('[tzApi] extra_add:', error); return { ok: false } }
  return data as { ok: boolean; motivo?: string }
}
export async function setExtraPago(key: string, id: string, pago: boolean, forma?: FormaPagamento | null) {
  const { data, error } = await supabase.rpc('tz_extra_pago', { p_key: key, p_id: id, p_pago: pago, p_forma: forma ?? null })
  if (error) { console.error('[tzApi] extra_pago:', error); return { ok: false } }
  return data as { ok: boolean }
}
export async function removerExtra(key: string, id: string) {
  const { data, error } = await supabase.rpc('tz_extra_remover', { p_key: key, p_id: id })
  if (error) { console.error('[tzApi] extra_remover:', error); return { ok: false } }
  return data as { ok: boolean }
}
export async function salvarCombinados(key: string, grupo: string, texto: string, maePagouCentavos: number | null) {
  const { data, error } = await supabase.rpc('tz_turma_combinados', { p_key: key, p_grupo: grupo, p_texto: texto, p_mae_pagou_centavos: maePagouCentavos })
  if (error) { console.error('[tzApi] combinados:', error); return { ok: false } }
  return data as { ok: boolean; motivo?: string }
}
export const paraCentavos = (s: string) => Math.round(Number(s.replace(/\./g, '').replace(',', '.')) * 100) || 0

// ---------- util ----------
export const formatBRL = (centavos: number) =>
  (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
