import { useState, useEffect, useCallback, Component } from 'react'
import { createClient } from '@supabase/supabase-js'

// ─── Supabase ─────────────────────────────────────────────────────────────────
const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
)

async function dbGet(table) {
  try {
    const { data, error } = await sb.from(table).select('*')
    if (error) throw error
    return data || []
  } catch(e) { console.warn('db get', table, e.message); return [] }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().split('T')[0]
const addDays = (d, n) => { const dt = new Date(d + 'T12:00:00'); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0] }
const fmtDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
const fmtLong = (d) => new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const dow = (d) => new Date(d + 'T12:00:00').getDay()
const isDue = (t, date) => {
  if (!t || !t.frequency) return false
  if (t.type === 'task') return t.due_date === date
  const d = dow(date)
  if (t.frequency === 'daily') return true
  if (t.frequency === 'weekdays') return d >= 1 && d <= 5
  if (t.frequency === 'weekends') return d === 0 || d === 6
  if (t.frequency === 'custom') return (t.frequency_days || []).includes(d)
  return true
}
const getLog = (logs, tid, date) => (logs || []).find(l => l.trackable_id === tid && l.date === date)
const isComplete = (t, log) => { if (!log) return false; if (t.type === 'measure') return Number(log.value) >= Number(t.target_count); return !!log.done }
const ratio = (t, log) => { if (!log || !t.target_count) return 0; return Math.min(1, Number(log.value) / Number(t.target_count)) }

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = { bg:'#080810', surface:'#0d0d1a', border:'#1a1a2e', border2:'#2a2a3e', text:'#e0e0e0', dim:'#888', faint:'#555', gold:'#d4af37', serif:"'Cinzel',serif" }

// ─── UI primitives ────────────────────────────────────────────────────────────
const Card = ({ children, style={}, onClick }) => <div onClick={onClick} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:'16px 18px', ...style }}>{children}</div>
const Title = ({ children, right }) => <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}><span style={{ fontSize:11, color:T.dim, textTransform:'uppercase', letterSpacing:2 }}>{children}</span>{right}</div>
const Bar = ({ pct=0, color=T.gold, h=4 }) => <div style={{ height:h, background:T.border, borderRadius:h/2, overflow:'hidden' }}><div style={{ height:'100%', width:`${Math.min(100,Math.max(0,pct))}%`, background:color, borderRadius:h/2, transition:'width .4s' }}/></div>
const Btn = ({ children, onClick, primary, color=T.gold, disabled, style={} }) => (
  <button onClick={onClick} disabled={disabled} style={{ padding:'8px 16px', borderRadius:8, border:`1px solid ${color}`, background:primary?color+'22':'transparent', color:primary?color:T.dim, cursor:disabled?'default':'pointer', fontSize:13, fontWeight:600, opacity:disabled?.5:1, ...style }}>{children}</button>
)
const Ring = ({ pct=0, color=T.gold, size=80, children }) => {
  const r=38, c=2*Math.PI*r
  return (
    <div style={{ position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center', width:size, height:size }}>
      <svg viewBox="0 0 100 100" style={{ width:size, height:size }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke={T.border} strokeWidth={12}/>
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth={12} strokeDasharray={`${pct/100*c} ${c}`} strokeLinecap="round" transform="rotate(-90 50 50)"/>
      </svg>
      <div style={{ position:'absolute', fontSize:size*.18, fontWeight:900, color }}>{children}</div>
    </div>
  )
}

// ─── ErrorBoundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(p) { super(p); this.state = { err:null } }
  static getDerivedStateFromError(e) { return { err:e } }
  render() {
    if (this.state.err) return (
      <div style={{ padding:40, background:T.bg, minHeight:'100vh', color:'#ff6b6b', fontFamily:'monospace' }}>
        <div style={{ fontSize:18, marginBottom:16 }}>Erreur - merci de copier ce message</div>
        <pre style={{ fontSize:11, color:'#aaa', whiteSpace:'pre-wrap' }}>{this.state.err.message}\n{this.state.err.stack}</pre>
      </div>
    )
    return this.props.children
  }
}

// ─── Categories ───────────────────────────────────────────────────────────────
const CATS = {
  spirituel:{label:'Spirituel',color:'#d4af37',icon:'☽'},
  sport:{label:'Sport',color:'#6b9de8',icon:'⚡'},
  nutrition:{label:'Nutrition',color:'#ff9f43',icon:'🍎'},
  sante:{label:'Santé',color:'#7eb8a4',icon:'💧'},
  pro:{label:'Pro',color:'#a29bfe',icon:'💼'},
  mental:{label:'Mental',color:'#fd79a8',icon:'🧠'},
  autre:{label:'Autre',color:'#888',icon:'●'},
}
const TOD = { morning:{label:'Matin',icon:'☀️'}, afternoon:{label:'Après-midi',icon:'🌤️'}, evening:{label:'Soir',icon:'🌙'}, anytime:{label:'Flexible',icon:'🕐'} }
const EVT_COLORS = { Pro:'#6b9de8', Médecin:'#ff6b6b', Perso:'#7eb8a4', Autre:'#d4af37' }
const PRI = { high:{label:'Haute',color:'#ff6b6b',icon:'▲',o:0}, medium:{label:'Moyenne',color:T.gold,icon:'◆',o:1}, low:{label:'Basse',color:'#7eb8a4',icon:'▼',o:2} }

// ─── Main store ───────────────────────────────────────────────────────────────
function useAppStore() {
  const [loaded, setLoaded] = useState(false)
  const [challenges, setChallenges] = useState([])
  const [trackables, setTrackables] = useState([])
  const [logs, setLogs] = useState([])
  const [events, setEvents] = useState([])
  const [todos, setTodos] = useState([])
  const [milestones, setMilestones] = useState([])

  useEffect(() => {
    (async () => {
      try {
        const [c,t,l,e,m,td] = await Promise.all([
          dbGet('challenges'), dbGet('trackables'), dbGet('logs'),
          dbGet('events'), dbGet('milestones'), dbGet('todos')
        ])
        setChallenges(c); setTrackables(t); setLogs(l)
        setEvents(e); setMilestones(m); setTodos(td)
      } catch(e) { console.error('store load', e) }
      setLoaded(true)
    })()
  }, [])

  const setLog = useCallback(async (tid, date, fields) => {
    setLogs(prev => {
      const ex = prev.find(l => l.trackable_id === tid && l.date === date)
      return ex ? prev.map(l => l===ex ? {...l,...fields} : l) : [...prev, {trackable_id:tid, date, value:1, done:true, ...fields}]
    })
    try { await sb.from('logs').upsert({trackable_id:tid, date, ...fields},{onConflict:'trackable_id,date'}) } catch(e) {}
  }, [])

  const clearLog = useCallback(async (tid, date) => {
    setLogs(prev => prev.filter(l => !(l.trackable_id===tid && l.date===date)))
    try { await sb.from('logs').delete().eq('trackable_id',tid).eq('date',date) } catch(e) {}
  }, [])

  const addChallenge = useCallback(async (fields, tDefs=[], mDefs=[]) => {
    try {
      const { data:ch } = await sb.from('challenges').insert(fields).select().single()
      if (!ch) return null
      let newT = [], newM = []
      if (tDefs.length) { const {data} = await sb.from('trackables').insert(tDefs.map((t,i)=>({...t,challenge_id:ch.id,sort_order:i}))).select(); newT = data||[] }
      if (mDefs.length) { const {data} = await sb.from('milestones').insert(mDefs.map(m=>({...m,challenge_id:ch.id}))).select(); newM = data||[] }
      setChallenges(p=>[ch,...p]); setTrackables(p=>[...p,...newT]); setMilestones(p=>[...p,...newM])
      return ch
    } catch(e) { console.error(e); return null }
  }, [])

  const editChallenge = useCallback(async (id, patch) => {
    setChallenges(p=>p.map(c=>c.id===id?{...c,...patch}:c))
    try { await sb.from('challenges').update(patch).eq('id',id) } catch(e) {}
  }, [])

  const removeChallenge = useCallback(async (id) => {
    setChallenges(p=>p.filter(c=>c.id!==id)); setTrackables(p=>p.filter(t=>t.challenge_id!==id)); setMilestones(p=>p.filter(m=>m.challenge_id!==id))
    try { await sb.from('challenges').delete().eq('id',id) } catch(e) {}
  }, [])

  const addEvent = useCallback(async (fields) => {
    try {
      const {data} = await sb.from('events').insert(fields).select().single()
      if (data) setEvents(p=>[...p,data])
    } catch(e) {}
  }, [])

  const removeEvent = useCallback(async (id) => {
    setEvents(p=>p.filter(e=>e.id!==id))
    try { await sb.from('events').delete().eq('id',id) } catch(e) {}
  }, [])

  const addTodo = useCallback(async (fields) => {
    try {
      const {data} = await sb.from('todos').insert(fields).select().single()
      if (data) setTodos(p=>[data,...p])
    } catch(e) {}
  }, [])

  const toggleTodo = useCallback(async (id) => {
    setTodos(p => {
      const t = p.find(x=>x.id===id); if (!t) return p
      const patch = {done:!t.done, done_at:!t.done?new Date().toISOString():null}
      sb.from('todos').update(patch).eq('id',id).catch(()=>{})
      return p.map(x=>x.id===id?{...x,...patch}:x)
    })
  }, [])

  const editTodo = useCallback(async (id, patch) => {
    setTodos(p=>p.map(x=>x.id===id?{...x,...patch}:x))
    try { await sb.from('todos').update(patch).eq('id',id) } catch(e) {}
  }, [])

  const removeTodo = useCallback(async (id) => {
    setTodos(p=>p.filter(x=>x.id!==id))
    try { await sb.from('todos').delete().eq('id',id) } catch(e) {}
  }, [])

  return { loaded, challenges, trackables, logs, events, todos, milestones, setLog, clearLog, addChallenge, editChallenge, removeChallenge, addEvent, removeEvent, addTodo, toggleTodo, editTodo, removeTodo }
}

// ─── Scoring ─────────────────────────────────────────────────────────────────
function dayScore(trackables, logs, date) {
  const due = (trackables||[]).filter(t => !t.archived && isDue(t, date))
  if (!due.length) return { done:0, total:0, pct:0 }
  let done = 0
  due.forEach(t => { const l=getLog(logs,t.id,date); if(t.type==='measure') done+=ratio(t,l); else if(isComplete(t,l)) done++ })
  return { done:Math.round(done*10)/10, total:due.length, pct:Math.round(done/due.length*100) }
}
function streak(trackables, logs, threshold=60) {
  const active = (trackables||[]).filter(t=>!t.archived)
  if (!active.length) return 0
  let s=0, d=TODAY
  if (dayScore(active,logs,TODAY).pct < threshold) d = addDays(TODAY,-1)
  for (let i=0;i<365;i++) {
    const due = active.filter(t=>isDue(t,d))
    if (!due.length) { d=addDays(d,-1); continue }
    if (dayScore(active,logs,d).pct >= threshold) { s++; d=addDays(d,-1) } else break
  }
  return s
}
function chalScore(tList, logs, w=30) {
  const a = (tList||[]).filter(t=>!t.archived)
  if (!a.length) return 0
  const scores = a.map(t => {
    let due=0,done=0
    for(let i=0;i<w;i++){const d=addDays(TODAY,-i);if(!isDue(t,d))continue;due++;const l=getLog(logs,t.id,d);if(t.type==='measure')done+=ratio(t,l);else if(isComplete(t,l))done++}
    return due?done/due*100:0
  })
  return Math.round(scores.reduce((a,b)=>a+b,0)/scores.length)
}
function chalDay(c) { return Math.max(1, Math.floor((new Date(TODAY+'T12:00:00')-new Date(c.start_date+'T12:00:00'))/86400000)+1) }
function chalProg(c) { return Math.min(100, Math.max(0, Math.round(chalDay(c)/c.duration_days*100))) }

// ─── TEMPLATES ────────────────────────────────────────────────────────────────
const TEMPLATES = [
  { id:'discipline90', title:'Discipline 90 Jours', description:'Prières, sport, Coran, certif, nutrition.', duration_days:90, color:'#d4af37', icon:'◈',
    trackables:[
      {name:'Fajr',type:'habit',frequency:'daily',time_of_day:'morning',category:'spirituel',icon:'☽'},
      {name:'Dhuhr',type:'habit',frequency:'daily',time_of_day:'afternoon',category:'spirituel',icon:'☽'},
      {name:'Asr',type:'habit',frequency:'daily',time_of_day:'afternoon',category:'spirituel',icon:'☽'},
      {name:'Maghrib',type:'habit',frequency:'daily',time_of_day:'evening',category:'spirituel',icon:'☽'},
      {name:'Isha',type:'habit',frequency:'daily',time_of_day:'evening',category:'spirituel',icon:'☽'},
      {name:'Page de Coran',type:'habit',frequency:'daily',time_of_day:'morning',category:'spirituel',icon:'📖'},
      {name:'Sport',type:'habit',frequency:'custom',frequency_days:[1,2,3,4,5],time_of_day:'afternoon',category:'sport',icon:'⚡'},
      {name:'Certification (min)',type:'measure',frequency:'daily',target_count:45,unit:'min',time_of_day:'evening',category:'pro',icon:'◇'},
      {name:'Protéines (g)',type:'measure',frequency:'daily',target_count:165,unit:'g',time_of_day:'anytime',category:'nutrition',icon:'🍗'},
      {name:'Eau (L)',type:'measure',frequency:'daily',target_count:3,unit:'L',time_of_day:'anytime',category:'sante',icon:'💧'},
    ],
    milestones:[{day_number:15,label:'Mock exam #1'},{day_number:30,label:'Mi-parcours'},{day_number:60,label:'Mock exam #2'},{day_number:75,label:'Révision finale'},{day_number:90,label:'🏆 Certification'}]
  },
  { id:'spiritual', title:'Routine Spirituelle', description:'5 prières + Coran + adhkar.', duration_days:365, color:'#d4af37', icon:'☽',
    trackables:[
      {name:'Fajr',type:'habit',frequency:'daily',time_of_day:'morning',category:'spirituel',icon:'☽'},
      {name:'Dhuhr',type:'habit',frequency:'daily',time_of_day:'afternoon',category:'spirituel',icon:'☽'},
      {name:'Asr',type:'habit',frequency:'daily',time_of_day:'afternoon',category:'spirituel',icon:'☽'},
      {name:'Maghrib',type:'habit',frequency:'daily',time_of_day:'evening',category:'spirituel',icon:'☽'},
      {name:'Isha',type:'habit',frequency:'daily',time_of_day:'evening',category:'spirituel',icon:'☽'},
      {name:'Adhkar matin',type:'habit',frequency:'daily',time_of_day:'morning',category:'spirituel',icon:'🤲'},
      {name:'Adhkar soir',type:'habit',frequency:'daily',time_of_day:'evening',category:'spirituel',icon:'🤲'},
      {name:'Coran (min)',type:'measure',frequency:'daily',target_count:15,unit:'min',time_of_day:'anytime',category:'spirituel',icon:'📖'},
    ],
    milestones:[{day_number:30,label:'Un mois'},{day_number:90,label:'3 mois'},{day_number:180,label:'6 mois'},{day_number:365,label:'🏆 Un an'}]
  },
  { id:'fitness30', title:'Remise en forme 30J', description:'Sport, nutrition, hydratation.', duration_days:30, color:'#6b9de8', icon:'⚡',
    trackables:[
      {name:'Sport',type:'habit',frequency:'custom',frequency_days:[1,2,4,5],time_of_day:'afternoon',category:'sport',icon:'⚡'},
      {name:'Protéines (g)',type:'measure',frequency:'daily',target_count:150,unit:'g',time_of_day:'anytime',category:'nutrition',icon:'🍗'},
      {name:'Eau (L)',type:'measure',frequency:'daily',target_count:2.5,unit:'L',time_of_day:'anytime',category:'sante',icon:'💧'},
      {name:'Coucher avant 23h30',type:'habit',frequency:'daily',time_of_day:'evening',category:'sante',icon:'😴'},
    ],
    milestones:[{day_number:7,label:'Semaine 1'},{day_number:15,label:'Mi-parcours'},{day_number:30,label:'🏆 Objectif atteint'}]
  },
  { id:'deepwork21', title:'Deep Work 21J', description:'Focus, concentration, revue du soir.', duration_days:21, color:'#a29bfe', icon:'🧠',
    trackables:[
      {name:'Sessions focus',type:'measure',frequency:'weekdays',target_count:3,unit:'sessions',time_of_day:'morning',category:'pro',icon:'🎯'},
      {name:'Objectif du jour',type:'habit',frequency:'daily',time_of_day:'morning',category:'mental',icon:'✍️'},
      {name:'Revue du soir',type:'habit',frequency:'daily',time_of_day:'evening',category:'mental',icon:'📔'},
    ],
    milestones:[{day_number:7,label:'Semaine 1'},{day_number:14,label:'Semaine 2'},{day_number:21,label:'🏆 Habitude ancrée'}]
  },
]

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  {id:'home', label:'Accueil', icon:'◎'},
  {id:'todos', label:'To-dos', icon:'✓'},
  {id:'challenges', label:'Challenges', icon:'◇'},
  {id:'stats', label:'Stats', icon:'◈'},
  {id:'agenda', label:'Agenda', icon:'◻'},
]

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  )
}

function AppShell() {
  const store = useAppStore()
  const [tab, setTab] = useState('home')
  const [day, setDay] = useState(TODAY)
  const [openCh, setOpenCh] = useState(null)
  const str = streak(store.trackables, store.logs)
  const tp = dayScore(store.trackables, store.logs, TODAY).pct
  const pending = (store.todos||[]).filter(t=>!t.done&&t.due_date&&t.due_date<=TODAY).length

  function goC(id) { setOpenCh(id); setTab('challenges') }
  function goT() { setTab('todos') }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:T.bg, color:T.text, fontFamily:"'Lato','Helvetica Neue',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Lato:wght@400;700;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0} button{cursor:pointer} button:hover{filter:brightness(1.15)} input:focus,select:focus,textarea:focus{outline:none;border-color:#d4af3766!important} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#2a2a3e;border-radius:2px} @media(max-width:768px){.sb{display:none!important}.mnav{display:flex!important}.mbar{display:block!important}}`}</style>

      {/* Sidebar */}
      <nav className="sb" style={{ width:220, background:T.surface, borderRight:`1px solid ${T.border}`, display:'flex', flexDirection:'column', padding:'24px 16px', gap:14, position:'sticky', top:0, height:'100vh', overflowY:'auto', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, paddingBottom:14, borderBottom:`1px solid ${T.border}` }}>
          <span style={{ fontSize:26, color:T.gold }}>◈</span>
          <div>
            <div style={{ fontSize:15, fontWeight:900, color:'#fff', fontFamily:T.serif, letterSpacing:1 }}>Momentum</div>
            <div style={{ fontSize:10, color:T.dim, textTransform:'uppercase', letterSpacing:2 }}>Organisation</div>
          </div>
        </div>
        <div style={{ background:'linear-gradient(135deg,rgba(255,107,53,.15),rgba(212,175,55,.1))', border:'1px solid rgba(255,107,53,.3)', borderRadius:10, padding:'10px 14px', textAlign:'center' }}>
          <div style={{ fontSize:30, fontWeight:900, color:'#ff6b35', fontFamily:T.serif }}>{str}</div>
          <div style={{ fontSize:10, color:T.dim, textTransform:'uppercase', letterSpacing:1 }}>jours de suite</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:3, flex:1 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); if(t.id==='challenges') setOpenCh(null) }}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, border:'none', background:tab===t.id?T.gold+'22':'transparent', color:tab===t.id?T.gold:T.dim, fontSize:13, fontWeight:tab===t.id?700:400, textAlign:'left' }}>
              <span style={{ width:18, textAlign:'center' }}>{t.icon}</span>
              <span style={{ flex:1 }}>{t.label}</span>
              {t.id==='todos'&&pending>0&&<span style={{ fontSize:10, fontWeight:900, color:'#080810', background:'#ff6b6b', borderRadius:10, padding:'1px 6px' }}>{pending}</span>}
            </button>
          ))}
        </div>
        <div style={{ paddingTop:12, borderTop:`1px solid ${T.border}`, fontSize:11, color:T.dim }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}><span>{fmtDate(TODAY)}</span><span style={{ color:T.gold }}>{tp}%</span></div>
          <Bar pct={tp} />
        </div>
      </nav>

      {/* Main */}
      <main style={{ flex:1, display:'flex', flexDirection:'column', minHeight:'100vh' }}>
        <header style={{ padding:'16px 24px', borderBottom:`1px solid ${T.border}` }}>
          <div style={{ fontSize:18, fontWeight:900, color:'#fff', fontFamily:T.serif }}>{TABS.find(t=>t.id===tab)?.label}{tab==='challenges'&&openCh?' · Détail':''}</div>
          <div style={{ fontSize:12, color:T.dim, marginTop:2 }}>{fmtDate(TODAY)}</div>
        </header>
        <div className="mbar" style={{ display:'none', padding:'8px 16px', borderBottom:`1px solid ${T.border}`, fontSize:12, color:T.dim, textAlign:'center' }}>
          🔥 {str} jours · {tp}% aujourd'hui{pending>0&&` · ${pending} tâche${pending>1?'s':''} en attente`}
        </div>
        <div style={{ padding:'20px 24px', flex:1, overflowY:'auto', paddingBottom:80 }}>
          {!store.loaded && <div style={{ textAlign:'center', padding:40, color:T.dim }}>Synchronisation…</div>}
          {tab==='home' && <HomeView store={store} day={day} setDay={setDay} goC={goC} goT={goT} />}
          {tab==='todos' && <TodosView store={store} />}
          {tab==='challenges' && (openCh ? <ChalView store={store} id={openCh} onBack={()=>setOpenCh(null)}/> : <ChalsView store={store} goC={goC}/>)}
          {tab==='stats' && <StatsView store={store} goC={goC}/>}
          {tab==='agenda' && <AgendaView store={store}/>}
        </div>
        <nav className="mnav" style={{ display:'none', position:'fixed', bottom:0, left:0, right:0, background:T.surface, borderTop:`1px solid ${T.border}`, zIndex:50 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); if(t.id==='challenges') setOpenCh(null) }}
              style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'8px 4px', background:'transparent', border:'none', color:tab===t.id?T.gold:T.faint, position:'relative' }}>
              <span style={{ fontSize:18 }}>{t.icon}</span>
              <span style={{ fontSize:9, fontWeight:tab===t.id?700:400 }}>{t.label}</span>
              {t.id==='todos'&&pending>0&&<span style={{ position:'absolute', top:4, right:'15%', fontSize:8, fontWeight:900, color:'#080810', background:'#ff6b6b', borderRadius:8, padding:'0 4px' }}>{pending}</span>}
            </button>
          ))}
        </nav>
      </main>
    </div>
  )
}

// ─── HOME VIEW ────────────────────────────────────────────────────────────────
function HomeView({ store, day, setDay, goC, goT }) {
  const { challenges, trackables, logs, events, todos, setLog, clearLog } = store
  const active = challenges.filter(c=>c.status==='active')
  const score = dayScore(trackables, logs, day)
  const str = streak(trackables, logs)
  const due = trackables.filter(t=>!t.archived&&isDue(t,day))
  const dayEvts = events.filter(e=>e.date===day)
  const todayTds = todos.filter(t=>!t.done&&t.due_date===day)
  const ovTds = todos.filter(t=>!t.done&&t.due_date&&t.due_date<TODAY)
  const grp = {morning:[],afternoon:[],evening:[],anytime:[]}
  due.forEach(t => { (grp[t.time_of_day]||grp.anytime).push(t) })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Nav jour */}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <button onClick={()=>setDay(addDays(day,-1))} style={{ padding:'6px 12px', borderRadius:8, border:`1px solid ${T.border}`, background:T.surface, color:T.dim, fontSize:18 }}>‹</button>
        <div style={{ flex:1, textAlign:'center', fontSize:14, fontWeight:700, color:'#fff' }}>{fmtLong(day)}</div>
        {day!==TODAY && <button onClick={()=>setDay(TODAY)} style={{ padding:'5px 10px', borderRadius:8, border:`1px solid ${T.gold}44`, background:T.gold+'11', color:T.gold, fontSize:11, fontWeight:700 }}>Aujourd'hui</button>}
        <button onClick={()=>setDay(addDays(day,1))} style={{ padding:'6px 12px', borderRadius:8, border:`1px solid ${T.border}`, background:T.surface, color:T.dim, fontSize:18 }}>›</button>
      </div>

      {/* Score + Streak */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Card style={{ display:'flex', alignItems:'center', gap:14 }}>
          <Ring pct={score.pct}>{score.pct}%</Ring>
          <div>
            <div style={{ fontSize:11, color:T.dim }}>Score du jour</div>
            <div style={{ fontSize:20, fontWeight:900, color:'#fff', fontFamily:T.serif }}>{score.done}/{score.total}</div>
          </div>
        </Card>
        <Card style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ fontSize:36 }}>🔥</div>
          <div>
            <div style={{ fontSize:11, color:T.dim }}>Streak</div>
            <div style={{ fontSize:20, fontWeight:900, color:'#ff6b35', fontFamily:T.serif }}>{str}j</div>
          </div>
        </Card>
      </div>

      {/* Challenges actifs */}
      {active.length > 0 && (
        <Card>
          <Title right={<button onClick={()=>goC(null)} style={{ background:'none', border:'none', color:T.gold, fontSize:11 }}>Voir tout →</button>}>Challenges en cours</Title>
          {active.map(c => {
            const chT = trackables.filter(t=>t.challenge_id===c.id)
            const s = chalScore(chT, logs), d = chalDay(c), p = chalProg(c)
            return (
              <div key={c.id} onClick={()=>goC(c.id)} style={{ cursor:'pointer', padding:'10px 12px', background:T.bg, borderRadius:10, borderLeft:`3px solid ${c.color}`, marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:13, color:T.text, fontWeight:600 }}>{c.icon} {c.title}</span>
                  <span style={{ fontSize:13, color:c.color, fontWeight:700 }}>{s}%</span>
                </div>
                <Bar pct={p} color={c.color} h={4} />
                <div style={{ fontSize:10, color:T.faint, marginTop:3 }}>Jour {Math.min(d,c.duration_days)}/{c.duration_days}</div>
              </div>
            )
          })}
        </Card>
      )}
      {!active.length && (
        <Card><div style={{ textAlign:'center', padding:'20px 0', color:T.faint }}>
          <div style={{ fontSize:28, marginBottom:8 }}>◇</div>
          Aucun challenge actif. <button onClick={()=>goC(null)} style={{ background:'none', border:'none', color:T.gold, cursor:'pointer' }}>Créer →</button>
        </div></Card>
      )}

      {/* To-dos */}
      <Card>
        <Title right={<button onClick={goT} style={{ background:'none', border:'none', color:T.gold, fontSize:11 }}>Gérer →</button>}>✓ To-dos {day===TODAY?"d'aujourd'hui":`du ${fmtDate(day)}`}</Title>
        {ovTds.length>0 && <div style={{ marginBottom:8, padding:'5px 10px', background:'#ff6b6b11', borderRadius:8, border:'1px solid #ff6b6b33', fontSize:11, color:'#ff6b6b', fontWeight:700 }}>⚠ {ovTds.length} en retard</div>}
        {!todayTds.length&&!ovTds.length && <div style={{ textAlign:'center', padding:'12px 0', color:T.faint, fontSize:13 }}>Rien · <button onClick={goT} style={{ background:'none', border:'none', color:T.gold, cursor:'pointer', fontSize:13 }}>ajouter</button></div>}
        {[...ovTds,...todayTds].map(t => (
          <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', background:T.bg, borderRadius:8, border:`1px solid ${T.border}`, marginBottom:6 }}>
            <button onClick={()=>store.toggleTodo(t.id)} style={{ width:20, height:20, borderRadius:5, border:`2px solid ${t.priority==='high'?'#ff6b6b':T.gold}`, background:'transparent', flexShrink:0 }}/>
            <span style={{ flex:1, fontSize:13, color:T.text }}>{t.title}</span>
            {t.due_date&&t.due_date<TODAY&&<span style={{ fontSize:10, color:'#ff6b6b', fontWeight:700 }}>Retard</span>}
          </div>
        ))}
      </Card>

      {/* Graphe catégories */}
      <CatChart trackables={trackables} logs={logs} />

      {/* RDV */}
      {dayEvts.length>0 && (
        <Card>
          <Title>Rendez-vous</Title>
          {dayEvts.map(e => (
            <div key={e.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:EVT_COLORS[e.type]||'#888', flexShrink:0 }}/>
              <span style={{ flex:1, fontSize:13 }}>{e.title}</span>
              {e.time&&<span style={{ fontSize:12, color:T.dim }}>{e.time}</span>}
            </div>
          ))}
        </Card>
      )}

      {/* Habitudes par moment */}
      {Object.entries(grp).map(([slot, list]) => !list.length ? null : (
        <Card key={slot}>
          <Title>{TOD[slot]?.icon} {TOD[slot]?.label}</Title>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {list.map(t => <TrackRow key={t.id} t={t} log={getLog(logs,t.id,day)} date={day} setLog={setLog} clearLog={clearLog}/>)}
          </div>
        </Card>
      ))}
    </div>
  )
}

function CatChart({ trackables, logs }) {
  const [win, setWin] = useState(30)
  const cats = {}
  ;(trackables||[]).filter(t=>!t.archived).forEach(t => {
    const cat = t.category||'autre'
    if (!cats[cat]) cats[cat] = {due:0, done:0}
    for (let i=0;i<win;i++) {
      const d=addDays(TODAY,-i)
      if (!isDue(t,d)) continue
      cats[cat].due++
      const l=getLog(logs,t.id,d)
      if (t.type==='measure') cats[cat].done+=ratio(t,l); else if (isComplete(t,l)) cats[cat].done++
    }
  })
  const entries = Object.entries(cats).filter(([,v])=>v.due>0).map(([cat,v])=>({cat,pct:Math.round(v.done/v.due*100)})).sort((a,b)=>b.pct-a.pct)

  return (
    <Card>
      <Title right={<div style={{display:'flex',gap:5}}>{[7,30,90].map(w=><button key={w} onClick={()=>setWin(w)} style={{padding:'3px 9px',borderRadius:12,border:`1px solid ${win===w?T.gold:T.border}`,background:win===w?T.gold+'22':'transparent',color:win===w?T.gold:T.dim,fontSize:11,fontWeight:win===w?700:400}}>{w}j</button>)}</div>}>
        Répartition · {win} jours
      </Title>
      {!entries.length && <div style={{ color:T.faint, fontSize:13, textAlign:'center', padding:'12px 0' }}>Lance un challenge pour voir tes stats ici.</div>}
      <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:4 }}>
        {entries.map(({cat,pct}) => {
          const info = CATS[cat]||CATS.autre
          return (
            <div key={cat}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:5 }}>
                <span style={{ fontSize:13, color:T.text }}>{info.icon} {info.label}</span>
                <span style={{ fontSize:15, fontWeight:900, color:info.color, fontFamily:T.serif }}>{pct}%</span>
              </div>
              <Bar pct={pct} color={info.color} h={8} />
              <div style={{ display:'flex', gap:3, marginTop:4 }}>
                {Array.from({length:7},(_,i) => {
                  const d=addDays(TODAY,-6+i)
                  const tl=(trackables||[]).filter(t=>!t.archived&&(t.category||'autre')===cat&&isDue(t,d))
                  if (!tl.length) return <div key={d} style={{flex:1,height:4,borderRadius:2,background:T.border}}/>
                  let dn=0; tl.forEach(t=>{const l=getLog(logs,t.id,d);if(t.type==='measure')dn+=ratio(t,l);else if(isComplete(t,l))dn++})
                  return <div key={d} style={{flex:1,height:4,borderRadius:2,background:info.color,opacity:Math.max(.1,dn/tl.length),border:d===TODAY?`1px solid ${info.color}`:'none'}}/>
                })}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function TrackRow({ t, log, date, setLog, clearLog }) {
  const cat = CATS[t.category]||CATS.autre
  const color = t.color||cat.color
  if (t.type === 'measure') {
    const val = log ? Number(log.value) : 0
    const pct = Math.round(ratio(t,log)*100)
    return (
      <div style={{ padding:'10px 12px', background:T.bg, borderRadius:8, border:`1px solid ${pct>=100?color+'66':T.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <span>{t.icon}</span><span style={{ flex:1, fontSize:13 }}>{t.name}</span>
          <span style={{ fontSize:12, color:pct>=100?color:T.dim, fontWeight:700 }}>{val}/{t.target_count} {t.unit}</span>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input type="number" value={log?.value??''} onChange={e=>setLog(t.id,date,{value:Number(e.target.value),done:Number(e.target.value)>=t.target_count})} placeholder="0" style={{ width:90, background:T.bg, border:`1px solid ${T.border2}`, borderRadius:6, padding:'7px 10px', color:T.text, fontSize:13 }}/>
          <div style={{ flex:1 }}><Bar pct={pct} color={color} h={6}/></div>
        </div>
      </div>
    )
  }
  const done = isComplete(t, log)
  return (
    <button onClick={()=>done?clearLog(t.id,date):setLog(t.id,date,{value:1,done:true})}
      style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 12px', background:done?color+'11':T.bg, border:`1px solid ${done?color+'55':T.border}`, borderRadius:8, cursor:'pointer', textAlign:'left', transition:'all .15s' }}>
      <span>{t.icon}</span><span style={{ flex:1, fontSize:13, color:done?T.text:T.dim }}>{t.name}</span>
      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:color+'22', color, fontWeight:700 }}>{cat.label}</span>
      <div style={{ width:22, height:22, borderRadius:6, border:`2px solid ${done?color:T.border2}`, background:done?color:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        {done&&<span style={{ color:'#080810', fontSize:12, fontWeight:900 }}>✓</span>}
      </div>
    </button>
  )
}

// ─── TODOS VIEW ───────────────────────────────────────────────────────────────
function TodosView({ store }) {
  const { todos, addTodo, toggleTodo, editTodo, removeTodo } = store
  const [form, setForm] = useState({title:'',priority:'medium',category:'pro',due_date:'',notes:''})
  const [showAdv, setShowAdv] = useState(false)
  const [editId, setEditId] = useState(null)
  const [filter, setFilter] = useState('active')
  const [quick, setQuick] = useState('')
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  async function quickAdd(e) { if(e.key!=='Enter'||!quick.trim()) return; await addTodo({title:quick.trim(),priority:'medium',category:'autre',due_date:TODAY}); setQuick('') }

  async function submit() {
    if (!form.title.trim()) return
    if (editId) { await editTodo(editId, form); setEditId(null) } else await addTodo(form)
    setForm({title:'',priority:'medium',category:'pro',due_date:'',notes:''}); setShowAdv(false)
  }

  function startEdit(t) { setEditId(t.id); setForm({title:t.title,priority:t.priority,category:t.category,due_date:t.due_date||'',notes:t.notes||''}); setShowAdv(true) }

  const filtered = (todos||[])
    .filter(t => filter==='all'?true:filter==='done'?t.done:!t.done)
    .sort((a,b) => { if(a.done!==b.done)return a.done?1:-1; const pa=PRI[a.priority]?.o??1,pb=PRI[b.priority]?.o??1; return pa!==pb?pa-pb:(a.due_date||'9999')<(b.due_date||'9999')?-1:1 })

  const pending=(todos||[]).filter(t=>!t.done).length, dueT=(todos||[]).filter(t=>!t.done&&t.due_date===TODAY).length, ov=(todos||[]).filter(t=>!t.done&&t.due_date&&t.due_date<TODAY).length

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
        {[{l:'À faire',v:pending,c:T.gold},{l:"Auj.",v:dueT,c:'#6b9de8'},{l:'Retard',v:ov,c:ov?'#ff6b6b':T.faint}].map(s=>(
          <div key={s.l} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'12px', textAlign:'center' }}>
            <div style={{ fontSize:24, fontWeight:900, color:s.c, fontFamily:T.serif }}>{s.v}</div>
            <div style={{ fontSize:11, color:T.dim }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Saisie rapide */}
      <Card>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <span style={{ fontSize:18, color:T.dim }}>+</span>
          <input value={quick} onChange={e=>setQuick(e.target.value)} onKeyDown={quickAdd} placeholder="Tâche rapide… (Entrée)" style={{ flex:1, background:'transparent', border:'none', outline:'none', color:T.text, fontSize:14, padding:'4px 0' }}/>
        </div>
      </Card>

      {/* Formulaire */}
      <Card>
        <div style={{ display:'flex', gap:10, alignItems:'flex-end', marginBottom:showAdv?12:0 }}>
          <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Titre de la tâche…" style={{ flex:1, background:T.bg, border:`1px solid ${T.border2}`, borderRadius:6, padding:'9px 12px', color:T.text, fontSize:13 }}/>
          <select value={form.priority} onChange={e=>set('priority',e.target.value)} style={{ background:T.bg, border:`1px solid ${T.border2}`, borderRadius:6, padding:'9px 12px', color:T.text, fontSize:13 }}>
            {Object.entries(PRI).map(([v,o])=><option key={v} value={v}>{o.label}</option>)}
          </select>
          <Btn primary onClick={submit} disabled={!form.title.trim()}>{editId?'Modifier':'Ajouter'}</Btn>
          {editId&&<Btn onClick={()=>{setEditId(null);setForm({title:'',priority:'medium',category:'pro',due_date:'',notes:''})}}>Annuler</Btn>}
          <button onClick={()=>setShowAdv(!showAdv)} style={{ background:'transparent', border:'none', color:T.dim, fontSize:11, padding:'4px' }}>{showAdv?'▲':'▼'}</button>
        </div>
        {showAdv && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            <div><div style={{ fontSize:11, color:T.dim, marginBottom:4 }}>CATÉGORIE</div><select value={form.category} onChange={e=>set('category',e.target.value)} style={{ width:'100%', background:T.bg, border:`1px solid ${T.border2}`, borderRadius:6, padding:'8px 10px', color:T.text, fontSize:13 }}>{Object.entries(CATS).map(([v,o])=><option key={v} value={v}>{o.label}</option>)}</select></div>
            <div><div style={{ fontSize:11, color:T.dim, marginBottom:4 }}>ÉCHÉANCE</div><input type="date" value={form.due_date} onChange={e=>set('due_date',e.target.value)} style={{ width:'100%', background:T.bg, border:`1px solid ${T.border2}`, borderRadius:6, padding:'8px 10px', color:T.text, fontSize:13 }}/></div>
            <div><div style={{ fontSize:11, color:T.dim, marginBottom:4 }}>NOTES</div><input value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Contexte…" style={{ width:'100%', background:T.bg, border:`1px solid ${T.border2}`, borderRadius:6, padding:'8px 10px', color:T.text, fontSize:13 }}/></div>
          </div>
        )}
      </Card>

      <div style={{ display:'flex', gap:8 }}>
        {[['active','À faire'],['done','Terminées'],['all','Tout']].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{ padding:'6px 14px', borderRadius:20, border:`1px solid ${filter===v?T.gold:T.border}`, background:filter===v?T.gold+'22':'transparent', color:filter===v?T.gold:T.dim, fontSize:12, fontWeight:filter===v?700:400 }}>{l}</button>
        ))}
        <span style={{ marginLeft:'auto', fontSize:12, color:T.faint, alignSelf:'center' }}>{filtered.length} tâche{filtered.length>1?'s':''}</span>
      </div>

      {!filtered.length && <Card><div style={{ textAlign:'center', padding:'20px 0', color:T.faint, fontSize:13 }}>{filter==='done'?'Aucune terminée.':'Aucune tâche !'}</div></Card>}
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {filtered.map(t => {
          const prio=PRI[t.priority]||PRI.medium, cat=CATS[t.category]||CATS.autre
          const isOv=!t.done&&t.due_date&&t.due_date<TODAY, isDT=!t.done&&t.due_date===TODAY
          return (
            <div key={t.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10, background:t.done?T.bg:T.surface, border:`1px solid ${isOv?'#ff6b6b44':isDT?T.gold+'44':T.border}`, opacity:t.done?.55:1 }}>
              <button onClick={()=>toggleTodo(t.id)} style={{ width:22, height:22, borderRadius:6, border:`2px solid ${t.done?'#7eb8a4':prio.color}`, background:t.done?'#7eb8a4':'transparent', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {t.done&&<span style={{ color:'#080810', fontSize:12, fontWeight:900 }}>✓</span>}
              </button>
              <span style={{ fontSize:10, color:prio.color }}>{prio.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, color:t.done?T.faint:T.text, textDecoration:t.done?'line-through':'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</div>
                {t.due_date && <div style={{ fontSize:11, color:isOv?'#ff6b6b':isDT?T.gold:T.faint, fontWeight:isOv||isDT?700:400, marginTop:2 }}>{isOv?'⚠ ':isDT?'⏰ ':''}{fmtDate(t.due_date)}</div>}
              </div>
              <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:cat.color+'22', color:cat.color }}>{cat.label}</span>
              <button onClick={()=>startEdit(t)} style={{ background:'transparent', border:'none', color:T.faint, padding:'2px 4px', fontSize:13 }}>✏</button>
              <button onClick={()=>removeTodo(t.id)} style={{ background:'transparent', border:'none', color:T.faint, padding:'2px 4px', fontSize:13 }}>×</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── CHALLENGES LIST ──────────────────────────────────────────────────────────
function ChalsView({ store, goC }) {
  const [creating, setCreating] = useState(false)
  const { challenges, trackables, logs } = store
  const active = challenges.filter(c=>c.status==='active')
  const others = challenges.filter(c=>c.status!=='active')

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:13, color:T.dim }}>{active.length} actif{active.length>1?'s':''}</span>
        <Btn primary onClick={()=>setCreating(true)}>+ Nouveau challenge</Btn>
      </div>
      {!challenges.length && <Card><div style={{ textAlign:'center', padding:'24px 0', color:T.faint }}>
        <div style={{ fontSize:28, marginBottom:8 }}>◇</div>Aucun challenge. Crée ton premier !
      </div></Card>}
      {active.map(c => {
        const chT=trackables.filter(t=>t.challenge_id===c.id)
        const s=chalScore(chT,logs), d=chalDay(c), p=chalProg(c)
        return (
          <Card key={c.id} onClick={()=>goC(c.id)} style={{ cursor:'pointer', borderLeft:`3px solid ${c.color}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <span style={{ fontSize:26 }}>{c.icon}</span>
                <div>
                  <div style={{ fontSize:16, fontWeight:700, color:'#fff' }}>{c.title}</div>
                  <div style={{ fontSize:12, color:T.dim }}>Jour {Math.min(d,c.duration_days)}/{c.duration_days} · {chT.length} objectifs</div>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:20, fontWeight:900, color:c.color, fontFamily:T.serif }}>{s}%</div>
                <div style={{ fontSize:10, color:T.faint }}>30j</div>
              </div>
            </div>
            <Bar pct={p} color={c.color} />
          </Card>
        )
      })}
      {others.length>0 && others.map(c => (
        <Card key={c.id} onClick={()=>goC(c.id)} style={{ cursor:'pointer', opacity:.6 }}>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <span style={{ fontSize:20 }}>{c.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:600 }}>{c.title}</div>
              <div style={{ fontSize:11, color:T.dim }}>{c.duration_days}j · {c.status}</div>
            </div>
          </div>
        </Card>
      ))}
      {creating && <CreateModal store={store} onClose={()=>setCreating(false)} onDone={id=>{setCreating(false);goC(id)}}/>}
    </div>
  )
}

// ─── CREATE CHALLENGE MODAL ───────────────────────────────────────────────────
function CreateModal({ store, onClose, onDone }) {
  const [step, setStep] = useState('tpl')
  const [tpl, setTpl] = useState(null)
  const [title, setTitle] = useState('')
  const [start, setStart] = useState(TODAY)
  const [dur, setDur] = useState(30)
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [newItem, setNewItem] = useState({name:'',type:'habit',category:'autre',frequency:'daily',time_of_day:'anytime',target_count:'',unit:''})

  function pickTpl(t) { setTpl(t); setTitle(t.title); setDur(t.duration_days); setItems(t.trackables.map(x=>({...x}))); setStep('config') }

  function addItem() {
    if (!newItem.name.trim()) return
    const it = {...newItem, icon:CATS[newItem.category]?.icon||'●', color:CATS[newItem.category]?.color||'#888'}
    if (it.type==='measure') { it.target_count=Number(newItem.target_count)||1 } else { delete it.target_count; delete it.unit }
    setItems(p=>[...p,it]); setNewItem({name:'',type:'habit',category:'autre',frequency:'daily',time_of_day:'anytime',target_count:'',unit:''}); setAddOpen(false)
  }

  async function submit() {
    if (!title||!items.length) return
    setBusy(true)
    const ch = await store.addChallenge({ title, start_date:start, duration_days:Number(dur), status:'active', color:tpl?.color||T.gold, icon:tpl?.icon||'◈', template_source:tpl?.id||null, description:tpl?.description||null }, items, tpl?.milestones||[])
    setBusy(false)
    if (ch) onDone(ch.id)
  }

  const ovStyle = { position:'fixed', inset:0, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:16 }
  const boxStyle = { background:T.surface, border:`1px solid ${T.border2}`, borderRadius:14, padding:24, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto' }

  return (
    <div onClick={onClose} style={ovStyle}>
      <div onClick={e=>e.stopPropagation()} style={boxStyle}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <span style={{ fontSize:18, fontWeight:900, color:'#fff', fontFamily:T.serif }}>Nouveau challenge</span>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:T.dim, fontSize:22 }}>×</button>
        </div>

        {step==='tpl' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:13, color:T.dim, marginBottom:4 }}>Choisis un modèle…</div>
            {TEMPLATES.map(t => (
              <div key={t.id} onClick={()=>pickTpl(t)} style={{ cursor:'pointer', padding:'14px 16px', background:T.bg, borderRadius:10, borderLeft:`3px solid ${t.color}` }}>
                <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                  <span style={{ fontSize:22 }}>{t.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, color:'#fff' }}>{t.title}</div>
                    <div style={{ fontSize:11, color:T.dim, marginTop:2 }}>{t.description}</div>
                    <div style={{ fontSize:10, color:T.faint, marginTop:2 }}>{t.duration_days}j · {t.trackables.length} objectifs</div>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={()=>{setTpl(null);setItems([]);setStep('config')}} style={{ padding:'10px', borderRadius:8, border:`1px solid ${T.border}`, background:'transparent', color:T.dim, cursor:'pointer' }}>… créer de zéro</button>
          </div>
        )}

        {step==='config' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <div style={{ fontSize:11, color:T.dim, marginBottom:4 }}>NOM</div>
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Mon défi…" style={{ width:'100%', background:T.bg, border:`1px solid ${T.border2}`, borderRadius:6, padding:'9px 12px', color:T.text, fontSize:13 }}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div><div style={{ fontSize:11, color:T.dim, marginBottom:4 }}>DÉBUT</div><input type="date" value={start} onChange={e=>setStart(e.target.value)} style={{ width:'100%', background:T.bg, border:`1px solid ${T.border2}`, borderRadius:6, padding:'9px 12px', color:T.text, fontSize:13 }}/></div>
              <div><div style={{ fontSize:11, color:T.dim, marginBottom:4 }}>DURÉE</div>
                <select value={dur} onChange={e=>setDur(e.target.value)} style={{ width:'100%', background:T.bg, border:`1px solid ${T.border2}`, borderRadius:6, padding:'9px 12px', color:T.text, fontSize:13 }}>
                  {[7,14,21,30,60,90,180,365].map(d=><option key={d} value={d}>{d} jours</option>)}
                </select>
              </div>
            </div>

            <div>
              <div style={{ fontSize:11, color:T.dim, marginBottom:8 }}>OBJECTIFS ({items.length})</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:200, overflowY:'auto', marginBottom:8 }}>
                {items.map((it,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:T.bg, borderRadius:8, border:`1px solid ${T.border}` }}>
                    <span>{it.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:T.text }}>{it.name}</div>
                      <div style={{ fontSize:10, color:T.faint }}>{it.type}{it.type==='measure'?` · ${it.target_count} ${it.unit}`:''} · {it.frequency}</div>
                    </div>
                    <button onClick={()=>setItems(items.filter((_,j)=>j!==i))} style={{ background:'transparent', border:'none', color:T.faint, fontSize:16 }}>×</button>
                  </div>
                ))}
              </div>
              {!addOpen && <button onClick={()=>setAddOpen(true)} style={{ width:'100%', padding:'9px', borderRadius:8, border:`1px solid ${T.border}`, background:'transparent', color:T.dim, cursor:'pointer' }}>+ Ajouter un objectif</button>}
              {addOpen && (
                <div style={{ background:T.bg, borderRadius:8, border:`1px solid ${T.border2}`, padding:12 }}>
                  <div style={{ marginBottom:8 }}><input value={newItem.name} onChange={e=>setNewItem(p=>({...p,name:e.target.value}))} placeholder="Nom de l'objectif…" style={{ width:'100%', background:T.bg, border:`1px solid ${T.border2}`, borderRadius:6, padding:'8px 10px', color:T.text, fontSize:13 }}/></div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                    <select value={newItem.type} onChange={e=>setNewItem(p=>({...p,type:e.target.value}))} style={{ background:T.bg, border:`1px solid ${T.border2}`, borderRadius:6, padding:'8px', color:T.text, fontSize:12 }}>
                      <option value="habit">Habitude</option><option value="measure">Mesure</option><option value="task">Tâche</option>
                    </select>
                    <select value={newItem.category} onChange={e=>setNewItem(p=>({...p,category:e.target.value}))} style={{ background:T.bg, border:`1px solid ${T.border2}`, borderRadius:6, padding:'8px', color:T.text, fontSize:12 }}>
                      {Object.entries(CATS).map(([v,o])=><option key={v} value={v}>{o.label}</option>)}
                    </select>
                    <select value={newItem.frequency} onChange={e=>setNewItem(p=>({...p,frequency:e.target.value}))} style={{ background:T.bg, border:`1px solid ${T.border2}`, borderRadius:6, padding:'8px', color:T.text, fontSize:12 }}>
                      <option value="daily">Tous les jours</option><option value="weekdays">En semaine</option><option value="weekends">Week-end</option>
                    </select>
                    <select value={newItem.time_of_day} onChange={e=>setNewItem(p=>({...p,time_of_day:e.target.value}))} style={{ background:T.bg, border:`1px solid ${T.border2}`, borderRadius:6, padding:'8px', color:T.text, fontSize:12 }}>
                      {Object.entries(TOD).map(([v,o])=><option key={v} value={v}>{o.label}</option>)}
                    </select>
                  </div>
                  {newItem.type==='measure' && (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                      <input type="number" value={newItem.target_count} onChange={e=>setNewItem(p=>({...p,target_count:e.target.value}))} placeholder="Objectif (ex: 165)" style={{ background:T.bg, border:`1px solid ${T.border2}`, borderRadius:6, padding:'8px', color:T.text, fontSize:12 }}/>
                      <input value={newItem.unit} onChange={e=>setNewItem(p=>({...p,unit:e.target.value}))} placeholder="Unité (g, min, L…)" style={{ background:T.bg, border:`1px solid ${T.border2}`, borderRadius:6, padding:'8px', color:T.text, fontSize:12 }}/>
                    </div>
                  )}
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={()=>setAddOpen(false)} style={{ background:'transparent', border:'none', color:T.dim, cursor:'pointer', fontSize:12 }}>Annuler</button>
                    <div style={{ flex:1 }}/>
                    <Btn primary onClick={addItem} disabled={!newItem.name.trim()}>Ajouter</Btn>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <Btn onClick={()=>setStep('tpl')}>‹ Retour</Btn>
              <div style={{ flex:1 }}/>
              <Btn primary onClick={submit} disabled={busy||!title||!items.length}>{busy?'Création…':'Créer le challenge'}</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── CHALLENGE DETAIL ─────────────────────────────────────────────────────────
function ChalView({ store, id, onBack }) {
  const { challenges, trackables, logs, milestones, editChallenge, removeChallenge } = store
  const [confirmDel, setConfirmDel] = useState(false)
  const c = challenges.find(x=>x.id===id)
  if (!c) return <div style={{ color:T.faint, textAlign:'center', padding:40 }}>Challenge introuvable.</div>

  const chT = trackables.filter(t=>t.challenge_id===id)
  const chM = milestones.filter(m=>m.challenge_id===id)
  const day = chalDay(c), prog = chalProg(c)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <Btn onClick={onBack}>‹ Challenges</Btn>
        <div style={{ flex:1 }}/>
        <Btn onClick={()=>editChallenge(id,{status:c.status==='active'?'completed':'active'})}>{c.status==='active'?'Marquer terminé':'Réactiver'}</Btn>
        <Btn onClick={()=>setConfirmDel(true)} style={{ color:'#ff6b6b', borderColor:'#ff6b6b' }}>Supprimer</Btn>
      </div>

      <Card style={{ borderLeft:`3px solid ${c.color}` }}>
        <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:12 }}>
          <span style={{ fontSize:32 }}>{c.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:20, fontWeight:900, color:'#fff', fontFamily:T.serif }}>{c.title}</div>
            <div style={{ fontSize:13, color:T.dim }}>Démarré le {fmtDate(c.start_date)} · Jour {Math.min(day,c.duration_days)}/{c.duration_days}</div>
          </div>
        </div>
        {c.description && <div style={{ fontSize:13, color:T.dim, marginBottom:12 }}>{c.description}</div>}
        <Bar pct={prog} color={c.color} h={6} />
        <div style={{ fontSize:11, color:T.faint, marginTop:5 }}>{prog}% écoulé · {Math.max(0,c.duration_days-day)}j restants</div>
      </Card>

      <Card>
        <Title>Objectifs · régularité 30j</Title>
        {chT.map(t => {
          const s = chalScore([t], logs, 30)
          const cat = CATS[t.category]||CATS.autre
          const color = t.color||cat.color
          return (
            <div key={t.id} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
                <span>{t.icon}</span><span style={{ flex:1, fontSize:13 }}>{t.name}</span>
                <span style={{ fontSize:13, color, fontWeight:700 }}>{s}%</span>
              </div>
              <Bar pct={s} color={color} />
              <div style={{ display:'flex', gap:3, marginTop:4 }}>
                {Array.from({length:30},(_,i) => {
                  const d=addDays(TODAY,-(29)+i)
                  const due=isDue(t,d), log=getLog(logs,t.id,d)
                  let op=0.12
                  if(due){if(t.type==='measure')op=0.12+ratio(t,log)*0.88;else if(isComplete(t,log))op=1;else op=0.18}
                  return <div key={d} style={{flex:1,height:12,borderRadius:2,background:due?color:T.border,opacity:due?op:0.3,border:d===TODAY?`1px solid ${color}`:'none'}}/>
                })}
              </div>
            </div>
          )
        })}
        {!chT.length && <div style={{ color:T.faint, fontSize:13 }}>Aucun objectif.</div>}
      </Card>

      {chM.length>0 && (
        <Card>
          <Title>Jalons</Title>
          {chM.map(m => {
            const reached = day>=m.day_number
            return (
              <div key={m.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom:`1px solid ${T.border}`, opacity:reached?1:.5 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:reached?c.color:T.border, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:reached?'#080810':T.faint, flexShrink:0 }}>{m.day_number}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{m.label}</div>
                  <div style={{ fontSize:11, color:T.faint }}>{fmtDate(addDays(c.start_date,m.day_number-1))}</div>
                </div>
                {reached?<span style={{ color:c.color }}>✓</span>:<span style={{ fontSize:11, color:T.faint }}>J-{m.day_number-day}</span>}
              </div>
            )
          })}
        </Card>
      )}

      {confirmDel && (
        <div onClick={()=>setConfirmDel(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:T.surface, border:`1px solid ${T.border2}`, borderRadius:14, padding:24, maxWidth:420, width:'90%' }}>
            <div style={{ fontSize:16, fontWeight:900, color:'#fff', marginBottom:12 }}>Supprimer ce challenge ?</div>
            <div style={{ fontSize:14, color:T.dim, marginBottom:20 }}>Supprimera « {c.title} » et tout l'historique. Irréversible.</div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <Btn onClick={()=>setConfirmDel(false)}>Annuler</Btn>
              <Btn primary color="#ff6b6b" onClick={()=>{removeChallenge(id);onBack()}}>Supprimer</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── STATS VIEW ───────────────────────────────────────────────────────────────
function StatsView({ store, goC }) {
  const { challenges, trackables, logs, events } = store
  const active = challenges.filter(c=>c.status==='active')
  const str = streak(trackables, logs)
  const ts = dayScore(trackables, logs, TODAY)
  const totalLogs = (logs||[]).filter(l=>l.done).length
  const upcoming = (events||[]).filter(e=>e.date>=TODAY).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4)
  const trend = Array.from({length:14},(_,i)=>{ const d=addDays(TODAY,-13+i); return {d,pct:dayScore(trackables,logs,d).pct} })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {[{icon:'🔥',v:str,l:'Streak',c:'#ff6b35'},{icon:'◇',v:active.length,l:'Challenges',c:T.gold},{icon:'✓',v:totalLogs,l:'Validations',c:'#7eb8a4'},{icon:'◎',v:`${ts.pct}%`,l:"Aujourd'hui",c:'#6b9de8'}].map(k=>(
          <div key={k.l} style={{ background:T.surface, border:`1px solid ${k.c}44`, borderRadius:12, padding:14, textAlign:'center' }}>
            <div style={{ fontSize:22 }}>{k.icon}</div>
            <div style={{ fontSize:26, fontWeight:900, color:k.c, fontFamily:T.serif }}>{k.v}</div>
            <div style={{ fontSize:11, color:T.dim, marginTop:2 }}>{k.l}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <Card>
          <Title>Tendance 14j</Title>
          <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:80, marginTop:8 }}>
            {trend.map(({d,pct})=>(
              <div key={d} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }} title={`${fmtDate(d)} · ${pct}%`}>
                <div style={{ width:'100%', height:66, display:'flex', alignItems:'flex-end' }}>
                  <div style={{ width:'100%', height:`${Math.max(4,pct)}%`, background:d===TODAY?T.gold:T.gold+'55', borderRadius:3 }}/>
                </div>
                <div style={{ fontSize:8, color:T.faint }}>{new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'narrow'})}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <Title>Score du jour</Title>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'8px 0' }}>
            <Ring pct={ts.pct} size={110}>{ts.pct}%</Ring>
          </div>
          <div style={{ textAlign:'center', fontSize:12, color:T.dim }}>{ts.done}/{ts.total} objectifs</div>
        </Card>
      </div>
      {active.length>0 && (
        <Card>
          <Title>Challenges actifs</Title>
          {active.map(c=>{
            const chT=trackables.filter(t=>t.challenge_id===c.id)
            const s=chalScore(chT,logs), d=chalDay(c)
            return (
              <div key={c.id} onClick={()=>goC(c.id)} style={{ cursor:'pointer', marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontSize:13 }}>{c.icon} {c.title}</span>
                  <span style={{ fontSize:12, color:c.color, fontWeight:700 }}>{s}%</span>
                </div>
                <Bar pct={s} color={c.color} h={5}/>
                <div style={{ fontSize:10, color:T.faint, marginTop:3 }}>Jour {Math.min(d,c.duration_days)}/{c.duration_days}</div>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}

// ─── AGENDA VIEW ──────────────────────────────────────────────────────────────
function AgendaView({ store }) {
  const { events, addEvent, removeEvent } = store
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({title:'',date:TODAY,time:'',type:'Pro',location:'',notes:''})
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  async function add() {
    if (!form.title||!form.date) return
    await addEvent({...form}); setForm({title:'',date:TODAY,time:'',type:'Pro',location:'',notes:''}); setOpen(false)
  }

  const sorted = (events||[]).sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||'')))
  const upcoming = sorted.filter(e=>e.date>=TODAY)
  const past = sorted.filter(e=>e.date<TODAY).reverse().slice(0,8)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', justifyContent:'flex-end' }}><Btn primary onClick={()=>setOpen(true)}>+ Nouveau RDV</Btn></div>
      <Card>
        <Title>À venir ({upcoming.length})</Title>
        {!upcoming.length && <div style={{ color:T.faint, fontSize:13, textAlign:'center', padding:'12px 0' }}>Aucun RDV à venir</div>}
        {upcoming.map(e=>(
          <div key={e.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:T.bg, borderRadius:8, border:`1px solid ${T.border}`, marginBottom:6 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:EVT_COLORS[e.type]||'#888', flexShrink:0 }}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:600 }}>{e.title}</div>
              <div style={{ fontSize:12, color:T.dim }}>{fmtDate(e.date)}{e.time?` · ${e.time}`:''}{e.location?` · ${e.location}`:''}</div>
            </div>
            <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:(EVT_COLORS[e.type]||'#888')+'22', color:EVT_COLORS[e.type]||'#888', fontWeight:700 }}>{e.type}</span>
            <button onClick={()=>removeEvent(e.id)} style={{ background:'transparent', border:'none', color:T.faint, fontSize:14 }}>×</button>
          </div>
        ))}
      </Card>
      {past.length>0 && (
        <Card>
          <Title>Passés récents</Title>
          {past.map(e=>(
            <div key={e.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:T.bg, borderRadius:8, opacity:.5, marginBottom:5 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:EVT_COLORS[e.type]||'#888', flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13 }}>{e.title}</div>
                <div style={{ fontSize:11, color:T.dim }}>{fmtDate(e.date)}{e.time?` · ${e.time}`:''}</div>
              </div>
            </div>
          ))}
        </Card>
      )}
      {open && (
        <div onClick={()=>setOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:16 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:T.surface, border:`1px solid ${T.border2}`, borderRadius:14, padding:24, width:'100%', maxWidth:460 }}>
            <div style={{ fontSize:18, fontWeight:900, color:'#fff', fontFamily:T.serif, marginBottom:16 }}>Nouveau rendez-vous</div>
            <div style={{ marginBottom:12 }}><div style={{ fontSize:11, color:T.dim, marginBottom:4 }}>TITRE</div><input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Ex: Kiné, Entretien…" style={{ width:'100%', background:T.bg, border:`1px solid ${T.border2}`, borderRadius:6, padding:'9px 12px', color:T.text, fontSize:13 }}/></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div><div style={{ fontSize:11, color:T.dim, marginBottom:4 }}>DATE</div><input type="date" value={form.date} onChange={e=>set('date',e.target.value)} style={{ width:'100%', background:T.bg, border:`1px solid ${T.border2}`, borderRadius:6, padding:'9px 12px', color:T.text, fontSize:13 }}/></div>
              <div><div style={{ fontSize:11, color:T.dim, marginBottom:4 }}>HEURE</div><input type="time" value={form.time} onChange={e=>set('time',e.target.value)} style={{ width:'100%', background:T.bg, border:`1px solid ${T.border2}`, borderRadius:6, padding:'9px 12px', color:T.text, fontSize:13 }}/></div>
              <div><div style={{ fontSize:11, color:T.dim, marginBottom:4 }}>TYPE</div><select value={form.type} onChange={e=>set('type',e.target.value)} style={{ width:'100%', background:T.bg, border:`1px solid ${T.border2}`, borderRadius:6, padding:'9px 12px', color:T.text, fontSize:13 }}>{Object.keys(EVT_COLORS).map(k=><option key={k}>{k}</option>)}</select></div>
              <div><div style={{ fontSize:11, color:T.dim, marginBottom:4 }}>LIEU</div><input value={form.location} onChange={e=>set('location',e.target.value)} placeholder="Adresse…" style={{ width:'100%', background:T.bg, border:`1px solid ${T.border2}`, borderRadius:6, padding:'9px 12px', color:T.text, fontSize:13 }}/></div>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <Btn onClick={()=>setOpen(false)}>Annuler</Btn>
              <Btn primary onClick={add} disabled={!form.title}>Ajouter</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
