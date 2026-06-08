import { Card, CardTitle, ProgressBar, ApptTag } from './ui'
import {
  PRAYERS, TODAY, addDays, fmtDate, daysBetween,
  CHALLENGE_START, CERT_MILESTONES, MORNING_ROUTINE, EVENING_ROUTINE, APPT_COLORS
} from '../lib/constants'

export default function Dashboard({ selectedDay, setSelectedDay, store, streak, progress, challengeDay, dayScore, todayScore }) {
  const { prayers, workouts, quranPages, certStudy, appointments, morningRoutine, eveningRoutine } = store

  const upcoming = [...appointments]
    .filter(a => a.date >= TODAY)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4)

  // 90-day grid
  const grid = Array.from({ length: 90 }, (_, i) => {
    const d = addDays(CHALLENGE_START, i)
    const s = dayScore(d)
    return { d, s, isPast: d <= TODAY, isToday: d === TODAY }
  })

  const totalPrayers = Object.values(prayers).reduce((a, p) => a + PRAYERS.filter(pr => p[pr]).length, 0)
  const totalQuran = Object.values(quranPages).filter(q => q.done).length
  const totalWorkouts = Object.values(workouts).filter(w => w.done).length
  const totalCert = Object.values(certStudy).filter(d => d.done).length

  // Today routine scores
  const mDay = morningRoutine[TODAY] || {}
  const eDay = eveningRoutine[TODAY] || {}
  const mPct = Math.round(MORNING_ROUTINE.filter(r => mDay[r.id]).length / MORNING_ROUTINE.length * 100)
  const ePct = Math.round(EVENING_ROUTINE.filter(r => eDay[r.id]).length / EVENING_ROUTINE.length * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { icon: '🔥', val: streak, label: 'Streak', color: '#ff6b35' },
          { icon: '📿', val: totalPrayers, label: 'Prières', color: '#d4af37' },
          { icon: '📖', val: totalQuran, label: 'Pages Coran', color: '#7eb8a4' },
          { icon: '💪', val: totalWorkouts, label: 'Séances', color: '#6b9de8' },
        ].map(k => (
          <div key={k.label} style={{ background: '#0d0d1a', border: `1px solid ${k.color}44`, borderRadius: 12, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: 28 }}>{k.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: k.color, fontFamily: "'Cinzel', serif", lineHeight: 1.2 }}>{k.val}</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Score du jour + routines */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <CardTitle>Score du jour — {fmtDate(TODAY)}</CardTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg viewBox="0 0 100 100" style={{ width: 88, height: 88 }}>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a2e" strokeWidth="10" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#d4af37" strokeWidth="10"
                  strokeDasharray={`${todayScore.pct * 2.51} 251`}
                  strokeLinecap="round" transform="rotate(-90 50 50)" />
              </svg>
              <div style={{ position: 'absolute', fontSize: 18, fontWeight: 900, color: '#d4af37' }}>{todayScore.pct}%</div>
            </div>
            <div style={{ flex: 1 }}>
              {PRAYERS.map(p => {
                const done = prayers[TODAY]?.[p]
                return <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginBottom: 2, opacity: done ? 1 : 0.4 }}>
                  <span style={{ color: done ? '#d4af37' : '#555', fontSize: 8 }}>●</span>{p}
                </div>
              })}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginTop: 4, opacity: workouts[TODAY]?.done ? 1 : 0.4 }}>
                <span style={{ color: workouts[TODAY]?.done ? '#6b9de8' : '#555', fontSize: 8 }}>●</span>Sport
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, opacity: quranPages[TODAY]?.done ? 1 : 0.4 }}>
                <span style={{ color: quranPages[TODAY]?.done ? '#7eb8a4' : '#555', fontSize: 8 }}>●</span>Coran
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Routines du jour</CardTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#aaa' }}>☀️ Routine matin</span>
                <span style={{ fontSize: 13, color: '#d4af37', fontWeight: 700 }}>{mPct}%</span>
              </div>
              <ProgressBar pct={mPct} color="#d4af37" height={6} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#aaa' }}>🌙 Routine soir</span>
                <span style={{ fontSize: 13, color: '#a29bfe', fontWeight: 700 }}>{ePct}%</span>
              </div>
              <ProgressBar pct={ePct} color="#a29bfe" height={6} />
            </div>
            <div style={{ marginTop: 4, padding: '8px 12px', background: '#080810', borderRadius: 8, fontSize: 12, color: '#888' }}>
              Certification : <span style={{ color: '#6b9de8', fontWeight: 700 }}>{totalCert} jours</span> d'étude
            </div>
          </div>
        </Card>
      </div>

      {/* 90J Grid */}
      <Card>
        <CardTitle>Grille 90 jours — Jour {Math.min(challengeDay, 90)} / 90</CardTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(18, 1fr)', gap: 3, margin: '12px 0' }}>
          {grid.map(({ d, s, isPast, isToday }) => (
            <div key={d}
              title={`J${daysBetween(CHALLENGE_START, d) + 1} · ${fmtDate(d)} · ${s.pct}%`}
              onClick={() => setSelectedDay(d)}
              style={{
                aspectRatio: '1', borderRadius: 3, cursor: 'pointer',
                background: isToday ? '#d4af37' : isPast ? `rgba(212,175,55,${s.pct / 100 * 0.85 + 0.05})` : '#1a1a2e',
                border: isToday ? '2px solid #fff' : '1px solid #222',
                transition: 'transform 0.1s',
              }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#555' }}>
          <span>○ À venir</span>
          <span style={{ color: 'rgba(212,175,55,0.3)' }}>◎ Partiel</span>
          <span style={{ color: '#d4af37' }}>● Complet</span>
        </div>
      </Card>

      {/* Milestones + RDV */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <CardTitle>Jalons certification</CardTitle>
          {CERT_MILESTONES.map(m => {
            const reached = challengeDay >= m.day
            return (
              <div key={m.day} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #1a1a2e', opacity: reached ? 1 : 0.4 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: reached ? '#d4af37' : '#333', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#e0e0e0' }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: '#666' }}>Jour {m.day}</div>
                </div>
                {reached && <span style={{ color: '#d4af37' }}>✓</span>}
              </div>
            )
          })}
        </Card>

        <Card>
          <CardTitle>Prochains RDV</CardTitle>
          {upcoming.length === 0 && <div style={{ color: '#555', fontSize: 13 }}>Aucun rendez-vous</div>}
          {upcoming.map((a, i) => (
            <div key={a.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #1a1a2e' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: APPT_COLORS[a.type] || '#666', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#e0e0e0' }}>{a.title}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{fmtDate(a.date)}{a.time ? ` · ${a.time}` : ''}</div>
              </div>
              <ApptTag type={a.type} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
