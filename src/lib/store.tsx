/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase, uploadPhoto, deletePhoto } from './supabase'
import type { CalendarEntry, Item, Outfit } from './types'

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
  loading: boolean
  error: string | null
  saveItem: (input: ItemInput, photo: Blob | null, existing?: Item) => Promise<void>
  deleteItem: (item: Item) => Promise<void>
  toggleItemFavorite: (item: Item) => Promise<void>
  saveOutfit: (input: OutfitInput, photo: Blob | null, existing?: Outfit) => Promise<void>
  deleteOutfit: (outfit: Outfit) => Promise<void>
  toggleOutfitFavorite: (outfit: Outfit) => Promise<void>
  setEntry: (date: string, outfitId: string | null, notes: string | null) => Promise<void>
  removeEntry: (date: string) => Promise<void>
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setError(null)
    const [i, o, c] = await Promise.all([
      supabase.from('items').select('*').order('created_at', { ascending: false }),
      supabase
        .from('outfits')
        .select('*, outfit_items(item_id)')
        .order('created_at', { ascending: false }),
      supabase.from('calendar_entries').select('*'),
    ])
    const err = i.error ?? o.error ?? c.error
    if (err) {
      setError(err.message)
    } else {
      setItems((i.data as Item[]) ?? [])
      setOutfits((o.data as Outfit[]) ?? [])
      setEntries((c.data as CalendarEntry[]) ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const saveItem = useCallback(
    async (input: ItemInput, photo: Blob | null, existing?: Item) => {
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
    },
    [loadAll],
  )

  const deleteItem = useCallback(
    async (item: Item) => {
      const { error } = await supabase.from('items').delete().eq('id', item.id)
      if (error) throw error
      await deletePhoto(item.image_path)
      await loadAll()
    },
    [loadAll],
  )

  const toggleItemFavorite = useCallback(async (item: Item) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, favorite: !item.favorite } : i)),
    )
    await supabase.from('items').update({ favorite: !item.favorite }).eq('id', item.id)
  }, [])

  const saveOutfit = useCallback(
    async (input: OutfitInput, photo: Blob | null, existing?: Outfit) => {
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
    },
    [loadAll],
  )

  const deleteOutfit = useCallback(
    async (outfit: Outfit) => {
      const { error } = await supabase.from('outfits').delete().eq('id', outfit.id)
      if (error) throw error
      await deletePhoto(outfit.image_path)
      await loadAll()
    },
    [loadAll],
  )

  const toggleOutfitFavorite = useCallback(async (outfit: Outfit) => {
    setOutfits((prev) =>
      prev.map((o) => (o.id === outfit.id ? { ...o, favorite: !outfit.favorite } : o)),
    )
    await supabase.from('outfits').update({ favorite: !outfit.favorite }).eq('id', outfit.id)
  }, [])

  const setEntry = useCallback(
    async (date: string, outfitId: string | null, notes: string | null) => {
      const { error } = await supabase
        .from('calendar_entries')
        .upsert({ date, outfit_id: outfitId, notes }, { onConflict: 'date' })
      if (error) throw error
      await loadAll()
    },
    [loadAll],
  )

  const removeEntry = useCallback(
    async (date: string) => {
      const { error } = await supabase.from('calendar_entries').delete().eq('date', date)
      if (error) throw error
      await loadAll()
    },
    [loadAll],
  )

  return (
    <StoreContext.Provider
      value={{
        items,
        outfits,
        entries,
        loading,
        error,
        saveItem,
        deleteItem,
        toggleItemFavorite,
        saveOutfit,
        deleteOutfit,
        toggleOutfitFavorite,
        setEntry,
        removeEntry,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}
