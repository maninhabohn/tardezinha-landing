// tz-comprovante — 27/11/2026 (Jack)
// A Ana via "Pago" nos Inscritos e não achava o comprovante (ele ficava no card do CRM).
// Agora a inscrição guarda tardezinha_reservas.comprovante_url e este cano devolve um link
// que vale 10 min, SÓ pra chave de ADM/dona (tz_nivel). A pasta whatsapp-images é privada.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  try {
    const { key, reserva } = await req.json()
    if (!key || !reserva) return json({ ok: false, motivo: 'faltou chave ou inscrição' }, 400)
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: nivel } = await sb.rpc('tz_nivel', { p_key: key })
    if (!nivel || nivel === 'equipe') return json({ ok: false, motivo: 'só administração' }, 403)
    const { data: r } = await sb.from('tardezinha_reservas').select('comprovante_url').eq('id', reserva).maybeSingle()
    if (!r?.comprovante_url) return json({ ok: false, motivo: 'sem comprovante guardado' }, 404)
    const { data: s, error } = await sb.storage.from('whatsapp-images').createSignedUrl(r.comprovante_url, 600)
    if (error || !s?.signedUrl) return json({ ok: false, motivo: 'não abriu o arquivo' }, 500)
    return json({ ok: true, url: s.signedUrl })
  } catch (e) {
    return json({ ok: false, motivo: String(e) }, 500)
  }
})
