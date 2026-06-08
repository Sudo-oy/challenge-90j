export const TODAY = new Date().toISOString().split('T')[0]
export const CHALLENGE_START = '2026-06-08'
export const CHALLENGE_END = addDays(CHALLENGE_START, 89)
export const TOTAL_DAYS = 90

export function addDays(d, n) {
  const dt = new Date(d + 'T12:00:00')
  dt.setDate(dt.getDate() + n)
  return dt.toISOString().split('T')[0]
}

export function daysBetween(a, b) {
  return Math.floor((new Date(b) - new Date(a)) / 86400000)
}

export function fmtDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short'
  })
}

export const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

export const WORKOUT_PLAN = {
  1: 'Push (Poitrine / Épaules / Triceps)',
  2: 'Pull (Dos / Biceps)',
  3: 'Legs (Quadriceps / Ischio / Mollets)',
  4: 'Force + HIIT',
  5: 'Cardio + Core',
  6: 'Repos actif / Étirements',
  0: 'Repos complet',
}

export const WORKOUT_EXERCISES = {
  'Push (Poitrine / Épaules / Triceps)': ['Développé couché', 'Développé incliné haltères', 'Élévations latérales', 'Dips lestés', 'Pushdown câble'],
  'Pull (Dos / Biceps)': ['Tractions lestées', 'Rowing barre', 'Tirage vertical prise large', 'Curl barre EZ', 'Curl marteau'],
  'Legs (Quadriceps / Ischio / Mollets)': ['Squat barre', 'Presse à cuisses', 'Fentes marchées', 'Leg curl couché', 'Mollets debout'],
  'Force + HIIT': ['Deadlift 5×3', 'Front squat 4×5', 'OHP strict 4×5', 'Farmer carry', 'HIIT 20min'],
  'Cardio + Core': ['Vélo 30min Z2', 'Planche 3×60s', 'Crunchs câble 3×15', 'Russian twist', 'Bird dog'],
}

export const NUTRITION_GOALS = { calories: 2050, protein: 165, carbs: 220, fat: 60 }

export const CERT_MILESTONES = [
  { day: 15, label: 'Mock exam #1' },
  { day: 30, label: 'Mi-parcours review' },
  { day: 60, label: 'Mock exam #2' },
  { day: 75, label: 'Révision finale' },
  { day: 90, label: '🏆 Certification AWS' },
]

export const APPT_COLORS = {
  Médecin: '#ff6b6b',
  Pro: '#6b9de8',
  Perso: '#7eb8a4',
  Autre: '#d4af37',
}

export const MORNING_ROUTINE = [
  { id: 'fajr', label: 'Prière Fajr', icon: '☽', category: 'spirituel' },
  { id: 'quran_morning', label: 'Lecture Coran (15 min)', icon: '📖', category: 'spirituel' },
  { id: 'dhikr', label: 'Adhkar du matin', icon: '🤲', category: 'spirituel' },
  { id: 'hydration', label: 'Grand verre d\'eau', icon: '💧', category: 'santé' },
  { id: 'stretching', label: 'Étirements / mobilité (10 min)', icon: '🧘', category: 'sport' },
  { id: 'cold_shower', label: 'Douche froide', icon: '🚿', category: 'santé' },
  { id: 'breakfast', label: 'Petit-déjeuner protéiné', icon: '🥚', category: 'nutrition' },
  { id: 'planning', label: 'Revue agenda du jour (5 min)', icon: '📋', category: 'pro' },
  { id: 'supplements_am', label: 'Compléments matin (Oméga-3, Collagène)', icon: '💊', category: 'santé' },
  { id: 'intention', label: 'Intention du jour (écrire 1 objectif)', icon: '✍️', category: 'mental' },
]

export const EVENING_ROUTINE = [
  { id: 'maghrib', label: 'Prière Maghrib', icon: '☽', category: 'spirituel' },
  { id: 'isha', label: 'Prière Isha', icon: '☽', category: 'spirituel' },
  { id: 'quran_evening', label: 'Révision page Coran mémorisée', icon: '📖', category: 'spirituel' },
  { id: 'adhkar_evening', label: 'Adhkar du soir', icon: '🤲', category: 'spirituel' },
  { id: 'journal', label: 'Journal / bilan du jour (10 min)', icon: '📔', category: 'mental' },
  { id: 'review_tasks', label: 'Revue tâches pro du lendemain', icon: '✅', category: 'pro' },
  { id: 'no_screen', label: 'Pas d\'écran 30 min avant sommeil', icon: '📵', category: 'santé' },
  { id: 'supplements_pm', label: 'Créatine 5g + magnésium', icon: '💊', category: 'santé' },
  { id: 'gratitude', label: '3 gratitudes de la journée', icon: '🌟', category: 'mental' },
  { id: 'sleep', label: 'Au lit avant 23h30', icon: '😴', category: 'santé' },
]

export const ROUTINE_CATEGORY_COLORS = {
  spirituel: '#d4af37',
  santé: '#7eb8a4',
  sport: '#6b9de8',
  nutrition: '#ff9f43',
  pro: '#a29bfe',
  mental: '#fd79a8',
}
