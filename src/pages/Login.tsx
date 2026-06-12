import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase, APP_EMAIL } from '../lib/supabase'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: APP_EMAIL,
      password,
    })
    if (error) {
      setError('Contraseña incorrecta')
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl shadow-blush-200/50"
      >
        <div className="mb-6 text-center">
          <div className="text-5xl">👗</div>
          <h1 className="font-display mt-3 text-3xl text-blush-800">Mi Armario</h1>
          <p className="mt-1 text-sm text-blush-400">Tu colección, siempre contigo</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          autoFocus
          className="w-full rounded-xl border border-blush-200 bg-blush-50 px-4 py-3 outline-none focus:border-blush-400"
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="mt-4 w-full rounded-xl bg-blush-600 py-3 font-medium text-white transition hover:bg-blush-700 disabled:opacity-50"
        >
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
