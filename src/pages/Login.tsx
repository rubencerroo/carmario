import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (mode === 'signup' && !accepted) {
      setError('Debes aceptar los términos y la política de privacidad')
      return
    }
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

        {isSignup && (
          <label className="mt-3 flex items-start gap-2 text-xs text-blush-500">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 accent-blush-600"
            />
            <span>
              Acepto los{' '}
              <Link to="/terminos" className="text-blush-600 underline">
                términos
              </Link>{' '}
              y la{' '}
              <Link to="/privacidad" className="text-blush-600 underline">
                política de privacidad
              </Link>
              .
            </span>
          </label>
        )}

        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        {info && <p className="mt-2 text-sm text-green-600">{info}</p>}

        <button
          type="submit"
          disabled={busy || !email || !password || (isSignup && !accepted)}
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

        <div className="mt-6 border-t border-blush-100 pt-4 text-center text-xs text-blush-300">
          <Link to="/terminos" className="hover:text-blush-500">
            Términos
          </Link>
          <span className="mx-2">·</span>
          <Link to="/privacidad" className="hover:text-blush-500">
            Privacidad
          </Link>
        </div>
      </form>
    </div>
  )
}
