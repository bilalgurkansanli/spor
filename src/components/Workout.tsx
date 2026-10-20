import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, Bike, Check, ChevronDown, Dumbbell, Footprints, Link2, Pause, Play, RotateCcw, ShieldAlert, Timer, Trophy, Youtube, X } from 'lucide-react'
import { CARDIO, EXERCISES, type Exercise } from '../lib/plan'
import { useStore, workoutProgress, type SetLog } from '../lib/store'
import { ExerciseAnimator } from './Visuals'
import { Card, Pill, beep, fmtTime } from './ui'

export default function Workout() {
  const { day, updateDay } = useStore()
  const [rest, setRest] = useState<{ total: number; left: number; label: string } | null>(null)
  const [open, setOpen] = useState<string>(() => firstOpen(day.workout.sets))
  const wp = workoutProgress(day.workout)

  // Dinlenme sayacı
  useEffect(() => {
    if (!rest) return
    if (rest.left <= 0) { beep(988, 220, 3); const t = setTimeout(() => setRest(null), 1200); return () => clearTimeout(t) }
    const t = setTimeout(() => setRest((r) => (r ? { ...r, left: r.left - 1 } : r)), 1000)
    return () => clearTimeout(t)
  }, [rest])

  const updateSet = (exId: string, i: number, patch: Partial<SetLog>) =>
    updateDay((d) => {
      const sets = [...(d.workout.sets[exId] ?? [])]
      sets[i] = { ...sets[i], ...patch }
      return { ...d, workout: { ...d.workout, sets: { ...d.workout.sets, [exId]: sets } } }
    })

  const toggleSet = (ex: Exercise, i: number) => {
    const s = day.workout.sets[ex.id][i]
    updateSet(ex.id, i, { done: !s.done, reps: s.reps || (s.done ? '' : ex.reps.split('-').pop() ?? '') })
    if (!s.done) {
      const allDone = day.workout.sets[ex.id].every((x, j) => (j === i ? true : x.done))
      setRest({ total: ex.rest, left: ex.rest, label: allDone ? 'Sonraki harekete geç' : `${ex.name} · Set ${i + 2}` })
      if (allDone) {
        const idx = EXERCISES.findIndex((e) => e.id === ex.id)
        setTimeout(() => setOpen(EXERCISES[idx + 1]?.id ?? ''), 400)
      }
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-8">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="label">Full Body · Haftada 3 Gün</div>
              <h2 className="mt-1 text-xl font-bold">Antrenman Modu</h2>
              <p className="mt-1 text-[13px] text-mute">Büyük kaslar başta → izole kaslar ortada → karın ve kardiyo sonda.</p>
            </div>
            <div className="text-right">
              <div className="font-mono text-3xl font-bold tabular text-emerald">{Math.round(wp.pct * 100)}%</div>
              <div className="text-[11px] text-mute">{wp.done}/{wp.total} set</div>
            </div>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-emerald transition-all duration-500" style={{ width: `${wp.pct * 100}%` }} />
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/[.06] p-3 text-[12px] leading-relaxed text-red-300">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" />
            <span><b>Dumbbell Upright Row programdan kalıcı olarak çıkarıldı:</b> omuz ekleminde iç rotasyon + sıkışma (impingement) riski yaratır. Yan omuz için Lateral Raise yeterli.</span>
          </div>
        </Card>

        {EXERCISES.map((ex, idx) => (
          <ExerciseCard key={ex.id} ex={ex} idx={idx} open={open === ex.id} onToggle={() => setOpen(open === ex.id ? '' : ex.id)}
            sets={day.workout.sets[ex.id] ?? []} onSet={updateSet} onDone={toggleSet} />
        ))}

        <Cardio />
      </div>

      <div className="lg:col-span-4">
        <div className="space-y-4 lg:sticky lg:top-24">
          <RestPanel rest={rest} onStart={(s) => setRest({ total: s, left: s, label: 'Manuel dinlenme' })} onStop={() => setRest(null)} />
          <Card title="Sıralama Prensibi" icon={<Activity size={16} />}>
            <ol className="space-y-2 text-[13px]">
              {EXERCISES.map((e, i) => {
                const sets = day.workout.sets[e.id] ?? []
                const done = e.isPlank ? day.workout.plankSec > 0 : sets.every((s) => s.done)
                return (
                  <li key={e.id}>
                    <button onClick={() => { setOpen(e.id); document.getElementById(`ex-${e.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
                      className="flex w-full items-center gap-2 text-left hover:text-white">
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] ${done ? 'bg-emerald text-ink' : 'bg-white/5 text-mute'}`}>{done ? <Check size={11} /> : i + 1}</span>
                      <span className={`truncate ${done ? 'text-mute line-through' : ''}`}>{e.name}</span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </Card>
        </div>
      </div>

      {/* Mobil yüzen dinlenme sayacı */}
      <AnimatePresence>
        {rest && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed inset-x-3 bottom-20 z-40 lg:hidden">
            <div className="card flex items-center gap-3 border-emerald/30 p-3">
              <Timer className="text-emerald" size={20} />
              <div className="flex-1">
                <div className="text-[11px] text-mute">Dinlenme · {rest.label}</div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-emerald transition-all" style={{ width: `${(rest.left / rest.total) * 100}%` }} /></div>
              </div>
              <span className="font-mono text-2xl font-bold tabular">{fmtTime(Math.max(0, rest.left))}</span>
              <button className="rounded-lg p-1.5 text-mute" onClick={() => setRest(null)} aria-label="Durdur"><X size={18} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function firstOpen(sets: Record<string, SetLog[]>) {
  return EXERCISES.find((e) => !e.isPlank && !(sets[e.id] ?? []).every((s) => s.done))?.id ?? 'plank'
}

function ExerciseCard({ ex, idx, open, onToggle, sets, onSet, onDone }: {
  ex: Exercise; idx: number; open: boolean; onToggle: () => void; sets: SetLog[]
  onSet: (id: string, i: number, p: Partial<SetLog>) => void; onDone: (ex: Exercise, i: number) => void
}) {
  const { state, setState, day } = useStore()
  const custom = state.customGifs[ex.id]
  const [gifEdit, setGifEdit] = useState(false)
  const [gifUrl, setGifUrl] = useState(custom ?? '')
  const doneCount = ex.isPlank ? (day.workout.plankSec > 0 ? 1 : 0) : sets.filter((s) => s.done).length
  const complete = doneCount === ex.sets

  return (
    <motion.section id={`ex-${ex.id}`} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`card scroll-mt-24 overflow-hidden ${complete ? 'border-emerald/30' : ''}`}>
      <button onClick={onToggle} className="flex w-full items-center gap-3 p-4 text-left sm:p-5">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold ${complete ? 'bg-emerald text-ink' : 'bg-white/5 text-slate-300'}`}>
          {complete ? <Check size={18} /> : String(idx + 1).padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{ex.name}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-mute">
            <span>{ex.target}</span>
            <span className="font-mono">{ex.sets} × {ex.reps}</span>
            <span className="hidden sm:inline">{ex.start}</span>
          </div>
        </div>
        <Pill color={complete ? '#10B981' : '#94A3B8'}>{doneCount}/{ex.sets}</Pill>
        <ChevronDown size={18} className={`text-mute transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="grid gap-4 border-t border-white/5 p-4 sm:grid-cols-[minmax(0,240px)_1fr] sm:p-5">
              <div className="space-y-2">
                <ExerciseAnimator dbId={ex.dbId} customGif={custom} muscles={ex.muscles} motion={ex.motion} className="aspect-square w-full" />
                <div className="grid grid-cols-2 gap-2">
                  <a href={ex.youtube} target="_blank" rel="noreferrer" className="btn btn-ghost !px-2 !py-2 text-xs"><Youtube size={14} className="text-danger" /> Formu Gör</a>
                  <button onClick={() => setGifEdit(!gifEdit)} className="btn btn-ghost !px-2 !py-2 text-xs"><Link2 size={14} /> GIF Değiştir</button>
                </div>
                <AnimatePresence>
                  {gifEdit && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                      <input className="input text-xs" placeholder="https://…/hareket.gif" value={gifUrl} onChange={(e) => setGifUrl(e.target.value)} />
                      <div className="flex gap-2">
                        <button className="btn btn-primary flex-1 !py-1.5 text-xs" onClick={() => { setState((s) => ({ ...s, customGifs: { ...s.customGifs, [ex.id]: gifUrl.trim() } })); setGifEdit(false) }}>Kaydet</button>
                        {custom && <button className="btn btn-ghost !py-1.5 text-xs" onClick={() => { setState((s) => { const g = { ...s.customGifs }; delete g[ex.id]; return { ...s, customGifs: g } }); setGifUrl(''); setGifEdit(false) }}>Varsayılan</button>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="min-w-0 space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Info k="Set × Tekrar" v={`${ex.sets} × ${ex.reps}`} />
                  <Info k="Başlangıç" v={ex.start.replace(' (kademeli artır)', '')} />
                  <Info k="Dinlenme" v={ex.restLabel} />
                </div>
                <div className="rounded-xl border border-amber/20 bg-amber/[.06] p-3 text-[13px] leading-relaxed text-amber-100/90">
                  <span className="mr-1 font-semibold text-amber">Form:</span>{ex.note}
                </div>
                {ex.isPlank ? <PlankTimer /> : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-[2rem_1fr_1fr_3rem] gap-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-mute">
                      <span>Set</span><span>Kilo (kg)</span><span>Tekrar</span><span />
                    </div>
                    {sets.map((s, i) => (
                      <div key={i} className={`grid grid-cols-[2rem_1fr_1fr_3rem] items-center gap-2 rounded-xl p-1 transition ${s.done ? 'bg-emerald/[.07]' : ''}`}>
                        <span className="text-center font-mono text-sm text-mute">{i + 1}</span>
                        <input className="input !py-2.5 text-center font-mono text-base" inputMode="decimal" placeholder={ex.startKg == null ? 'VA' : String(ex.startKg)}
                          value={s.kg} onChange={(e) => onSet(ex.id, i, { kg: e.target.value })} />
                        <input className="input !py-2.5 text-center font-mono text-base" inputMode="numeric" placeholder={ex.reps}
                          value={s.reps} onChange={(e) => onSet(ex.id, i, { reps: e.target.value })} />
                        <motion.button whileTap={{ scale: 0.85 }} onClick={() => onDone(ex, i)} aria-label="Seti tamamladım"
                          className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${s.done ? 'border-emerald bg-emerald text-ink' : 'border-white/10 bg-white/5 text-mute hover:border-emerald/50'}`}>
                          <Check size={20} strokeWidth={3} />
                        </motion.button>
                      </div>
                    ))}
                    <p className="px-1 text-[11px] text-mute">✓ tikine bastığında {ex.restLabel} dinlenme sayacı otomatik başlar.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[.03] px-2 py-2">
      <div className="text-[10px] uppercase tracking-wider text-mute">{k}</div>
      <div className="mt-0.5 font-mono text-[13px] font-semibold">{v}</div>
    </div>
  )
}

function RestPanel({ rest, onStart, onStop }: { rest: { total: number; left: number; label: string } | null; onStart: (s: number) => void; onStop: () => void }) {
  const r = 52, c = 2 * Math.PI * r
  const pct = rest ? rest.left / rest.total : 0
  return (
    <Card title="Dinlenme Sayacı" icon={<Timer size={16} />}>
      <div className="flex items-center gap-4">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={r} stroke="rgba(255,255,255,.06)" strokeWidth="8" fill="none" />
            <circle cx="60" cy="60" r={r} stroke={rest && rest.left <= 5 ? '#F59E0B' : '#10B981'} strokeWidth="8" fill="none" strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-3xl font-bold tabular">{rest ? fmtTime(Math.max(0, rest.left)) : '00:00'}</span>
            <span className="text-[10px] text-mute">{rest ? (rest.left <= 0 ? 'Hazır!' : 'dinlen') : 'bekliyor'}</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {rest && <div className="truncate text-[11px] text-mute">{rest.label}</div>}
          <div className="grid grid-cols-2 gap-2">
            <button className="btn btn-ghost" onClick={() => onStart(60)}>60 sn</button>
            <button className="btn btn-ghost" onClick={() => onStart(90)}>90 sn</button>
          </div>
          {rest && <button className="btn btn-ghost w-full text-xs" onClick={onStop}><X size={14} /> Atla</button>}
        </div>
      </div>
    </Card>
  )
}

function useStopwatch() {
  const [running, setRunning] = useState(false)
  const [ms, setMs] = useState(0)
  const startRef = useRef(0)
  useEffect(() => {
    if (!running) return
    startRef.current = performance.now() - ms
    let raf = 0
    const tick = () => { setMs(performance.now() - startRef.current); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])
  return { running, ms, start: () => setRunning(true), stop: () => setRunning(false), reset: () => { setRunning(false); setMs(0) } }
}

function PlankTimer() {
  const { state, setState, day, updateDay } = useStore()
  const sw = useStopwatch()
  const [newRecord, setNewRecord] = useState(false)
  const sec = Math.floor(sw.ms / 1000)
  const finish = () => {
    sw.stop()
    if (sec <= 0) return
    updateDay((d) => ({ ...d, workout: { ...d.workout, plankSec: Math.max(d.workout.plankSec, sec) } }))
    if (sec > state.plankRecord) { setState((s) => ({ ...s, plankRecord: sec })); setNewRecord(true); beep(1320, 150, 2) }
  }
  return (
    <div className="rounded-2xl border border-white/5 bg-ink/60 p-4 text-center">
      <div className="font-mono text-6xl font-bold tabular tracking-tight" style={{ color: sw.running ? '#10B981' : '#E5E7EB' }}>
        {fmtTime(sec)}<span className="text-2xl text-mute">.{String(Math.floor((sw.ms % 1000) / 100))}</span>
      </div>
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-mute">
        <span className="flex items-center gap-1"><Trophy size={13} className="text-amber" /> Rekor: <b className="font-mono text-slate-200">{fmtTime(state.plankRecord)}</b></span>
        {day.workout.plankSec > 0 && <span>Bugün: <b className="font-mono text-slate-200">{fmtTime(day.workout.plankSec)}</b></span>}
      </div>
      {newRecord && <div className="mt-2 text-sm font-semibold text-amber">🏆 Yeni rekor!</div>}
      <div className="mt-4 flex justify-center gap-2">
        {!sw.running ? (
          <button className="btn btn-primary min-w-32 !py-3" onClick={() => { setNewRecord(false); sw.start() }}><Play size={18} /> {sw.ms ? 'Devam' : 'Başlat'}</button>
        ) : (
          <button className="btn min-w-32 bg-amber !py-3 text-ink" onClick={finish}><Pause size={18} /> Bitir</button>
        )}
        <button className="btn btn-ghost !py-3" onClick={sw.reset} aria-label="Sıfırla"><RotateCcw size={18} /></button>
      </div>
    </div>
  )
}

function Cardio() {
  const { day, updateDay } = useStore()
  const [active, setActive] = useState<number | null>(null)
  const done = day.workout.cardioSec
  const totalDone = done.reduce((a, b) => a + Math.min(b, 600), 0)

  useEffect(() => {
    if (active == null) return
    const t = setInterval(() => {
      updateDay((d) => {
        const c = [...d.workout.cardioSec]
        c[active] = Math.min(600, (c[active] ?? 0) + 1)
        return { ...d, workout: { ...d.workout, cardioSec: c } }
      })
    }, 1000)
    return () => clearInterval(t)
  }, [active, updateDay])

  useEffect(() => {
    if (active == null || done[active] < 600) return
    beep(880, 250, 3)
    setActive(active < 2 ? active + 1 : null)
  }, [active, done])

  const icons = [Footprints, Bike, Activity]
  return (
    <Card title="Kardiyo Protokolü · 3 × 10 dk (Zone 2)" icon={<Dumbbell size={16} />} action={<Pill>{fmtTime(totalDone)} / 30:00</Pill>}>
      <p className="mb-4 text-[13px] text-mute">Ağırlık ve karın biter bitmez — glikojen depoları boşaldığı için vücut doğrudan yağ yakımına geçer.</p>
      <div className="grid gap-3 md:grid-cols-3">
        {CARDIO.map((c, i) => {
          const Icon = icons[i]
          const sec = done[i] ?? 0
          const isOn = active === i
          return (
            <div key={c.id} className={`rounded-2xl border p-3 transition ${isOn ? 'border-emerald/50 bg-emerald/[.06]' : sec >= 600 ? 'border-emerald/30' : 'border-white/5 bg-white/[.02]'}`}>
              <ExerciseAnimator dbId={c.dbId} muscles={['cardio', 'quads']} motion="hold" className="mb-3 aspect-[4/3] w-full" />
              <div className="flex items-center gap-2 text-sm font-semibold"><Icon size={16} className="text-emerald" /> {i * 10}–{i * 10 + 10}. dk</div>
              <div className="mt-0.5 text-[13px]">{c.name}</div>
              <div className="font-mono text-[12px] text-emerald">{c.detail}</div>
              <div className="mt-1 text-[11px] text-mute">{c.tip}</div>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-mono text-2xl font-bold tabular">{fmtTime(600 - sec)}</span>
                <div className="flex gap-1.5">
                  <button className={`btn !p-2 ${isOn ? 'bg-amber text-ink' : 'btn-primary'}`} onClick={() => setActive(isOn ? null : i)} aria-label={isOn ? 'Duraklat' : 'Başlat'}>
                    {isOn ? <Pause size={16} /> : sec >= 600 ? <Check size={16} /> : <Play size={16} />}
                  </button>
                  <button className="btn btn-ghost !p-2" aria-label="Sıfırla" onClick={() => { if (isOn) setActive(null); updateDay((d) => { const cs = [...d.workout.cardioSec]; cs[i] = 0; return { ...d, workout: { ...d.workout, cardioSec: cs } } }) }}>
                    <RotateCcw size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5"><div className="h-full bg-emerald transition-all" style={{ width: `${(sec / 600) * 100}%` }} /></div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
