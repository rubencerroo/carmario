import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import type { Item, ItemKind } from '../lib/types'
import {
  DEFAULT_STATUS,
  GARMENT_CATEGORIES,
  MAKEUP_CATEGORIES,
  PERFUME_CATEGORIES,
} from '../lib/types'
import ItemCard from '../components/ItemCard'
import ItemForm from '../components/ItemForm'
import { Chip, EmptyState, inputCls } from '../components/ui'

type Mode = 'armario' | 'belleza'

export default function ItemsPage({ mode }: { mode: Mode }) {
  const { items, loading, error } = useStore()
  const [beautyKind, setBeautyKind] = useState<ItemKind>('colonia')
  const kind: ItemKind = mode === 'armario' ? 'prenda' : beautyKind

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [onlyFavs, setOnlyFavs] = useState(false)
  const [onlyAway, setOnlyAway] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [creating, setCreating] = useState(false)

  const categories =
    kind === 'prenda'
      ? GARMENT_CATEGORIES
      : kind === 'colonia'
        ? PERFUME_CATEGORIES
        : MAKEUP_CATEGORIES

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((i) => {
      if (i.kind !== kind) return false
      if (category && i.category !== category) return false
      if (onlyFavs && !i.favorite) return false
      if (onlyAway && i.status === DEFAULT_STATUS) return false
      if (q) {
        const hay = [i.name, i.brand, i.color, i.category, i.season, i.status, i.status_note, ...i.tags, i.notes]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [items, kind, category, onlyFavs, onlyAway, search])

  const usedCategories = useMemo(
    () => categories.filter((c) => items.some((i) => i.kind === kind && i.category === c)),
    [categories, items, kind],
  )

  if (error) {
    return <EmptyState icon="⚠️" text={`Error al cargar los datos: ${error}`} />
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-blush-800 md:text-3xl">
          {mode === 'armario' ? 'Armario' : 'Belleza'}
        </h2>
        <button
          onClick={() => setCreating(true)}
          className="rounded-xl bg-blush-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blush-700"
        >
          + Añadir
        </button>
      </div>

      {mode === 'belleza' && (
        <div className="mb-4 flex gap-2">
          <Chip
            active={beautyKind === 'colonia'}
            onClick={() => {
              setBeautyKind('colonia')
              setCategory('')
            }}
          >
            🌸 Colonias
          </Chip>
          <Chip
            active={beautyKind === 'maquillaje'}
            onClick={() => {
              setBeautyKind('maquillaje')
              setCategory('')
            }}
          >
            💄 Maquillaje
          </Chip>
        </div>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre, marca, color, etiqueta…"
        className={`${inputCls} mb-3`}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Chip
          active={!category && !onlyFavs && !onlyAway}
          onClick={() => {
            setCategory('')
            setOnlyFavs(false)
            setOnlyAway(false)
          }}
        >
          Todo
        </Chip>
        <Chip active={onlyFavs} onClick={() => setOnlyFavs(!onlyFavs)}>
          ⭐ Favoritos
        </Chip>
        {items.some((i) => i.kind === kind && i.status !== DEFAULT_STATUS) && (
          <Chip active={onlyAway} onClick={() => setOnlyAway(!onlyAway)}>
            📍 Fuera de casa
          </Chip>
        )}
        {usedCategories.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(category === c ? '' : c)}>
            {c}
          </Chip>
        ))}
      </div>

      {loading ? (
        <EmptyState icon="⏳" text="Cargando…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={kind === 'prenda' ? '🧺' : kind === 'colonia' ? '🌸' : '💄'}
          text={
            items.some((i) => i.kind === kind)
              ? 'Nada coincide con la búsqueda'
              : 'Aún no hay nada aquí. ¡Añade lo primero!'
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} onClick={() => setEditing(item)} />
          ))}
        </div>
      )}

      {creating && <ItemForm kind={kind} onClose={() => setCreating(false)} />}
      {editing && <ItemForm kind={kind} existing={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
