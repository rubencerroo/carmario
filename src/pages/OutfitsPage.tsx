import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { photoUrl } from '../lib/supabase'
import type { Outfit } from '../lib/types'
import { OCCASIONS } from '../lib/types'
import OutfitForm from '../components/OutfitForm'
import { Chip, EmptyState, FavStar, inputCls } from '../components/ui'

function OutfitCard({ outfit, onClick }: { outfit: Outfit; onClick: () => void }) {
  const { items, toggleOutfitFavorite } = useStore()
  const cover = photoUrl(outfit.image_path)
  const pieces = outfit.outfit_items
    .map((oi) => items.find((i) => i.id === oi.item_id))
    .filter((i) => i != null)
  const thumbs = pieces.slice(0, 4)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="group cursor-pointer overflow-hidden rounded-2xl bg-white text-left shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-square bg-blush-100">
        {cover ? (
          <img src={cover} alt={outfit.name} loading="lazy" className="h-full w-full object-cover" />
        ) : thumbs.length > 0 ? (
          <div className={`grid h-full ${thumbs.length === 1 ? '' : 'grid-cols-2'}`}>
            {thumbs.map((p) => {
              const u = photoUrl(p.image_path)
              return u ? (
                <img key={p.id} src={u} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div key={p.id} className="flex items-center justify-center text-2xl opacity-40">
                  👚
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-4xl opacity-40">✨</div>
        )}
        <div className="absolute top-2 right-2">
          <FavStar active={outfit.favorite} onClick={() => toggleOutfitFavorite(outfit)} />
        </div>
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium">{outfit.name}</p>
        <p className="mt-1 truncate text-xs text-blush-400">
          {pieces.length} {pieces.length === 1 ? 'pieza' : 'piezas'}
          {outfit.occasion ? ` · ${outfit.occasion}` : ''}
        </p>
      </div>
    </div>
  )
}

export default function OutfitsPage() {
  const { outfits, loading, error } = useStore()
  const [search, setSearch] = useState('')
  const [occasion, setOccasion] = useState('')
  const [onlyFavs, setOnlyFavs] = useState(false)
  const [editing, setEditing] = useState<Outfit | null>(null)
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return outfits.filter((o) => {
      if (occasion && o.occasion !== occasion) return false
      if (onlyFavs && !o.favorite) return false
      if (q) {
        const hay = [o.name, o.occasion, o.season, ...o.tags, o.notes]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [outfits, occasion, onlyFavs, search])

  const usedOccasions = useMemo(
    () => OCCASIONS.filter((o) => outfits.some((x) => x.occasion === o)),
    [outfits],
  )

  if (error) return <EmptyState icon="⚠️" text={`Error al cargar los datos: ${error}`} />

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-blush-800 md:text-3xl">Outfits</h2>
        <button
          onClick={() => setCreating(true)}
          className="rounded-xl bg-blush-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blush-700"
        >
          + Crear outfit
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar outfits…"
        className={`${inputCls} mb-3`}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Chip active={!occasion && !onlyFavs} onClick={() => { setOccasion(''); setOnlyFavs(false) }}>
          Todo
        </Chip>
        <Chip active={onlyFavs} onClick={() => setOnlyFavs(!onlyFavs)}>
          ⭐ Favoritos
        </Chip>
        {usedOccasions.map((o) => (
          <Chip key={o} active={occasion === o} onClick={() => setOccasion(occasion === o ? '' : o)}>
            {o}
          </Chip>
        ))}
      </div>

      {loading ? (
        <EmptyState icon="⏳" text="Cargando…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="✨"
          text={
            outfits.length > 0
              ? 'Nada coincide con la búsqueda'
              : 'Aún no hay outfits. ¡Crea el primero combinando tus prendas!'
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((o) => (
            <OutfitCard key={o.id} outfit={o} onClick={() => setEditing(o)} />
          ))}
        </div>
      )}

      {creating && <OutfitForm onClose={() => setCreating(false)} />}
      {editing && <OutfitForm existing={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
