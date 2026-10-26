import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Droplets, Dumbbell, Flame, GraduationCap, Moon, Pencil, Star } from 'lucide-react'
import { EXERCISES, LEGACY_EXERCISES } from '../lib/plan'
import { dayKcal, emptyDay, fromKey, todayKey, useStore, workoutProgress, type DayLog } from '../lib/store'
import { Card, Pill, fmtTime } from './ui'
import { kcalStatus } from './Today'

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

export default function History({ onEdit }: { onEdit: (date: string) => void }) {
  const { state, updateDay } = useStore()
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [sel, setSel] = useState<string>(todayKey())

  const cells = useMemo(() => {
    const first = (cursor.getDay() + 6) % 7 // Pazartesi başlangıç
    const n = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    return [...Array(first).fill(null), ...Array.from({ length: n }, (_, i) => todayKey(new Date(cursor.getFullYear(), cursor.getMonth(), i + 1)))]
  }, [cursor])

  const list = useMemo(() => Object.values(state.days).filter((d) => d.completed || dayKcal(d) > 0 || d.note).sort((a, b) => b.date.localeCompare(a.date)), [state.days])
  const selDay: DayLog = state.days[sel] ?? emptyDay(sel)
  const [editNote, setEditNote] = useState(false)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Card className="lg:col-span-5" title="Takvim" icon={<CalendarDays size={16} />} action={
        <div className="flex items-center gap-1">
          <button className="rounded-lg p-1.5 hover:bg-white/5" aria-label="Önceki ay" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><ChevronLeft size={16} /></button>
          <span className="w-28 text-center text-sm font-semibold">{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</span>
          <button className="rounded-lg p-1.5 hover:bg-white/5" aria-label="Sonraki ay" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><ChevronRight size={16} /></button>
        </div>
      }>
        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold uppercase text-mute">
          {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="mt-1.5 grid grid-cols-7 gap-1.5">
          {cells.map((k, i) => {
            if (!k) return <div key={i} />
            const d = state.days[k]
            const has = d && (dayKcal(d) > 0 || d.note || d.water)
            const isToday = k === todayKey()
            return (
              <button key={k} onClick={() => setSel(k)}
                className={`relative aspect-square rounded-lg text-sm font-medium transition
                  ${d?.completed ? 'bg-emerald/80 text-ink hover:bg-emerald' : has ? 'bg-white/10 hover:bg-white/15' : 'bg-white/[.03] text-mute hover:bg-white/[.07]'}
                  ${sel === k ? 'ring-2 ring-white/80' : isToday ? 'ring-1 ring-emerald' : ''}`}>
                {Number(k.slice(8))}
                {d && workoutProgress(d.workout).done > 0 && <span className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${d.completed ? 'bg-ink' : 'bg-emerald'}`} />}
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-mute">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald/80" /> Tamamlandı</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-white/10" /> Kayıt var</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald" /> Antrenman</span>
        </div>
      </Card>

      <Card className="lg:col-span-7" title={fromKey(sel).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        action={<button className="btn btn-ghost !py-1.5 text-xs" onClick={() => onEdit(sel)}><Pencil size={13} /> Günü düzenle</button>}>
        <DayDetail day={selDay} />
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="label">Günlük not</span>
            <button className="text-xs text-emerald" onClick={() => setEditNote(!editNote)}>{editNote ? 'Bitti' : 'Düzenle'}</button>
          </div>
          {editNote ? (
            <textarea className="input min-h-[100px]" value={selDay.note} onChange={(e) => updateDay((d) => ({ ...d, note: e.target.value }), sel)} />
          ) : (
            <p className="whitespace-pre-wrap rounded-xl bg-white/[.03] p-3 text-sm leading-relaxed text-slate-300">{selDay.note || <span className="text-mute">Bu gün için not yok.</span>}</p>
          )}
        </div>
      </Card>

      <Card className="lg:col-span-12" title="Geçmiş Günlükler">
        {list.length === 0 ? <p className="py-6 text-center text-sm text-mute">Henüz kayıtlı gün yok. Bugünü tamamladığında burada görünecek.</p> : (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {list.map((d) => {
              const kcal = dayKcal(d)
              const wp = workoutProgress(d.workout)
              return (
                <button key={d.date} onClick={() => { setSel(d.date); setCursor(new Date(Number(d.date.slice(0, 4)), Number(d.date.slice(5, 7)) - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className={`rounded-xl border p-3 text-left transition hover:bg-white/[.04] ${d.completed ? 'border-emerald/30' : 'border-white/5'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{fromKey(d.date).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    {d.completed ? <Pill>{d.score ?? '–'} puan</Pill> : <Pill color="#94A3B8">açık</Pill>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-mute">
                    <span style={{ color: kcalStatus(kcal).color }}>{kcal} kcal</span>
                    <span className="text-sky-400">{(d.water / 1000).toFixed(1)} L</span>
                    {d.sleepH ? <span>{d.sleepH} sa</span> : null}
                    {wp.done > 0 && <span className="flex items-center gap-1 text-emerald"><Dumbbell size={11} /> {Math.round(wp.pct * 100)}%</span>}
                    {d.school && <span className="flex items-center gap-1"><GraduationCap size={11} /> okul</span>}
                  </div>
                  {d.note && <p className="mt-2 line-clamp-2 text-[12px] text-slate-400">{d.note}</p>}
                </button>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

function DayDetail({ day }: { day: DayLog }) {
  const kcal = dayKcal(day)
  const wp = workoutProgress(day.workout)
  const st = kcalStatus(kcal)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon={<Flame size={14} />} k="Kalori" v={`${kcal}`} color={st.color} />
        <Stat icon={<Droplets size={14} />} k="Su" v={`${(day.water / 1000).toFixed(1)} L`} color="#3B82F6" />
        <Stat icon={<Moon size={14} />} k="Uyku" v={day.sleepH ? `${day.sleepH} sa` : '–'} color="#A78BFA" extra={day.sleepQ ? <span className="flex">{Array.from({ length: day.sleepQ }).map((_, i) => <Star key={i} size={9} className="fill-amber text-amber" />)}</span> : null} />
        <Stat icon={<Dumbbell size={14} />} k="Antrenman" v={`${Math.round(wp.pct * 100)}%`} color="#10B981" />
      </div>
      {day.kcalExpr?.trim() && <div className="rounded-xl bg-white/[.03] p-2.5 font-mono text-[12px] text-mute">{day.kcalExpr} = <b className="text-slate-200">{kcal} kcal</b></div>}
      {wp.done > 0 && (
        <div>
          <div className="label mb-1.5">Antrenman detayı</div>
          <ul className="space-y-1 text-[12px]">
            {[...EXERCISES, ...Object.entries(LEGACY_EXERCISES).map(([id, name]) => ({ id, name }))].map((ex) => {
              const done = (day.workout.sets[ex.id] ?? []).filter((s) => s.done)
              if (!done.length) return null
              return <li key={ex.id} className="flex justify-between gap-2"><span className="truncate text-slate-300">{ex.name}</span><span className="shrink-0 font-mono text-mute">{done.map((s) => `${s.kg || 'VA'}×${s.reps || '?'}`).join('  ')}</span></li>
            })}
            {day.workout.plankSec > 0 && <li className="flex justify-between"><span className="text-slate-300">Plank</span><span className="font-mono text-mute">{fmtTime(day.workout.plankSec)}</span></li>}
            {day.workout.cardioSec.some((s) => s > 0) && <li className="flex justify-between"><span>Kardiyo</span><span className="font-mono">{fmtTime(day.workout.cardioSec.reduce((a, b) => a + b, 0))}</span></li>}
          </ul>
        </div>
      )}
    </div>
  )
}

function Stat({ icon, k, v, color, extra }: { icon: React.ReactNode; k: string; v: string; color: string; extra?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[.03] p-2.5">
      <div className="flex items-center gap-1.5 text-[11px] text-mute"><span style={{ color }}>{icon}</span>{k}</div>
      <div className="mt-1 flex items-center gap-2 font-mono text-lg font-semibold">{v}{extra}</div>
    </div>
  )
}
