import { useState } from 'react'
import type { FormEvent } from 'react'
import { useStore } from '../lib/store'
import { photoUrl } from '../lib/supabase'
import type { Item, ItemKind } from '../lib/types'
import {
  COLORS,
  DEFAULT_STATUS,
  GARMENT_CATEGORIES,
  MAKEUP_CATEGORIES,
  PERFUME_CATEGORIES,
  SEASONS,
  STATUSES,
} from '../lib/types'
import { Field, Modal, PhotoInput, TagInput, inputCls } from './ui'

function categoriesFor(kind: ItemKind): readonly string[] {
  if (kind === 'prenda') return GARMENT_CATEGORIES
  if (kind === 'colonia') return PERFUME_CATEGORIES
  return MAKEUP_CATEGORIES
}

export default function ItemForm({
  kind,
  existing,
  onClose,
}: {
  kind: ItemKind
  existing?: Item
  onClose: () => void
}) {
  const { saveItem, deleteItem } = useStore()
  const categories = categoriesFor(kind)

  const [name, setName] = useState(existing?.name ?? '')
  const [category, setCategory] = useState(existing?.category ?? categories[0])
  const [brand, setBrand] = useState(existing?.brand ?? '')
  const [color, setColor] = useState(existing?.color ?? '')
  const [season, setSeason] = useState(existing?.season ?? '')
  const [tags, setTags] = useState<string[]>(existing?.tags ?? [])
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [status, setStatus] = useState(existing?.status ?? DEFAULT_STATUS)
  const [statusNote, setStatusNote] = useState(existing?.status_note ?? '')
  const [price, setPrice] = useState(existing?.price != null ? String(existing.price) : '')
  const [purchasedAt, setPurchasedAt] = useState(existing?.purchased_at ?? '')
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string | null>(photoUrl(existing?.image_path ?? null))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await saveItem(
        {
          kind,
          name: name.trim(),
          category,
          brand: brand.trim() || null,
          color: color || null,
          season: season || null,
          tags,
          notes: notes.trim() || null,
          favorite: existing?.favorite ?? false,
          status,
          status_note: status === DEFAULT_STATUS ? null : statusNote.trim() || null,
          price: price.trim() ? Number(price.replace(',', '.')) : null,
          purchased_at: purchasedAt || null,
        },
        photo,
        existing,
      )
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!existing) return
    if (!confirm(`¿Eliminar "${existing.name}"? Esta acción no se puede deshacer.`)) return
    setBusy(true)
    try {
      await deleteItem(existing)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
      setBusy(false)
    }
  }

  const kindLabel = kind === 'prenda' ? 'prenda' : kind === 'colonia' ? 'colonia' : 'maquillaje'

  return (
    <Modal title={existing ? `Editar ${kindLabel}` : `Nueva ${kindLabel}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mx-auto w-40">
          <PhotoInput
            previewUrl={preview}
            onChange={(blob, url) => {
              setPhoto(blob)
              setPreview(url)
            }}
          />
        </div>

        <Field label="Nombre">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={kind === 'prenda' ? 'Vaqueros anchos' : 'Nombre'}
            required
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoría">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputCls}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Marca">
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Zara…"
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Color">
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c.name}
                type="button"
                title={c.name}
                onClick={() => setColor(color === c.name ? '' : c.name)}
                className={`h-8 w-8 rounded-full border transition ${
                  color === c.name
                    ? 'scale-110 ring-2 ring-blush-600 ring-offset-2'
                    : 'border-black/10'
                }`}
                style={
                  c.hex === 'conic-gradient'
                    ? { background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }
                    : { backgroundColor: c.hex }
                }
              />
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Temporada">
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className={inputCls}
            >
              <option value="">—</option>
              {SEASONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Etiquetas">
            <TagInput tags={tags} onChange={setTags} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="¿Dónde está?">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputCls}
            >
              {STATUSES.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.emoji} {s.name}
                </option>
              ))}
            </select>
          </Field>
          {status !== DEFAULT_STATUS ? (
            <Field label="Detalle">
              <input
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder={status === 'Prestada' ? '¿A quién?' : '¿Dónde?'}
                className={inputCls}
              />
            </Field>
          ) : (
            <div />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Precio (€)">
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              placeholder="29,95"
              className={inputCls}
            />
          </Field>
          <Field label="Fecha de compra">
            <input
              type="date"
              value={purchasedAt}
              onChange={(e) => setPurchasedAt(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Notas">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Talla, dónde la compró, con qué combina…"
            className={inputCls}
          />
        </Field>

        {error && <p className="text-sm text-red-500">{error}</p>}

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
