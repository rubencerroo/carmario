import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, anonKey)

const BUCKET = 'photos'

export function photoUrl(path: string | null): string | null {
  if (!path) return null
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

export async function uploadPhoto(blob: Blob): Promise<string> {
  // Cada usuario sube a su propia carpeta (user_id/uuid.webp); las políticas RLS lo exigen.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No hay sesión activa')
  const path = `${user.id}/${crypto.randomUUID()}.webp`
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/webp',
    cacheControl: '31536000',
  })
  if (error) throw error
  return path
}

export async function deletePhoto(path: string | null) {
  if (!path) return
  await supabase.storage.from(BUCKET).remove([path])
}
