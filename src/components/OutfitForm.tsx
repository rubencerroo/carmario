import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useStore } from '../lib/store'
import { photoUrl } from '../lib/supabase'
import type { Outfit } from '../lib/types'
import { OCCASIONS, SEASONS } from '../lib/types'
import ItemCard from './ItemCard'
import { Chip, EmptyState, Field, Modal, PhotoInput, TagInput, inputCls } from './ui'

const PICKER_TABS = [
  { kind: 'prenda', label: '👚 Prendas' },
  { kind: 'colonia', label: '🌸 Colonias' },
  { kind: 'maquillaje', label: '💄 Maquillaje' },
] as const

export default function OutfitForm({
  existing,
  onClose,
}: {
  existing?: Outfit
  onClose: () => void
}) {
  const { items, saveOutfit, deleteOutfit } = useStore()

  const [name, setName] = useState(existing?.name ?? '')
  const [occasion, setOccasion] = useState(existing?.occasion ?? '')
  const [season, setSeason] = useState(existing?.season ?? '')
  const [tags, setTags] = useState<string[]>(existing?.tags ?? [])
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [selected, setSelected] = useState<Set<string>>(
    new Set(existing?.outfit_items.map((oi) => oi.item_id) ?? []),
  )
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string | null>(photoUrl(existing?.image_path ?? null))
  const [tab, setTab] = useState<(typeof PICKER_TABS)[number]['kind']>('prenda')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tabItems = useMemo(() => items.filter((i) => i.kind === tab), [items, tab])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await saveOutfit(
        {
          name: name.trim(),
          occasion: occasion || null,
          season: season || null,
          tags,
          notes: notes.trim() || null,
          favorite: existing?.favorite ?? false,
          itemIds: [...selected],
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
    if (!confirm(`¿Eliminar el outfit "${existing.name}"?`)) return
    setBusy(true)
    try {
      await deleteOutfit(existing)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
      setBusy(false)
    }
  }

  return (
    <Modal title={existing ? 'Editar outfit' : 'Nuevo outfit'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          <div className="w-32 shrink-0">
            <PhotoInput
              previewUrl={preview}
              onChange={(blob, url) => {
                setPhoto(blob)
                setPreview(url)
              }}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <Field label="Nombre">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Look de viernes"
                required
                className={inputCls}
              />
            </Field>
            <Field label="Ocasión">
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className={inputCls}
              >
                <option value="">—</option>
                {OCCASIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

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

        <Field label={`Piezas del outfit (${selected.size} seleccionadas)`}>
          <div className="mb-2 flex gap-2">
            {PICKER_TABS.map((t) => (
              <Chip key={t.kind} active={tab === t.kind} onClick={() => setTab(t.kind)}>
                {t.label}
              </Chip>
            ))}
          </div>
          {tabItems.length === 0 ? (
            <EmptyState icon="🧺" text="No hay nada en esta sección todavía" />
          ) : (
            <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto rounded-xl bg-blush-50 p-2">
              {tabItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  selected={selected.has(item.id)}
                  onClick={() => toggle(item.id)}
                />
              ))}
            </div>
          )}
        </Field>

        <Field label="Notas">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Para la cena del sábado…"
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
