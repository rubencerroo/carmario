import { useStore } from '../lib/store'
import { photoUrl } from '../lib/supabase'
import type { Item } from '../lib/types'
import { COLORS, DEFAULT_STATUS, STATUSES } from '../lib/types'
import { FavStar } from './ui'

const KIND_ICON: Record<Item['kind'], string> = {
  prenda: '👚',
  colonia: '🌸',
  maquillaje: '💄',
}

export default function ItemCard({
  item,
  onClick,
  selected,
}: {
  item: Item
  onClick: () => void
  selected?: boolean
}) {
  const { toggleItemFavorite } = useStore()
  const url = photoUrl(item.image_path)
  const colorHex = COLORS.find((c) => c.name === item.color)?.hex
  const away = item.status !== DEFAULT_STATUS
  const statusEmoji = STATUSES.find((s) => s.name === item.status)?.emoji ?? '📍'

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
      className={`group cursor-pointer overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-blush-600 transition hover:shadow-md ${
        selected ? 'ring-3' : ''
      }`}
    >
      <div className="relative aspect-square bg-blush-100">
        {url ? (
          <img src={url} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl opacity-40">
            {KIND_ICON[item.kind]}
          </div>
        )}
        <div className="absolute top-2 right-2">
          <FavStar active={item.favorite} onClick={() => toggleItemFavorite(item)} />
        </div>
        {selected && (
          <div className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-blush-700 text-sm text-white">
            ✓
          </div>
        )}
        {away && (
          <span
            className="absolute bottom-2 left-2 flex max-w-[85%] items-center gap-1 truncate rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-white backdrop-blur"
            title={item.status_note ?? item.status}
          >
            {statusEmoji} {item.status_note || item.status}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-blush-400">
          {colorHex && (
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-full border border-black/10"
              style={
                colorHex === 'conic-gradient'
                  ? { background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }
                  : { backgroundColor: colorHex }
              }
            />
          )}
          <span className="truncate">
            {item.category}
            {item.brand ? ` · ${item.brand}` : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
