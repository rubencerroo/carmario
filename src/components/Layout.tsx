import { useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../lib/store'
import { DB_LIMIT_BYTES, STORAGE_LIMIT_BYTES, USAGE_WARN_RATIO } from '../lib/types'

/** Aviso cuando la base de datos o las fotos se acercan al límite del plan gratuito. */
function UsageBanner() {
  const { usage } = useStore()
  const [dismissed, setDismissed] = useState(false)
  if (!usage || dismissed) return null

  const warnings: string[] = []
  const storagePct = usage.storage_bytes / STORAGE_LIMIT_BYTES
  const dbPct = usage.db_bytes / DB_LIMIT_BYTES
  if (storagePct >= USAGE_WARN_RATIO)
    warnings.push(`las fotos ocupan el ${Math.round(storagePct * 100)}% del espacio gratuito`)
  if (dbPct >= USAGE_WARN_RATIO)
    warnings.push(`la base de datos está al ${Math.round(dbPct * 100)}% de su capacidad`)
  if (warnings.length === 0) return null

  const critical = storagePct >= 0.95 || dbPct >= 0.95
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 text-sm md:px-8 ${
        critical ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'
      }`}
    >
      <span>⚠️</span>
      <p className="flex-1">
        Atención: {warnings.join(' y ')}. Borra fotos o prendas que ya no uses, o consulta el
        apartado Estadísticas para ver el detalle.
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 opacity-60 hover:opacity-100"
        aria-label="Cerrar aviso"
      >
        ✕
      </button>
    </div>
  )
}

const NAV = [
  { to: '/', label: 'Armario', icon: '👚' },
  { to: '/belleza', label: 'Belleza', icon: '💄' },
  { to: '/outfits', label: 'Outfits', icon: '✨' },
  { to: '/calendario', label: 'Calendario', icon: '📅' },
  { to: '/deseos', label: 'Deseos', icon: '🛍️' },
  { to: '/maletas', label: 'Maletas', icon: '🧳' },
  { to: '/stats', label: 'Estadísticas', icon: '📊' },
]

// En móvil caben 4 secciones + un menú "Más" con el resto
const MOBILE_MAIN = NAV.slice(0, 4)
const MOBILE_MORE = NAV.slice(4)

export default function Layout({ children }: { children: ReactNode }) {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()
  const moreActive = MOBILE_MORE.some((n) => n.to === location.pathname)

  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar escritorio */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-blush-200 bg-white p-5 md:flex md:sticky md:top-0 md:h-dvh">
        <h1 className="font-display mb-8 flex items-center gap-2 text-2xl text-blush-800">
          <span>👗</span> Carmario
        </h1>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-2.5 transition ${
                  isActive
                    ? 'bg-blush-100 font-medium text-blush-800'
                    : 'text-blush-500 hover:bg-blush-50'
                }`
              }
            >
              <span>{n.icon}</span> {n.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-auto rounded-xl px-4 py-2 text-left text-sm text-blush-400 hover:bg-blush-50"
        >
          Cerrar sesión
        </button>
      </aside>

      {/* Cabecera móvil */}
      <header className="flex items-center justify-between border-b border-blush-200 bg-white px-5 py-3 md:hidden">
        <h1 className="font-display flex items-center gap-2 text-xl text-blush-800">
          <span>👗</span> Carmario
        </h1>
        <button onClick={() => supabase.auth.signOut()} className="text-sm text-blush-400">
          Salir
        </button>
      </header>

      <div className="min-w-0 flex-1">
        <UsageBanner />
        <main className="p-4 pb-24 md:p-8 md:pb-8">{children}</main>
      </div>

      {/* Menú "Más" móvil */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+5rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            {MOBILE_MORE.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3.5 ${
                    isActive ? 'bg-blush-100 font-medium text-blush-800' : 'text-blush-600'
                  }`
                }
              >
                <span className="text-xl">{n.icon}</span> {n.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* Barra inferior móvil */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t border-blush-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {MOBILE_MAIN.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            onClick={() => setMoreOpen(false)}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
                isActive && !moreOpen ? 'font-medium text-blush-700' : 'text-blush-400'
              }`
            }
          >
            <span className="text-xl">{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
            moreOpen || moreActive ? 'font-medium text-blush-700' : 'text-blush-400'
          }`}
        >
          <span className="text-xl">•••</span>
          Más
        </button>
      </nav>
    </div>
  )
}
