import { AnimatedNumber } from '../components/ui'

export default function Dashboard({ db }) {
  const { impact, leaderboardSeed } = db
  const myDonations = db.listings.filter((l) => l.status === 'picked_up').reduce((s, l) => s + l.servings, 0)
  const board = [...leaderboardSeed].sort((a, b) => b.servings - a.servings)
  const max = board[0].servings
  const week = [
    { d: 'Mon', v: 42 }, { d: 'Tue', v: 58 }, { d: 'Wed', v: 35 }, { d: 'Thu', v: 71 }, { d: 'Fri', v: 64 }, { d: 'Sat', v: 96 }, { d: 'Sun', v: 88 },
  ]
  const weekMax = Math.max(...week.map((w) => w.v))
  const cards = [
    { icon: '🍽️', label: 'Meals rescued', value: impact.rescuedServings + myDonations },
    { icon: '⚖️', label: 'Food saved', value: impact.rescuedKg, suffix: ' kg' },
    { icon: '🌍', label: 'CO₂ avoided', value: impact.co2SavedKg, suffix: ' kg' },
    { icon: '🤝', label: 'Active donors', value: impact.activeDonors },
  ]
  return (
    <div>
      <h2 className="text-xl font-extrabold mb-3">Impact dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-gray-200 dark:ring-slate-700 p-4">
            <div className="text-2xl">{c.icon}</div>
            <div className="text-2xl font-extrabold text-brand-700 dark:text-brand-300 mt-1"><AnimatedNumber value={c.value} />{c.suffix || ''}</div>
            <div className="text-sm text-gray-500 dark:text-slate-400">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-gray-200 dark:ring-slate-700 p-4 mt-4">
        <h3 className="font-bold mb-3">Meals rescued this week</h3>
        <div className="flex items-end gap-2 h-32">
          {week.map((w) => (
            <div key={w.d} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">{w.v}</span>
              <div className="w-full bg-gradient-to-t from-brand-600 to-brand-400 rounded-t-lg origin-bottom" style={{ height: `${(w.v / weekMax) * 100}%`, animation: `barGrow .7s ease ${week.indexOf(w) * 80}ms both` }} />
              <span className="text-[11px] text-gray-400 dark:text-slate-500">{w.d}</span>
            </div>
          ))}
        </div>
      </div>


      <div className="bg-gradient-to-br from-brand-600 to-fuchsia-600 rounded-2xl p-4 mt-4 text-white shadow-lg shadow-brand-200">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">🎯 Weekly rescue goal</h3>
          <span className="text-sm font-semibold text-brand-100">{Math.min(454 + myDonations, 500)}/500 meals</span>
        </div>
        <div className="h-3 bg-white dark:bg-slate-900/25 rounded-full mt-3 overflow-hidden">
          <div className="h-full bg-white dark:bg-slate-900 rounded-full transition-[width] duration-1000" style={{ width: `${Math.min(100, ((454 + myDonations) / 500) * 100)}%` }} />
        </div>
        <p className="text-[13px] text-brand-50 mt-2">Every pickup moves the whole city closer. Keep going!</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-gray-200 dark:ring-slate-700 p-4 mt-4">
        <h3 className="font-bold mb-2">🏆 Top donors</h3>
        {board.map((b, i) => (
          <div key={b.name} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-slate-800 last:border-0">
            <span className="w-6 text-center font-extrabold text-brand-700 dark:text-brand-300">{i + 1}</span>
            <span className="flex-1 font-medium">{b.name}</span>
            <span className="text-sm text-gray-500 dark:text-slate-400">{b.servings} meals</span>
          </div>
        ))}
        <div className="h-1.5 bg-brand-100 dark:bg-brand-900/50 rounded-full mt-3 overflow-hidden"><div className="h-full bg-brand-50 dark:bg-slate-8000 rounded-full" style={{ width: `${(board[0].servings / max) * 100}%` }} /></div>
      </div>

      <p className="text-[11px] text-gray-400 dark:text-slate-500 text-center mt-5 px-4">Estimates: 1 serving ≈ 0.4 kg food ≈ 1 kg CO₂e avoided (landfill diversion). Food safety assumption: donors confirm all food is freshly prepared or safely stored and fit to eat; receivers inspect at pickup.</p>
    </div>
  )
}
