import { Card, CardTitle, ProgressBar } from './ui'
import { MORNING_ROUTINE, EVENING_ROUTINE, ROUTINE_CATEGORY_COLORS, TODAY, addDays, fmtDate } from '../lib/constants'

export default function Routine({ selectedDay, morningRoutine, setMorningRoutine, eveningRoutine, setEveningRoutine }) {
  const morning = morningRoutine[selectedDay] || {}
  const evening = eveningRoutine[selectedDay] || {}

  const toggleMorning = (id) => setMorningRoutine(selectedDay, { [id]: !morning[id] })
  const toggleEvening = (id) => setEveningRoutine(selectedDay, { [id]: !evening[id] })

  const morningDone = MORNING_ROUTINE.filter(r => morning[r.id]).length
  const eveningDone = EVENING_ROUTINE.filter(r => evening[r.id]).length
  const morningPct = Math.round(morningDone / MORNING_ROUTINE.length * 100)
  const eveningPct = Math.round(eveningDone / EVENING_ROUTINE.length * 100)

  // Streak for each routine
  const calcRoutineStreak = (store, items) => {
    let streak = 0
    let d = TODAY
    while (true) {
      const day = store[d] || {}
      const allDone = items.every(r => day[r.id])
      if (allDone) { streak++; d = addDays(d, -1) }
      else break
    }
    return streak
  }

  // Weekly heatmap (7 days)
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(TODAY, -6 + i))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <CardTitle>☀️ Routine matin</CardTitle>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: '#d4af37', fontFamily: "'Cinzel', serif" }}>
              {morningDone}/{MORNING_ROUTINE.length}
            </span>
            <span style={{ fontSize: 11, color: '#888' }}>{morningPct}%</span>
          </div>
          <ProgressBar pct={morningPct} color="#d4af37" />
        </Card>
        <Card>
          <CardTitle>🌙 Routine soir</CardTitle>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: '#a29bfe', fontFamily: "'Cinzel', serif" }}>
              {eveningDone}/{EVENING_ROUTINE.length}
            </span>
            <span style={{ fontSize: 11, color: '#888' }}>{eveningPct}%</span>
          </div>
          <ProgressBar pct={eveningPct} color="#a29bfe" />
        </Card>
      </div>

      {/* Morning checklist */}
      <Card>
        <CardTitle>☀️ Routine matinale — {fmtDate(selectedDay)}</CardTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
          {MORNING_ROUTINE.map(item => {
            const done = !!morning[item.id]
            const catColor = ROUTINE_CATEGORY_COLORS[item.category]
            return (
              <button key={item.id} onClick={() => toggleMorning(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 10, border: `1px solid ${done ? catColor + '66' : '#1a1a2e'}`,
                  background: done ? catColor + '11' : '#080810',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: done ? '#e0e0e0' : '#888', textDecoration: done ? 'none' : 'none' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 10, color: catColor, textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 }}>
                    {item.category}
                  </div>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: 6, border: `2px solid ${done ? catColor : '#333'}`,
                  background: done ? catColor : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {done && <span style={{ color: '#000', fontSize: 12, fontWeight: 900 }}>✓</span>}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Evening checklist */}
      <Card>
        <CardTitle>🌙 Routine du soir — {fmtDate(selectedDay)}</CardTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
          {EVENING_ROUTINE.map(item => {
            const done = !!evening[item.id]
            const catColor = ROUTINE_CATEGORY_COLORS[item.category]
            return (
              <button key={item.id} onClick={() => toggleEvening(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 10, border: `1px solid ${done ? catColor + '66' : '#1a1a2e'}`,
                  background: done ? catColor + '11' : '#080810',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: done ? '#e0e0e0' : '#888' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 10, color: catColor, textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 }}>
                    {item.category}
                  </div>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: 6, border: `2px solid ${done ? catColor : '#333'}`,
                  background: done ? catColor : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {done && <span style={{ color: '#000', fontSize: 12, fontWeight: 900 }}>✓</span>}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* 7 day heatmap */}
      <Card>
        <CardTitle>Régularité cette semaine</CardTitle>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          {last7.map(d => {
            const mDay = morningRoutine[d] || {}
            const eDay = eveningRoutine[d] || {}
            const mPct = MORNING_ROUTINE.filter(r => mDay[r.id]).length / MORNING_ROUTINE.length
            const ePct = EVENING_ROUTINE.filter(r => eDay[r.id]).length / EVENING_ROUTINE.length
            const avg = (mPct + ePct) / 2
            return (
              <div key={d} style={{ flex: 1, minWidth: 44, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>
                  {new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'narrow' })}
                </div>
                <div style={{
                  height: 40, borderRadius: 6,
                  background: avg > 0.8 ? '#d4af37' : avg > 0.5 ? `rgba(212,175,55,${avg})` : '#1a1a2e',
                  border: d === TODAY ? '2px solid #d4af37' : '1px solid #222',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: avg > 0.5 ? '#000' : '#555', fontWeight: 700,
                }}>
                  {Math.round(avg * 100)}%
                </div>
                {/* Split view */}
                <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
                  <div style={{ flex: 1, height: 3, borderRadius: 2, background: mPct > 0.5 ? '#d4af37' : '#1a1a2e' }} title="Matin" />
                  <div style={{ flex: 1, height: 3, borderRadius: 2, background: ePct > 0.5 ? '#a29bfe' : '#1a1a2e' }} title="Soir" />
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: '#555' }}>
          <span style={{ color: '#d4af37' }}>— Matin</span>
          <span style={{ color: '#a29bfe' }}>— Soir</span>
        </div>
      </Card>
    </div>
  )
}
