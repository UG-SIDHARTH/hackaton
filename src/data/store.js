// ---------------------------------------------------------------------------
// RePlate data layer.
//
// One interface, two backends:
//  - Firebase mode: set VITE_FIREBASE_API_KEY (and friends) in .env and the
//    app will use Firestore (see src/data/firebase.js — wired at build time).
//  - Mock mode (default, zero setup): localStorage + a tiny event bus.
//    Storage events give real cross-tab sync in the same browser, which is
//    enough to demo the full donor -> receiver loop in two tabs.
//    Note: in mock mode "atomic claim" is per-browser (localStorage is
//    synchronous, so two tabs can't double-claim). True cross-device
//    atomicity comes from Firestore transactions in Firebase mode.
// ---------------------------------------------------------------------------

const LS_KEY = 'replate_db_v1'
export const CITY_CENTER = { lat: 8.5241, lng: 76.9366 } // Thiruvananthapuram

const PRESET_PHOTOS = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80', // cooked meal
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80', // bowl salad
  'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80', // bread / bakery
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', // pizza
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80', // pancakes
  'https://images.unsplash.com/photo-1540189549336-e6e99c629fe0?w=800&q=80', // veg platter
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80', // dessert
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80', // healthy veg
]
export { PRESET_PHOTOS }

const mins = (m) => Date.now() + m * 60 * 1000
const jitter = (base, amt) => base + (Math.random() - 0.5) * amt

function seed() {
  const donors = [
    { name: 'Spice Route Restaurant', phone: '+91 98470 11223', lat: 8.5285, lng: 76.9390 },
    { name: 'Bake House Bakery', phone: '+91 98470 44556', lat: 8.5190, lng: 76.9320 },
    { name: 'FreshMart Supermarket', phone: '+91 98470 77889', lat: 8.5310, lng: 76.9455 },
    { name: 'Grand Caterers', phone: '+91 98470 99001', lat: 8.5160, lng: 76.9410 },
    { name: 'Cafe Aroma', phone: '+91 98470 33445', lat: 8.5248, lng: 76.9360 },
  ]
  const L = (i, foodName, servings, veg, deadlineMin, donorIdx, status = 'available', claimedByName = null) => ({
    id: 'seed_' + i,
    foodName,
    photo: PRESET_PHOTOS[i % PRESET_PHOTOS.length],
    servings,
    veg,
    donorName: donors[donorIdx].name,
    donorPhone: donors[donorIdx].phone,
    donorId: 'seed_donor_' + donorIdx,
    address: donors[donorIdx].name + ', Thiruvananthapuram',
    lat: jitter(donors[donorIdx].lat, 0.004),
    lng: jitter(donors[donorIdx].lng, 0.004),
    createdAt: Date.now() - (5 + i * 3) * 60 * 1000,
    expiresAt: mins(deadlineMin),
    status,
    claimedBy: claimedByName ? 'seed_receiver' : null,
    claimedByName,
    claimedAt: claimedByName ? Date.now() - 20 * 60 * 1000 : null,
    safetyConfirmed: true,
  })
  return {
    users: [
      { id: 'demo_donor', name: 'Ananya (Demo Donor)', org: 'Spice Route Restaurant', phone: '+91 98470 11223', role: 'donor', email: 'donor@replate.demo', password: 'demo' },
      { id: 'demo_receiver', name: 'Ravi (Demo Receiver)', org: 'Hope Shelter', phone: '+91 98470 22334', role: 'receiver', email: 'receiver@replate.demo', password: 'demo', radiusKm: 5 },
    ],
    listings: [
      L(0, 'Vegetable Biryani (large tray)', 40, true, 200, 0),
      L(1, 'Assorted Bread & Buns', 25, true, 45, 1),
      L(2, 'Chicken Curry + Rice', 30, false, 95, 3),
      L(3, 'Fresh Fruit Boxes', 15, true, 25, 2),
      L(4, 'Masala Dosa Batter + Chutney', 20, true, 150, 4),
      L(5, 'Grilled Sandwich Platter', 18, true, 65, 4),
      L(6, 'Egg Fried Rice', 22, false, 110, 0),
      L(7, 'Wedding Feast Leftovers (veg)', 80, true, 240, 3, 'picked_up', 'Hope Shelter'),
      L(8, 'Paneer Butter Masala + Naan', 12, true, 55, 0, 'claimed', 'Hope Shelter'),
    ],
    notifications: [],
    impact: { rescuedServings: 412, rescuedKg: 168, co2SavedKg: 420, activeDonors: 26 },
    leaderboardSeed: [
      { name: 'Grand Caterers', servings: 320 },
      { name: 'Spice Route Restaurant', servings: 265 },
      { name: 'Bake House Bakery', servings: 198 },
      { name: 'FreshMart Supermarket', servings: 154 },
      { name: 'Cafe Aroma', servings: 121 },
    ],
  }
}

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  const db = seed()
  save(db)
  return db
}
function save(db) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(db)) } catch { /* storage full etc. */ }
}

// --- tiny pub/sub -----------------------------------------------------------
const listeners = new Set()
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function emit() { listeners.forEach((fn) => fn(db)) }
window.addEventListener('storage', (e) => { if (e.key === LS_KEY) { db = load(); emit() } })

let db = load()

function mutate(fn) {
  fn(db)
  // expire anything past its deadline
  const now = Date.now()
  db.listings.forEach((l) => { if (l.status === 'available' && l.expiresAt <= now) l.status = 'expired' })
  save(db)
  emit()
  return db
}

// --- auth -------------------------------------------------------------------
export function getSession() {
  try { return JSON.parse(localStorage.getItem('replate_session') || 'null') } catch { return null }
}
export function currentUser() {
  const s = getSession()
  return s ? db.users.find((u) => u.id === s.userId) || null : null
}
export function login(email, password) {
  const u = db.users.find((u) => u.email === email && u.password === password)
  if (!u) return { error: 'No account matches that email and password.' }
  localStorage.setItem('replate_session', JSON.stringify({ userId: u.id }))
  emit()
  return { user: u }
}
export function demoLogin(role) {
  const u = db.users.find((x) => x.id === (role === 'donor' ? 'demo_donor' : 'demo_receiver'))
  localStorage.setItem('replate_session', JSON.stringify({ userId: u.id }))
  emit()
  return u
}
export function signup({ name, org, phone, email, password, role, radiusKm }) {
  if (db.users.some((u) => u.email === email)) return { error: 'That email is already registered. Try logging in.' }
  const u = { id: 'u_' + Date.now(), name, org: org || '', phone, email, password, role, radiusKm: radiusKm || 5 }
  mutate((d) => d.users.push(u))
  localStorage.setItem('replate_session', JSON.stringify({ userId: u.id }))
  return { user: u }
}
export function logout() { localStorage.removeItem('replate_session'); emit() }

// --- listings ---------------------------------------------------------------
export function getDb() { return db }
export function addListing(user, data) {
  const l = {
    id: 'l_' + Date.now(),
    donorId: user.id, donorName: user.org || user.name, donorPhone: user.phone,
    createdAt: Date.now(), status: 'available', claimedBy: null, claimedByName: null, claimedAt: null,
    ...data,
  }
  mutate((d) => {
    d.listings.unshift(l)
    d.notifications.unshift({
      id: 'n_' + Date.now(), kind: 'new_listing', listingId: l.id,
      text: `New food near you: ${l.foodName} (${l.servings} servings) from ${l.donorName}`,
      at: Date.now(), read: false,
    })
  })
  return l
}
export function cancelListing(id) { mutate((d) => { const l = d.listings.find((x) => x.id === id); if (l && l.status === 'available') l.status = 'cancelled' }) }
export function claimListing(id, user) {
  let err = null
  mutate((d) => {
    const l = d.listings.find((x) => x.id === id)
    if (!l || l.status !== 'available') { err = 'Sorry — this was just claimed by someone else.'; return }
    l.status = 'claimed'; l.claimedBy = user.id; l.claimedByName = user.org || user.name; l.claimedAt = Date.now()
    d.notifications.unshift({ id: 'n_' + Date.now(), kind: 'claimed', listingId: l.id, text: `Your listing "${l.foodName}" was claimed by ${l.claimedByName}`, at: Date.now(), read: false, forUserId: l.donorId })
  })
  return { error: err }
}
export function cancelClaim(id) {
  mutate((d) => { const l = d.listings.find((x) => x.id === id); if (l && l.status === 'claimed') { l.status = 'available'; l.claimedBy = null; l.claimedByName = null; l.claimedAt = null } })
}
export function markPickedUp(id) {
  mutate((d) => {
    const l = d.listings.find((x) => x.id === id)
    if (l && l.status === 'claimed') {
      l.status = 'picked_up'
      d.impact.rescuedServings += l.servings
      d.impact.rescuedKg += Math.round(l.servings * 0.4)
      d.impact.co2SavedKg += Math.round(l.servings * 1.0)
    }
  })
}
export function tick() { mutate(() => {}) } // forces expiry sweep + rerender
export function markNotificationsRead() { mutate((d) => d.notifications.forEach((n) => (n.read = true))) }

const SIM_FOODS = [
  ['Sambar + Rice (family packs)', 16, true], ['Croissants & Muffins', 14, true],
  ['Fish Curry Meals', 10, false], ['Veg Pulao Trays', 28, true], ['Idli + Vada Sets', 20, true],
]
export function simulateDonation() {
  const [foodName, servings, veg] = SIM_FOODS[Math.floor(Math.random() * SIM_FOODS.length)]
  const donor = { id: 'seed_donor_2', org: 'FreshMart Supermarket', name: 'FreshMart', phone: '+91 98470 77889' }
  return addListing(donor, {
    foodName, servings, veg, photo: PRESET_PHOTOS[Math.floor(Math.random() * PRESET_PHOTOS.length)],
    address: 'FreshMart Supermarket, Thiruvananthapuram',
    lat: jitter(CITY_CENTER.lat, 0.02), lng: jitter(CITY_CENTER.lng, 0.02),
    expiresAt: mins(50 + Math.floor(Math.random() * 90)), safetyConfirmed: true,
  })
}

// --- helpers ----------------------------------------------------------------
export function haversineKm(a, b) {
  const R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}
export function resetDemo() { localStorage.removeItem(LS_KEY); db = seed(); save(db); emit() }

// --- theme ------------------------------------------------------------------
export function getTheme() {
  try {
    const saved = localStorage.getItem('replate_theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch { return 'light' }
}
export function applyTheme(t) {
  document.documentElement.classList.toggle('dark', t === 'dark')
  try { localStorage.setItem('replate_theme', t) } catch { /* ignore */ }
}
