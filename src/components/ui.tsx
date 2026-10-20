import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export function Card({ children, className = '', title, icon, action }: { children: ReactNode; className?: string; title?: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`card p-4 sm:p-5 ${className}`}
    >
      {title && (
        <header className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-200">
            {icon && <span className="text-emerald">{icon}</span>}
            {title}
          </h2>
          {action}
        </header>
      )}
      {children}
    </motion.section>
  )
}

export function Bar({ value, max, color, softMax }: { value: number; max: number; color: string; softMax?: number }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="relative h-2.5 overflow-hidden rounded-full bg-white/5">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color, boxShadow: `0 0 12px ${color}66` }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />
      {softMax && <div className="absolute top-0 h-full w-0.5 bg-white/40" style={{ left: `${Math.min(100, (softMax / max) * 100)}%` }} />}
    </div>
  )
}

export function Ring({ value, max, size = 180, stroke = 14, color, children, bufferPct }: { value: number; max: number; size?: number; stroke?: number; color: string; children?: ReactNode; bufferPct?: number }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.min(1, value / max)
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,.06)" strokeWidth={stroke} fill="none" />
        {bufferPct != null && (
          <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(245,158,11,.25)" strokeWidth={stroke} fill="none"
            strokeDasharray={`${c * (1 - bufferPct)} ${c}`} strokeDashoffset={-c * bufferPct} />
        )}
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct), stroke: color }}
          transition={{ type: 'spring', stiffness: 60, damping: 18 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

export function Pill({ children, color = '#10B981' }: { children: ReactNode; color?: string }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: `${color}1A`, color, border: `1px solid ${color}33` }}>
      {children}
    </span>
  )
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button onClick={() => onChange(!on)} className="flex items-center gap-2.5" aria-pressed={on}>
      <span className={`relative h-6 w-11 rounded-full transition-colors ${on ? 'bg-emerald' : 'bg-white/10'}`}>
        <motion.span layout className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow" style={{ left: on ? 22 : 2 }} />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}

export const fmtTime = (s: number) => {
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

export function beep(freq = 880, ms = 180, times = 1) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    for (let i = 0; i < times; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.frequency.value = freq
      o.connect(g); g.connect(ctx.destination)
      const t = ctx.currentTime + i * (ms / 1000 + 0.12)
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000)
      o.start(t); o.stop(t + ms / 1000 + 0.05)
    }
    navigator.vibrate?.([120, 60, 120])
  } catch { /* ses yok */ }
}
