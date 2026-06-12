/**
 * Comprime una imagen en el navegador antes de subirla:
 * redimensiona a un máximo de 1200px y la convierte a WebP.
 * Una foto de móvil de ~4 MB queda en ~100-200 KB.
 */
export async function compressImage(file: File, maxSize = 1200, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', quality),
  )
  if (!blob) throw new Error('No se pudo procesar la imagen')
  return blob
}

/**
 * Quita el fondo de la imagen con IA, todo dentro del navegador (la primera vez
 * descarga el modelo, ~40 MB, que queda cacheado). Devuelve WebP con transparencia.
 */
export async function removeBg(blob: Blob): Promise<Blob> {
  const { removeBackground } = await import('@imgly/background-removal')
  const cutout = await removeBackground(blob)

  // Re-encode a WebP conservando la transparencia para que siga ocupando poco
  const bitmap = await createImageBitmap(cutout)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0)
  bitmap.close()

  const webp = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', 0.85),
  )
  if (!webp) throw new Error('No se pudo procesar la imagen')
  return webp
}
