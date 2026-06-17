import { useCallback, useEffect, useState } from 'react'
import { supabase, photoUrl } from '../lib/supabase'
import { Chip, EmptyState } from '../components/ui'
import type { ActivityLog, AdminUser, Item, Outfit, Wish } from '../lib/types'

function fmt(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function euro(n: number): string {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

interface UserData {
  items: Item[]
  outfits: Outfit[]
  wishes: Wish[]
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-blush-100">
      <div className="font-display text-2xl text-blush-800">{value}</div>
      <div className="text-xs text-blush-400">{label}</div>
    </div>
  )
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selected, setSelected] = useState<AdminUser | null>(null)
  const [data, setData] = useState<UserData | null>(null)

  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [logLevel, setLogLevel] = useState<'all' | 'info' | 'warn' | 'error'>('all')

  // Carga el resumen de usuarios
  useEffect(() => {
    supabase
      .rpc('admin_users')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setUsers((data as AdminUser[]) ?? [])
        setLoading(false)
      })
  }, [])

  // Carga los logs (global o del usuario seleccionado, filtrados por nivel)
  const loadLogs = useCallback(() => {
    supabase
      .rpc('admin_logs', {
        p_limit: 300,
        p_user: selected?.id ?? null,
        p_level: logLevel === 'all' ? null : logLevel,
      })
      .then(({ data }) => setLogs((data as ActivityLog[]) ?? []))
  }, [selected, logLevel])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  // Carga el armario completo del usuario seleccionado
  useEffect(() => {
    if (!selected) {
      setData(null)
      return
    }
    let cancelled = false
    Promise.all([
      supabase.from('items').select('*').eq('user_id', selected.id).order('created_at', { ascending: false }),
      supabase.from('outfits').select('*, outfit_items(item_id)').eq('user_id', selected.id),
      supabase.from('wishes').select('*').eq('user_id', selected.id),
    ]).then(([i, o, w]) => {
      if (cancelled) return
      setData({
        items: (i.data as Item[]) ?? [],
        outfits: (o.data as Outfit[]) ?? [],
        wishes: (w.data as Wish[]) ?? [],
      })
    })
    return () => {
      cancelled = true
    }
  }, [selected])

  if (loading) return <p className="text-blush-400">Cargando panel…</p>
  if (error)
    return (
      <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
        No se pudo cargar el panel de admin: {error}
      </div>
    )

  const totalItems = users.reduce((s, u) => s + u.items, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-blush-800">🛠️ Panel de administración</h1>
        <span className="text-sm text-blush-400">
          {users.length} usuarios · {totalItems} prendas en total
        </span>
      </div>

      {/* Lista de usuarios */}
      <section>
        <h2 className="mb-2 text-sm font-medium tracking-wide text-blush-500 uppercase">Usuarios</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelected(selected?.id === u.id ? null : u)}
              className={`rounded-2xl p-4 text-left ring-1 transition ${
                selected?.id === u.id
                  ? 'bg-blush-100 ring-blush-300'
                  : 'bg-white ring-blush-100 hover:bg-blush-50'
              }`}
            >
              <div className="truncate font-medium text-blush-800">{u.email}</div>
              <div className="mt-1 text-xs text-blush-400">
                {u.items} prendas · {u.outfits} outfits · {u.wishes} deseos · {u.trips} viajes
              </div>
              <div className="mt-1 text-xs text-blush-400">
                Última actividad: {fmt(u.last_activity ?? u.last_sign_in)}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Detalle del usuario seleccionado */}
      {selected && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium tracking-wide text-blush-500 uppercase">
            Armario de {selected.email}
          </h2>

          {!data ? (
            <p className="text-blush-400">Cargando armario…</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatBox label="Prendas" value={data.items.filter((i) => i.kind === 'prenda').length} />
                <StatBox label="Belleza" value={data.items.filter((i) => i.kind !== 'prenda').length} />
                <StatBox label="Favoritos" value={data.items.filter((i) => i.favorite).length} />
                <StatBox label="Outfits" value={data.outfits.length} />
                <StatBox label="Deseos" value={data.wishes.length} />
                <StatBox
                  label="Valor total"
                  value={euro(data.items.reduce((s, i) => s + (i.price ?? 0), 0))}
                />
                <StatBox
                  label="Sin foto"
                  value={data.items.filter((i) => !i.image_path).length}
                />
                <StatBox label="Total items" value={data.items.length} />
              </div>

              {data.items.length === 0 ? (
                <EmptyState icon="👕" text="Este usuario no tiene prendas todavía" />
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {data.items.map((it) => {
                    const url = photoUrl(it.image_path)
                    return (
                      <div key={it.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-blush-100">
                        <div className="flex aspect-square items-center justify-center bg-blush-50">
                          {url ? (
                            <img src={url} alt={it.name} className="h-full w-full object-contain" />
                          ) : (
                            <span className="text-2xl opacity-40">👕</span>
                          )}
                        </div>
                        <div className="p-2">
                          <div className="truncate text-xs font-medium text-blush-800">{it.name}</div>
                          <div className="truncate text-[10px] text-blush-400">
                            {it.category}
                            {it.price != null ? ` · ${euro(it.price)}` : ''}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Logs */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium tracking-wide text-blush-500 uppercase">
            Logs {selected ? `de ${selected.email}` : '(todos)'}
          </h2>
          <div className="flex gap-1.5">
            {(['all', 'info', 'warn', 'error'] as const).map((lv) => (
              <Chip key={lv} active={logLevel === lv} onClick={() => setLogLevel(lv)}>
                {lv === 'all' ? 'Todos' : lv === 'error' ? 'Errores' : lv === 'warn' ? 'Avisos' : 'Info'}
              </Chip>
            ))}
          </div>
        </div>

        {logs.length === 0 ? (
          <EmptyState icon="📋" text="Sin registros para este filtro" />
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-blush-100">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-blush-100 text-blush-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Fecha</th>
                  <th className="px-3 py-2 font-medium">Usuario</th>
                  <th className="px-3 py-2 font-medium">Acción</th>
                  <th className="px-3 py-2 font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr
                    key={l.id}
                    className={`border-b border-blush-50 last:border-0 ${
                      l.level === 'error' ? 'bg-red-50' : l.level === 'warn' ? 'bg-amber-50' : ''
                    }`}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-blush-500">{fmt(l.created_at)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-blush-500">{l.email ?? '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-medium text-blush-800">
                      {l.level === 'error' ? '🔴 ' : l.level === 'warn' ? '🟡 ' : ''}
                      {l.action}
                    </td>
                    <td className="px-3 py-2 text-blush-400">
                      {l.path && <span className="mr-1 text-blush-300">{l.path}</span>}
                      {l.details ? JSON.stringify(l.details) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
