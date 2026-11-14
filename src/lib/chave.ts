// 13/11/2026 — Página da Tardezinha (desenho aprovado pela Maninha).
// DUAS portas, decididas no BANCO (tz_nivel), nunca aqui:
//   ?k=<chave do painel>  → EQUIPE do dia (Leti, recepção, cozinha, monitores): só a edição do dia,
//                           sem número de faturamento, sem edição anterior, sem relatório.
//   ?key=<chave do admin> → ADM (Ana e Maninha): tudo. A chave da dona (Maninha) também é ADM
//                           e é a única que aprova edição nova.
// A página só repassa a chave que veio no link; quem decide o que aparece é o banco.

export function lerChave(): { chave: string; param: 'k' | 'key' } {
  const p = new URLSearchParams(window.location.search)
  const adm = p.get('key')
  if (adm) return { chave: adm, param: 'key' }
  return { chave: p.get('k') ?? '', param: 'k' }
}

// link pra outra tela da casa levando a MESMA chave (e o mesmo nível)
export function comChave(path: string): string {
  const { chave, param } = lerChave()
  if (!chave) return path
  return `${path}${path.includes('?') ? '&' : '?'}${param}=${chave}`
}
