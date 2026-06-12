import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const NAV = [
  { to: '/', label: 'Armario', icon: '👚' },
  { to: '/belleza', label: 'Belleza', icon: '💄' },
  { to: '/outfits', label: 'Outfits', icon: '✨' },
  { to: '/calendario', label: 'Calendario', icon: '📅' },
]

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar escritorio */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-blush-200 bg-white p-5 md:flex md:sticky md:top-0 md:h-dvh">
        <h1 className="font-display mb-8 flex items-center gap-2 text-2xl text-blush-800">
          <span>👗</span> Mi Armario
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
          <span>👗</span> Mi Armario
        </h1>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-sm text-blush-400"
        >
          Salir
        </button>
      </header>

      <main className="min-w-0 flex-1 p-4 pb-24 md:p-8 md:pb-8">{children}</main>

      {/* Barra inferior móvil */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-blush-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
                isActive ? 'font-medium text-blush-700' : 'text-blush-400'
              }`
            }
          >
            <span className="text-xl">{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
