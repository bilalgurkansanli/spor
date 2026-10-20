import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Calculator, CheckCircle2, Droplets, Eraser, Flame, GraduationCap, Lightbulb, Moon, NotebookPen, Plus, Star, Sunrise, X } from 'lucide-react'
import { COACH_TIPS, SCHOOL_STRATEGIES, TARGETS, type Meal } from '../lib/plan'
import { dayKcal, dayScore, fromKey, streak, sumKcal, useStore, workoutProgress } from '../lib/store'
import { Card, Pill, Ring, Toggle } from './ui'

export function kcalStatus(kcal: number) {
  if (kcal === 0) return { color: '#64748B', label: 'Henüz kayıt yok', tone: 'mute' as const }
  if (kcal < TARGETS.kcalLow) return { color: '#F59E0B', label: 'Çok düşük kalori! Kas yıkımı ve güç kaybı riski', tone: 'warn' as const }
  if (kcal <= TARGETS.kcal) return { color: '#10B981', label: 'Hedefe doğru ilerliyorsun', tone: 'ok' as const }
  if (kcal <= TARGETS.kcalBuffer) return { color: '#F59E0B', label: 'Tampon bölge içindesin (ideal açık ~500 kcal)', tone: 'ok' as const }
  if (kcal <= TARGETS.kcalHigh) return { color: '#F59E0B', label: 'Tamponun üst sınırındasın — bugünlük yeter', tone: 'warn' as const }
  return { color: '#EF4444', label: 'Üst sınır aşıldı (> 2.250 kcal)', tone: 'bad' as const }
}

const nowTime = () => new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

export default function Today() {
  const { day, updateDay, state, date } = useStore()
  const kcal = dayKcal(day)
  const st = kcalStatus(kcal)
  const score = dayScore(day)
  const tip = useMemo(() => COACH_TIPS[fromKey(date).getDate() % COACH_TIPS.length], [date])

  const setExpr = (expr: string) => updateDay((d) => ({ ...d, kcalExpr: expr, kcalSavedAt: nowTime() }))
  const appendKcal = (n: number) => {
    const cur = day.kcalExpr.trim() || (kcal ? String(kcal) : '')
    setExpr(cur ? `${cur} + ${n}` : String(n))
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Kalori halkası */}
      <Card className="lg:col-span-5" title="Kalori" icon={<Flame size={16} />} action={<Pill color={st.color}>{kcal} / {TARGETS.kcal} kcal</Pill>}>
        <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col xl:flex-row">
          <Ring value={kcal} max={TARGETS.kcalHigh} color={st.color} bufferPct={TARGETS.kcal / TARGETS.kcalHigh} size={190}>
            <span className="font-mono text-4xl font-bold tabular">{kcal}</span>
            <span className="text-xs text-mute">kcal alındı</span>
            <span className="mt-1 text-[11px] font-semibold" style={{ color: st.color }}>
              {kcal <= TARGETS.kcal ? `${TARGETS.kcal - kcal} kaldı` : `+${kcal - TARGETS.kcal} tampon`}
            </span>
          </Ring>
          <div className="w-full space-y-3">
            <div className="rounded-xl border border-white/5 bg-white/[.03] p-3 text-sm" style={{ color: st.color }}>
              <div className="flex items-start gap-2">
                {st.tone === 'bad' || st.tone === 'warn' ? <AlertTriangle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
                <span className="font-medium">{st.label}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <Zone c="#10B981" t="Hedef" v="2.000" />
              <Zone c="#F59E0B" t="Tampon" v="2.000–2.200" />
              <Zone c="#EF4444" t="Sınır" v="> 2.250" />
            </div>
          </div>
        </div>
      </Card>

      {/* Kalori hesap makinesi */}
      <Card className="lg:col-span-7" title="Kalori Girişi" icon={<Calculator size={16} />} action={<Toggle on={day.school} onChange={(v) => updateDay((d) => ({ ...d, school: v }))} label="Okul Günü" />}>
        <KcalCalculator expr={day.kcalExpr} savedAt={day.kcalSavedAt} fallback={kcal} onChange={setExpr} onAdd={appendKcal} />
        <AnimatePresence>{day.school && <SchoolMode onAdd={(m) => appendKcal(m.kcal)} />}</AnimatePresence>
      </Card>

      {/* Not */}
      <Card className="lg:col-span-7" title="Günlük Not" icon={<NotebookPen size={16} />}>
        <textarea
          className="input min-h-[150px] resize-y leading-relaxed"
          placeholder="Bugün enerjin nasıldı? Antrenman hissiyatı, beslenme notları…"
          value={day.note}
          onChange={(e) => updateDay((d) => ({ ...d, note: e.target.value }))}
        />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:col-span-5">
        <Water />
        <Sleep />
      </div>

      {/* Koç notu + Tamamla */}
      <Card className="lg:col-span-12">
        <div className="grid items-center gap-5 md:grid-cols-2">
          <div className="flex items-start gap-3">
            <Lightbulb size={18} className="mt-0.5 shrink-0 text-amber" />
            <div>
              <div className="text-sm font-semibold">Koç Notu · {tip.title}</div>
              <p className="mt-1 text-[13px] leading-relaxed text-mute">{tip.body}</p>
            </div>
          </div>
          <CompleteDay score={score} streakN={streak(state.days)} />
        </div>
      </Card>
    </div>
  )
}

function Zone({ c, t, v }: { c: string; t: string; v: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[.02] px-2 py-1.5">
      <div className="mx-auto mb-1 h-1 w-6 rounded-full" style={{ background: c }} />
      <div className="text-mute">{t}</div>
      <div className="font-mono font-semibold">{v}</div>
    </div>
  )
}

function KcalCalculator({ expr, savedAt, fallback, onChange, onAdd }: { expr: string; savedAt?: string; fallback: number; onChange: (v: string) => void; onAdd: (n: number) => void }) {
  const [add, setAdd] = useState('')
  const total = expr.trim() ? sumKcal(expr) : fallback
  const items = expr.trim() ? (expr.replace(/(\d)[.,](\d{3})(?!\d)/g, '$1$2').match(/\d+(?:[.,]\d+)?/g) ?? []).length : 0
  const quickAdd = () => {
    const n = sumKcal(add)
    if (!n) return
    onAdd(n)
    setAdd('')
  }
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="input !py-3 font-mono text-lg"
          inputMode="numeric"
          placeholder="Yediğin kcal (ör. 450)"
          value={add}
          onChange={(e) => setAdd(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && quickAdd()}
        />
        <button className="btn btn-primary shrink-0 !px-5" onClick={quickAdd}><Plus size={18} /> Ekle</button>
      </div>

      <div className="rounded-2xl border border-white/5 bg-ink/60 p-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="label">Bugünün hesabı</span>
          {expr.trim() && (
            <button className="flex items-center gap-1 text-[11px] text-mute hover:text-danger" onClick={() => { if (confirm('Bugünkü kalori hesabı sıfırlansın mı?')) onChange('') }}>
              <Eraser size={12} /> Sıfırla
            </button>
          )}
        </div>
        <textarea
          className="w-full resize-none bg-transparent font-mono text-[15px] leading-relaxed text-slate-200 outline-none placeholder:text-slate-600"
          rows={2}
          placeholder="450 + 320 + 180  (buraya doğrudan da yazabilir, düzeltebilirsin)"
          value={expr}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="mt-2 flex items-end justify-between gap-3 border-t border-white/5 pt-2">
          <span className="text-[11px] text-mute">
            {items ? `${items} kalem` : 'Henüz giriş yok'}
            {savedAt && expr.trim() ? ` · son kayıt ${savedAt}` : ''}
          </span>
          <span className="font-mono text-2xl font-bold tabular">= {total.toLocaleString('tr-TR')} <span className="text-sm text-mute">kcal</span></span>
        </div>
      </div>
      <p className="text-[11px] text-mute">Her değişiklik otomatik kaydedilir; günün kalorisi her zaman buradaki en son toplamdır.</p>
    </div>
  )
}

function SchoolMode({ onAdd }: { onAdd: (m: Meal) => void }) {
  const [added, setAdded] = useState<string | null>(null)
  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
      <div className="mt-4 rounded-2xl border border-emerald/20 bg-emerald/[.05] p-3">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald"><GraduationCap size={16} /> Okul Günü — 3 Kurtarıcı Strateji</div>
        <div className="grid gap-3 md:grid-cols-3">
          {SCHOOL_STRATEGIES.map((s, i) => (
            <div key={s.id} className="flex flex-col rounded-xl border border-white/5 bg-ink/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">{i + 1}. {s.title}</span>
                <Pill>{s.badge}</Pill>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                {s.menus.map((m) => (
                  <button key={m.name} onClick={() => { onAdd(m); setAdded(m.name); setTimeout(() => setAdded(null), 1500) }}
                    className="group rounded-lg border border-white/5 bg-white/[.03] p-2.5 text-left transition hover:border-emerald/40 hover:bg-emerald/[.06]">
                    <div className="text-[12px] leading-snug text-slate-300">{m.desc}</div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px]">
                      <span className="font-mono text-mute">~{m.kcal} kcal · {m.protein}g P</span>
                      <span className="flex items-center gap-1 font-semibold text-emerald">
                        {added === m.name ? <><CheckCircle2 size={12} /> Eklendi</> : <><Plus size={12} /> Ekle</>}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              {s.rule && <p className="mt-2 rounded-lg bg-amber/10 p-2 text-[11px] font-medium leading-snug text-amber">⚠ {s.rule}</p>}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function Water() {
  const { day, updateDay } = useStore()
  const pct = Math.min(1, day.water / TARGETS.waterMl)
  const add = (ml: number) => updateDay((d) => ({ ...d, water: Math.max(0, d.water + ml) }))
  return (
    <Card title="Su" icon={<Droplets size={16} className="text-water" />} action={<Pill color="#3B82F6">{(day.water / 1000).toFixed(2)} / 3.5 L</Pill>}>
      <div className="flex items-center gap-4">
        <div className="relative h-36 w-20 shrink-0 overflow-hidden rounded-b-3xl rounded-t-lg border-2 border-water/40 bg-water/5">
          <motion.div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-water to-sky-400" animate={{ height: `${pct * 100}%` }} transition={{ type: 'spring', stiffness: 60, damping: 15 }}>
            <svg viewBox="0 0 80 10" preserveAspectRatio="none" className="absolute -top-2 left-0 h-3 w-[200%] animate-[wave_3s_linear_infinite]" style={{ animation: 'wave 3s linear infinite' }}>
              <path d="M0 5 Q10 0 20 5 T40 5 T60 5 T80 5 V10 H0Z" fill="#38BDF8" />
            </svg>
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold">{Math.round(pct * 100)}%</div>
        </div>
        <div className="flex-1 space-y-2">
          <button onClick={() => updateDay((d) => ({ ...d, morningWater: !d.morningWater, water: Math.max(0, d.water + (d.morningWater ? -500 : 500)) }))}
            className={`btn w-full justify-start ${day.morningWater ? 'border border-water/50 bg-water/15 text-sky-300' : 'btn-ghost'}`}>
            <Sunrise size={16} /> Sabah uyanınca 500 ml {day.morningWater && <CheckCircle2 size={14} className="ml-auto" />}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn btn-ghost" onClick={() => add(250)}>+250 ml</button>
            <button className="btn btn-ghost" onClick={() => add(500)}>+500 ml</button>
          </div>
          <button className="w-full text-center text-[11px] text-mute hover:text-slate-300" onClick={() => add(-250)}>− 250 ml geri al</button>
        </div>
      </div>
    </Card>
  )
}

function Sleep() {
  const { day, updateDay } = useStore()
  const h = day.sleepH ?? 0
  const color = h >= 7.5 ? '#10B981' : h >= 6.5 ? '#F59E0B' : h > 0 ? '#EF4444' : '#64748B'
  return (
    <Card title="Uyku" icon={<Moon size={16} className="text-violet-400" />} action={<Pill color={color}>{h ? `${h} sa` : '—'} / 8 sa</Pill>}>
      <input type="range" min={0} max={12} step={0.5} value={h} onChange={(e) => updateDay((d) => ({ ...d, sleepH: parseFloat(e.target.value) || null }))}
        className="w-full accent-emerald" aria-label="Uyku süresi" />
      <div className="mt-1 flex justify-between text-[10px] text-mute"><span>0</span><span>4</span><span>8</span><span>12</span></div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-mute">Uyku kalitesi</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} aria-label={`${i} yıldız`} onClick={() => updateDay((d) => ({ ...d, sleepQ: d.sleepQ === i ? 0 : i }))}>
              <Star size={20} className={i <= day.sleepQ ? 'fill-amber text-amber' : 'text-slate-600'} />
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}

function CompleteDay({ score, streakN }: { score: number; streakN: number }) {
  const { day, updateDay } = useStore()
  const [celebrate, setCelebrate] = useState(false)
  const wp = workoutProgress(day.workout)
  const complete = () => {
    updateDay((d) => ({ ...d, completed: true, score: dayScore(d), completedAt: new Date().toISOString() }))
    setCelebrate(true)
    setTimeout(() => setCelebrate(false), 2600)
  }
  return (
    <div className="relative">
      <div className="mb-3 flex items-center justify-between text-xs text-mute">
        <span>Başarı puanı <b className="font-mono text-base text-slate-100">{score}</b>/100</span>
        <span>🔥 Seri <b className="font-mono text-base text-slate-100">{streakN}</b> gün</span>
        <span>Antrenman <b className="font-mono text-slate-100">{Math.round(wp.pct * 100)}%</b></span>
      </div>
      {day.completed ? (
        <div className="flex items-center gap-2">
          <div className="btn flex-1 border border-emerald/40 bg-emerald/10 text-emerald"><CheckCircle2 size={18} /> Gün tamamlandı · {day.score ?? score} puan</div>
          <button className="btn btn-ghost !px-3" title="Tamamlamayı geri al" onClick={() => updateDay((d) => ({ ...d, completed: false }))}><X size={16} /></button>
        </div>
      ) : (
        <button onClick={complete} className="btn btn-primary w-full !py-3.5 text-base shadow-[0_10px_30px_-10px_#10B981]">
          <CheckCircle2 size={20} /> Bugünü Tamamladım
        </button>
      )}
      <AnimatePresence>
        {celebrate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
            {Array.from({ length: 28 }).map((_, i) => (
              <motion.span key={i} className="absolute h-2.5 w-2.5 rounded-sm"
                style={{ background: ['#10B981', '#F59E0B', '#3B82F6', '#F472B6'][i % 4] }}
                initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                animate={{ x: Math.cos(i) * (180 + (i % 5) * 40), y: Math.sin(i * 1.7) * 220 - 60, rotate: 360 + i * 20, opacity: 0 }}
                transition={{ duration: 1.8, ease: 'easeOut' }} />
            ))}
            <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="card px-8 py-6 text-center">
              <div className="text-4xl">🏆</div>
              <div className="mt-2 text-lg font-bold">Harika iş!</div>
              <div className="text-sm text-mute">Gün arşive kaydedildi · {score}/100</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
