// Pix "copia e cola" com VALOR, gerado aqui mesmo (sem banco, sem custo).
// Chave aleatória da conta C6 da Show de Bola, lida do QR oficial que a Maninha baixou
// do app (01-COMPARTILHADO/PIX-C6-CASA-DE-FESTAS/qr-c6-original.jpeg), 07/11/2026.
const PIX_CHAVE = 'edfc8643-ae5f-41f4-bceb-92f927c31952'
const PIX_NOME = 'SHOW DE BOLA'
const PIX_CIDADE = 'SAO PAULO'

function campo(id: string, valor: string) {
  return id + String(valor.length).padStart(2, '0') + valor
}

function crc16(payload: string) {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/** valorCentavos: 6000 = R$ 60,00 · txid: só letras e números, até 25 */
export function pixCopiaECola(valorCentavos: number, txid: string) {
  const id = (txid || '***').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***'
  const conta = campo('00', 'br.gov.bcb.pix') + campo('01', PIX_CHAVE)
  const base =
    campo('00', '01') +
    campo('26', conta) +
    campo('52', '0000') +
    campo('53', '986') +
    campo('54', (valorCentavos / 100).toFixed(2)) +
    campo('58', 'BR') +
    campo('59', PIX_NOME) +
    campo('60', PIX_CIDADE) +
    campo('62', campo('05', id)) +
    '6304'
  return base + crc16(base)
}

export const reais = (centavos: number) =>
  'R$ ' + (centavos / 100).toFixed(2).replace('.', ',')
