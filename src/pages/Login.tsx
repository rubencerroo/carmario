import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Email o contraseña incorrectos')
        setBusy(false)
      }
      return
    }

    // Registro
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setBusy(false)
      return
    }
    if (!data.session) {
      // Si la confirmación por email está activada no hay sesión todavía.
      setInfo('Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.')
      setMode('login')
      setBusy(false)
    }
    // Si hay sesión, onAuthStateChange en App entra directo.
  }

  const isSignup = mode === 'signup'

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl shadow-blush-200/50"
      >
        <div className="mb-6 text-center">
          <div className="text-5xl">👗</div>
          <h1 className="font-display mt-3 text-3xl text-blush-800">Carmario</h1>
          <p className="mt-1 text-sm text-blush-400">Tu armario, siempre contigo</p>
        </div>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          autoFocus
          className="w-full rounded-xl border border-blush-200 bg-blush-50 px-4 py-3 outline-none focus:border-blush-400"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          className="mt-3 w-full rounded-xl border border-blush-200 bg-blush-50 px-4 py-3 outline-none focus:border-blush-400"
        />

        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        {info && <p className="mt-2 text-sm text-green-600">{info}</p>}

        <button
          type="submit"
          disabled={busy || !email || !password}
          className="mt-4 w-full rounded-xl bg-blush-600 py-3 font-medium text-white transition hover:bg-blush-700 disabled:opacity-50"
        >
          {busy ? 'Un momento…' : isSignup ? 'Crear cuenta' : 'Entrar'}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(isSignup ? 'login' : 'signup')
            setError(null)
            setInfo(null)
          }}
          className="mt-4 w-full text-center text-sm text-blush-500 hover:text-blush-700"
        >
          {isSignup ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </button>
      </form>
    </div>
  )
}
