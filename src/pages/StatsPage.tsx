import { useMemo } from 'react'
import { useStore } from '../lib/store'
import { photoUrl } from '../lib/supabase'
import type { Item } from '../lib/types'
import { COLORS, DB_LIMIT_BYTES, STORAGE_LIMIT_BYTES, USAGE_WARN_RATIO } from '../lib/types'
import { EmptyState } from '../components/ui'

function euros(n: number): string {
  return `${n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`
}

function megas(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toLocaleString('es-ES', { maximumFractionDigits: 1 })} MB`
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.min(1, used / limit)
  const color =
    pct >= 0.95 ? 'bg-red-400' : pct >= USAGE_WARN_RATIO ? 'bg-amber-400' : 'bg-blush-300'
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-blush-500">
        <span>{label}</span>
        <span>
          {megas(used)} de {megas(limit)} ({Math.round(pct * 100)}%)
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-blush-50">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.max(2, pct * 100)}%` }}
        />
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm md:p-5">
      <h3 className="mb-3 text-xs font-medium tracking-wide text-blush-500 uppercase">{title}</h3>
      {children}
    </section>
  )
}

function MiniItem({ item, detail }: { item: Item; detail: string }) {
  const url = photoUrl(item.image_path)
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-blush-100">
        {url ? (
          <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-lg opacity-40">👚</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className="text-xs text-blush-400">{detail}</p>
      </div>
    </div>
  )
}

export default function StatsPage() {
  const { items, outfits, entries, usage, error } = useStore()

  const stats = useMemo(() => {
    // Cada día del calendario con outfit cuenta un uso para cada pieza del outfit
    const uses = new Map<string, number>()
    const today = new Date().toISOString().slice(0, 10)
    for (const entry of entries) {
      if (!entry.outfit_id || entry.date > today) continue
      const outfit = outfits.find((o) => o.id === entry.outfit_id)
      if (!outfit) continue
      for (const oi of outfit.outfit_items) {
        uses.set(oi.item_id, (uses.get(oi.item_id) ?? 0) + 1)
      }
    }

    const garments = items.filter((i) => i.kind === 'prenda')
    const totalValue = items.reduce((s, i) => s + (i.price ?? 0), 0)
    const daysLogged = entries.filter((e) => e.outfit_id && e.date <= today).length

    const used = garments
      .map((g) => ({ item: g, uses: uses.get(g.id) ?? 0 }))
      .sort((a, b) => b.uses - a.uses)
    const top = used.filter((u) => u.uses > 0).slice(0, 5)
    const forgotten = used.filter((u) => u.uses === 0)

    const colorCounts = COLORS.map((c) => ({
      ...c,
      count: garments.filter((g) => g.color === c.name).length,
    })).filter((c) => c.count > 0)
    const maxColor = Math.max(1, ...colorCounts.map((c) => c.count))

    const categoryCounts = [...new Set(garments.map((g) => g.category))]
      .map((cat) => ({ cat, count: garments.filter((g) => g.category === cat).length }))
      .sort((a, b) => b.count - a.count)

    return { uses, garments, totalValue, daysLogged, top, forgotten, colorCounts, maxColor, categoryCounts }
  }, [items, outfits, entries])

  if (error) return <EmptyState icon="⚠️" text={`Error al cargar los datos: ${error}`} />

  const counts = [
    { label: 'Prendas', value: items.filter((i) => i.kind === 'prenda').length, icon: '👚' },
    { label: 'Colonias', value: items.filter((i) => i.kind === 'colonia').length, icon: '🌸' },
    { label: 'Maquillaje', value: items.filter((i) => i.kind === 'maquillaje').length, icon: '💄' },
    { label: 'Outfits', value: outfits.length, icon: '✨' },
  ]

  return (
    <div>
      <h2 className="font-display mb-4 text-2xl text-blush-800 md:text-3xl">Estadísticas</h2>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {counts.map((c) => (
          <div key={c.label} className="rounded-2xl bg-white p-4 text-center shadow-sm">
            <div className="text-2xl">{c.icon}</div>
            <div className="font-display text-2xl text-blush-800">{c.value}</div>
            <div className="text-xs text-blush-400">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(stats.totalValue > 0 || stats.daysLogged > 0) && (
          <Card title="En números">
            <div className="space-y-2 text-sm">
              {stats.totalValue > 0 && (
                <p>
                  💰 Tu colección vale <strong>{euros(stats.totalValue)}</strong>
                </p>
              )}
              {stats.daysLogged > 0 && (
                <p>
                  📅 Has registrado <strong>{stats.daysLogged}</strong>{' '}
                  {stats.daysLogged === 1 ? 'día con outfit' : 'días con outfit'}
                </p>
              )}
            </div>
          </Card>
        )}

        {stats.top.length > 0 && (
          <Card title="⭐ Lo que más usas">
            <div className="space-y-2.5">
              {stats.top.map(({ item, uses }) => {
                const cpu = item.price != null && uses > 0 ? item.price / uses : null
                return (
                  <MiniItem
                    key={item.id}
                    item={item}
                    detail={`${uses} ${uses === 1 ? 'uso' : 'usos'}${
                      cpu != null ? ` · ${euros(cpu)} por puesta` : ''
                    }`}
                  />
                )
              })}
            </div>
          </Card>
        )}

        {stats.forgotten.length > 0 && stats.daysLogged > 0 && (
          <Card title={`🕸️ Prendas olvidadas (${stats.forgotten.length})`}>
            <p className="mb-3 text-xs text-blush-400">
              Sin estrenar en el calendario. ¿Un outfit nuevo con alguna de ellas?
            </p>
            <div className="space-y-2.5">
              {stats.forgotten.slice(0, 5).map(({ item }) => (
                <MiniItem key={item.id} item={item} detail={item.category} />
              ))}
            </div>
          </Card>
        )}

        {stats.colorCounts.length > 0 && (
          <Card title="🎨 Tus colores">
            <div className="space-y-2">
              {stats.colorCounts
                .sort((a, b) => b.count - a.count)
                .map((c) => (
                  <div key={c.name} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border border-black/10"
                      style={
                        c.hex === 'conic-gradient'
                          ? { background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }
                          : { backgroundColor: c.hex }
                      }
                    />
                    <span className="w-20 shrink-0 text-xs text-blush-500">{c.name}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-blush-50">
                      <div
                        className="h-full rounded-full bg-blush-300"
                        style={{ width: `${(c.count / stats.maxColor) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-xs text-blush-400">{c.count}</span>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {stats.categoryCounts.length > 0 && (
          <Card title="👚 Por categorías">
            <div className="flex flex-wrap gap-2">
              {stats.categoryCounts.map((c) => (
                <span
                  key={c.cat}
                  className="rounded-full bg-blush-50 px-3 py-1.5 text-xs text-blush-600"
                >
                  {c.cat} <strong className="text-blush-800">{c.count}</strong>
                </span>
              ))}
            </div>
          </Card>
        )}
        {usage && (
          <Card title="💾 Espacio usado (plan gratuito)">
            <div className="space-y-3">
              <UsageBar label="📷 Fotos" used={usage.storage_bytes} limit={STORAGE_LIMIT_BYTES} />
              <UsageBar label="🗄️ Base de datos" used={usage.db_bytes} limit={DB_LIMIT_BYTES} />
              <p className="text-xs text-blush-400">
                Si alguna barra se acerca al máximo, borra fotos o cosas que ya no uses. Con la
                compresión automática caben miles de prendas, así que tranquila 😉
              </p>
            </div>
          </Card>
        )}
      </div>

      {items.length === 0 && (
        <EmptyState icon="📊" text="Añade prendas y registra outfits en el calendario para ver tus estadísticas" />
      )}
    </div>
  )
}
