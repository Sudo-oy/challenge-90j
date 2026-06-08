import { useState } from 'react'
import { Card, CardTitle, ProgressBar, ToggleButton, Input, Select, Textarea, Label, ApptTag } from './ui'
import {
  PRAYERS, TODAY, addDays, fmtDate, WORKOUT_PLAN, WORKOUT_EXERCISES, NUTRITION_GOALS,
  CERT_MILESTONES, APPT_COLORS, CHALLENGE_START, daysBetween
} from '../lib/constants'

// ─── SPORT ────────────────────────────────────────────────────────────────────
export function Sport({ selectedDay, workouts, setWorkouts, nutrition, setNutrition }) {
  const wod = workouts[selectedDay] || {}
  const nut = nutrition[selectedDay] || {}
  const dayOfWeek = new Date(selectedDay + 'T12:00:00').getDay()
  const workoutType = WORKOUT_PLAN[dayOfWeek]
  const exList = WORKOUT_EXERCISES[workoutType] || []
  const isRest = !WORKOUT_EXERCISES[workoutType]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <CardTitle>Séance du jour</CardTitle>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 18, color: '#d4af37', fontWeight: 700 }}>{workoutType}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{fmtDate(selectedDay)}</div>
          </div>
          {!isRest && (
            <ToggleButton done={!!wod.done} onToggle={() => setWorkouts(selectedDay, { done: !wod.done })}
              labelDone="Séance faite" labelUndone="Marquer comme fait" color="#6b9de8" />
          )}
        </div>

        {exList.length > 0 && (
          <>
            <Label>Exercices suggérés</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8, marginBottom: 12 }}>
              {exList.map(ex => (
                <div key={ex} style={{ background: '#080810', border: '1px solid #1a1a2e', borderRadius: 6, padding: '8px 10px', fontSize: 13, color: '#aaa' }}>
                  <span style={{ color: '#6b9de8', marginRight: 6 }}>⚡</span>{ex}
                </div>
              ))}
            </div>
          </>
        )}

        <Label>Notes de séance</Label>
        <Textarea value={wod.notes} onChange={v => setWorkouts(selectedDay, { notes: v })}
          placeholder="Charges utilisées, ressenti, PR…" />
      </Card>

      <Card>
        <CardTitle>Nutrition du jour</CardTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {[
            { key: 'calories', label: 'Calories', unit: 'kcal', goal: NUTRITION_GOALS.calories, color: '#ff6b35' },
            { key: 'protein', label: 'Protéines', unit: 'g', goal: NUTRITION_GOALS.protein, color: '#6b9de8' },
            { key: 'carbs', label: 'Glucides', unit: 'g', goal: NUTRITION_GOALS.carbs, color: '#d4af37' },
            { key: 'fat', label: 'Lipides', unit: 'g', goal: NUTRITION_GOALS.fat, color: '#7eb8a4' },
          ].map(({ key, label, unit, goal, color }) => {
            const val = Number(nut[key]) || 0
            const pct = Math.min(100, Math.round(val / goal * 100))
            return (
              <div key={key} style={{ background: '#080810', border: '1px solid #1a1a2e', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#aaa' }}>{label}</span>
                  <span style={{ fontSize: 11, color: '#666' }}>/ {goal}{unit}</span>
                </div>
                <Input value={nut[key]} onChange={v => setNutrition(selectedDay, { [key]: v })}
                  type="number" placeholder={`0 ${unit}`} style={{ marginBottom: 8 }} />
                <ProgressBar pct={pct} color={color} height={4} />
                <div style={{ fontSize: 11, color, marginTop: 4 }}>{pct}%</div>
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: 12, padding: '10px 14px', background: '#080810', borderRadius: 8, fontSize: 12, color: '#888' }}>
          💊 Post-séance : Whey 30g · Créatine 5g/j · Oméga-3 2g · Collagène 10g (épaule droite)
        </div>
      </Card>
    </div>
  )
}

// ─── PRAYER ───────────────────────────────────────────────────────────────────
export function Prayer({ selectedDay, prayers, setPrayers }) {
  const dayPrayers = prayers[selectedDay] || {}
  const done = PRAYERS.filter(p => dayPrayers[p]).length
  const prayerTimes = { Fajr: '~05:30', Dhuhr: '~13:30', Asr: '~17:00', Maghrib: '~21:30', Isha: '~23:00' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <CardTitle>Prières du {fmtDate(selectedDay)}</CardTitle>
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <div style={{ fontSize: 52, fontWeight: 900, color: '#d4af37', fontFamily: "'Cinzel', serif" }}>{done}/5</div>
          <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 2 }}>prières accomplies</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PRAYERS.map(p => {
            const checked = !!dayPrayers[p]
            return (
              <button key={p} onClick={() => setPrayers(selectedDay, { [p]: !checked })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                  borderRadius: 10, border: `1px solid ${checked ? '#d4af37' : '#222'}`,
                  background: checked ? 'rgba(212,175,55,0.1)' : '#0d0d1a',
                  cursor: 'pointer', color: '#e0e0e0', textAlign: 'left', transition: 'all 0.2s',
                }}>
                <span style={{ fontSize: 20 }}>{checked ? '☽' : '☾'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: checked ? '#d4af37' : '#aaa' }}>{p}</div>
                  <div style={{ fontSize: 11, color: '#666' }}>{prayerTimes[p]}</div>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked ? '#d4af37' : '#444'}`,
                  background: checked ? '#d4af37' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {checked && <span style={{ color: '#000', fontSize: 12, fontWeight: 900 }}>✓</span>}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <Card>
        <CardTitle>Historique 7 jours</CardTitle>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {Array.from({ length: 7 }, (_, i) => {
            const d = addDays(TODAY, -6 + i)
            const dp = prayers[d] || {}
            const cnt = PRAYERS.filter(p => dp[p]).length
            return (
              <div key={d} style={{ textAlign: 'center', flex: 1, minWidth: 40 }}>
                <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>
                  {new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'narrow' })}
                </div>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', margin: '0 auto',
                  background: cnt === 5 ? '#d4af37' : cnt > 0 ? `rgba(212,175,55,${cnt / 5})` : '#1a1a2e',
                  border: d === TODAY ? '2px solid #d4af37' : '1px solid #222',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: cnt > 0 ? (cnt === 5 ? '#000' : '#d4af37') : '#555',
                }}>
                  {cnt}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

// ─── QURAN ────────────────────────────────────────────────────────────────────
export function Quran({ selectedDay, quranPages, setQuranPages }) {
  const dayQ = quranPages[selectedDay] || {}
  const totalDone = Object.values(quranPages).filter(q => q.done).length
  const challengeDay = Math.max(1, daysBetween(CHALLENGE_START, selectedDay) + 1)
  const expectedPage = challengeDay

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <CardTitle>Mémorisation du {fmtDate(selectedDay)}</CardTitle>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', margin: '16px 0', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, fontWeight: 900, color: '#7eb8a4', fontFamily: "'Cinzel', serif" }}>{totalDone}</div>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 2 }}>pages mémorisées</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 8, fontSize: 13, color: '#aaa' }}>
              Page cible : <span style={{ color: '#d4af37', fontWeight: 700 }}>Page {expectedPage}</span>
            </div>
            <ProgressBar pct={Math.min(100, totalDone / 90 * 100)} color="#7eb8a4" />
            <div style={{ fontSize: 11, color: '#7eb8a4', marginTop: 4 }}>
              {Math.min(100, Math.round(totalDone / 90 * 100))}% de l'objectif 90 pages
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12 }}>
          <div>
            <Label>Page mémorisée</Label>
            <Input value={dayQ.page || expectedPage} onChange={v => setQuranPages(selectedDay, { page: Number(v) })}
              type="number" style={{ width: 90 }} />
          </div>
          <ToggleButton done={!!dayQ.done} onToggle={() => setQuranPages(selectedDay, { done: !dayQ.done, page: dayQ.page || expectedPage })}
            labelDone="Page mémorisée" labelUndone="Valider page" color="#7eb8a4" />
        </div>

        <Label>Notes (tajwid, difficultés, révisions)</Label>
        <Textarea value={dayQ.notes} onChange={v => setQuranPages(selectedDay, { notes: v })} />
      </Card>

      <Card>
        <CardTitle>Régularité — 30 derniers jours</CardTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 12 }}>
          {Array.from({ length: 30 }, (_, i) => {
            const d = addDays(TODAY, -29 + i)
            const done = quranPages[d]?.done
            return (
              <div key={d} title={fmtDate(d)} style={{
                width: 22, height: 22, borderRadius: 4,
                background: done ? '#7eb8a4' : '#1a1a2e',
                border: d === TODAY ? '2px solid #7eb8a4' : '1px solid #222',
              }} />
            )
          })}
        </div>
      </Card>
    </div>
  )
}

// ─── CERTIFICATION ────────────────────────────────────────────────────────────
const CERT_TOPICS = [
  'EC2 / Auto Scaling', 'S3 / Glacier', 'VPC / Networking', 'IAM / Security',
  'RDS / DynamoDB', 'EKS / ECS / Lambda', 'CloudFormation / CDK',
  'Monitoring / CloudWatch', 'CI/CD / CodePipeline', 'Well-Architected Framework',
]

export function Cert({ selectedDay, certStudy, setCertStudy }) {
  const day = certStudy[selectedDay] || {}
  const totalStudyDays = Object.values(certStudy).filter(d => d.done).length
  const challengeDay = Math.max(1, daysBetween(CHALLENGE_START, selectedDay) + 1)
  const set = (f, v) => setCertStudy(selectedDay, { [f]: v })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <CardTitle>Préparation AWS — {fmtDate(selectedDay)}</CardTitle>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', margin: '16px 0', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#6b9de8', fontFamily: "'Cinzel', serif" }}>{totalStudyDays}</div>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 2 }}>jours d'étude</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 6, fontSize: 13, color: '#aaa' }}>Objectif : 60 jours sur 90</div>
            <ProgressBar pct={Math.min(100, totalStudyDays / 60 * 100)} color="#6b9de8" />
            <div style={{ fontSize: 11, color: '#6b9de8', marginTop: 4 }}>{Math.min(100, Math.round(totalStudyDays / 60 * 100))}%</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12 }}>
          <div>
            <Label>Durée d'étude (minutes)</Label>
            <Input value={day.minutes} onChange={v => set('minutes', v)} type="number" placeholder="ex: 45" />
          </div>
          <div>
            <Label>Score mock exam (%)</Label>
            <Input value={day.mockScore} onChange={v => set('mockScore', v)} type="number" placeholder="Si passé" />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <Label>Sujet étudié</Label>
            <Select value={day.topic} onChange={v => set('topic', v)} options={[{ value: '', label: '— Choisir —' }, ...CERT_TOPICS]} />
          </div>
        </div>

        <Label>Notes de révision</Label>
        <Textarea value={day.notes} onChange={v => set('notes', v)} placeholder="Points difficiles, commandes mémorisées…" />

        <div style={{ marginTop: 12 }}>
          <ToggleButton done={!!day.done} onToggle={() => set('done', !day.done)}
            labelDone="Session validée" labelUndone="Valider session" color="#6b9de8" />
        </div>
      </Card>

      <Card>
        <CardTitle>Jalons du challenge</CardTitle>
        {CERT_MILESTONES.map(m => {
          const reached = challengeDay >= m.day
          const date = addDays(CHALLENGE_START, m.day - 1)
          return (
            <div key={m.day} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #1a1a2e', opacity: reached ? 1 : 0.5 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: reached ? '#6b9de8' : '#333',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: reached ? '#fff' : '#666', fontWeight: 700,
              }}>{m.day}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: '#e0e0e0', fontWeight: 600 }}>{m.label}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{fmtDate(date)}</div>
              </div>
              {reached ? <span style={{ color: '#6b9de8', fontSize: 18 }}>✓</span>
                : <span style={{ fontSize: 11, color: '#555' }}>J-{m.day - challengeDay}</span>}
            </div>
          )
        })}
      </Card>
    </div>
  )
}

// ─── AGENDA ───────────────────────────────────────────────────────────────────
const EMPTY_FORM = { title: '', date: TODAY, time: '', type: 'Pro', notes: '' }

export function Agenda({ appointments, addAppointment, removeAppointment }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleAdd = async () => {
    if (!form.title || !form.date) return
    await addAppointment({ ...form })
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  const sorted = [...appointments].sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))
  const upcoming = sorted.filter(a => a.date >= TODAY)
  const past = sorted.filter(a => a.date < TODAY).reverse().slice(0, 6)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: '9px 18px', background: 'rgba(212,175,55,0.1)', border: '1px solid #d4af3755', borderRadius: 8, color: '#d4af37', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
          {showForm ? '✕ Annuler' : '+ Nouveau RDV'}
        </button>
      </div>

      {showForm && (
        <Card>
          <CardTitle>Nouveau rendez-vous</CardTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <Label>Titre</Label>
              <Input value={form.title} onChange={v => set('title', v)} placeholder="Ex: Kiné épaule, Entretien…" />
            </div>
            <div>
              <Label>Date</Label>
              <Input value={form.date} onChange={v => set('date', v)} type="date" />
            </div>
            <div>
              <Label>Heure</Label>
              <Input value={form.time} onChange={v => set('time', v)} type="time" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onChange={v => set('type', v)} options={['Pro', 'Médecin', 'Perso', 'Autre']} />
            </div>
            <div>
              <Label>Notes / lieu</Label>
              <Input value={form.notes} onChange={v => set('notes', v)} placeholder="Adresse, infos…" />
            </div>
          </div>
          <button onClick={handleAdd}
            style={{ marginTop: 12, padding: '10px 20px', borderRadius: 8, border: '1px solid #d4af3755', background: '#d4af3733', color: '#d4af37', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
            Ajouter
          </button>
        </Card>
      )}

      <Card>
        <CardTitle>À venir ({upcoming.length})</CardTitle>
        {upcoming.length === 0 && <div style={{ color: '#555', fontSize: 13 }}>Aucun rendez-vous à venir</div>}
        {upcoming.map((a, i) => (
          <div key={a.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#080810', borderRadius: 8, border: '1px solid #1a1a2e', marginTop: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: APPT_COLORS[a.type] || '#666', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: '#e0e0e0' }}>{a.title}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{fmtDate(a.date)}{a.time ? ` · ${a.time}` : ''}{a.notes ? ` · ${a.notes}` : ''}</div>
            </div>
            <ApptTag type={a.type} />
            <button onClick={() => removeAppointment(a.id)} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontSize: 14, padding: '2px 4px' }}>✕</button>
          </div>
        ))}
      </Card>

      {past.length > 0 && (
        <Card>
          <CardTitle>Passés récents</CardTitle>
          {past.map((a, i) => (
            <div key={a.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#080810', borderRadius: 8, border: '1px solid #1a1a2e', marginTop: 6, opacity: 0.5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: APPT_COLORS[a.type] || '#666', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#e0e0e0' }}>{a.title}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{fmtDate(a.date)}{a.time ? ` · ${a.time}` : ''}</div>
              </div>
              <ApptTag type={a.type} />
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
