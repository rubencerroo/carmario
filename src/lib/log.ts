import { supabase } from './supabase'

export type LogLevel = 'info' | 'warn' | 'error'

/**
 * Registra una acción del usuario en la tabla activity_logs.
 * Es "fire and forget": nunca lanza ni bloquea la app aunque falle el registro.
 */
export function logActivity(action: string, details?: unknown, level: LogLevel = 'info') {
  try {
    void supabase
      .from('activity_logs')
      .insert({
        action,
        level,
        details: details === undefined ? null : (details as never),
        path: typeof location !== 'undefined' ? location.pathname : null,
      })
      .then(() => {}, () => {})
  } catch {
    /* el logging nunca debe romper la app */
  }
}

/** Envuelve una acción async: registra éxito (info) o fallo (error) y re-lanza el error. */
export async function tracked<T>(
  action: string,
  details: Record<string, unknown>,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    const result = await fn()
    logActivity(action, details)
    return result
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    logActivity(action, { ...details, error: message }, 'error')
    throw e
  }
}
