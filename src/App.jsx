import { useEffect, useMemo, useRef, useState } from 'react'
import { CITY_CENTER, currentUser, getDb, logout, markNotificationsRead, subscribe, tick } from './data/store'
import { Confetti, Toasts } from './components/ui'
import Auth from './pages/Auth'
import Feed from './pages/Feed'
import PostFood from './pages/PostFood'
import Dashboard from './pages/Dashboard'
import { MyListings, MyClaims } from './pages/DonorPages'

export default function App() {
  const [, setVersion] = useState(0)
  const [tab, setTab] = useState('home')
  const [toasts, setToasts] = useState([])
  const [showBell, setShowBell] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const celebrate = () => { setConfetti(true); setTimeout(() => setConfetti(false), 1800) }
  const [location, setLocation] = useState({ ...CITY_CENTER, fallback: true })
  const seenNotifs = useRef(new Set())
  const db = getDb()
  const user = currentUser()

  useEffect(() => subscribe(() => setVersion((v) => v + 1)), [])
  useEffect(() => { const t = setInterval(tick, 30000); return () => clearInterval(t) }, [])

  // geolocation with city-centre fallback
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (p) => setLocation({ lat: p.coords.latitude, lng: p.coords.longitude, fallback: false }),
      () => setLocation({ ...CITY_CENTER, fallback: true }),
      { timeout: 5000 }
    )
  }, [])

  const toast = (text, icon) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, text, icon }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
    if ('Notification' in window && Notification.permission === 'granted') { try { new Notification('RePlate', { body: text }) } catch { /* noop */ } }
  }

  // notify receivers about genuinely new listings
  const notifications = db.notifications
  useEffect(() => {
    if (!user || user.role !== 'receiver') return
    notifications.filter((n) => n.kind === 'new_listing').forEach((n) => {
      if (!seenNotifs.current.has(n.id) && Date.now() - n.at < 10000) { seenNotifs.current.add(n.id); toast(n.text, '🛎️') }
    })
  }, [notifications, user]) // eslint-disable-line react-hooks/exhaustive-deps

  const unread = useMemo(() => notifications.filter((n) => !n.read && (!n.forUserId || (user && n.forUserId === user.id))).length, [notifications, user])

  if (!user) return <><Toasts toasts={toasts} /><Auth onDone={() => setVersion((v) => v + 1)} toast={toast} /></>

  const isDonor = user.role === 'donor'
  const tabs = isDonor
    ? [{ id: 'post', icon: '➕', label: 'Post' }, { id: 'mine', icon: '📦', label: 'My Listings' }, { id: 'impact', icon: '📊', label: 'Impact' }]
    : [{ id: 'home', icon: '🏠', label: 'Feed' }, { id: 'claims', icon: '🎒', label: 'My Claims' }, { id: 'impact', icon: '📊', label: 'Impact' }]
  const activeTab = tabs.some((t) => t.id === tab) ? tab : tabs[0].id

  return (
    <div className="min-h-screen bg-cream">
      <Toasts toasts={toasts} />
      <Confetti show={confetti} />
      <header className="sticky top-0 z-40 bg-gradient-to-r from-leaf-700 via-leaf-600 to-emerald-600 text-white px-4 py-3 flex items-center gap-2 shadow-md">
        <span className="text-2xl">🍽️</span>
        <div className="flex-1">
          <div className="font-extrabold leading-none">RePlate</div>
          <div className="text-[11px] text-leaf-100">{user.name} · {isDonor ? 'Donor' : 'Receiver'}{user.org ? ` · ${user.org}` : ''}</div>
        </div>
        <button onClick={() => { setShowBell(!showBell); if (!showBell) markNotificationsRead() }} className="relative text-xl p-1.5">
          🔔
          {unread > 0 && <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center">{unread}</span>}
        </button>
        <button onClick={() => { logout(); setTab('home') }} className="text-xs font-semibold bg-leaf-700 rounded-lg px-2.5 py-1.5">Log out</button>
      </header>

      {showBell && (
        <div className="max-w-md mx-auto px-4 mt-3">
          <div className="bg-white rounded-2xl ring-1 ring-gray-200 p-3 space-y-2 max-h-64 overflow-auto">
            {notifications.length === 0 && <p className="text-sm text-gray-400 text-center py-3">No notifications yet.</p>}
            {notifications.slice(0, 12).map((n) => (
              <div key={n.id} className="text-sm flex gap-2 border-b border-gray-50 pb-2 last:border-0"><span>🔔</span><span>{n.text}</span></div>
            ))}
          </div>
        </div>
      )}

      <main key={activeTab} className="max-w-md mx-auto px-4 py-4 pb-24 anim-fadeUp">
        {activeTab === 'home' && <Feed user={user} listings={db.listings} location={location} toast={toast} goClaims={() => setTab('claims')} celebrate={celebrate} />}
        {activeTab === 'post' && <PostFood user={user} location={location} toast={toast} goMyListings={() => setTab('mine')} />}
        {activeTab === 'mine' && <MyListings user={user} listings={db.listings} toast={toast} celebrate={celebrate} />}
        {activeTab === 'claims' && <MyClaims user={user} listings={db.listings} toast={toast} celebrate={celebrate} />}
        {activeTab === 'impact' && <Dashboard db={db} />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-md mx-auto grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`py-2.5 flex flex-col items-center gap-0.5 text-[11px] font-semibold ${activeTab === t.id ? 'text-leaf-700' : 'text-gray-400'}`}>
              <span className="text-xl leading-none">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
