import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight, Download, Dumbbell, Flame, LayoutDashboard, LineChart, Settings, Target, Upload } from 'lucide-react'
import Today from './components/Today'
import Workout from './components/Workout'
import Progress from './components/Progress'
import History from './components/History'
import { Card } from './components/ui'
import { exportJson, fromKey, normalize, streak, todayKey, useStore, type Profile } from './lib/store'
import { TARGETS } from './lib/plan'

const TABS = [
  { id: 'today', label: 'Bugün', icon: LayoutDashboard },
  { id: 'workout', label: 'Antrenman', icon: Dumbbell },
  { id: 'progress', label: 'Ölçümler', icon: LineChart },
  { id: 'history', label: 'Geçmiş', icon: CalendarDays },
  { id: 'settings', label: 'Ayarlar', icon: Settings },
] as const
type Tab = (typeof TABS)[number]['id']

export default function App() {
  const { state, date, setDate } = useStore()
  const [tab, setTab] = useState<Tab>('today')

  if (!state.profile) return <Onboarding />

  const shift = (n: number) => { const d = fromKey(date); d.setDate(d.getDate() + n); setDate(todayKey(d)) }
  const isToday = date === todayKey()
  const showDate = tab === 'today' || tab === 'workout'

  return (
    <div className="mx-auto min-h-dvh max-w-7xl px-4 pb-28 sm:px-6 lg:pb-12">
      <header className="sticky top-0 z-30 -mx-4 mb-5 border-b border-white/5 bg-ink/80 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald to-teal-600 shadow-[0_0_20px_-4px_#10B981]">
              <Flame size={18} className="text-ink" />
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-bold tracking-tight">Recomp</div>
              <div className="hidden whitespace-nowrap text-[11px] text-mute sm:block">Diyetisyen & Antrenör</div>
            </div>
          </div>

          <nav className="ml-6 hidden gap-1 lg:flex">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`relative rounded-xl px-3.5 py-2 text-sm font-medium transition ${tab === t.id ? 'text-white' : 'text-mute hover:text-slate-200'}`}>
                {tab === t.id && <motion.span layoutId="tab" className="absolute inset-0 rounded-xl bg-white/[.07]" />}
                <span className="relative flex items-center gap-2"><t.icon size={16} /> {t.label}</span>
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1 whitespace-nowrap rounded-full bg-amber/10 px-2.5 py-1 text-xs font-semibold text-amber sm:flex">🔥 {streak(state.days)} gün</span>
            {showDate && (
              <div className="flex items-center rounded-xl border border-white/5 bg-white/[.03]">
                <button className="p-2 text-mute hover:text-white" onClick={() => shift(-1)} aria-label="Önceki gün"><ChevronLeft size={16} /></button>
                <button className="min-w-24 text-center text-xs font-semibold" onClick={() => setDate(todayKey())}>
                  {isToday ? 'Bugün' : fromKey(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', weekday: 'short' })}
                </button>
                <button className="p-2 text-mute hover:text-white disabled:opacity-30" disabled={isToday} onClick={() => shift(1)} aria-label="Sonraki gün"><ChevronRight size={16} /></button>
              </div>
            )}
          </div>
        </div>
      </header>

      <motion.main key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {tab === 'today' && <Today />}
          {tab === 'workout' && <Workout />}
          {tab === 'progress' && <Progress />}
          {tab === 'history' && <History onEdit={(d) => { setDate(d); setTab('today') }} />}
          {tab === 'settings' && <SettingsPage />}
      </motion.main>

      <footer className="mt-10 text-center text-[11px] text-mute">
        Veriler yalnızca bu tarayıcıda saklanır. Bu uygulama tıbbi tavsiye yerine geçmez.
      </footer>

      {/* Mobil alt navigasyon */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); window.scrollTo({ top: 0 }) }} className={`relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${tab === t.id ? 'text-emerald' : 'text-mute'}`}>
              {tab === t.id && <motion.span layoutId="mtab" className="absolute top-0 h-0.5 w-8 rounded-full bg-emerald" />}
              <t.icon size={20} />
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

function ProfileForm({ initial, onSave, cta }: { initial?: Profile; onSave: (p: Profile) => void; cta: string }) {
  const [f, setF] = useState({ start: initial ? String(initial.startWeight) : '', target: initial ? String(initial.targetWeight) : '', date: initial?.startDate ?? todayKey() })
  const s = parseFloat(f.start.replace(',', '.')), t = parseFloat(f.target.replace(',', '.'))
  const valid = s > 30 && t > 30 && s > t
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label><span className="label">Başlangıç kilosu</span>
          <div className="relative mt-1"><input className="input pr-9 font-mono" inputMode="decimal" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-mute">kg</span></div>
        </label>
        <label><span className="label">Hedef kilo</span>
          <div className="relative mt-1"><input className="input pr-9 font-mono" inputMode="decimal" value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-mute">kg</span></div>
        </label>
      </div>
      <label className="block"><span className="label">Program başlangıç tarihi</span><input type="date" className="input mt-1" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
      {f.start && f.target && !valid && <p className="text-xs text-amber">Hedef kilo, başlangıç kilosundan düşük olmalı.</p>}
      <button disabled={!valid} className="btn btn-primary w-full !py-3 disabled:opacity-40" onClick={() => onSave({ startWeight: s, targetWeight: t, startDate: f.date })}>{cta}</button>
    </div>
  )
}

function Onboarding() {
  const { setState } = useStore()
  const features = [
    ['🎯', `${TARGETS.kcal.toLocaleString('tr-TR')} kcal hedef + tampon bölge`],
    ['🥩', '165–180 g protein · ≤ 20 g ilave şeker'],
    ['💧', '3.5 L su · 8 saat uyku takibi'],
    ['🏋️', '12 hareketlik full body + 30 dk Zone 2'],
    ['📏', 'Kilo + mezura recomposition analizi'],
    ['🎓', 'Okul günü kurtarıcı menüleri'],
  ]
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid w-full max-w-4xl gap-6 lg:grid-cols-2">
        <div className="flex flex-col justify-center">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald to-teal-600 shadow-[0_0_30px_-4px_#10B981]"><Flame className="text-ink" /></div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">Yağ yak.<br /><span className="bg-gradient-to-r from-emerald to-teal-300 bg-clip-text text-transparent">Kası koru.</span></h1>
          <p className="mt-4 max-w-md text-mute">Body recomposition için kişisel diyetisyen & antrenör: beslenme, antrenman, su, uyku ve mezura tek yerde. 20-24 haftalık bilimsel yol haritası.</p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {features.map(([e, t]) => <li key={t} className="flex items-center gap-2 text-sm text-slate-300"><span>{e}</span>{t}</li>)}
          </ul>
        </div>
        <Card>
          <div className="mb-4 flex items-center gap-2"><Target size={18} className="text-emerald" /><h2 className="font-semibold">Hedefini belirle</h2></div>
          <p className="mb-4 text-[13px] text-mute">Yol haritası ve projeksiyon eğrisi bu değerlere göre hesaplanır. Veriler sadece senin tarayıcında kalır.</p>
          <ProfileForm cta="Programa Başla" onSave={(p) => setState((s) => ({ ...s, profile: p, measurements: s.measurements.length ? s.measurements : [{ id: 'start', date: p.startDate, weight: p.startWeight }] }))} />
          <ImportButton className="mt-3 w-full" label="Yedekten geri yükle" />
        </Card>
      </motion.div>
    </div>
  )
}

function ImportButton({ className = '', label = 'Yedek Yükle' }: { className?: string; label?: string }) {
  const { setState } = useStore()
  const ref = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  return (
    <>
      <button className={`btn btn-ghost ${className}`} onClick={() => ref.current?.click()}><Upload size={16} /> {label}</button>
      <input ref={ref} type="file" accept="application/json,.json" hidden onChange={async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
          const data = normalize(JSON.parse(await file.text()))
          if (!confirm('Mevcut veriler yedekteki verilerle değiştirilecek. Devam edilsin mi?')) return
          setState(() => data)
          setMsg('Yedek yüklendi ✓')
        } catch { setMsg('Geçersiz yedek dosyası') }
        e.target.value = ''
      }} />
      {msg && <p className="mt-2 text-center text-xs text-mute">{msg}</p>}
    </>
  )
}

function SettingsPage() {
  const { state, setState } = useStore()
  const days = Object.values(state.days).filter((d) => d.completed).length
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title="Hedef & Program" icon={<Target size={16} />}>
        <ProfileForm initial={state.profile!} cta="Güncelle" onSave={(p) => setState((s) => ({ ...s, profile: p }))} />
      </Card>
      <Card title="Yedekle / Geri Yükle" icon={<Download size={16} />}>
        <p className="mb-4 text-[13px] leading-relaxed text-mute">Tüm veriler bu tarayıcıda (LocalStorage + IndexedDB) otomatik kaydedilir. Telefon değiştirirken veya tarayıcı verilerini temizlemeden önce JSON yedeği al.</p>
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white/[.03] p-2"><div className="font-mono text-xl font-bold">{days}</div><div className="text-[11px] text-mute">tamamlanan gün</div></div>
          <div className="rounded-xl bg-white/[.03] p-2"><div className="font-mono text-xl font-bold">{state.measurements.length}</div><div className="text-[11px] text-mute">ölçüm</div></div>
          <div className="rounded-xl bg-white/[.03] p-2"><div className="font-mono text-xl font-bold">{Object.keys(state.customGifs).length}</div><div className="text-[11px] text-mute">özel GIF</div></div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <button className="btn btn-primary" onClick={() => exportJson(state)}><Download size={16} /> Yedekle (JSON)</button>
          <div><ImportButton className="w-full" /></div>
        </div>
      </Card>
    </div>
  )
}
