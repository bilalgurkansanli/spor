import { useEffect, useState } from 'react'
import { IMG_BASE, type Motion, type Muscle } from '../lib/plan'

/** Katman 1: free-exercise-db 0.jpg ↔ 1.jpg kareleriyle GIF emülatörü (800 ms).
 *  Katman 3: kullanıcının özel GIF URL'si varsa önce o denenir.
 *  Herhangi bir yükleme hatasında Katman 2 SVG görünür kalır — kırık resim asla gösterilmez. */
export function ExerciseAnimator({ dbId, customGif, muscles, motion, className = '' }: { dbId: string; customGif?: string; muscles: Muscle[]; motion: Motion; className?: string }) {
  const [frame, setFrame] = useState(0)
  const [loaded, setLoaded] = useState<[boolean, boolean]>([false, false])
  const [failed, setFailed] = useState(false)
  const [customFailed, setCustomFailed] = useState(false)

  useEffect(() => { setCustomFailed(false) }, [customGif])
  useEffect(() => { setFailed(false); setLoaded([false, false]) }, [dbId])

  useEffect(() => {
    const t = setInterval(() => setFrame((f) => (f ? 0 : 1)), 800)
    return () => clearInterval(t)
  }, [])

  const useCustom = !!customGif && !customFailed
  const showPhotos = !useCustom && !failed && loaded[0] && loaded[1]

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-ink ${className}`}>
      <div className={`absolute inset-0 transition-opacity duration-300 ${useCustom || showPhotos ? 'opacity-0' : 'opacity-100'}`}>
        <MuscleFigure muscles={muscles} motion={motion} />
      </div>

      {useCustom ? (
        <img src={customGif} alt="" className="absolute inset-0 h-full w-full bg-white object-contain" onError={() => setCustomFailed(true)} />
      ) : !failed && (
        <div className={`absolute inset-0 bg-white transition-opacity duration-300 ${showPhotos ? 'opacity-100' : 'opacity-0'}`}>
          {[0, 1].map((i) => (
            <img
              key={i}
              src={`${IMG_BASE}${dbId}/${i}.jpg`}
              alt=""
              onLoad={() => setLoaded((l) => (i ? [l[0], true] : [true, l[1]]))}
              onError={() => setFailed(true)}
              className="absolute inset-0 h-full w-full object-contain transition-opacity duration-200"
              style={{ opacity: frame === i ? 1 : 0 }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const HOT = '#EF4444'
const OFF = '#1E293B'

/** Katman 2: Hedef kası parlatan, hareket eden vektörel figür. İnternetsiz çalışır. */
export function MuscleFigure({ muscles, motion }: { muscles: Muscle[]; motion: Motion }) {
  const on = (m: Muscle) =>
    muscles.includes(m) || (m === 'abs' && muscles.includes('core')) || (m === 'lowerabs' && muscles.includes('core'))
  const p = (m: Muscle) => (on(m) ? { fill: HOT, className: 'muscle-glow' } : { fill: OFF })

  // Üst kol (omuz ekseni) ve ön kol (dirsek ekseni) açıları — sol taraf için; sağ taraf aynalanır
  const upper = { press: 0, curl: 0, pull: 150, fly: 70, raise: 80, push: 50, legraise: 165, crunch: 20, hold: 0 }[motion]
  const upperFrom = { press: 0, curl: 0, pull: 165, fly: 70, raise: 5, push: 50, legraise: 165, crunch: 20, hold: 0 }[motion]
  const upperTo = motion === 'pull' ? 110 : motion === 'fly' ? 15 : upper
  const fore = { press: 0, curl: 140, pull: 0, fly: 0, raise: 0, push: 0, legraise: 0, crunch: 0, hold: 0 }[motion]
  const pushdown = motion === 'press' && on('triceps')
  const dur = '1.6s'

  const rot = (a: number, b: number, cx: number, cy: number) => (
    <animateTransform attributeName="transform" type="rotate" dur={dur} repeatCount="indefinite"
      values={`${a} ${cx} ${cy};${b} ${cx} ${cy};${a} ${cx} ${cy}`} calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" />
  )

  const Arm = ({ side }: { side: 1 | -1 }) => {
    const sx = side * 31
    const s = -side // sol kol (side=-1) için pozitif açı dışa
    return (
      <g>
        {upperFrom !== upperTo && rot(upperFrom * s, upperTo * s, sx, 31)}
        <g transform={upperFrom === upperTo && upper ? `rotate(${upper * s} ${sx} 31)` : undefined}>
          <rect x={sx - 6} y="35" width="12" height="25" rx="6" {...(on('biceps') || on('triceps') ? p(on('biceps') ? 'biceps' : 'triceps') : { fill: OFF })} />
          <g>
            {fore ? rot(0, fore * s, sx, 60) : pushdown ? rot(120 * s, 0, sx, 60) : null}
            <rect x={sx - 5} y="60" width="10" height="22" rx="5" fill="#334155" />
          </g>
        </g>
      </g>
    )
  }

  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label="Hedef kas animasyonu">
      <defs>
        <radialGradient id="mfGlow" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#10B981" stopOpacity=".14" />
          <stop offset="100%" stopColor="#090D16" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill="url(#mfGlow)" />
      <g transform="translate(100 14)" stroke="#475569" strokeWidth="1.2">
        <g>
          {motion === 'crunch' && (
            <animateTransform attributeName="transform" type="translate" dur={dur} repeatCount="indefinite" values="0 0;0 8;0 0" />
          )}
          {motion === 'hold' && (
            <animateTransform attributeName="transform" type="translate" dur="3s" repeatCount="indefinite" values="0 0;0 1.5;0 0" />
          )}
          <circle cx="0" cy="10" r="11" fill="#334155" />
          <Arm side={-1} />
          <Arm side={1} />
          <ellipse cx="-31" cy="31" rx="8" ry="7" {...p('delts')} />
          <ellipse cx="31" cy="31" rx="8" ry="7" {...p('delts')} />
          <path d="M-31 36 L-24 30 L-22 56 L-17 76 L-28 60 Z" {...p('lats')} />
          <path d="M31 36 L24 30 L22 56 L17 76 L28 60 Z" {...p('lats')} />
          <path d="M-24 27 Q0 21 24 27 L22 52 Q0 58 -22 52 Z" {...p('chest')} />
          {on('midback') && <path d="M-7 30 L7 30 L7 50 L-7 50 Z" fill={HOT} className="muscle-glow" stroke="none" opacity=".75" />}
          <path d="M-15 55 L15 55 L14 74 L-14 74 Z" {...p('abs')} />
          <path d="M0 55 L0 74 M-14 61 L14 61 M-14 67.5 L14 67.5" stroke="#0F172A" strokeWidth="1" fill="none" />
          <path d="M-14 75 L14 75 L12 90 L-12 90 Z" {...p('lowerabs')} />
        </g>
        <path d="M-19 90 L19 90 L21 103 L-21 103 Z" {...p('glutes')} />
        {[-1, 1].map((side) => {
          const lx = side * 10.5
          return (
            <g key={side}>
              {motion === 'legraise' && (
                <animateTransform attributeName="transform" type="translate" dur={dur} repeatCount="indefinite" values="0 0;0 -22;0 0" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" />
              )}
              {motion === 'press' && on('quads') && rot(0, side * -14, lx, 104)}
              <rect x={lx - 9} y="103" width="18" height="38" rx="8" {...p('quads')} />
              {on('hamstrings') && <rect x={lx - 3.5} y="108" width="7" height="30" rx="3.5" fill={HOT} stroke="none" className="muscle-glow" />}
              <g>
                {on('hamstrings') && rot(0, side * 35, lx, 141)}
                <rect x={lx - 7} y="141" width="14" height="32" rx="6" fill="#334155" />
              </g>
            </g>
          )
        })}
      </g>
      <text x="100" y="195" textAnchor="middle" fill="#64748B" fontSize="7.5" fontFamily="Inter" letterSpacing="1.4">HEDEF KAS · ÇEVRİMDIŞI GÖRÜNÜM</text>
    </svg>
  )
}
