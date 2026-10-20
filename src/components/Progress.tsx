import { useMemo, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, Flag, Plus, Ruler, Scale, Trash2, TrendingDown } from 'lucide-react'
import { projectionAt, roadmap, round1 } from '../lib/plan'
import { fromKey, todayKey, uid, useStore, type Measurement } from '../lib/store'
import { Card, Pill } from './ui'

const DAY = 86400000
const weekOf = (start: string, d: string) => (fromKey(d).getTime() - fromKey(start).getTime()) / (7 * DAY)
const fmtD = (d: string) => fromKey(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })

export default function Progress() {
  const { state, setState } = useStore()
  const p = state.profile!
  const ms = useMemo(() => [...state.measurements].sort((a, b) => a.date.localeCompare(b.date)), [state.measurements])
  const weights = ms.filter((m) => m.weight)
  const current = weights.at(-1)?.weight ?? p.startWeight
  const lost = p.startWeight - current
  const total = p.startWeight - p.targetWeight
  const pct = Math.max(0, Math.min(1, lost / total))
  const week = Math.max(0, weekOf(p.startDate, todayKey()))
  const expected = projectionAt(p.startWeight, p.targetWeight, Math.min(24, week))
  const rm = roadmap(p.startWeight, p.targetWeight)

  // Plato: toplam hedefin %60ı verildikten sonra 14+ gün < 0.3 kg değişim
  const plateauLine = p.startWeight - total * 0.6
  const plateau = useMemo(() => {
    const last = weights.at(-1)
    if (!last || last.weight! > plateauLine + 0.5) return false
    const cutoff = todayKey(new Date(fromKey(last.date).getTime() - 14 * DAY))
    const ref = [...weights].reverse().find((m) => m.date <= cutoff)
    return !!ref && Math.abs(ref.weight! - last.weight!) < 0.3
  }, [weights, plateauLine])

  const chart = useMemo(() => {
    const pts: { w: number; label: string; plan?: number; kilo?: number }[] = []
    for (let w = 0; w <= 24; w += 2) pts.push({ w, label: `H${w}`, plan: projectionAt(p.startWeight, p.targetWeight, w) })
    for (const m of weights) {
      const w = round1(weekOf(p.startDate, m.date))
      pts.push({ w, label: fmtD(m.date), kilo: m.weight })
    }
    return pts.sort((a, b) => a.w - b.w)
  }, [weights, p])

  const tape = ms.filter((m) => m.waist || m.chest || m.arm).map((m) => ({ label: fmtD(m.date), Bel: m.waist, Göğüs: m.chest, Kol: m.arm }))

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Card className="lg:col-span-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="label">Yol Haritası · 20-24 Hafta</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-4xl font-bold tabular">{round1(current)}</span>
              <span className="text-mute">kg</span>
              <TrendingDown size={18} className="text-emerald" />
              <span className="font-mono text-sm text-emerald">−{round1(Math.max(0, lost))} kg</span>
            </div>
          </div>
          <div className="flex gap-4 text-right text-xs">
            <div><div className="text-mute">Hafta</div><div className="font-mono text-lg font-semibold">{Math.floor(week)}</div></div>
            <div><div className="text-mute">Plana göre</div><div className="font-mono text-lg font-semibold">{expected} kg</div></div>
            <div><div className="text-mute">Hedef</div><div className="font-mono text-lg font-semibold text-emerald">{p.targetWeight} kg</div></div>
          </div>
        </div>
        <div className="relative mt-5 h-4 overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald to-teal-300 transition-all duration-700" style={{ width: `${pct * 100}%` }} />
          {rm.slice(0, -1).map((r) => (
            <div key={r.title} className="absolute top-0 h-full w-px bg-white/30" style={{ left: `${((p.startWeight - r.to) / total) * 100}%` }} />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[11px] text-mute"><span>{p.startWeight} kg</span><span>{Math.round(pct * 100)}%</span><span>{p.targetWeight} kg</span></div>

        <div className="mt-5 grid gap-2 sm:grid-cols-5">
          {rm.map((r, i) => {
            const reached = current <= r.to
            const activePhase = !reached && (i === 0 || current <= rm[i - 1].to)
            return (
              <div key={r.title} className={`rounded-xl border p-3 ${reached ? 'border-emerald/40 bg-emerald/[.06]' : activePhase ? 'border-amber/40 bg-amber/[.05]' : 'border-white/5 bg-white/[.02]'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold">{r.title.split(' — ')[0]}</span>
                  {reached ? <Flag size={13} className="text-emerald" /> : activePhase ? <Pill color="#F59E0B">şimdi</Pill> : null}
                </div>
                <div className="mt-1 font-mono text-[12px] text-slate-300">{r.from} → {r.to} kg</div>
                <div className="mt-1 text-[11px] leading-snug text-mute">{r.desc}</div>
              </div>
            )
          })}
        </div>

        {plateau && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber/30 bg-amber/10 p-3 text-sm text-amber">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div><b>{round1(plateauLine)} kg Adaptasyon Önerisi:</b> Kilo verimi 2-3 haftadır durdu. Kaloriyi <b>1.950 kcal</b>'ye çek veya kardiyoyu <b>40 dakikaya</b> çıkar.</div>
          </div>
        )}
      </Card>

      <Card className="lg:col-span-8" title="Kilo · Plan vs Gerçek" icon={<Scale size={16} />}>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={chart} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
              <XAxis dataKey="w" type="number" domain={[0, 24]} ticks={[0, 4, 8, 12, 16, 20, 24]} tickFormatter={(v) => `H${v}`} stroke="#64748B" fontSize={11} />
              <YAxis domain={[Math.floor(p.targetWeight - 2), Math.ceil(p.startWeight + 2)]} stroke="#64748B" fontSize={11} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 12 }} labelFormatter={(v) => `Hafta ${round1(Number(v))}`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line isAnimationActive={false} dataKey="plan" name="Projeksiyon" stroke="#64748B" strokeDasharray="6 4" dot={false} connectNulls strokeWidth={2} />
              <Line isAnimationActive={false} dataKey="kilo" name="Gerçek" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {weights.length === 0 && <p className="mt-2 text-center text-xs text-mute">İlk ölçümünü ekleyince gerçek eğrin burada belirecek.</p>}
      </Card>

      <MeasureForm />

      <Card className="lg:col-span-8" title="Mezura · Bel / Göğüs / Kol" icon={<Ruler size={16} />}>
        <p className="-mt-2 mb-3 text-[12px] text-mute">Tartı kas kazanımı yüzünden sabit kalabilir — bel küçülüyorsa doğru yoldasın.</p>
        {tape.length ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {([['Bel', '#F59E0B', 'küçülmeli'], ['Göğüs', '#3B82F6', 'korunmalı'], ['Kol', '#A78BFA', 'büyümeli']] as const).map(([k, color, goal]) => {
              const vals = tape.map((t) => t[k]).filter((v): v is number => v != null)
              const diff = vals.length > 1 ? round1(vals[vals.length - 1] - vals[0]) : 0
              return (
                <div key={k} className="rounded-xl border border-white/5 bg-white/[.02] p-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold" style={{ color }}>{k}</span>
                    <span className="font-mono text-xs text-mute">{goal}</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-bold">{vals.at(-1) ?? '–'}</span><span className="text-xs text-mute">cm</span>
                    {diff !== 0 && <span className="font-mono text-xs" style={{ color }}>{diff > 0 ? '+' : ''}{diff}</span>}
                  </div>
                  <div className="mt-2 h-28">
                    <ResponsiveContainer>
                      <LineChart data={tape} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                        <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" hide />
                        <YAxis stroke="#64748B" fontSize={10} domain={['dataMin - 1', 'dataMax + 1']} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 12 }} />
                        <Line isAnimationActive={false} dataKey={k} stroke={color} strokeWidth={2.5} connectNulls dot={{ r: 2.5, fill: color }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )
            })}
          </div>
        ) : <div className="flex h-40 items-center justify-center text-sm text-mute">Henüz mezura ölçümü yok.</div>}
      </Card>

      <Card className="lg:col-span-4" title="Ölçüm Kayıtları">
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-card text-mute">
              <tr><th className="py-1.5 text-left font-medium">Tarih</th><th>Kg</th><th>Bel</th><th>Göğüs</th><th>Kol</th><th /></tr>
            </thead>
            <tbody className="font-mono">
              {[...ms].reverse().map((m) => (
                <tr key={m.id} className="border-t border-white/5 text-center">
                  <td className="py-1.5 text-left font-sans">{fmtD(m.date)}</td>
                  <td>{m.weight ?? '–'}</td><td>{m.waist ?? '–'}</td><td>{m.chest ?? '–'}</td><td>{m.arm ?? '–'}</td>
                  <td><button aria-label="Sil" className="p-1 text-mute hover:text-danger" onClick={() => setState((s) => ({ ...s, measurements: s.measurements.filter((x) => x.id !== m.id) }))}><Trash2 size={12} /></button></td>
                </tr>
              ))}
              {ms.length === 0 && <tr><td colSpan={6} className="py-6 text-center font-sans text-mute">Kayıt yok</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function MeasureForm() {
  const { setState } = useStore()
  const [f, setF] = useState({ date: todayKey(), weight: '', waist: '', chest: '', arm: '' })
  const n = (s: string) => { const v = parseFloat(s.replace(',', '.')); return isFinite(v) && v > 0 ? v : undefined }
  const save = () => {
    const m: Measurement = { id: uid(), date: f.date, weight: n(f.weight), waist: n(f.waist), chest: n(f.chest), arm: n(f.arm) }
    if (!m.weight && !m.waist && !m.chest && !m.arm) return
    setState((s) => ({ ...s, measurements: [...s.measurements, m] }))
    setF({ ...f, weight: '', waist: '', chest: '', arm: '' })
  }
  const inp = (k: 'weight' | 'waist' | 'chest' | 'arm', label: string, unit: string) => (
    <label className="block">
      <span className="label">{label}</span>
      <div className="relative mt-1">
        <input className="input pr-10 font-mono" inputMode="decimal" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-mute">{unit}</span>
      </div>
    </label>
  )
  return (
    <Card className="lg:col-span-4" title="Yeni Ölçüm" icon={<Plus size={16} />}>
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 block"><span className="label">Tarih</span><input type="date" className="input mt-1" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
        {inp('weight', 'Kilo', 'kg')}{inp('waist', 'Bel', 'cm')}{inp('chest', 'Göğüs', 'cm')}{inp('arm', 'Kol', 'cm')}
      </div>
      <button className="btn btn-primary mt-4 w-full" onClick={save}><Plus size={16} /> Kaydet</button>
      <p className="mt-3 text-[11px] leading-relaxed text-mute">İpucu: Haftada 1 kez, sabah aç karnına ve tuvaletten sonra ölç. Bel ölçümünü göbek hizasından al.</p>
    </Card>
  )
}
