import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { photoUrl } from '../lib/supabase'
import { EmptyState } from '../components/ui'
import DayEditor from '../components/DayEditor'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function CalendarPage() {
  const { outfits, entries, error } = useStore()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const days = useMemo(() => {
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // lunes = 0
    const count = new Date(year, month + 1, 0).getDate()
    return { firstWeekday, count }
  }, [year, month])

  const byDate = useMemo(() => new Map(entries.map((e) => [e.date, e])), [entries])
  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate())

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  if (error) return <EmptyState icon="⚠️" text={`Error al cargar los datos: ${error}`} />

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-display shrink-0 text-2xl text-blush-800 md:text-3xl">Calendario</h2>
        <div className="flex min-w-0 items-center gap-1">
          <button
            onClick={() => shift(-1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-blush-500 hover:bg-blush-100"
            aria-label="Mes anterior"
          >
            ‹
          </button>
          <span className="min-w-0 flex-1 truncate text-center text-sm font-medium text-blush-700 md:w-44 md:flex-none md:text-base">
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={() => shift(1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-blush-500 hover:bg-blush-100"
            aria-label="Mes siguiente"
          >
            ›
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-3 shadow-sm md:p-5">
        <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-blush-400">
          {WEEKDAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5 md:gap-2">
          {Array.from({ length: days.firstWeekday }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {Array.from({ length: days.count }).map((_, i) => {
            const day = i + 1
            const iso = toISO(year, month, day)
            const entry = byDate.get(iso)
            const outfit = entry?.outfit_id
              ? outfits.find((o) => o.id === entry.outfit_id)
              : undefined
            const cover = outfit ? photoUrl(outfit.image_path) : null
            const isToday = iso === todayISO
            return (
              <button
                key={iso}
                onClick={() => setSelectedDate(iso)}
                className={`relative flex aspect-square flex-col overflow-hidden rounded-xl border text-left transition hover:border-blush-400 ${
                  isToday ? 'border-blush-600 ring-1 ring-blush-600' : 'border-blush-100'
                } ${entry ? 'bg-blush-50' : 'bg-white'}`}
              >
                <span
                  className={`absolute top-1 left-1.5 z-10 text-[11px] font-medium md:text-xs ${
                    isToday
                      ? 'flex h-5 w-5 items-center justify-center rounded-full bg-blush-600 text-white'
                      : 'text-blush-500'
                  }`}
                >
                  {day}
                </span>
                {cover ? (
                  <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : outfit ? (
                  <span className="m-auto text-lg">✨</span>
                ) : entry?.notes ? (
                  <span className="m-auto text-sm opacity-50">📝</span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <p className="mt-3 text-center text-sm text-blush-400">
        Toca un día para apuntar qué outfit llevaste
      </p>

      {selectedDate && <DayEditor date={selectedDate} onClose={() => setSelectedDate(null)} />}
    </div>
  )
}
