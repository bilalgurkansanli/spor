import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Droplets, Flame, GraduationCap, Lightbulb, Moon, NotebookPen, Plus, Sparkles, Star, Sunrise, Trash2, UtensilsCrossed, X } from 'lucide-react'
import { COACH_TIPS, QUICK_FOODS, SCHOOL_STRATEGIES, TARGETS, type Meal } from '../lib/plan'
import { dayScore, fromKey, streak, totals, uid, useStore, workoutProgress } from '../lib/store'
import { Bar, Card, Pill, Ring, Toggle } from './ui'

export function kcalStatus(kcal: number) {
  if (kcal === 0) return { color: '#64748B', label: 'Henüz kayıt yok', tone: 'mute' as const }
  if (kcal < TARGETS.kcalLow) return { color: '#F59E0B', label: 'Çok düşük kalori! Kas yıkımı ve güç kaybı riski', tone: 'warn' as const }
  if (kcal <= TARGETS.kcal) return { color: '#10B981', label: 'Hedefe doğru ilerliyorsun', tone: 'ok' as const }
  if (kcal <= TARGETS.kcalBuffer) return { color: '#F59E0B', label: 'Tampon bölge içindesin (ideal açık ~500 kcal)', tone: 'ok' as const }
  if (kcal <= TARGETS.kcalHigh) return { color: '#F59E0B', label: 'Tamponun üst sınırındasın — bugünlük yeter', tone: 'warn' as const }
  return { color: '#EF4444', label: 'Üst sınır aşıldı (> 2.250 kcal)', tone: 'bad' as const }
}

export default function Today() {
  const { day, updateDay, state, date } = useStore()
  const t = totals(day)
  const st = kcalStatus(t.kcal)
  const score = dayScore(day)
  const tip = useMemo(() => COACH_TIPS[fromKey(date).getDate() % COACH_TIPS.length], [date])

  const addMeal = (m: Meal) =>
    updateDay((d) => ({ ...d, meals: [...d.meals, { ...m, id: uid(), time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }] }))

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Kalori halkası */}
      <Card className="lg:col-span-5" title="Kalori" icon={<Flame size={16} />} action={<Pill color={st.color}>{t.kcal} / {TARGETS.kcal} kcal</Pill>}>
        <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col xl:flex-row">
          <Ring value={t.kcal} max={TARGETS.kcalHigh} color={st.color} bufferPct={TARGETS.kcal / TARGETS.kcalHigh} size={190}>
            <span className="font-mono text-4xl font-bold tabular">{t.kcal}</span>
            <span className="text-xs text-mute">kcal alındı</span>
            <span className="mt-1 text-[11px] font-semibold" style={{ color: st.color }}>
              {t.kcal <= TARGETS.kcal ? `${TARGETS.kcal - t.kcal} kaldı` : `+${t.kcal - TARGETS.kcal} tampon`}
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

      {/* Makrolar */}
      <Card className="lg:col-span-7" title="Makrolar & Şeker" icon={<Sparkles size={16} />}>
        <div className="space-y-4">
          <Macro name="Protein" v={t.protein} range={TARGETS.protein} color="#10B981" hint="En kritik kural — asla kısılmaz" />
          <Macro name="Karbonhidrat" v={t.carbs} range={TARGETS.carbs} color="#3B82F6" hint="Yulaf, basmati, bulgur, patates, karabuğday" />
          <Macro name="Yağ" v={t.fat} range={TARGETS.fat} color="#A78BFA" hint="Zeytinyağı, kuruyemiş, yumurta sarısı, avokado" />
          <div>
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="font-medium">İlave Şeker</span>
              <span className="font-mono tabular" style={{ color: t.sugar > TARGETS.sugarMax ? '#EF4444' : '#E5E7EB' }}>
                {round(t.sugar)} <span className="text-mute">/ maks {TARGETS.sugarMax} g</span>
              </span>
            </div>
            <Bar value={t.sugar} max={TARGETS.sugarMax} color={t.sugar > TARGETS.sugarMax ? '#EF4444' : t.sugar > 15 ? '#F59E0B' : '#10B981'} />
            <p className="mt-1 text-[11px] text-mute">Taze meyve & sade süt ürünlerindeki doğal şeker kotaya dahil değildir.</p>
          </div>
        </div>
      </Card>

      {/* Öğünler */}
      <Card className="lg:col-span-7" title="Öğünler" icon={<UtensilsCrossed size={16} />} action={<Toggle on={day.school} onChange={(v) => updateDay((d) => ({ ...d, school: v }))} label="Okul Günü" />}>
        <AnimatePresence>{day.school && <SchoolMode onAdd={addMeal} />}</AnimatePresence>
        <MealForm onAdd={addMeal} />
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {QUICK_FOODS.map((f) => (
            <button key={f.name} onClick={() => addMeal(f)} className="btn btn-ghost shrink-0 !px-3 !py-1.5 text-xs">
              <Plus size={12} /> {f.name}
            </button>
          ))}
        </div>
        <ul className="mt-4 divide-y divide-white/5">
          <AnimatePresence initial={false}>
            {day.meals.length === 0 && <li className="py-6 text-center text-sm text-mute">Bugün henüz öğün eklenmedi.</li>}
            {day.meals.map((m) => (
              <motion.li key={m.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex items-center gap-3 py-2.5">
                <span className="w-11 font-mono text-[11px] text-mute">{m.time}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{m.name}</div>
                  <div className="text-[11px] text-mute">P {m.protein}g · K {m.carbs}g · Y {m.fat}g{m.sugar ? ` · Ş ${m.sugar}g` : ''}</div>
                </div>
                <span className="font-mono text-sm tabular">{m.kcal}</span>
                <button aria-label="Sil" onClick={() => updateDay((d) => ({ ...d, meals: d.meals.filter((x) => x.id !== m.id) }))} className="rounded-lg p-1.5 text-mute hover:bg-white/5 hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </Card>

      <div className="grid gap-4 lg:col-span-5">
        <Water />
        <Sleep />
      </div>

      {/* Not + Tamamla */}
      <Card className="lg:col-span-7" title="Günlük Not" icon={<NotebookPen size={16} />}>
        <textarea
          className="input min-h-[120px] resize-y leading-relaxed"
          placeholder="Bugün enerjin nasıldı? Antrenman hissiyatı, beslenme notları…"
          value={day.note}
          onChange={(e) => updateDay((d) => ({ ...d, note: e.target.value }))}
        />
      </Card>

      <Card className="lg:col-span-5">
        <div className="flex h-full flex-col justify-between gap-4">
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

const round = (n: number) => Math.round(n * 10) / 10

function Zone({ c, t, v }: { c: string; t: string; v: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[.02] px-2 py-1.5">
      <div className="mx-auto mb-1 h-1 w-6 rounded-full" style={{ background: c }} />
      <div className="text-mute">{t}</div>
      <div className="font-mono font-semibold">{v}</div>
    </div>
  )
}

function Macro({ name, v, range, color, hint }: { name: string; v: number; range: readonly [number, number]; color: string; hint: string }) {
  const inRange = v >= range[0] && v <= range[1]
  const over = v > range[1]
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="font-medium">{name} {inRange && <CheckCircle2 size={13} className="ml-1 inline text-emerald" />}</span>
        <span className="font-mono tabular" style={{ color: over ? '#F59E0B' : '#E5E7EB' }}>
          {round(v)} <span className="text-mute">/ {range[0]}–{range[1]} g</span>
        </span>
      </div>
      <Bar value={v} max={range[1]} softMax={range[0]} color={color} />
      <p className="mt-1 text-[11px] text-mute">{hint}</p>
    </div>
  )
}

function MealForm({ onAdd }: { onAdd: (m: Meal) => void }) {
  const [f, setF] = useState({ name: '', kcal: '', protein: '', carbs: '', fat: '', sugar: '' })
  const n = (s: string) => Math.max(0, parseFloat(s.replace(',', '.')) || 0)
  const submit = () => {
    if (!f.name.trim() && !f.kcal) return
    onAdd({ name: f.name.trim() || 'Öğün', kcal: Math.round(n(f.kcal)), protein: n(f.protein), carbs: n(f.carbs), fat: n(f.fat), sugar: n(f.sugar) })
    setF({ name: '', kcal: '', protein: '', carbs: '', fat: '', sugar: '' })
  }
  const field = (k: keyof typeof f, ph: string) => (
    <input className="input !px-2 text-center font-mono" inputMode="decimal" placeholder={ph} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && submit()} />
  )
  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <input className="input" placeholder="Öğün adı (ör. Tavuklu bulgur)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && submit()} />
        <button className="btn btn-primary shrink-0" onClick={submit}><Plus size={16} /> Ekle</button>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {field('kcal', 'kcal')}{field('protein', 'P g')}{field('carbs', 'K g')}{field('fat', 'Y g')}{field('sugar', 'Şeker')}
      </div>
    </div>
  )
}

function SchoolMode({ onAdd }: { onAdd: (m: Meal) => void }) {
  const [added, setAdded] = useState<string | null>(null)
  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
      <div className="mb-4 rounded-2xl border border-emerald/20 bg-emerald/[.05] p-3">
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
