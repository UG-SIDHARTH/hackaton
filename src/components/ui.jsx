import { useEffect, useState } from 'react'

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
  if (ms <= 0) return { key: 'expired', label: 'Expired', bar: 'bg-gray-300', text: 'text-gray-500', ring: 'ring-gray-200' }
  if (ms < 30 * 60 * 1000) return { key: 'red', label: 'Expiring soon', bar: 'bg-red-500', text: 'text-red-600', ring: 'ring-red-200' }
  if (ms < 2 * 3600 * 1000) return { key: 'amber', label: 'Ending soon', bar: 'bg-amber-500', text: 'text-amber-600', ring: 'ring-amber-200' }
  return { key: 'green', label: 'Fresh', bar: 'bg-leaf-500', text: 'text-leaf-600', ring: 'ring-leaf-200' }
}

export function Toasts({ toasts }) {
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-sm space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="bg-gray-900 text-white text-sm rounded-xl px-4 py-3 shadow-lg flex gap-2 items-start animate-[slideDown_.25s_ease]">
          <span>{t.icon || '🔔'}</span><span>{t.text}</span>
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

export function ListingCard({ l, distanceKm, now, children }) {
  const left = l.expiresAt - now
  const u = urgency(left)
  return (
    <article className={`bg-white rounded-2xl shadow-sm ring-1 ${u.ring} overflow-hidden`}>
      <div className="relative">
        <img src={l.photo} alt={l.foodName} className="w-full h-40 object-cover" loading="lazy" />
        <span className={`absolute top-2 left-2 text-xs font-bold px-2.5 py-1 rounded-full text-white ${u.bar}`}>⏱ {fmtCountdown(left)}</span>
        <span className="absolute top-2 right-2"><VegBadge veg={l.veg} /></span>
      </div>
      <div className="p-3.5">
        <h3 className="font-bold text-[17px] leading-snug">{l.foodName}</h3>
        <p className="text-sm text-gray-500 mt-0.5">by {l.donorName}{distanceKm != null ? ` · ${distanceKm.toFixed(1)} km away` : ''}</p>
        <div className="flex items-center gap-3 mt-2 text-sm">
          <span className="font-semibold text-leaf-700">🍽 Serves {l.servings}</span>
          <span className={`font-medium ${u.text}`}>{u.label}</span>
        </div>
        {children}
      </div>
    </article>
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
