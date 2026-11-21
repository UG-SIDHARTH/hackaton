import { useEffect, useMemo, useState } from 'react'

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), intervalMs); return () => clearInterval(t) }, [intervalMs])
  return now
}

export function fmtCountdown(ms) {
  if (ms <= 0) return 'Expired'
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m ${String(sec).padStart(2, '0')}s`
}

export function urgency(ms) {
  if (ms <= 0) return { key: 'expired', label: 'Expired', bar: 'bg-gray-300', text: 'text-gray-500', ring: 'ring-gray-200', grad: 'from-gray-400 to-gray-500' }
  if (ms < 30 * 60 * 1000) return { key: 'red', label: 'Expiring soon', bar: 'bg-red-500', text: 'text-red-600', ring: 'ring-red-200', grad: 'from-red-500 to-orange-500' }
  if (ms < 2 * 3600 * 1000) return { key: 'amber', label: 'Ending soon', bar: 'bg-amber-500', text: 'text-amber-600', ring: 'ring-amber-200', grad: 'from-amber-500 to-yellow-500' }
  return { key: 'green', label: 'Fresh', bar: 'bg-leaf-500', text: 'text-leaf-600', ring: 'ring-leaf-200', grad: 'from-leaf-500 to-emerald-500' }
}

export function Toasts({ toasts }) {
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[120] w-[92%] max-w-sm space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="bg-gray-900/95 backdrop-blur text-white text-sm rounded-2xl px-4 py-3 shadow-xl flex gap-2 items-start anim-pop">
          <span className="text-base">{t.icon || '🔔'}</span><span>{t.text}</span>
        </div>
      ))}
    </div>
  )
}

export function VegBadge({ veg }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${veg ? 'text-leaf-700 border-leaf-300 bg-leaf-50' : 'text-red-700 border-red-300 bg-red-50'}`}>
      <span className={`w-2 h-2 rounded-full ${veg ? 'bg-leaf-500' : 'bg-red-500'}`} /> {veg ? 'Veg' : 'Non-veg'}
    </span>
  )
}

export function ListingCard({ l, distanceKm, now, children, index = 0 }) {
  const left = l.expiresAt - now
  const u = urgency(left)
  const total = Math.max(1, l.expiresAt - l.createdAt)
  const pct = Math.max(0, Math.min(100, (left / total) * 100))
  return (
    <article className={`bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow ring-1 ${u.ring} overflow-hidden anim-fadeUp`} style={{ animationDelay: `${Math.min(index, 6) * 70}ms` }}>
      <div className="relative">
        <img src={l.photo} alt={l.foodName} className="w-full h-44 object-cover" loading="lazy" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
        <span className={`absolute top-2.5 left-2.5 text-xs font-bold px-2.5 py-1 rounded-full text-white bg-gradient-to-r ${u.grad} shadow`}>⏱ {fmtCountdown(left)}</span>
        <span className="absolute top-2.5 right-2.5"><VegBadge veg={l.veg} /></span>
        <span className="absolute bottom-2.5 left-3 text-white text-sm font-semibold drop-shadow">🍽 Serves {l.servings}</span>
        {distanceKm != null && <span className="absolute bottom-2.5 right-3 text-white text-xs font-medium drop-shadow">📍 {distanceKm.toFixed(1)} km</span>}
      </div>
      <div className="p-3.5">
        <h3 className="font-bold text-[17px] leading-snug">{l.foodName}</h3>
        <p className="text-sm text-gray-500 mt-0.5">by {l.donorName}</p>
        <div className="mt-2.5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className={`h-full rounded-full bg-gradient-to-r ${u.grad} transition-[width] duration-1000 ease-linear`} style={{ width: `${pct}%` }} />
        </div>
        <p className={`text-xs font-semibold mt-1.5 ${u.text}`}>{u.label} · {fmtCountdown(left)} left to pick up</p>
        {children}
      </div>
    </article>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl ring-1 ring-gray-100 overflow-hidden">
      <div className="skeleton h-44 w-full" />
      <div className="p-3.5 space-y-2">
        <div className="skeleton h-4 rounded-full w-3/4" />
        <div className="skeleton h-3 rounded-full w-1/2" />
        <div className="skeleton h-10 rounded-xl w-full mt-3" />
      </div>
    </div>
  )
}

export function Confetti({ show }) {
  const pieces = useMemo(() => Array.from({ length: 28 }, (_, i) => ({
    left: Math.random() * 100, delay: Math.random() * 0.35, dur: 1.1 + Math.random() * 0.7,
    color: ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7'][i % 5],
    size: 6 + Math.random() * 7, round: Math.random() > 0.5,
  })), [])
  if (!show) return null
  return (
    <div className="fixed inset-0 z-[130] pointer-events-none overflow-hidden">
      {pieces.map((p, i) => (
        <span key={i} style={{
          position: 'absolute', top: '-4vh', left: `${p.left}%`, width: p.size, height: p.size * (p.round ? 1 : 0.45),
          background: p.color, borderRadius: p.round ? '50%' : '2px',
          animation: `confettiFall ${p.dur}s ease-in ${p.delay}s both`,
        }} />
      ))}
    </div>
  )
}

export function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[88vh] overflow-auto anim-pop">{children}</div>
    </div>
  )
}

export function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const from = display, to = value, start = performance.now(), dur = 700
    let raf
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur)
      setDisplay(Math.round(from + (to - from) * (1 - (1 - p) ** 3)))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return <>{display.toLocaleString('en-IN')}</>
}
