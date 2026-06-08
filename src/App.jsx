import { useState } from 'react'
import { useStore } from './lib/useStore'
import { TODAY, addDays, fmtDate, daysBetween, CHALLENGE_START, TOTAL_DAYS, PRAYERS, MORNING_ROUTINE, EVENING_ROUTINE } from './lib/constants'
import Dashboard from './components/Dashboard'
import Routine from './components/Routine'
import { Sport, Prayer, Quran, Cert, Agenda } from './components/Modules'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈' },
  { id: 'routine', label: 'Routines', icon: '🌅' },
  { id: 'sport', label: 'Sport', icon: '⚡' },
  { id: 'prayer', label: 'Prières', icon: '☽' },
  { id: 'quran', label: 'Coran', icon: '◎' },
  { id: 'cert', label: 'Certif', icon: '◇' },
  { id: 'agenda', label: 'Agenda', icon: '◻' },
]

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [selectedDay, setSelectedDay] = useState(TODAY)
  const store = useStore()

  const challengeDay = Math.max(1, daysBetween(CHALLENGE_START, selectedDay) + 1)
  const progress = Math.min(100, Math.round((daysBetween(CHALLENGE_START, TODAY) + 1) / TOTAL_DAYS * 100))

  const dayScore = (d) => {
    let score = 0, total = 0
    const p = store.prayers[d] || {}
    PRAYERS.forEach(() => total++)
    PRAYERS.filter(pr => p[pr]).forEach(() => score++)
    total++; if (store.workouts[d]?.done) score++
    total++; if (store.quranPages[d]?.done) score++
    const m = store.morningRoutine[d] || {}
    const e = store.eveningRoutine[d] || {}
    const mDone = MORNING_ROUTINE.filter(r => m[r.id]).length
    const eDone = EVENING_ROUTINE.filter(r => e[r.id]).length
    total += 2
    if (mDone / MORNING_ROUTINE.length >= 0.5) score++
    if (eDone / EVENING_ROUTINE.length >= 0.5) score++
    return { score, total, pct: total ? Math.round(score / total * 100) : 0 }
  }

  const todayScore = dayScore(TODAY)

  const calcStreak = () => {
    let streak = 0, d = TODAY
    while (true) {
      const { pct } = dayScore(d)
      if (pct >= 50) { streak++; d = addDays(d, -1) } else break
    }
    return streak
  }
  const streak = calcStreak()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080810', color: '#e0e0e0', fontFamily: "'Lato', 'Helvetica Neue', sans-serif" }}>
      <style>{GLOBAL_CSS}</style>

      {/* Sidebar */}
      <nav style={S.sidebar}>
        <div style={S.brand}>
          <span style={{ fontSize: 28, color: '#d4af37' }}>◈</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', fontFamily: "'Cinzel', serif", letterSpacing: 1 }}>Omar</div>
            <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 2 }}>Challenge 90J</div>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(212,175,55,0.1))', border: '1px solid rgba(255,107,53,0.3)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
          <span style={{ display: 'block', fontSize: 32, fontWeight: 900, color: '#ff6b35', fontFamily: "'Cinzel', serif", lineHeight: 1 }}>{streak}</span>
          <span style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>jours de suite</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {TABS.map(t => (
            <button key={t.id}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: 'none', background: tab === t.id ? 'rgba(212,175,55,0.1)' : 'transparent', color: tab === t.id ? '#d4af37' : '#888', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 700 : 500, transition: 'all 0.2s', position: 'relative', textAlign: 'left' }}
              onClick={() => setTab(t.id)}>
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{t.icon}</span>
              <span>{t.label}</span>
              {tab === t.id && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#d4af37', marginLeft: 'auto' }} />}
            </button>
          ))}
        </div>

        <div style={{ padding: '12px 0 0', borderTop: '1px solid #1a1a2e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginBottom: 6 }}>
            <span>Progression</span>
            <span style={{ color: '#d4af37' }}>{progress}%</span>
          </div>
          <div style={{ height: 4, background: '#1a1a2e', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#d4af37', borderRadius: 2, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>
            Jour {Math.min(daysBetween(CHALLENGE_START, TODAY) + 1, 90)} / 90
          </div>
        </div>
      </nav>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #1a1a2e', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', fontFamily: "'Cinzel', serif", letterSpacing: 1 }}>
              {TABS.find(t => t.id === tab)?.icon} {TABS.find(t => t.id === tab)?.label}
            </div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{fmtDate(selectedDay)} · Jour {challengeDay}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={S.dateBtn} onClick={() => setSelectedDay(addDays(selectedDay, -1))}>‹</button>
            <button style={{ ...S.dateBtn, background: 'rgba(212,175,55,0.1)', borderColor: '#d4af3755', color: '#d4af37' }} onClick={() => setSelectedDay(TODAY)}>Aujourd'hui</button>
            <button style={S.dateBtn} onClick={() => setSelectedDay(addDays(selectedDay, 1))}>›</button>
          </div>
        </header>

        {/* Mobile tab bar */}
        <div style={S.mobileTabBar}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 4px', background: 'transparent', border: 'none', color: tab === t.id ? '#d4af37' : '#555', cursor: 'pointer', fontSize: 8 }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              <span style={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
          {store.loaded === false && (
            <div style={{ textAlign: 'center', padding: 40, color: '#888', fontSize: 13 }}>
              Synchronisation des données…
            </div>
          )}
          {tab === 'dashboard' && <Dashboard selectedDay={selectedDay} setSelectedDay={setSelectedDay} store={store} streak={streak} progress={progress} challengeDay={challengeDay} dayScore={dayScore} todayScore={todayScore} />}
          {tab === 'routine' && <Routine selectedDay={selectedDay} morningRoutine={store.morningRoutine} setMorningRoutine={store.setMorningRoutine} eveningRoutine={store.eveningRoutine} setEveningRoutine={store.setEveningRoutine} />}
          {tab === 'sport' && <Sport selectedDay={selectedDay} workouts={store.workouts} setWorkouts={store.setWorkouts} nutrition={store.nutrition} setNutrition={store.setNutrition} />}
          {tab === 'prayer' && <Prayer selectedDay={selectedDay} prayers={store.prayers} setPrayers={store.setPrayers} />}
          {tab === 'quran' && <Quran selectedDay={selectedDay} quranPages={store.quranPages} setQuranPages={store.setQuranPages} />}
          {tab === 'cert' && <Cert selectedDay={selectedDay} certStudy={store.certStudy} setCertStudy={store.setCertStudy} />}
          {tab === 'agenda' && <Agenda appointments={store.appointments} addAppointment={store.addAppointment} removeAppointment={store.removeAppointment} />}
        </div>
      </main>
    </div>
  )
}

const S = {
  sidebar: { width: 220, background: '#0d0d1a', borderRight: '1px solid #1a1a2e', display: 'flex', flexDirection: 'column', padding: '24px 16px', gap: 16, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', flexShrink: 0 },
  brand: { display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 16, borderBottom: '1px solid #1a1a2e' },
  dateBtn: { padding: '6px 12px', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 6, color: '#aaa', cursor: 'pointer', fontSize: 13 },
  mobileTabBar: { display: 'none', borderBottom: '1px solid #1a1a2e', background: '#0d0d1a', overflowX: 'auto' },
}

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Lato:wght@300;400;700;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080810; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: #0d0d1a; }
  ::-webkit-scrollbar-thumb { background: #2a2a3e; border-radius: 2px; }
  button:hover { filter: brightness(1.15); }
  input:focus, select:focus, textarea:focus { border-color: #d4af3766 !important; }
  @media (max-width: 768px) {
    nav[style*="width: 220"] { display: none !important; }
    div[style*="mobileTabBar"] { display: flex !important; }
    div[style*="padding: '20px 24px'"] { padding: 16px !important; }
  }
`
