import { useEffect, useState } from 'react'
import { Bell, BellRing, Check, Copy, Moon, Sunrise } from 'lucide-react'
import { currentSubscription, pushSupported, subscribe, testNotification } from '../lib/push'
import { Card } from './ui'

export default function Notifications() {
  const supported = pushSupported()
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>(supported ? Notification.permission : 'unsupported')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    currentSubscription().then((s) => s && setCode(JSON.stringify(s.toJSON()))).catch(() => {})
  }, [])

  const enable = async () => {
    setBusy(true); setMsg('')
    try {
      const sub = await subscribe()
      setCode(JSON.stringify(sub.toJSON()))
      setPerm('granted')
      await testNotification()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Bildirim açılamadı.')
      if (supported) setPerm(Notification.permission)
    }
    setBusy(false)
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(code) } catch {
      const t = document.createElement('textarea'); t.value = code; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove()
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card title="Bildirimler" icon={<Bell size={16} />} className="lg:col-span-2">
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[.03] p-3">
          <Sunrise size={20} className="shrink-0 text-water" />
          <div><div className="font-mono text-sm font-bold">06:00</div><div className="text-[12px] text-mute">Uyanınca 500 ml su iç</div></div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[.03] p-3">
          <Moon size={20} className="shrink-0 text-violet-400" />
          <div><div className="font-mono text-sm font-bold">21:00</div><div className="text-[12px] text-mute">Uykuya hazırlan · günü tamamla</div></div>
        </div>
      </div>
      <p className="mb-4 text-[12px] text-mute">İstanbul saati (GMT+3). Uygulama kapalıyken de gelir.</p>

      {!supported ? (
        <p className="rounded-xl bg-amber/10 p-3 text-sm text-amber">Bu tarayıcı bildirim desteklemiyor. Android'de Chrome ile aç ve ana ekrana ekle.</p>
      ) : perm === 'granted' && code ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald"><BellRing size={16} /> Bu cihazda bildirim izni açık</div>
          <div className="rounded-xl border border-white/5 bg-ink/60 p-3">
            <div className="label mb-1.5">Cihaz kodu</div>
            <p className="mb-2 text-[12px] leading-relaxed text-mute">Zamanlanmış hatırlatmaların bu telefona gelmesi için bu kodu bir kez GitHub'a kaydetmen gerekiyor (kurulum notundaki adım).</p>
            <code className="block max-h-20 overflow-hidden break-all font-mono text-[10px] text-slate-500">{code}</code>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn btn-primary" onClick={copy}>{copied ? <><Check size={16} /> Kopyalandı</> : <><Copy size={16} /> Kodu Kopyala</>}</button>
            <button className="btn btn-ghost" onClick={() => testNotification().catch(() => setMsg('Test bildirimi gösterilemedi.'))}><Bell size={16} /> Test Et</button>
          </div>
        </div>
      ) : (
        <button className="btn btn-primary w-full !py-3" disabled={busy} onClick={enable}>
          <BellRing size={18} /> {busy ? 'Açılıyor…' : 'Bildirimleri Aç'}
        </button>
      )}
      {msg && <p className="mt-3 text-sm text-amber">{msg}</p>}
    </Card>
  )
}
