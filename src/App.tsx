import { useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { logActivity } from './lib/log'
import { StoreProvider } from './lib/store'
import { ADMIN_EMAIL } from './lib/types'
import Login from './pages/Login'
import Layout from './components/Layout'
import ItemsPage from './pages/ItemsPage'
import OutfitsPage from './pages/OutfitsPage'
import CalendarPage from './pages/CalendarPage'
import WishlistPage from './pages/WishlistPage'
import TripsPage from './pages/TripsPage'
import StatsPage from './pages/StatsPage'
import AdminPage from './pages/AdminPage'
import { Terms, Privacy } from './pages/Legal'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const loggedLogin = useRef(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      // Registra el inicio de sesión una sola vez por sesión de navegador.
      if (event === 'SIGNED_IN' && !loggedLogin.current) {
        loggedLogin.current = true
        logActivity('auth.login', { email: s?.user.email })
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-blush-400">
        Cargando…
      </div>
    )
  }

  // Páginas legales accesibles siempre (con o sin sesión).
  const legalRoutes = (
    <>
      <Route path="/terminos" element={<Terms />} />
      <Route path="/privacidad" element={<Privacy />} />
    </>
  )

  if (!session)
    return (
      <Routes>
        {legalRoutes}
        <Route path="*" element={<Login />} />
      </Routes>
    )

  const isAdmin = session.user.email?.toLowerCase() === ADMIN_EMAIL

  return (
    <StoreProvider>
      <Layout isAdmin={isAdmin}>
        <Routes>
          <Route path="/" element={<ItemsPage key="armario" mode="armario" />} />
          <Route path="/belleza" element={<ItemsPage key="belleza" mode="belleza" />} />
          <Route path="/outfits" element={<OutfitsPage />} />
          <Route path="/calendario" element={<CalendarPage />} />
          <Route path="/deseos" element={<WishlistPage />} />
          <Route path="/maletas" element={<TripsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          {isAdmin && <Route path="/admin" element={<AdminPage />} />}
          {legalRoutes}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </StoreProvider>
  )
}
