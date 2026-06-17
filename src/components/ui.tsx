import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { compressImage, removeBg, preloadBgModel } from '../lib/image'

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm md:items-center md:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl md:rounded-3xl md:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-blush-800">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-blush-400 hover:bg-blush-100"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export const inputCls =
  'w-full rounded-xl border border-blush-200 bg-blush-50 px-3 py-2.5 text-sm outline-none focus:border-blush-400'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium tracking-wide text-blush-500 uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}

/**
 * Selector de foto con cámara/galería, compresión, previsualización y
 * recorte de fondo opcional (siempre se puede volver a la original).
 */
export function PhotoInput({
  previewUrl,
  onChange,
}: {
  previewUrl: string | null
  onChange: (blob: Blob, localUrl: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [cutBusy, setCutBusy] = useState(false)
  const [cutError, setCutError] = useState(false)
  const [orig, setOrig] = useState<{ blob: Blob; url: string } | null>(null)
  const [cut, setCut] = useState<{ blob: Blob; url: string } | null>(null)
  const [active, setActive] = useState<'orig' | 'cut'>('orig')

  const shownUrl = active === 'cut' && cut ? cut.url : (orig?.url ?? previewUrl)

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setCut(null)
    setCutError(false)
    setActive('orig')
    try {
      const blob = await compressImage(file)
      const url = URL.createObjectURL(blob)
      setOrig({ blob, url })
      onChange(blob, url)
      // Calienta el modelo de IA en segundo plano por si pulsa "Quitar fondo".
      preloadBgModel()
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  async function handleRemoveBg() {
    if (!orig || cutBusy) return
    setCutBusy(true)
    setCutError(false)
    try {
      const blob = await removeBg(orig.blob)
      const url = URL.createObjectURL(blob)
      setCut({ blob, url })
      setActive('cut')
      onChange(blob, url)
    } catch {
      setCutError(true)
    } finally {
      setCutBusy(false)
    }
  }

  function pick(which: 'orig' | 'cut') {
    setActive(which)
    const v = which === 'cut' ? cut : orig
    if (v) onChange(v.blob, v.url)
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-blush-300 bg-blush-50 text-blush-400 transition hover:border-blush-400"
      >
        {shownUrl ? (
          <img src={shownUrl} alt="" className="h-full w-full object-contain" />
        ) : (
          <span className="px-4 text-center text-sm">
            {busy ? 'Procesando…' : '📷 Toca para añadir foto'}
          </span>
        )}
        {shownUrl && (
          <span className="absolute right-2 bottom-2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
            Cambiar
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </button>

      {orig && !cut && (
        <button
          type="button"
          onClick={handleRemoveBg}
          disabled={cutBusy}
          className="w-full rounded-xl bg-blush-100 py-2 text-xs font-medium text-blush-700 transition hover:bg-blush-200 disabled:opacity-60"
        >
          {cutBusy ? '✂️ Quitando fondo…' : '✂️ Quitar fondo'}
        </button>
      )}
      {cut && (
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => pick('orig')}
            className={`flex-1 rounded-xl py-2 text-xs font-medium transition ${
              active === 'orig'
                ? 'bg-blush-700 text-white'
                : 'bg-blush-100 text-blush-600 hover:bg-blush-200'
            }`}
          >
            Original
          </button>
          <button
            type="button"
            onClick={() => pick('cut')}
            className={`flex-1 rounded-xl py-2 text-xs font-medium transition ${
              active === 'cut'
                ? 'bg-blush-700 text-white'
                : 'bg-blush-100 text-blush-600 hover:bg-blush-200'
            }`}
          >
            ✂️ Sin fondo
          </button>
        </div>
      )}
      {cutError && (
        <p className="text-center text-xs text-blush-400">
          No se pudo quitar el fondo, se usará la foto original
        </p>
      )}
    </div>
  )
}

/** Diálogo de confirmación propio (sustituye al confirm() del navegador). */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Eliminar',
  busy = false,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-3xl">🗑️</div>
        <h3 className="font-display mt-2 text-lg text-blush-800">{title}</h3>
        <p className="mt-1 text-sm text-blush-500">{message}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-xl bg-blush-100 py-2.5 text-sm font-medium text-blush-700 transition hover:bg-blush-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-60"
          >
            {busy ? '…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Entrada de etiquetas separadas por comas o Enter. */
export function TagInput({
  tags,
  onChange,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  function commit() {
    const t = draft.trim().replace(/,$/, '')
    if (t && !tags.includes(t)) onChange([...tags, t])
    setDraft('')
  }

  return (
    <div className={`${inputCls} flex flex-wrap items-center gap-1.5`}>
      {tags.map((t) => (
        <span
          key={t}
          className="flex items-center gap-1 rounded-full bg-blush-200 px-2.5 py-0.5 text-xs text-blush-800"
        >
          {t}
          <button
            type="button"
            onClick={() => onChange(tags.filter((x) => x !== t))}
            className="text-blush-500"
            aria-label={`Quitar ${t}`}
          >
            ✕
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => {
          if (e.target.value.endsWith(',')) {
            setDraft(e.target.value)
            commit()
          } else setDraft(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
        }}
        onBlur={commit}
        placeholder={tags.length === 0 ? 'casual, fiesta…' : ''}
        className="min-w-20 flex-1 bg-transparent outline-none"
      />
    </div>
  )
}

export function FavStar({
  active,
  onClick,
}: {
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-lg shadow-sm backdrop-blur transition ${
        active ? '' : 'grayscale opacity-60'
      }`}
      aria-label="Favorito"
    >
      ⭐
    </button>
  )
}

export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-blush-400">
      <span className="text-4xl">{icon}</span>
      <p className="text-sm">{text}</p>
    </div>
  )
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm whitespace-nowrap transition ${
        active
          ? 'bg-blush-700 text-white'
          : 'bg-white text-blush-600 ring-1 ring-blush-200 hover:bg-blush-100'
      }`}
    >
      {children}
    </button>
  )
}
