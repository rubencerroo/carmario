import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { StoreProvider } from './lib/store'
import Login from './pages/Login'
import Layout from './components/Layout'
import ItemsPage from './pages/ItemsPage'
import OutfitsPage from './pages/OutfitsPage'
import CalendarPage from './pages/CalendarPage'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-blush-400">
        Cargando…
      </div>
    )
  }

  if (!session) return <Login />

  return (
    <StoreProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<ItemsPage key="armario" mode="armario" />} />
          <Route path="/belleza" element={<ItemsPage key="belleza" mode="belleza" />} />
          <Route path="/outfits" element={<OutfitsPage />} />
          <Route path="/calendario" element={<CalendarPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </StoreProvider>
  )
}
