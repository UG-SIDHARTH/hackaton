import { useMemo, useState } from 'react'
import { claimListing, haversineKm, simulateDonation } from '../data/store'
import { ListingCard, useNow } from '../components/ui'
import MapView from '../components/MapView'

export default function Feed({ user, listings, location, toast }) {
  const now = useNow(1000)
  const [view, setView] = useState('list')
  const [sort, setSort] = useState('urgency')
  const [vegOnly, setVegOnly] = useState(false)
  const [minServings, setMinServings] = useState(0)
  const radiusKm = user.radiusKm || 5

  const visible = useMemo(() => {
    const withDist = listings
      .filter((l) => l.status === 'available' && l.expiresAt > now)
      .map((l) => ({ ...l, distanceKm: haversineKm(location, l) }))
      .filter((l) => l.distanceKm <= radiusKm)
      .filter((l) => !vegOnly || l.veg)
      .filter((l) => l.servings >= minServings)
    withDist.sort((a, b) => sort === 'urgency' ? (a.expiresAt - b.expiresAt) || (a.distanceKm - b.distanceKm) : a.distanceKm - b.distanceKm)
    return withDist
  }, [listings, now, location, radiusKm, vegOnly, minServings, sort])

  const claim = (l) => {
    const r = claimListing(l.id, user)
    if (r.error) toast(r.error, '⚠️')
    else toast(`Claimed! Contact ${l.donorName} on ${l.donorPhone} and head over.`, '✅')
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold">Food near you</h2>
        <span className="text-xs font-semibold bg-leaf-100 text-leaf-800 px-2.5 py-1 rounded-full">📍 within {radiusKm} km · live</span>
      </div>

      <div className="flex gap-2 mt-3">
        <div className="flex bg-white rounded-xl ring-1 ring-gray-200 p-1 flex-1">
          {['list', 'map'].map((v) => (
            <button key={v} onClick={() => setView(v)} className={`flex-1 py-1.5 rounded-lg text-sm font-semibold capitalize ${view === v ? 'bg-leaf-600 text-white' : 'text-gray-500'}`}>{v === 'list' ? '📋 List' : '🗺 Map'}</button>
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-white ring-1 ring-gray-200 rounded-xl px-2 text-sm font-medium">
          <option value="urgency">⏱ Urgency first</option>
          <option value="distance">📍 Nearest first</option>
        </select>
      </div>

      <div className="flex gap-2 mt-2.5 items-center">
        <button onClick={() => setVegOnly(!vegOnly)} className={`px-3 py-1.5 rounded-full text-sm font-semibold ring-1 ${vegOnly ? 'bg-leaf-600 text-white ring-leaf-600' : 'bg-white text-gray-600 ring-gray-300'}`}>🟢 Veg only</button>
        <label className="flex items-center gap-2 text-sm text-gray-600 bg-white ring-1 ring-gray-300 rounded-full px-3 py-1.5">Min servings
          <input type="number" min="0" className="w-14 outline-none font-semibold" value={minServings || ''} placeholder="0" onChange={(e) => setMinServings(Number(e.target.value) || 0)} />
        </label>
        <button onClick={() => { simulateDonation(); toast('A new donation just appeared nearby!', '🛎️') }} className="ml-auto text-xs font-semibold text-leaf-700 underline">Simulate new donation</button>
      </div>

      {view === 'map' ? (
        <div className="mt-3"><MapView listings={visible} center={location} now={now} /></div>
      ) : visible.length === 0 ? (
        <div className="text-center py-14 text-gray-400">
          <div className="text-4xl mb-2">🍃</div>
          <p className="font-medium">No food available within {radiusKm} km right now.</p>
          <p className="text-sm mt-1">You'll be notified the moment something is posted.</p>
        </div>
      ) : (
        <div className="space-y-3 mt-3">
          {visible.map((l) => (
            <ListingCard key={l.id} l={l} distanceKm={l.distanceKm} now={now}>
              <div className="mt-3 flex gap-2">
                <button onClick={() => claim(l)} className="flex-1 bg-leaf-600 text-white font-bold rounded-xl py-3 active:scale-[.99]">Claim</button>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}`} target="_blank" rel="noreferrer" className="px-4 flex items-center bg-white ring-1 ring-gray-300 rounded-xl font-semibold text-sm">Directions</a>
              </div>
            </ListingCard>
          ))}
        </div>
      )}
    </div>
  )
}
