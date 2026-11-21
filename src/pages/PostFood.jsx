import { useRef, useState } from 'react'
import { addListing, CITY_CENTER, PRESET_PHOTOS } from '../data/store'

const CHIPS = [{ label: '1 hour', mins: 60 }, { label: '2 hours', mins: 120 }, { label: '4 hours', mins: 240 }]

export default function PostFood({ user, location, toast, goMyListings }) {
  const [foodName, setFoodName] = useState('')
  const [servings, setServings] = useState(20)
  const [veg, setVeg] = useState(true)
  const [photo, setPhoto] = useState(PRESET_PHOTOS[0])
  const [photoIdx, setPhotoIdx] = useState(0)
  const [address, setAddress] = useState(user.org ? `${user.org}, Thiruvananthapuram` : 'Thiruvananthapuram')
  const [deadlineMins, setDeadlineMins] = useState(120)
  const [customMins, setCustomMins] = useState('')
  const [safety, setSafety] = useState(false)
  const [err, setErr] = useState('')
  const fileRef = useRef(null)

  const onPhotoFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.min(1, 800 / img.width)
      canvas.width = img.width * scale; canvas.height = img.height * scale
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      setPhoto(canvas.toDataURL('image/jpeg', 0.72)) // compressed before saving
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(file)
  }

  const submit = (e) => {
    e.preventDefault()
    if (!foodName.trim()) return setErr('Give the food a name — e.g. "Veg Biryani, 2 trays".')
    if (!safety) return setErr('Please confirm the food-safety checkbox so receivers can trust the listing.')
    const mins = customMins ? Number(customMins) : deadlineMins
    if (!mins || mins < 5) return setErr('Pickup deadline must be at least 5 minutes from now.')
    addListing(user, {
      foodName: foodName.trim(), servings: Number(servings) || 1, veg, photo, address,
      lat: location.lat, lng: location.lng, expiresAt: Date.now() + mins * 60 * 1000, safetyConfirmed: true,
    })
    toast('Your food is live! Nearby receivers have been notified.', '🎉')
    goMyListings()
  }

  const input = 'w-full rounded-xl border border-gray-300 dark:border-slate-600 px-3.5 py-3 text-[16px] bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500'
  return (
    <form onSubmit={submit} className="space-y-4 max-w-xl mx-auto w-full">
      <h2 className="text-xl font-extrabold">Post surplus food</h2>
      <p className="-mt-2 text-sm text-gray-500 dark:text-slate-400">One screen, under 30 seconds.</p>

      <div>
        <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">Photo</label>
        <div className="flex gap-2 mt-1.5 overflow-x-auto pb-1">
          {PRESET_PHOTOS.slice(0, 5).map((p, i) => (
            <button type="button" key={p} onClick={() => { setPhoto(p); setPhotoIdx(i) }} className={`shrink-0 rounded-xl overflow-hidden ring-2 ${photo === p ? 'ring-brand-600' : 'ring-transparent'}`}>
              <img src={p} alt="" className="w-16 h-16 object-cover" />
            </button>
          ))}
          <button type="button" onClick={() => fileRef.current?.click()} className="shrink-0 w-16 h-16 rounded-xl bg-brand-50 dark:bg-slate-800 ring-2 ring-dashed ring-brand-300 text-brand-700 dark:text-brand-300 text-xs font-semibold">📷<br />Upload</button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhotoFile} />
        </div>
      </div>

      <input className={input} placeholder="Food name — e.g. Veg Biryani (2 trays)" value={foodName} onChange={(e) => setFoodName(e.target.value)} />
      <div>
        <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">Serves how many people? <span className="text-brand-700 dark:text-brand-300 font-bold">{servings}</span></label>
        <input type="range" min="1" max="200" value={servings} onChange={(e) => setServings(e.target.value)} className="w-full accent-brand-600 mt-1" />
      </div>

      <div className="flex bg-white dark:bg-slate-900 rounded-xl ring-1 ring-gray-200 dark:ring-slate-700 p-1">
        <button type="button" onClick={() => setVeg(true)} className={`flex-1 py-2.5 rounded-lg font-semibold ${veg ? 'bg-brand-600 text-white' : 'text-gray-500 dark:text-slate-400'}`}>🟢 Veg</button>
        <button type="button" onClick={() => setVeg(false)} className={`flex-1 py-2.5 rounded-lg font-semibold ${!veg ? 'bg-red-500 text-white' : 'text-gray-500 dark:text-slate-400'}`}>🔴 Non-veg</button>
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">Pickup location</label>
        <input className={input + ' mt-1.5'} value={address} onChange={(e) => setAddress(e.target.value)} />
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">📍 Using your current location ({location.lat.toFixed(4)}, {location.lng.toFixed(4)}){location.fallback ? ' — city centre fallback' : ''}</p>
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">Pickup deadline</label>
        <div className="flex gap-2 mt-1.5">
          {CHIPS.map((c) => (
            <button type="button" key={c.mins} onClick={() => { setDeadlineMins(c.mins); setCustomMins('') }} className={`flex-1 py-2.5 rounded-xl font-semibold ring-1 ${!customMins && deadlineMins === c.mins ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 ring-gray-300 dark:ring-slate-600'}`}>{c.label}</button>
          ))}
          <input className="w-24 rounded-xl border border-gray-300 dark:border-slate-600 px-2 py-2.5 text-center" placeholder="mins" inputMode="numeric" value={customMins} onChange={(e) => setCustomMins(e.target.value.replace(/\D/g, ''))} />
        </div>
      </div>

      <label className="flex gap-2.5 items-start bg-brand-50 dark:bg-slate-800 ring-1 ring-brand-200 dark:ring-brand-900 rounded-xl px-3.5 py-3 text-sm">
        <input type="checkbox" checked={safety} onChange={(e) => setSafety(e.target.checked)} className="mt-0.5 w-5 h-5 accent-brand-600" />
        <span>I confirm this food is <b>freshly prepared / safely stored</b> and fit to eat.</span>
      </label>

      {err && <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/50 rounded-lg px-3 py-2">{err}</p>}
      <button className="w-full bg-brand-600 text-white font-bold rounded-xl py-4 text-lg active:scale-[.99]">Post food now</button>
    </form>
  )
}
