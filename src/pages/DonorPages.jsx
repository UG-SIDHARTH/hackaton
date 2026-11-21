import { cancelListing, markPickedUp } from '../data/store'
import { fmtCountdown, useNow, VegBadge } from '../components/ui'

const STATUS_STYLE = {
  available: 'bg-leaf-100 text-leaf-800', claimed: 'bg-amber-100 text-amber-800',
  picked_up: 'bg-blue-100 text-blue-800', expired: 'bg-gray-200 text-gray-500', cancelled: 'bg-gray-200 text-gray-500',
}

export function MyListings({ user, listings, toast, celebrate }) {
  const now = useNow(1000)
  const mine = listings.filter((l) => l.donorId === user.id)
  return (
    <div>
      <h2 className="text-xl font-extrabold mb-3">My listings</h2>
      {mine.length === 0 && <p className="text-gray-400 text-center py-12">Nothing posted yet. Tap ＋ Post to share surplus food.</p>}
      <div className="space-y-3">
        {mine.map((l) => (
          <article key={l.id} className="bg-white rounded-2xl ring-1 ring-gray-200 p-3.5 flex gap-3">
            <img src={l.photo} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold leading-snug">{l.foodName}</h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_STYLE[l.status]}`}>{l.status.replace('_', ' ')}</span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">Serves {l.servings} · <VegBadge veg={l.veg} /></p>
              {l.status === 'available' && <p className="text-sm font-semibold text-leaf-700 mt-1">⏱ {fmtCountdown(l.expiresAt - now)} left</p>}
              {l.status === 'claimed' && (
                <>
                  <p className="text-sm mt-1">Claimed by <b>{l.claimedByName}</b></p>
                  <button onClick={() => { markPickedUp(l.id); celebrate && celebrate(); toast('Marked as picked up. Thank you for not wasting food!', '💚') }} className="mt-2 bg-leaf-600 text-white text-sm font-bold rounded-lg px-3 py-2">Mark picked up</button>
                </>
              )}
              {l.status === 'available' && (
                <button onClick={() => { cancelListing(l.id); toast('Listing cancelled.', '🗑️') }} className="mt-2 text-sm font-semibold text-red-600 ring-1 ring-red-200 rounded-lg px-3 py-1.5">Cancel listing</button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export function MyClaims({ user, listings, toast, celebrate }) {
  const now = useNow(1000)
  const mine = listings.filter((l) => l.claimedBy === user.id && ['claimed', 'picked_up'].includes(l.status))
  return (
    <div>
      <h2 className="text-xl font-extrabold mb-3">My claims</h2>
      {mine.length === 0 && <p className="text-gray-400 text-center py-12">No claims yet. Claim food from the feed and it will show up here.</p>}
      <div className="space-y-3">
        {mine.map((l) => (
          <article key={l.id} className="bg-white rounded-2xl ring-1 ring-gray-200 p-3.5">
            <div className="flex gap-3">
              <img src={l.photo} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold leading-snug">{l.foodName}</h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_STYLE[l.status]}`}>{l.status.replace('_', ' ')}</span>
                </div>
                <p className="text-sm text-gray-500">Serves {l.servings} · from {l.donorName}</p>
                {l.status === 'claimed' && <p className="text-sm font-semibold text-amber-600 mt-1">⏱ Pick up within {fmtCountdown(l.expiresAt - now)}</p>}
              </div>
            </div>
            {l.status === 'claimed' && (
              <div className="mt-3 bg-leaf-50 ring-1 ring-leaf-200 rounded-xl px-3.5 py-3 text-sm space-y-2">
                <p>📍 {l.address}</p>
                <p>📞 Donor: <b>{l.donorName}</b> — {l.donorPhone}</p>
                <div className="flex gap-2 pt-1">
                  <a href={`tel:${l.donorPhone.replace(/\s/g, '')}`} className="flex-1 text-center bg-leaf-600 text-white font-bold rounded-lg py-2.5">Call donor</a>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}`} target="_blank" rel="noreferrer" className="flex-1 text-center bg-white ring-1 ring-gray-300 font-semibold rounded-lg py-2.5">Directions</a>
                  <button onClick={() => { markPickedUp(l.id); celebrate && celebrate(); toast('Pickup confirmed — meals rescued!', '🎉') }} className="flex-1 bg-blue-600 text-white font-bold rounded-lg py-2.5">Picked up ✓</button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
