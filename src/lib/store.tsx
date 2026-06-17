/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase, uploadPhoto, deletePhoto } from './supabase'
import { logActivity, tracked } from './log'
import type { CalendarEntry, Item, Outfit, Trip, Usage, Wish } from './types'

interface ItemInput {
  kind: Item['kind']
  name: string
  category: string
  brand: string | null
  color: string | null
  season: string | null
  tags: string[]
  notes: string | null
  favorite: boolean
  status: string
  status_note: string | null
  price: number | null
  purchased_at: string | null
}

interface WishInput {
  name: string
  store: string | null
  price: number | null
  url: string | null
  notes: string | null
}

interface OutfitInput {
  name: string
  occasion: string | null
  season: string | null
  tags: string[]
  notes: string | null
  favorite: boolean
  itemIds: string[]
}

interface Store {
  items: Item[]
  outfits: Outfit[]
  entries: CalendarEntry[]
  wishes: Wish[]
  trips: Trip[]
  usage: Usage | null
  loading: boolean
  error: string | null
  saveItem: (input: ItemInput, photo: Blob | null, existing?: Item) => Promise<void>
  deleteItem: (item: Item) => Promise<void>
  toggleItemFavorite: (item: Item) => Promise<void>
  setItemStatus: (item: Item, status: string, statusNote: string | null) => Promise<void>
  saveOutfit: (input: OutfitInput, photo: Blob | null, existing?: Outfit) => Promise<void>
  deleteOutfit: (outfit: Outfit) => Promise<void>
  toggleOutfitFavorite: (outfit: Outfit) => Promise<void>
  setEntry: (date: string, outfitId: string | null, notes: string | null) => Promise<void>
  removeEntry: (date: string) => Promise<void>
  saveWish: (input: WishInput, photo: Blob | null, existing?: Wish) => Promise<void>
  deleteWish: (wish: Wish) => Promise<void>
  /** Convierte un deseo comprado en prenda del armario (reutiliza la foto). */
  purchaseWish: (wish: Wish, kind: Item['kind'], category: string) => Promise<void>
  saveTrip: (
    input: { name: string; start_date: string | null; end_date: string | null; notes: string | null },
    existing?: Trip,
  ) => Promise<void>
  deleteTrip: (trip: Trip) => Promise<void>
  setTripItems: (trip: Trip, itemIds: string[]) => Promise<void>
  toggleTripItemPacked: (trip: Trip, itemId: string, packed: boolean) => Promise<void>
  addTripExtra: (trip: Trip, name: string) => Promise<void>
  toggleTripExtra: (extraId: string, packed: boolean) => Promise<void>
  removeTripExtra: (extraId: string) => Promise<void>
}

const StoreContext = createContext<Store | null>(null)

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore fuera de StoreProvider')
  return ctx
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([])
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [entries, setEntries] = useState<CalendarEntry[]>([])
  const [wishes, setWishes] = useState<Wish[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [usage, setUsage] = useState<Usage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setError(null)
    const [i, o, c, w, t] = await Promise.all([
      supabase.from('items').select('*').order('created_at', { ascending: false }),
      supabase
        .from('outfits')
        .select('*, outfit_items(item_id)')
        .order('created_at', { ascending: false }),
      supabase.from('calendar_entries').select('*'),
      supabase.from('wishes').select('*').order('created_at', { ascending: false }),
      supabase
        .from('trips')
        .select('*, trip_items(item_id, packed), trip_extras(id, name, packed)')
        .order('created_at', { ascending: false }),
    ])
    const err = i.error ?? o.error ?? c.error ?? w.error ?? t.error
    if (err) {
      setError(err.message)
      logActivity('data.load', { error: err.message }, 'error')
    } else {
      setItems((i.data as Item[]) ?? [])
      setOutfits((o.data as Outfit[]) ?? [])
      setEntries((c.data as CalendarEntry[]) ?? [])
      setWishes((w.data as Wish[]) ?? [])
      setTrips((t.data as Trip[]) ?? [])
    }
    setLoading(false)
    // El uso de espacio es informativo: si falla no bloquea la app
    const { data: usageData } = await supabase.rpc('get_usage')
    if (usageData) setUsage(usageData as Usage)
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const saveItem = useCallback(
    (input: ItemInput, photo: Blob | null, existing?: Item) =>
      tracked(existing ? 'item.update' : 'item.create', { id: existing?.id, name: input.name }, async () => {
        let image_path = existing?.image_path ?? null
        if (photo) {
          const newPath = await uploadPhoto(photo)
          await deletePhoto(existing?.image_path ?? null)
          image_path = newPath
        }
        const row = { ...input, image_path }
        const { error } = existing
          ? await supabase.from('items').update(row).eq('id', existing.id)
          : await supabase.from('items').insert(row)
        if (error) throw error
        await loadAll()
      }),
    [loadAll],
  )

  const deleteItem = useCallback(
    (item: Item) =>
      tracked('item.delete', { id: item.id, name: item.name }, async () => {
        const { error } = await supabase.from('items').delete().eq('id', item.id)
        if (error) throw error
        await deletePhoto(item.image_path)
        await loadAll()
      }),
    [loadAll],
  )

  const toggleItemFavorite = useCallback(async (item: Item) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, favorite: !item.favorite } : i)),
    )
    await tracked('item.favorite', { id: item.id, favorite: !item.favorite }, async () => {
      const { error } = await supabase
        .from('items')
        .update({ favorite: !item.favorite })
        .eq('id', item.id)
      if (error) throw error
    }).catch(() => {})
  }, [])

  const setItemStatus = useCallback(async (item: Item, status: string, statusNote: string | null) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status, status_note: statusNote } : i)),
    )
    await tracked('item.status', { id: item.id, status }, async () => {
      const { error } = await supabase
        .from('items')
        .update({ status, status_note: statusNote })
        .eq('id', item.id)
      if (error) throw error
    }).catch(() => {})
  }, [])

  const saveOutfit = useCallback(
    (input: OutfitInput, photo: Blob | null, existing?: Outfit) =>
      tracked(existing ? 'outfit.update' : 'outfit.create', { id: existing?.id, name: input.name }, async () => {
        const { itemIds, ...fields } = input
        let image_path = existing?.image_path ?? null
        if (photo) {
          const newPath = await uploadPhoto(photo)
          await deletePhoto(existing?.image_path ?? null)
          image_path = newPath
        }
        const row = { ...fields, image_path }
        let outfitId = existing?.id
        if (existing) {
          const { error } = await supabase.from('outfits').update(row).eq('id', existing.id)
          if (error) throw error
          await supabase.from('outfit_items').delete().eq('outfit_id', existing.id)
        } else {
          const { data, error } = await supabase.from('outfits').insert(row).select('id').single()
          if (error) throw error
          outfitId = data.id
        }
        if (itemIds.length > 0) {
          const { error } = await supabase
            .from('outfit_items')
            .insert(itemIds.map((item_id) => ({ outfit_id: outfitId, item_id })))
          if (error) throw error
        }
        await loadAll()
      }),
    [loadAll],
  )

  const deleteOutfit = useCallback(
    (outfit: Outfit) =>
      tracked('outfit.delete', { id: outfit.id, name: outfit.name }, async () => {
        const { error } = await supabase.from('outfits').delete().eq('id', outfit.id)
        if (error) throw error
        await deletePhoto(outfit.image_path)
        await loadAll()
      }),
    [loadAll],
  )

  const toggleOutfitFavorite = useCallback(async (outfit: Outfit) => {
    setOutfits((prev) =>
      prev.map((o) => (o.id === outfit.id ? { ...o, favorite: !outfit.favorite } : o)),
    )
    await tracked('outfit.favorite', { id: outfit.id, favorite: !outfit.favorite }, async () => {
      const { error } = await supabase
        .from('outfits')
        .update({ favorite: !outfit.favorite })
        .eq('id', outfit.id)
      if (error) throw error
    }).catch(() => {})
  }, [])

  const setEntry = useCallback(
    (date: string, outfitId: string | null, notes: string | null) =>
      tracked('calendar.set', { date, outfitId }, async () => {
        const { error } = await supabase
          .from('calendar_entries')
          .upsert({ date, outfit_id: outfitId, notes }, { onConflict: 'user_id,date' })
        if (error) throw error
        await loadAll()
      }),
    [loadAll],
  )

  const removeEntry = useCallback(
    (date: string) =>
      tracked('calendar.remove', { date }, async () => {
        const { error } = await supabase.from('calendar_entries').delete().eq('date', date)
        if (error) throw error
        await loadAll()
      }),
    [loadAll],
  )

  const saveWish = useCallback(
    (input: WishInput, photo: Blob | null, existing?: Wish) =>
      tracked(existing ? 'wish.update' : 'wish.create', { id: existing?.id, name: input.name }, async () => {
        let image_path = existing?.image_path ?? null
        if (photo) {
          const newPath = await uploadPhoto(photo)
          await deletePhoto(existing?.image_path ?? null)
          image_path = newPath
        }
        const row = { ...input, image_path }
        const { error } = existing
          ? await supabase.from('wishes').update(row).eq('id', existing.id)
          : await supabase.from('wishes').insert(row)
        if (error) throw error
        await loadAll()
      }),
    [loadAll],
  )

  const deleteWish = useCallback(
    (wish: Wish) =>
      tracked('wish.delete', { id: wish.id, name: wish.name }, async () => {
        const { error } = await supabase.from('wishes').delete().eq('id', wish.id)
        if (error) throw error
        await deletePhoto(wish.image_path)
        await loadAll()
      }),
    [loadAll],
  )

  const purchaseWish = useCallback(
    (wish: Wish, kind: Item['kind'], category: string) =>
      tracked('wish.purchase', { id: wish.id, name: wish.name }, async () => {
        const { error } = await supabase.from('items').insert({
          kind,
          name: wish.name,
          category,
          brand: wish.store,
          price: wish.price,
          purchased_at: new Date().toISOString().slice(0, 10),
          notes: wish.notes,
          image_path: wish.image_path, // la foto pasa a la prenda, no se borra
          tags: [],
        })
        if (error) throw error
        const { error: delErr } = await supabase.from('wishes').delete().eq('id', wish.id)
        if (delErr) throw delErr
        await loadAll()
      }),
    [loadAll],
  )

  const saveTrip = useCallback(
    (
      input: { name: string; start_date: string | null; end_date: string | null; notes: string | null },
      existing?: Trip,
    ) =>
      tracked(existing ? 'trip.update' : 'trip.create', { id: existing?.id, name: input.name }, async () => {
        const { error } = existing
          ? await supabase.from('trips').update(input).eq('id', existing.id)
          : await supabase.from('trips').insert(input)
        if (error) throw error
        await loadAll()
      }),
    [loadAll],
  )

  const deleteTrip = useCallback(
    (trip: Trip) =>
      tracked('trip.delete', { id: trip.id, name: trip.name }, async () => {
        const { error } = await supabase.from('trips').delete().eq('id', trip.id)
        if (error) throw error
        await loadAll()
      }),
    [loadAll],
  )

  const setTripItems = useCallback(
    (trip: Trip, itemIds: string[]) =>
      tracked('trip.items', { id: trip.id, count: itemIds.length }, async () => {
        const current = new Set(trip.trip_items.map((ti) => ti.item_id))
        const next = new Set(itemIds)
        const toAdd = itemIds.filter((id) => !current.has(id))
        const toRemove = [...current].filter((id) => !next.has(id))
        if (toAdd.length > 0) {
          const { error } = await supabase
            .from('trip_items')
            .insert(toAdd.map((item_id) => ({ trip_id: trip.id, item_id })))
          if (error) throw error
        }
        if (toRemove.length > 0) {
          const { error } = await supabase
            .from('trip_items')
            .delete()
            .eq('trip_id', trip.id)
            .in('item_id', toRemove)
          if (error) throw error
        }
        await loadAll()
      }),
    [loadAll],
  )

  const toggleTripItemPacked = useCallback(async (trip: Trip, itemId: string, packed: boolean) => {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === trip.id
          ? {
              ...t,
              trip_items: t.trip_items.map((ti) =>
                ti.item_id === itemId ? { ...ti, packed } : ti,
              ),
            }
          : t,
      ),
    )
    await tracked('trip.pack', { id: trip.id, itemId, packed }, async () => {
      const { error } = await supabase
        .from('trip_items')
        .update({ packed })
        .eq('trip_id', trip.id)
        .eq('item_id', itemId)
      if (error) throw error
    }).catch(() => {})
  }, [])

  const addTripExtra = useCallback(
    (trip: Trip, name: string) =>
      tracked('trip.extra.add', { id: trip.id, name }, async () => {
        const { error } = await supabase.from('trip_extras').insert({ trip_id: trip.id, name })
        if (error) throw error
        await loadAll()
      }),
    [loadAll],
  )

  const toggleTripExtra = useCallback(async (extraId: string, packed: boolean) => {
    setTrips((prev) =>
      prev.map((t) => ({
        ...t,
        trip_extras: t.trip_extras.map((e) => (e.id === extraId ? { ...e, packed } : e)),
      })),
    )
    await tracked('trip.extra.pack', { extraId, packed }, async () => {
      const { error } = await supabase.from('trip_extras').update({ packed }).eq('id', extraId)
      if (error) throw error
    }).catch(() => {})
  }, [])

  const removeTripExtra = useCallback(
    (extraId: string) =>
      tracked('trip.extra.remove', { extraId }, async () => {
        const { error } = await supabase.from('trip_extras').delete().eq('id', extraId)
        if (error) throw error
        await loadAll()
      }),
    [loadAll],
  )

  return (
    <StoreContext.Provider
      value={{
        items,
        outfits,
        entries,
        wishes,
        trips,
        usage,
        loading,
        error,
        saveItem,
        deleteItem,
        toggleItemFavorite,
        setItemStatus,
        saveOutfit,
        deleteOutfit,
        toggleOutfitFavorite,
        setEntry,
        removeEntry,
        saveWish,
        deleteWish,
        purchaseWish,
        saveTrip,
        deleteTrip,
        setTripItems,
        toggleTripItemPacked,
        addTripExtra,
        toggleTripExtra,
        removeTripExtra,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}
