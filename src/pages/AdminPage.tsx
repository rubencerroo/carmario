import { useCallback, useEffect, useState } from 'react'
import { supabase, photoUrl } from '../lib/supabase'
import { Chip, EmptyState } from '../components/ui'
import {
  DB_LIMIT_BYTES,
  STORAGE_LIMIT_BYTES,
  type ActivityLog,
  type AdminUser,
  type Item,
  type Outfit,
  type Usage,
  type Wish,
} from '../lib/types'

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

function mb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toLocaleString('es-ES', { maximumFractionDigits: 0 })} MB`
}

function pct(used: number, limit: number): number {
  return Math.round((used / limit) * 100)
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

  const [usage, setUsage] = useState<Usage | null>(null)
  const [errorCount, setErrorCount] = useState(0)

  // Carga el resumen de usuarios, el uso de espacio del proyecto y los errores
  useEffect(() => {
    supabase
      .rpc('admin_users')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setUsers((data as AdminUser[]) ?? [])
        setLoading(false)
      })
    supabase.rpc('get_usage').then(({ data }) => {
      if (data) setUsage(data as Usage)
    })
    supabase
      .rpc('admin_logs', { p_limit: 1000, p_user: null, p_level: 'error' })
      .then(({ data }) => setErrorCount((data as ActivityLog[] | null)?.length ?? 0))
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
  const totalOutfits = users.reduce((s, u) => s + u.outfits, 0)
  // Usuarios activos en los últimos 7 días (según su última actividad registrada)
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const activeWeek = users.filter((u) => u.last_activity && new Date(u.last_activity).getTime() > weekAgo).length

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-blush-800">🛠️ Panel de administración</h1>

      {/* Resumen global */}
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatBox label="Usuarios" value={users.length} />
        <StatBox label="Activos (7 días)" value={activeWeek} />
        <StatBox label="Prendas totales" value={totalItems} />
        <StatBox label="Outfits totales" value={totalOutfits} />
        <StatBox
          label={`Fotos${usage ? ` (${pct(usage.storage_bytes, STORAGE_LIMIT_BYTES)}%)` : ''}`}
          value={usage ? mb(usage.storage_bytes) : '…'}
        />
        <StatBox
          label={`BD${usage ? ` (${pct(usage.db_bytes, DB_LIMIT_BYTES)}%)` : ''}`}
          value={usage ? mb(usage.db_bytes) : '…'}
        />
      </section>

      {errorCount > 0 && (
        <button
          onClick={() => {
            setSelected(null)
            setLogLevel('error')
          }}
          className="flex w-full items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-left text-sm text-red-700 ring-1 ring-red-100 transition hover:bg-red-100"
        >
          🔴 <strong>{errorCount}</strong> {errorCount === 1 ? 'error registrado' : 'errores registrados'}. Toca para verlos.
        </button>
      )}

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
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-blush-100">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="border-b border-blush-100 text-blush-400">
                <tr>
                  <th className="w-[22%] px-3 py-2 font-medium">Fecha</th>
                  <th className="w-[26%] px-3 py-2 font-medium">Usuario</th>
                  <th className="w-[22%] px-3 py-2 font-medium">Acción</th>
                  <th className="w-[30%] px-3 py-2 font-medium">Detalle</th>
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
                    <td className="px-3 py-2 align-top text-blush-500">{fmt(l.created_at)}</td>
                    <td className="px-3 py-2 align-top break-words text-blush-500">{l.email ?? '—'}</td>
                    <td className="px-3 py-2 align-top break-words font-medium text-blush-800">
                      {l.level === 'error' ? '🔴 ' : l.level === 'warn' ? '🟡 ' : ''}
                      {l.action}
                    </td>
                    <td className="px-3 py-2 align-top break-words text-blush-400">
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
