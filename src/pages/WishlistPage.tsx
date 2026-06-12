import { useState } from 'react'
import type { FormEvent } from 'react'
import { useStore } from '../lib/store'
import { photoUrl } from '../lib/supabase'
import type { Wish } from '../lib/types'
import { GARMENT_CATEGORIES, MAKEUP_CATEGORIES, PERFUME_CATEGORIES } from '../lib/types'
import { ConfirmDialog, EmptyState, Field, Modal, PhotoInput, inputCls } from '../components/ui'

function formatPrice(n: number | null): string | null {
  if (n == null) return null
  return `${n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`
}

function WishForm({ existing, onClose }: { existing?: Wish; onClose: () => void }) {
  const { saveWish, deleteWish } = useStore()
  const [name, setName] = useState(existing?.name ?? '')
  const [store, setStore] = useState(existing?.store ?? '')
  const [price, setPrice] = useState(existing?.price != null ? String(existing.price) : '')
  const [url, setUrl] = useState(existing?.url ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string | null>(photoUrl(existing?.image_path ?? null))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await saveWish(
        {
          name: name.trim(),
          store: store.trim() || null,
          price: price.trim() ? Number(price.replace(',', '.')) : null,
          url: url.trim() || null,
          notes: notes.trim() || null,
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
    setBusy(true)
    try {
      await deleteWish(existing)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
      setConfirming(false)
      setBusy(false)
    }
  }

  return (
    <Modal title={existing ? 'Editar deseo' : 'Nuevo deseo'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mx-auto w-40">
          <PhotoInput
            previewUrl={preview}
            onChange={(blob, u) => {
              setPhoto(blob)
              setPreview(u)
            }}
          />
        </div>
        <Field label="¿Qué es?">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Botas altas marrones"
            required
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tienda / marca">
            <input
              value={store}
              onChange={(e) => setStore(e.target.value)}
              placeholder="Zara…"
              className={inputCls}
            />
          </Field>
          <Field label="Precio (€)">
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              placeholder="49,95"
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Enlace">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            type="url"
            placeholder="https://…"
            className={inputCls}
          />
        </Field>
        <Field label="Notas">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Esperar a rebajas, talla 38…"
            className={inputCls}
          />
        </Field>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3 pt-1">
          {existing && (
            <button
              type="button"
              onClick={() => setConfirming(true)}
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
      {confirming && existing && (
        <ConfirmDialog
          title={`¿Eliminar "${existing.name}"?`}
          message="Se quitará de la lista de deseos."
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </Modal>
  )
}

/** Al marcar un deseo como comprado hay que decidir a qué sección del armario va. */
function PurchaseModal({ wish, onClose }: { wish: Wish; onClose: () => void }) {
  const { purchaseWish } = useStore()
  const [kind, setKind] = useState<'prenda' | 'colonia' | 'maquillaje'>('prenda')
  const categories =
    kind === 'prenda'
      ? GARMENT_CATEGORIES
      : kind === 'colonia'
        ? PERFUME_CATEGORIES
        : MAKEUP_CATEGORIES
  const [category, setCategory] = useState<string>(GARMENT_CATEGORIES[0])
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    try {
      await purchaseWish(wish, kind, category)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={`🎉 ¡Comprada! ¿Dónde la guardo?`} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-blush-500">
          "{wish.name}" pasará de la lista de deseos a tu colección.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sección">
            <select
              value={kind}
              onChange={(e) => {
                const k = e.target.value as typeof kind
                setKind(k)
                setCategory(
                  k === 'prenda'
                    ? GARMENT_CATEGORIES[0]
                    : k === 'colonia'
                      ? PERFUME_CATEGORIES[0]
                      : MAKEUP_CATEGORIES[0],
                )
              }}
              className={inputCls}
            >
              <option value="prenda">👚 Armario</option>
              <option value="colonia">🌸 Colonias</option>
              <option value="maquillaje">💄 Maquillaje</option>
            </select>
          </Field>
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
        </div>
        <button
          onClick={confirm}
          disabled={busy}
          className="w-full rounded-xl bg-blush-600 py-3 font-medium text-white transition hover:bg-blush-700 disabled:opacity-50"
        >
          {busy ? 'Guardando…' : 'Añadir a mi colección'}
        </button>
      </div>
    </Modal>
  )
}

export default function WishlistPage() {
  const { wishes, loading, error } = useStore()
  const [editing, setEditing] = useState<Wish | null>(null)
  const [creating, setCreating] = useState(false)
  const [purchasing, setPurchasing] = useState<Wish | null>(null)

  const total = wishes.reduce((sum, w) => sum + (w.price ?? 0), 0)

  if (error) return <EmptyState icon="⚠️" text={`Error al cargar los datos: ${error}`} />

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-blush-800 md:text-3xl">Lista de deseos</h2>
          {total > 0 && (
            <p className="text-sm text-blush-400">{formatPrice(total)} en caprichos pendientes</p>
          )}
        </div>
        <button
          onClick={() => setCreating(true)}
          className="rounded-xl bg-blush-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blush-700"
        >
          + Añadir
        </button>
      </div>

      {loading ? (
        <EmptyState icon="⏳" text="Cargando…" />
      ) : wishes.length === 0 ? (
        <EmptyState icon="🛍️" text="Nada pendiente de comprar. ¡Apunta aquí los caprichos!" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {wishes.map((w) => {
            const url = photoUrl(w.image_path)
            return (
              <div
                key={w.id}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => setEditing(w)}
                  className="block w-full text-left"
                >
                  <div className="relative aspect-square bg-blush-100">
                    {url ? (
                      <img src={url} alt={w.name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl opacity-40">
                        🛍️
                      </div>
                    )}
                    {w.price != null && (
                      <span className="absolute right-2 bottom-2 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white backdrop-blur">
                        {formatPrice(w.price)}
                      </span>
                    )}
                  </div>
                  <div className="p-3 pb-1">
                    <p className="truncate text-sm font-medium">{w.name}</p>
                    <p className="mt-0.5 truncate text-xs text-blush-400">
                      {w.store ?? ' '}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2 px-3 pb-3">
                  <button
                    type="button"
                    onClick={() => setPurchasing(w)}
                    className="flex-1 rounded-lg bg-blush-100 py-1.5 text-xs font-medium text-blush-700 transition hover:bg-blush-200"
                  >
                    ✓ ¡Comprada!
                  </button>
                  {w.url && (
                    <a
                      href={w.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-blush-50 px-2.5 py-1.5 text-xs text-blush-500 transition hover:bg-blush-100"
                      title="Ver en la tienda"
                    >
                      🔗
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {creating && <WishForm onClose={() => setCreating(false)} />}
      {editing && <WishForm existing={editing} onClose={() => setEditing(null)} />}
      {purchasing && <PurchaseModal wish={purchasing} onClose={() => setPurchasing(null)} />}
    </div>
  )
}
