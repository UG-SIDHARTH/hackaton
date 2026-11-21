import { useState } from 'react'
import { login, signup, demoLogin } from '../data/store'

export default function Auth({ onDone, toast }) {
  const [mode, setMode] = useState('login')
  const [role, setRole] = useState('receiver')
  const [f, setF] = useState({ name: '', org: '', phone: '', email: '', password: '', radiusKm: 5 })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    setErr('')
    if (mode === 'login') {
      const r = login(f.email.trim(), f.password)
      if (r.error) return setErr(r.error)
      toast('Welcome back!', '👋')
    } else {
      if (!f.name || !f.phone || !f.email || !f.password) return setErr('Please fill name, phone, email and password.')
      const r = signup({ ...f, email: f.email.trim(), role, radiusKm: Number(f.radiusKm) || 5 })
      if (r.error) return setErr(r.error)
      toast('Account created — welcome to RePlate!', '🎉')
    }
    onDone()
  }

  const input = 'w-full rounded-xl border border-gray-300 px-3.5 py-3 text-[16px] bg-white focus:outline-none focus:ring-2 focus:ring-leaf-500'

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <div className="bg-leaf-600 text-white px-5 pt-10 pb-8 rounded-b-[2rem]">
        <div className="text-4xl">🍽️</div>
        <h1 className="text-3xl font-extrabold mt-2">RePlate</h1>
        <p className="text-leaf-100 mt-1">Rescue the Surplus — no edible food in a dustbin while someone nearby is hungry.</p>
      </div>

      <div className="px-5 py-5 flex-1 w-full max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => demoLogin('donor') || onDone()} className="bg-leaf-600 text-white font-semibold rounded-xl py-3 active:scale-[.98]">▶ Demo as Donor</button>
          <button onClick={() => demoLogin('receiver') || onDone()} className="bg-white text-leaf-700 font-semibold rounded-xl py-3 ring-1 ring-leaf-300 active:scale-[.98]">▶ Demo as Receiver</button>
        </div>
        <p className="text-center text-xs text-gray-400 mb-4">One tap, no signup — best for judges. Demo accounts: donor@replate.demo / receiver@replate.demo, password "demo".</p>

        <div className="flex bg-white rounded-xl ring-1 ring-gray-200 p-1 mb-4">
          {['login', 'signup'].map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg font-semibold capitalize ${mode === m ? 'bg-leaf-600 text-white' : 'text-gray-500'}`}>{m === 'login' ? 'Log in' : 'Sign up'}</button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'signup' && (
            <>
              <div className="flex bg-white rounded-xl ring-1 ring-gray-200 p-1">
                {['donor', 'receiver'].map((r) => (
                  <button type="button" key={r} onClick={() => setRole(r)} className={`flex-1 py-2 rounded-lg font-semibold capitalize ${role === r ? 'bg-leaf-100 text-leaf-800' : 'text-gray-500'}`}>{r === 'donor' ? '🍴 I donate food' : '🤲 I receive food'}</button>
                ))}
              </div>
              <input className={input} placeholder="Your name" value={f.name} onChange={set('name')} />
              <input className={input} placeholder="Organisation (optional)" value={f.org} onChange={set('org')} />
              <input className={input} placeholder="Phone" inputMode="tel" value={f.phone} onChange={set('phone')} />
              {role === 'receiver' && (
                <label className="block bg-white rounded-xl ring-1 ring-gray-200 px-3.5 py-3">
                  <span className="text-sm text-gray-500">Pickup radius: <b className="text-gray-800">{f.radiusKm} km</b></span>
                  <input type="range" min="1" max="25" value={f.radiusKm} onChange={set('radiusKm')} className="w-full accent-leaf-600 mt-1" />
                </label>
              )}
            </>
          )}
          <input className={input} placeholder="Email" inputMode="email" value={f.email} onChange={set('email')} />
          <input className={input} placeholder="Password" type="password" value={f.password} onChange={set('password')} />
          {err && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{err}</p>}
          <button className="w-full bg-leaf-600 text-white font-bold rounded-xl py-3.5 text-[16px] active:scale-[.99]">{mode === 'login' ? 'Log in' : 'Create account'}</button>
        </form>
      </div>
      <p className="text-center text-[11px] text-gray-400 pb-4 px-6">Food safety: donors confirm food is freshly prepared / safely stored and fit to eat.</p>
    </div>
  )
}
