import { useEffect, useMemo, useState } from 'react'
import { claimListing, haversineKm, simulateDonation } from '../data/store'
import { AnimatedNumber, fmtCountdown, ListingCard, Modal, SkeletonCard, urgency, useNow, VegBadge } from '../components/ui'
import MapView from '../components/MapView'

const TICKER_EVENTS = [
  'Grand Caterers rescued 80 meals at a wedding hall',
  'Hope Shelter picked up Paneer Butter Masala + Naan',
  'Bake House Bakery listed Assorted Bread & Buns',
  'FreshMart saved 15 fruit boxes from the bin',
  'Cafe Aroma listed a Grilled Sandwich Platter',
]

export default function Feed({ user, listings, location, toast, goClaims, celebrate }) {
  const now = useNow(1000)
  const [view, setView] = useState('list')
  const [sort, setSort] = useState('urgency')
  const [vegOnly, setVegOnly] = useState(false)
  const [minServings, setMinServings] = useState(0)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [tickIdx, setTickIdx] = useState(0)
  const radiusKm = user.radiusKm || 5

  useEffect(() => { const t = setTimeout(() => setLoading(false), 650); return () => clearTimeout(t) }, [])
  useEffect(() => { const t = setInterval(() => setTickIdx((i) => i + 1), 3600); return () => clearInterval(t) }, [])

  const available = useMemo(() => listings
    .filter((l) => l.status === 'available' && l.expiresAt > now)
    .map((l) => ({ ...l, distanceKm: haversineKm(location, l) }))
    .filter((l) => l.distanceKm <= radiusKm), [listings, now, location, radiusKm])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const out = available
      .filter((l) => !vegOnly || l.veg)
      .filter((l) => l.servings >= minServings)
      .filter((l) => !q || l.foodName.toLowerCase().includes(q) || l.donorName.toLowerCase().includes(q))
    out.sort((a, b) => sort === 'urgency' ? (a.expiresAt - b.expiresAt) || (a.distanceKm - b.distanceKm) : a.distanceKm - b.distanceKm)
    return out
  }, [available, vegOnly, minServings, sort, query])

  const expiring = available.filter((l) => l.expiresAt - now < 30 * 60 * 1000)
  const totalServings = available.reduce((s, l) => s + l.servings, 0)
  const tickerText = TICKER_EVENTS[tickIdx % TICKER_EVENTS.length]

  const confirmClaim = () => {
    const l = selected
    const r = claimListing(l.id, user)
    setSelected(null)
    if (r.error) { toast(r.error, '⚠️'); return }
    celebrate()
    toast(`Claimed! ${l.donorName} is expecting you. Details are in My Claims.`, '✅')
    setTimeout(goClaims, 900)
  }

  return (
    <div>
      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-br from-brand-600 via-brand-500 to-fuchsia-500 text-white p-4 shadow-lg shadow-brand-200 anim-fadeUp">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-brand-100">
          <span className="relative flex w-2 h-2"><span className="absolute inline-flex w-full h-full rounded-full bg-white dark:bg-slate-900" style={{ animation: 'pulseDot 1.6s infinite' }} /><span className="relative inline-flex w-2 h-2 rounded-full bg-white dark:bg-slate-900" /></span>
          Live near you · {radiusKm} km radius
        </div>
        <div className="mt-1.5 text-[26px] leading-tight font-extrabold"><AnimatedNumber value={totalServings} /> meals ready to rescue</div>
        <p className="text-brand-50/90 text-sm mt-0.5">{available.length} listings from local restaurants, bakeries & stores — claim before the timer runs out.</p>
      </div>

      {/* Activity ticker */}
      <div className="mt-3 bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-gray-200 dark:ring-slate-700 px-3.5 py-2.5 flex items-center gap-2 overflow-hidden">
        <span className="text-sm">📣</span>
        <p key={tickIdx} className="anim-ticker text-[13px] text-gray-600 dark:text-slate-300 truncate">{tickerText}</p>
      </div>

      {/* Search + view */}
      <div className="flex gap-2 mt-3">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">🔍</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search food or donor…" className="w-full bg-white dark:bg-slate-900 ring-1 ring-gray-200 dark:ring-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div className="flex bg-white dark:bg-slate-900 rounded-xl ring-1 ring-gray-200 dark:ring-slate-700 p-1">
          {['list', 'map'].map((v) => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${view === v ? 'bg-brand-600 text-white' : 'text-gray-500 dark:text-slate-400'}`}>{v === 'list' ? '📋' : '🗺'}</button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mt-2.5 items-center overflow-x-auto no-scrollbar pb-0.5">
        <button onClick={() => setVegOnly(!vegOnly)} className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold ring-1 transition ${vegOnly ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 ring-gray-300 dark:ring-slate-600'}`}>🟢 Veg only</button>
        <label className="shrink-0 flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 ring-1 ring-gray-300 dark:ring-slate-600 rounded-full px-3 py-1.5">Min servings
          <input type="number" min="0" className="w-12 outline-none font-semibold" value={minServings || ''} placeholder="0" onChange={(e) => setMinServings(Number(e.target.value) || 0)} />
        </label>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="shrink-0 bg-white dark:bg-slate-900 ring-1 ring-gray-300 dark:ring-slate-600 rounded-full px-3 py-1.5 text-sm font-medium">
          <option value="urgency">⏱ Urgency first</option>
          <option value="distance">📍 Nearest first</option>
        </select>
        <button onClick={() => { simulateDonation(); toast('A new donation just appeared nearby!', '🛎️') }} className="shrink-0 text-xs font-semibold text-brand-700 dark:text-brand-300 underline">Simulate donation</button>
      </div>

      {/* Expiring soon rail */}
      {view === 'list' && expiring.length > 0 && (
        <div className="mt-4">
          <h3 className="font-extrabold text-red-600 dark:text-red-400 flex items-center gap-1.5">⚡ Expiring in under 30 min</h3>
          <div className="flex gap-3 mt-2 overflow-x-auto no-scrollbar snap-x pb-1">
            {expiring.map((l) => (
              <button key={l.id} onClick={() => setSelected(l)} className="snap-start shrink-0 w-56 text-left bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-red-200 dark:ring-red-900 overflow-hidden active:scale-[.98] transition">
                <img src={l.photo} alt="" className="w-full h-24 object-cover" />
                <div className="p-2.5">
                  <p className="font-bold text-sm leading-snug line-clamp-1">{l.foodName}</p>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-0.5">⏱ {fmtCountdown(l.expiresAt - now)} · Serves {l.servings} · {l.distanceKm.toFixed(1)} km</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {view === 'map' ? (
        <div className="mt-3"><MapView listings={visible} center={location} now={now} /></div>
      ) : loading ? (
        <div className="space-y-3 mt-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : visible.length === 0 ? (
        <div className="text-center py-14 text-gray-400 dark:text-slate-500 anim-fadeUp">
          <div className="text-4xl mb-2">🍃</div>
          <p className="font-medium">Nothing matches right now within {radiusKm} km.</p>
          <p className="text-sm mt-1">Try clearing the search or filters — new food appears all day.</p>
        </div>
      ) : (
        <div className="space-y-3.5 mt-4">
          {visible.map((l, i) => (
            <ListingCard key={l.id} l={l} distanceKm={l.distanceKm} now={now} index={i}>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setSelected(l)} className="flex-1 bg-gradient-to-r from-brand-600 to-fuchsia-600 text-white font-bold rounded-xl py-3 shadow-sm shadow-brand-200 active:scale-[.98] transition">Claim this food</button>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}`} target="_blank" rel="noreferrer" className="px-4 flex items-center bg-white dark:bg-slate-900 ring-1 ring-gray-300 dark:ring-slate-600 rounded-xl font-semibold text-sm active:scale-[.98] transition">Directions</a>
              </div>
            </ListingCard>
          ))}
        </div>
      )}

      {/* Claim confirmation modal */}
      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <img src={selected.photo} alt="" className="w-full h-44 object-cover" />
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-extrabold text-lg leading-snug">{selected.foodName}</h3>
              <VegBadge veg={selected.veg} />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div className="bg-cream dark:bg-slate-950 rounded-xl py-2"><div className="font-extrabold text-brand-700 dark:text-brand-300">{selected.servings}</div><div className="text-[11px] text-gray-500 dark:text-slate-400">servings</div></div>
              <div className="bg-cream dark:bg-slate-950 rounded-xl py-2"><div className="font-extrabold text-brand-700 dark:text-brand-300">{selected.distanceKm?.toFixed(1)} km</div><div className="text-[11px] text-gray-500 dark:text-slate-400">away</div></div>
              <div className="bg-cream dark:bg-slate-950 rounded-xl py-2"><div className={`font-extrabold ${urgency(selected.expiresAt - now).text}`}>{fmtCountdown(selected.expiresAt - now)}</div><div className="text-[11px] text-gray-500 dark:text-slate-400">to pick up</div></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300 mt-3">📍 {selected.address}</p>
            <p className="text-sm text-gray-600 dark:text-slate-300">🏪 {selected.donorName} — contact details unlock after you claim.</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">Claiming holds this food for you. Please only claim what you can actually pick up in time.</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setSelected(null)} className="flex-1 ring-1 ring-gray-300 dark:ring-slate-600 rounded-xl py-3 font-semibold">Not now</button>
              <button onClick={confirmClaim} className="flex-1 bg-gradient-to-r from-brand-600 to-fuchsia-600 text-white rounded-xl py-3 font-bold shadow shadow-brand-200 active:scale-[.98]">Confirm claim ✓</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
