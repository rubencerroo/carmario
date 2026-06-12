import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useStore } from '../lib/store'
import { photoUrl } from '../lib/supabase'
import type { Trip } from '../lib/types'
import ItemCard from '../components/ItemCard'
import { Chip, EmptyState, Field, Modal, inputCls } from '../components/ui'

function formatRange(trip: Trip): string | null {
  if (!trip.start_date) return null
  const fmt = (d: string) =>
    new Date(`${d}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  return trip.end_date && trip.end_date !== trip.start_date
    ? `${fmt(trip.start_date)} – ${fmt(trip.end_date)}`
    : fmt(trip.start_date)
}

function TripForm({ existing, onClose }: { existing?: Trip; onClose: () => void }) {
  const { saveTrip, deleteTrip } = useStore()
  const [name, setName] = useState(existing?.name ?? '')
  const [start, setStart] = useState(existing?.start_date ?? '')
  const [end, setEnd] = useState(existing?.end_date ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await saveTrip(
        {
          name: name.trim(),
          start_date: start || null,
          end_date: end || null,
          notes: notes.trim() || null,
        },
        existing,
      )
      onClose()
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!existing) return
    if (!confirm(`¿Eliminar la maleta "${existing.name}"?`)) return
    setBusy(true)
    try {
      await deleteTrip(existing)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={existing ? 'Editar viaje' : 'Nuevo viaje'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Destino / nombre">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Finde en París"
            required
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Desde">
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Hasta">
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Notas">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Boda el sábado, lloverá…"
            className={inputCls}
          />
        </Field>
        <div className="flex gap-3 pt-1">
          {existing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="rounded-xl px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
            >
              Eliminar
            </button>
          )}
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="ml-auto rounded-xl bg-blush-600 px-6 py-2.5 font-medium text-white transition hover:bg-blush-700 disabled:opacity-50"
          >
            {busy ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/** Selector de prendas del armario para meter en la maleta. */
function TripItemPicker({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const { items, setTripItems } = useStore()
  const [selected, setSelected] = useState<Set<string>>(
    new Set(trip.trip_items.map((ti) => ti.item_id)),
  )
  const [tab, setTab] = useState<'prenda' | 'colonia' | 'maquillaje'>('prenda')
  const [busy, setBusy] = useState(false)
  const tabItems = useMemo(() => items.filter((i) => i.kind === tab), [items, tab])

  async function save() {
    setBusy(true)
    try {
      await setTripItems(trip, [...selected])
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={`Elegir qué llevar (${selected.size})`} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Chip active={tab === 'prenda'} onClick={() => setTab('prenda')}>👚 Prendas</Chip>
          <Chip active={tab === 'colonia'} onClick={() => setTab('colonia')}>🌸 Colonias</Chip>
          <Chip active={tab === 'maquillaje'} onClick={() => setTab('maquillaje')}>💄 Maquillaje</Chip>
        </div>
        {tabItems.length === 0 ? (
          <EmptyState icon="🧺" text="No hay nada en esta sección todavía" />
        ) : (
          <div className="grid max-h-96 grid-cols-3 gap-2 overflow-y-auto rounded-xl bg-blush-50 p-2">
            {tabItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                selected={selected.has(item.id)}
                onClick={() =>
                  setSelected((prev) => {
                    const next = new Set(prev)
                    if (next.has(item.id)) next.delete(item.id)
                    else next.add(item.id)
                    return next
                  })
                }
              />
            ))}
          </div>
        )}
        <button
          onClick={save}
          disabled={busy}
          className="w-full rounded-xl bg-blush-600 py-3 font-medium text-white transition hover:bg-blush-700 disabled:opacity-50"
        >
          {busy ? 'Guardando…' : 'Guardar selección'}
        </button>
      </div>
    </Modal>
  )
}

function TripDetail({ tripId, onClose }: { tripId: string; onClose: () => void }) {
  const { items, trips, toggleTripItemPacked, addTripExtra, toggleTripExtra, removeTripExtra } =
    useStore()
  const trip = trips.find((t) => t.id === tripId)
  const [picking, setPicking] = useState(false)
  const [editing, setEditing] = useState(false)
  const [extraDraft, setExtraDraft] = useState('')

  if (!trip) return null

  const packables = trip.trip_items
    .map((ti) => ({ ...ti, item: items.find((i) => i.id === ti.item_id) }))
    .filter((ti) => ti.item != null)
  const packedCount =
    packables.filter((p) => p.packed).length + trip.trip_extras.filter((e) => e.packed).length
  const totalCount = packables.length + trip.trip_extras.length
  const range = formatRange(trip)

  async function submitExtra(e: FormEvent) {
    e.preventDefault()
    const name = extraDraft.trim()
    if (!name) return
    setExtraDraft('')
    await addTripExtra(trip!, name)
  }

  return (
    <Modal title={`🧳 ${trip.name}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-blush-500">
          <span>{range ?? 'Sin fechas'}</span>
          <button onClick={() => setEditing(true)} className="text-blush-600 underline">
            Editar viaje
          </button>
        </div>
        {trip.notes && <p className="rounded-xl bg-blush-50 p-3 text-sm">{trip.notes}</p>}

        {totalCount > 0 && (
          <div>
            <div className="mb-1 flex justify-between text-xs text-blush-500">
              <span>Maleta</span>
              <span>
                {packedCount}/{totalCount} listo
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-blush-100">
              <div
                className="h-full rounded-full bg-blush-500 transition-all"
                style={{ width: `${totalCount ? (packedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          {packables.map(({ item, packed }) => {
            const url = photoUrl(item!.image_path)
            return (
              <label
                key={item!.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl bg-white p-2 shadow-sm"
              >
                <input
                  type="checkbox"
                  checked={packed}
                  onChange={(e) => toggleTripItemPacked(trip, item!.id, e.target.checked)}
                  className="h-5 w-5 accent-blush-600"
                />
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-blush-100">
                  {url && <img src={url} alt="" className="h-full w-full object-cover" />}
                </div>
                <span className={`truncate text-sm ${packed ? 'text-blush-300 line-through' : ''}`}>
                  {item!.name}
                </span>
              </label>
            )
          })}
          {trip.trip_extras.map((e) => (
            <label
              key={e.id}
              className="flex cursor-pointer items-center gap-3 rounded-xl bg-white p-2 shadow-sm"
            >
              <input
                type="checkbox"
                checked={e.packed}
                onChange={(ev) => toggleTripExtra(e.id, ev.target.checked)}
                className="h-5 w-5 accent-blush-600"
              />
              <span className={`flex-1 truncate text-sm ${e.packed ? 'text-blush-300 line-through' : ''}`}>
                {e.name}
              </span>
              <button
                type="button"
                onClick={(ev) => {
                  ev.preventDefault()
                  removeTripExtra(e.id)
                }}
                className="px-2 text-blush-300 hover:text-red-400"
                aria-label={`Quitar ${e.name}`}
              >
                ✕
              </button>
            </label>
          ))}
        </div>

        <button
          onClick={() => setPicking(true)}
          className="w-full rounded-xl bg-blush-100 py-2.5 text-sm font-medium text-blush-700 transition hover:bg-blush-200"
        >
          👚 Elegir del armario ({packables.length})
        </button>

        <form onSubmit={submitExtra} className="flex gap-2">
          <input
            value={extraDraft}
            onChange={(e) => setExtraDraft(e.target.value)}
            placeholder="Otra cosa: cargador, neceser…"
            className={inputCls}
          />
          <button
            type="submit"
            disabled={!extraDraft.trim()}
            className="shrink-0 rounded-xl bg-blush-600 px-4 text-white disabled:opacity-50"
          >
            +
          </button>
        </form>
      </div>
      {picking && <TripItemPicker trip={trip} onClose={() => setPicking(false)} />}
      {editing && <TripForm existing={trip} onClose={() => setEditing(false)} />}
    </Modal>
  )
}

export default function TripsPage() {
  const { trips, loading, error } = useStore()
  const [creating, setCreating] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  if (error) return <EmptyState icon="⚠️" text={`Error al cargar los datos: ${error}`} />

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-blush-800 md:text-3xl">Maletas</h2>
        <button
          onClick={() => setCreating(true)}
          className="rounded-xl bg-blush-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blush-700"
        >
          + Nuevo viaje
        </button>
      </div>

      {loading ? (
        <EmptyState icon="⏳" text="Cargando…" />
      ) : trips.length === 0 ? (
        <EmptyState icon="🧳" text="Sin viajes a la vista. ¡Crea tu primera maleta!" />
      ) : (
        <div className="space-y-3">
          {trips.map((t) => {
            const total = t.trip_items.length + t.trip_extras.length
            const packed =
              t.trip_items.filter((ti) => ti.packed).length +
              t.trip_extras.filter((e) => e.packed).length
            const range = formatRange(t)
            return (
              <button
                key={t.id}
                onClick={() => setOpenId(t.id)}
                className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm transition hover:shadow-md"
              >
                <span className="text-3xl">🧳</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{t.name}</p>
                  <p className="text-sm text-blush-400">
                    {range ?? 'Sin fechas'} · {total} {total === 1 ? 'cosa' : 'cosas'}
                  </p>
                </div>
                {total > 0 && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      packed === total
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blush-100 text-blush-600'
                    }`}
                  >
                    {packed === total ? '✓ Lista' : `${packed}/${total}`}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {creating && <TripForm onClose={() => setCreating(false)} />}
      {openId && <TripDetail tripId={openId} onClose={() => setOpenId(null)} />}
    </div>
  )
}
