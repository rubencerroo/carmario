import { useState } from 'react'
import { useStore } from '../lib/store'
import { photoUrl } from '../lib/supabase'
import { Field, Modal, inputCls } from './ui'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

/** Editor del outfit/notas de un día concreto. Se usa en el calendario y en el atajo "Hoy me pongo". */
export default function DayEditor({ date, onClose }: { date: string; onClose: () => void }) {
  const { outfits, entries, setEntry, removeEntry } = useStore()
  const entry = entries.find((e) => e.date === date)
  const [outfitId, setOutfitId] = useState(entry?.outfit_id ?? '')
  const [notes, setNotes] = useState(entry?.notes ?? '')
  const [busy, setBusy] = useState(false)

  const [y, m, d] = date.split('-').map(Number)
  const title = `${d} de ${MONTHS[m - 1].toLowerCase()} de ${y}`

  async function save() {
    setBusy(true)
    try {
      await setEntry(date, outfitId || null, notes.trim() || null)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  async function clear() {
    setBusy(true)
    try {
      await removeEntry(date)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Outfit del día">
          {outfits.length === 0 ? (
            <p className="text-sm text-blush-400">
              Aún no hay outfits creados. Crea uno en la sección Outfits.
            </p>
          ) : (
            <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto rounded-xl bg-blush-50 p-2">
              {outfits.map((o) => {
                const url = photoUrl(o.image_path)
                const active = outfitId === o.id
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setOutfitId(active ? '' : o.id)}
                    className={`overflow-hidden rounded-xl bg-white text-left shadow-sm ring-blush-600 transition ${
                      active ? 'ring-3' : ''
                    }`}
                  >
                    <div className="flex aspect-square items-center justify-center bg-blush-100">
                      {url ? (
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-2xl opacity-40">✨</span>
                      )}
                    </div>
                    <p className="truncate p-2 text-xs font-medium">{o.name}</p>
                  </button>
                )
              })}
            </div>
          )}
        </Field>

        <Field label="Notas del día">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Cena con amigas, boda de Marta…"
            className={inputCls}
          />
        </Field>

        <div className="flex gap-3">
          {entry && (
            <button
              type="button"
              onClick={clear}
              disabled={busy}
              className="rounded-xl px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
            >
              Vaciar día
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={busy || (!outfitId && !notes.trim())}
            className="ml-auto rounded-xl bg-blush-600 px-6 py-2.5 font-medium text-white transition hover:bg-blush-700 disabled:opacity-50"
          >
            {busy ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
