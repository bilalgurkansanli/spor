import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { EXERCISES, TARGETS, type Meal } from './plan'

export interface MealEntry extends Meal { id: string; time: string }
export interface SetLog { kg: string; reps: string; done: boolean }

export interface WorkoutLog {
  sets: Record<string, SetLog[]>
  plankSec: number
  cardioSec: number[]
  finished: boolean
}

export interface DayLog {
  date: string
  meals: MealEntry[]
  water: number
  morningWater: boolean
  sleepH: number | null
  sleepQ: number
  note: string
  school: boolean
  workout: WorkoutLog
  completed: boolean
  score?: number
  completedAt?: string
}

export interface Measurement { id: string; date: string; weight?: number; waist?: number; chest?: number; arm?: number }

export interface Profile { startWeight: number; targetWeight: number; startDate: string }

export interface AppState {
  version: 1
  profile: Profile | null
  days: Record<string, DayLog>
  measurements: Measurement[]
  plankRecord: number
  customGifs: Record<string, string>
}

const KEY = 'recomp-tracker-v1'

export const todayKey = (d = new Date()) => {
  const z = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export function emptyWorkout(): WorkoutLog {
  const sets: Record<string, SetLog[]> = {}
  for (const ex of EXERCISES) {
    sets[ex.id] = Array.from({ length: ex.sets }, () => ({ kg: ex.startKg != null ? String(ex.startKg) : '', reps: '', done: false }))
  }
  return { sets, plankSec: 0, cardioSec: [0, 0, 0], finished: false }
}

export function emptyDay(date: string): DayLog {
  return { date, meals: [], water: 0, morningWater: false, sleepH: null, sleepQ: 0, note: '', school: false, workout: emptyWorkout(), completed: false }
}

const initial: AppState = { version: 1, profile: null, days: {}, measurements: [], plankRecord: 0, customGifs: {} }

export function totals(day: DayLog) {
  return day.meals.reduce(
    (a, m) => ({ kcal: a.kcal + m.kcal, protein: a.protein + m.protein, carbs: a.carbs + m.carbs, fat: a.fat + m.fat, sugar: a.sugar + m.sugar }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 },
  )
}

export function workoutProgress(w: WorkoutLog) {
  let done = 0, total = 0
  for (const ex of EXERCISES) {
    if (ex.isPlank) { total++; if (w.plankSec > 0) done++; continue }
    for (const s of w.sets[ex.id] ?? []) { total++; if (s.done) done++ }
  }
  return { done, total, pct: total ? done / total : 0 }
}

/** Günlük başarı puanı (0-100) */
export function dayScore(day: DayLog) {
  const t = totals(day)
  let s = 0
  // Kalori 30
  if (t.kcal >= TARGETS.kcal - 100 && t.kcal <= TARGETS.kcalBuffer) s += 30
  else if (t.kcal >= TARGETS.kcalLow && t.kcal <= TARGETS.kcalHigh) s += 20
  else if (t.kcal > 0) s += 5
  // Protein 25
  s += 25 * Math.min(1, t.protein / TARGETS.protein[0])
  // Şeker 10
  if (t.kcal > 0) s += t.sugar <= TARGETS.sugarMax ? 10 : Math.max(0, 10 - (t.sugar - TARGETS.sugarMax) / 2)
  // Su 15
  s += 15 * Math.min(1, day.water / TARGETS.waterRange[0])
  // Uyku 10
  if (day.sleepH) s += 10 * Math.min(1, day.sleepH / 7.5)
  // Antrenman 10 (antrenman olmayan günlerde dinlenme puanı 6)
  const wp = workoutProgress(day.workout)
  s += wp.done > 0 ? 10 * Math.max(0.5, wp.pct) : 6
  return Math.round(Math.min(100, s))
}

export function streak(days: Record<string, DayLog>) {
  let n = 0
  const d = new Date()
  if (!days[todayKey(d)]?.completed) d.setDate(d.getDate() - 1)
  while (days[todayKey(d)]?.completed) { n++; d.setDate(d.getDate() - 1) }
  return n
}

// ---------- IndexedDB yedek aynası ----------
function idb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open('recomp-tracker', 1)
    r.onupgradeneeded = () => r.result.createObjectStore('kv')
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
}
async function idbSet(v: AppState) {
  try {
    const db = await idb()
    db.transaction('kv', 'readwrite').objectStore('kv').put(v, KEY)
  } catch { /* yoksay */ }
}
async function idbGet(): Promise<AppState | null> {
  try {
    const db = await idb()
    return await new Promise((res) => {
      const r = db.transaction('kv').objectStore('kv').get(KEY)
      r.onsuccess = () => res((r.result as AppState) ?? null)
      r.onerror = () => res(null)
    })
  } catch { return null }
}

function load(): AppState | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? normalize(JSON.parse(raw)) : null
  } catch { return null }
}

export function normalize(v: unknown): AppState {
  const s = (v ?? {}) as Partial<AppState>
  const days: Record<string, DayLog> = {}
  for (const [k, d] of Object.entries(s.days ?? {})) {
    const base = emptyDay(k)
    const w = { ...base.workout, ...(d.workout ?? {}) }
    w.sets = { ...base.workout.sets, ...(d.workout?.sets ?? {}) }
    days[k] = { ...base, ...d, workout: w }
  }
  return {
    version: 1,
    profile: s.profile ?? null,
    days,
    measurements: Array.isArray(s.measurements) ? s.measurements : [],
    plankRecord: s.plankRecord ?? 0,
    customGifs: s.customGifs ?? {},
  }
}

interface Ctx {
  state: AppState
  setState: (fn: (s: AppState) => AppState) => void
  date: string
  setDate: (d: string) => void
  day: DayLog
  updateDay: (fn: (d: DayLog) => DayLog, date?: string) => void
}

const StoreCtx = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setRaw] = useState<AppState>(() => load() ?? initial)
  const [date, setDate] = useState(todayKey())
  const [ready, setReady] = useState(() => load() !== null)

  // localStorage boşsa (ör. temizlendiyse) IndexedDB'den geri getir
  useEffect(() => {
    if (ready) return
    idbGet().then((v) => {
      if (v) setRaw(normalize(v))
      setReady(true)
    })
  }, [ready])

  useEffect(() => {
    if (!ready) return
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* kota */ }
    idbSet(state)
  }, [state])

  const setState = useCallback((fn: (s: AppState) => AppState) => setRaw(fn), [])
  const updateDay = useCallback((fn: (d: DayLog) => DayLog, d?: string) => {
    setRaw((s) => {
      const k = d ?? date
      return { ...s, days: { ...s.days, [k]: fn(s.days[k] ?? emptyDay(k)) } }
    })
  }, [date])

  const day = state.days[date] ?? emptyDay(date)
  return <StoreCtx.Provider value={{ state, setState, date, setDate, day, updateDay }}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const c = useContext(StoreCtx)
  if (!c) throw new Error('StoreProvider eksik')
  return c
}

export function exportJson(state: AppState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `recomp-yedek-${todayKey()}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

/** "YYYY-MM-DD" → yerel saat dilimindeki Date (UTC kaymasını önler) */
export const fromKey = (k: string) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d) }
