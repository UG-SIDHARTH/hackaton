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
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl ring-1 ring-gray-200 p-4">
            <div className="text-2xl">{c.icon}</div>
            <div className="text-2xl font-extrabold text-leaf-700 mt-1"><AnimatedNumber value={c.value} />{c.suffix || ''}</div>
            <div className="text-sm text-gray-500">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl ring-1 ring-gray-200 p-4 mt-4">
        <h3 className="font-bold mb-3">Meals rescued this week</h3>
        <div className="flex items-end gap-2 h-32">
          {week.map((w) => (
            <div key={w.d} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[11px] font-semibold text-gray-500">{w.v}</span>
              <div className="w-full bg-leaf-500 rounded-t-lg transition-all duration-500" style={{ height: `${(w.v / weekMax) * 100}%` }} />
              <span className="text-[11px] text-gray-400">{w.d}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl ring-1 ring-gray-200 p-4 mt-4">
        <h3 className="font-bold mb-2">🏆 Top donors</h3>
        {board.map((b, i) => (
          <div key={b.name} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
            <span className="w-6 text-center font-extrabold text-leaf-700">{i + 1}</span>
            <span className="flex-1 font-medium">{b.name}</span>
            <span className="text-sm text-gray-500">{b.servings} meals</span>
          </div>
        ))}
        <div className="h-1.5 bg-leaf-100 rounded-full mt-3 overflow-hidden"><div className="h-full bg-leaf-500 rounded-full" style={{ width: `${(board[0].servings / max) * 100}%` }} /></div>
      </div>

      <p className="text-[11px] text-gray-400 text-center mt-5 px-4">Estimates: 1 serving ≈ 0.4 kg food ≈ 1 kg CO₂e avoided (landfill diversion). Food safety assumption: donors confirm all food is freshly prepared or safely stored and fit to eat; receivers inspect at pickup.</p>
    </div>
  )
}
