import { useEffect } from 'react'

// ADM: Convidar famílias de edições anteriores — SÓ DESENHADA (13/11/2026, desenho aprovado pela Maninha).
// Regra da casa (skill `disparo`): nada sai pra cliente sem o OK da Maninha no TEXTO e no HORÁRIO.
// A máquina já existe no banco (tz_convite_alvos = prévia · tz_convite_rodada = envio pelo porteiro).
// Esta tela vai mostrar a prévia e pedir o OK dela antes de ligar qualquer envio. Hoje não envia nada.

export function Convidar() {
  const k = new URLSearchParams(window.location.search).get('key') ?? ''
  useEffect(() => { document.title = 'Convidar — Tardezinha (ADM)' }, [])
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <a href={`/central?key=${k}`} className="text-xs font-semibold text-purple-700 underline">← Página da Tardezinha</a>
        <h1 className="mt-2 text-2xl font-extrabold text-purple-800">💌 Convidar famílias</h1>
        <p className="mt-1 text-sm text-gray-500">Chamar quem já veio numa Tardezinha pra próxima data.</p>

        <div className="mt-5 rounded-2xl border-2 border-dashed border-gray-300 bg-white p-5">
          <p className="font-bold text-gray-700">⏳ Em breve — como vai funcionar</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-600">
            <li>Escolhe a data aberta pra convidar.</li>
            <li>A tela mostra <strong>quem vai receber</strong>, quem fica de fora e por quê, e a <strong>mensagem pronta</strong>.</li>
            <li>Vai pra Maninha aprovar o <strong>texto e o horário</strong>.</li>
            <li>Só depois do OK dela o convite sai — devagar, uma família por vez, no horário combinado.</li>
          </ol>
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            🔒 Nada sai pra cliente sem o OK da Maninha. Por enquanto, pede o convite pra Jack.
          </p>
        </div>
      </div>
    </div>
  )
}
