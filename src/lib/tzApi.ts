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
  preco_centavos: number
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
  item: string
  qtd: number
  preco_unit_centavos: number
  obs: string | null
  origem: 'reserva' | 'evento'
  status: 'recebido' | 'preparando' | 'entregue' | 'cancelado'
}
export interface PainelCrianca { nome: string; status: string }
export interface PainelReserva {
  id: string
  nome: string
  turno: string
  status: string
  qtd_criancas: number
  entrada_ref_centavos: number
  criancas: PainelCrianca[]
  pedidos: PainelPedido[]
  consumo_centavos: number
}
export interface PainelResult { ok: boolean; reservas?: PainelReserva[] }

export async function fetchPainel(key: string): Promise<PainelResult> {
  const { data, error } = await supabase.rpc('tardezinha_painel_dados', { p_key: key })
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

export async function addPedido(
  key: string, reservaId: string, itemNome: string,
  precoCentavos: number, qtd: number, obs?: string,
) {
  const { data, error } = await supabase.rpc('tardezinha_pedido_add', {
    p_key: key, p_reserva_id: reservaId, p_item_nome: itemNome,
    p_preco_centavos: precoCentavos, p_qtd: qtd, p_obs: obs ?? null,
  })
  if (error) { console.error('[tzApi] pedido_add:', error); return { ok: false } }
  return data as { ok: boolean; id?: string }
}

// ---------- util ----------
export const formatBRL = (centavos: number) =>
  (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
