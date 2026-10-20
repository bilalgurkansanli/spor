import { useState, type FormEvent, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Flame, Lock as LockIcon, LogIn } from 'lucide-react'

// Şifrenin kendisi kodda yok; yalnızca PBKDF2-SHA256 (tuzlu) özeti tutulur.
const SALT = '244702951f580d257e9443479168727c'
const ITERATIONS = 310000
const HASH = 'd7f12e4ca8448111a24e21f3860d33874952e08e5ae28f61dd2c295fdf1e7f8d'
const KEY = 'recomp-auth'

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('')
const unhex = (h: string) => new Uint8Array(h.match(/../g)!.map((x) => parseInt(x, 16)))

async function verify(pw: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw.normalize('NFC')), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unhex(SALT), iterations: ITERATIONS }, key, 256)
  return hex(bits) === HASH
}

function readAuth() {
  try { return localStorage.getItem(KEY) === HASH || sessionStorage.getItem(KEY) === HASH } catch { return false }
}

export function logout() {
  try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY) } catch { /* yoksay */ }
  location.reload()
}

export default function Lock({ children }: { children: ReactNode }) {
  const [ok, setOk] = useState(readAuth)
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  if (ok) return <>{children}</>

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!pw || busy) return
    setBusy(true)
    setError(false)
    const good = await verify(pw).catch(() => false)
    setBusy(false)
    if (!good) { setError(true); setPw(''); return }
    try { (remember ? localStorage : sessionStorage).setItem(KEY, HASH) } catch { /* yoksay */ }
    setOk(true)
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 16 }}
        animate={error ? { opacity: 1, y: 0, x: [0, -10, 10, -6, 6, 0] } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card w-full max-w-sm p-6"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald to-teal-600 shadow-[0_0_30px_-4px_#10B981]">
            <Flame className="text-ink" size={26} />
          </div>
          <h1 className="text-xl font-bold">Recomp</h1>
          <p className="mt-1 text-sm text-mute">Devam etmek için şifreni gir.</p>
        </div>

        <label className="block">
          <span className="label">Şifre</span>
          <div className="relative mt-1">
            <LockIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
            <input
              autoFocus
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              className={`input !pl-9 !pr-10 ${error ? '!border-danger/70' : ''}`}
              value={pw}
              onChange={(e) => { setPw(e.target.value); setError(false) }}
            />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Şifreyi gizle' : 'Şifreyi göster'}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-mute hover:text-slate-200">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>
        {error && <p className="mt-2 text-xs font-medium text-danger">Şifre yanlış, tekrar dene.</p>}

        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-emerald" />
          Bu cihazda beni hatırla
        </label>

        <button type="submit" disabled={busy || !pw} className="btn btn-primary mt-5 w-full !py-3 disabled:opacity-50">
          <LogIn size={18} /> {busy ? 'Kontrol ediliyor…' : 'Giriş Yap'}
        </button>
      </motion.form>
    </div>
  )
}
