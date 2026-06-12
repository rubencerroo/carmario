export type ItemKind = 'prenda' | 'colonia' | 'maquillaje'

export interface Item {
  id: string
  kind: ItemKind
  name: string
  category: string
  brand: string | null
  color: string | null
  season: string | null
  tags: string[]
  notes: string | null
  image_path: string | null
  favorite: boolean
  created_at: string
}

export interface Outfit {
  id: string
  name: string
  occasion: string | null
  season: string | null
  tags: string[]
  notes: string | null
  image_path: string | null
  favorite: boolean
  created_at: string
  outfit_items: { item_id: string }[]
}

export interface CalendarEntry {
  id: string
  date: string // YYYY-MM-DD
  outfit_id: string | null
  notes: string | null
}

export const GARMENT_CATEGORIES = [
  'Camisetas',
  'Tops y blusas',
  'Camisas',
  'Jerséis y sudaderas',
  'Pantalones',
  'Vaqueros',
  'Faldas',
  'Vestidos',
  'Monos',
  'Chaquetas',
  'Abrigos',
  'Zapatos',
  'Deportivas',
  'Botas',
  'Bolsos',
  'Cinturones',
  'Joyas',
  'Gafas',
  'Pañuelos y bufandas',
  'Gorros y sombreros',
  'Ropa interior',
  'Pijamas',
  'Ropa de baño',
  'Otros',
] as const

export const PERFUME_CATEGORIES = ['Colonia', 'Perfume', 'Body mist', 'Otros'] as const

export const MAKEUP_CATEGORIES = [
  'Base y corrector',
  'Polvos y colorete',
  'Iluminador y contorno',
  'Sombras de ojos',
  'Eyeliner',
  'Máscara de pestañas',
  'Cejas',
  'Labiales',
  'Uñas',
  'Brochas y utensilios',
  'Cuidado de la piel',
  'Otros',
] as const

export const SEASONS = ['Primavera', 'Verano', 'Otoño', 'Invierno', 'Todo el año'] as const

export const OCCASIONS = [
  'Diario',
  'Trabajo',
  'Cita',
  'Fiesta',
  'Evento formal',
  'Deporte',
  'Viaje',
  'Casa',
] as const

export const COLORS: { name: string; hex: string }[] = [
  { name: 'Negro', hex: '#1f1f1f' },
  { name: 'Blanco', hex: '#fafafa' },
  { name: 'Gris', hex: '#9ca3af' },
  { name: 'Beige', hex: '#d9c7a7' },
  { name: 'Marrón', hex: '#7c5a3f' },
  { name: 'Rojo', hex: '#dc2626' },
  { name: 'Rosa', hex: '#f472b6' },
  { name: 'Naranja', hex: '#f97316' },
  { name: 'Amarillo', hex: '#facc15' },
  { name: 'Verde', hex: '#16a34a' },
  { name: 'Azul', hex: '#2563eb' },
  { name: 'Celeste', hex: '#7dd3fc' },
  { name: 'Morado', hex: '#9333ea' },
  { name: 'Dorado', hex: '#d4af37' },
  { name: 'Plateado', hex: '#c0c0c8' },
  { name: 'Multicolor', hex: 'conic-gradient' },
]
