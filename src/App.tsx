import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

type Status =
  | { kind: 'loading' }
  | { kind: 'ok'; message: string }
  | { kind: 'error'; message: string }

function App() {
  const [status, setStatus] = useState<Status>({ kind: 'loading' })

  useEffect(() => {
    // Teste mais leve possivel: pede a sessao atual.
    // Nao precisa de tabela nem login — so testa se o garcom chega na despensa.
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          setStatus({ kind: 'error', message: error.message })
        } else {
          setStatus({
            kind: 'ok',
            message: data.session
              ? 'Conectado (com sessao ativa)'
              : 'Conectado (sem sessao — esperado, ninguem logou ainda)',
          })
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err)
        setStatus({ kind: 'error', message })
      })
  }, [])

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Tardezinha Landing
        </h1>
        <p className="text-slate-600 text-sm">
          Teste de conexao com o Supabase
        </p>

        {status.kind === 'loading' && (
          <div className="rounded-lg bg-slate-100 border border-slate-200 p-4">
            <p className="text-slate-700">Testando conexao...</p>
          </div>
        )}

        {status.kind === 'ok' && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
            <p className="font-semibold text-emerald-800">Conectado!</p>
            <p className="text-emerald-700 text-sm mt-1">{status.message}</p>
          </div>
        )}

        {status.kind === 'error' && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-4">
            <p className="font-semibold text-rose-800">Falhou</p>
            <p className="text-rose-700 text-sm mt-1 break-words">
              {status.message}
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 text-xs text-slate-400">
          <p>
            URL: <code>{import.meta.env.VITE_SUPABASE_URL ?? 'nao definida'}</code>
          </p>
        </div>
      </div>
    </main>
  )
}

export default App
