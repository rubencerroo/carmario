import { useEffect, useState } from 'react'
import { supabase, deletePhoto } from '../lib/supabase'
import { useStore } from '../lib/store'
import { logActivity } from '../lib/log'
import { ConfirmDialog, Field, inputCls } from '../components/ui'

export default function AccountPage() {
  const { items, outfits, wishes } = useStore()
  const [email, setEmail] = useState('')

  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pwBusy, setPwBusy] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [delBusy, setDelBusy] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''))
  }, [])

  async function changePassword() {
    setPwMsg(null)
    if (password.length < 6) {
      setPwMsg({ ok: false, text: 'La contraseña debe tener al menos 6 caracteres' })
      return
    }
    if (password !== password2) {
      setPwMsg({ ok: false, text: 'Las contraseñas no coinciden' })
      return
    }
    setPwBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setPwBusy(false)
    if (error) {
      setPwMsg({ ok: false, text: error.message })
    } else {
      logActivity('account.password_changed')
      setPwMsg({ ok: true, text: 'Contraseña actualizada' })
      setPassword('')
      setPassword2('')
    }
  }

  async function deleteAccount() {
    setDelBusy(true)
    try {
      logActivity('account.delete')
      // Borra las fotos del Storage (no se eliminan con el cascade de la BD)
      const paths = [...items, ...outfits, ...wishes].map((x) => x.image_path)
      await Promise.all(paths.map((p) => deletePhoto(p)))
      const { error } = await supabase.rpc('delete_my_account')
      if (error) throw error
      await supabase.auth.signOut()
      window.location.reload()
    } catch (e) {
      setDelBusy(false)
      setConfirmDelete(false)
      alert('No se pudo borrar la cuenta: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="font-display mb-4 text-2xl text-blush-800 md:text-3xl">Mi cuenta</h2>

      <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm md:p-5">
        <p className="text-xs tracking-wide text-blush-400 uppercase">Email</p>
        <p className="mt-1 font-medium text-blush-800">{email || '…'}</p>
      </section>

      <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm md:p-5">
        <h3 className="mb-3 text-sm font-medium text-blush-800">Cambiar contraseña</h3>
        <div className="space-y-3">
          <Field label="Nueva contraseña">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className={inputCls}
            />
          </Field>
          <Field label="Repite la contraseña">
            <input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              autoComplete="new-password"
              className={inputCls}
            />
          </Field>
          {pwMsg && (
            <p className={`text-sm ${pwMsg.ok ? 'text-green-600' : 'text-red-500'}`}>{pwMsg.text}</p>
          )}
          <button
            onClick={changePassword}
            disabled={pwBusy || !password || !password2}
            className="rounded-xl bg-blush-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blush-700 disabled:opacity-50"
          >
            {pwBusy ? 'Guardando…' : 'Actualizar contraseña'}
          </button>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm md:p-5">
        <h3 className="mb-1 text-sm font-medium text-red-600">Borrar mi cuenta</h3>
        <p className="mb-3 text-xs text-blush-400">
          Se eliminarán permanentemente tu cuenta y todos tus datos (prendas, outfits, fotos…). Esta
          acción no se puede deshacer.
        </p>
        <button
          onClick={() => setConfirmDelete(true)}
          className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          Borrar mi cuenta
        </button>
      </section>

      {confirmDelete && (
        <ConfirmDialog
          title="¿Borrar tu cuenta?"
          message="Se eliminará todo tu armario y no se podrá recuperar."
          confirmLabel="Sí, borrar todo"
          busy={delBusy}
          onConfirm={deleteAccount}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
