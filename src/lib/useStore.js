import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, upsertDayLog, fetchAllLogs, fetchAppointments, upsertAppointment, deleteAppointment } from './supabase'

// ─── Local storage fallback ───────────────────────────────────────────────────
function ls(key, def) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def }
  catch { return def }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ─── Convert Supabase rows array → { date: rowData } map ─────────────────────
function rowsToMap(rows, exclude = ['id', 'created_at', 'updated_at']) {
  return rows.reduce((acc, row) => {
    const { date, ...rest } = row
    exclude.forEach(k => delete rest[k])
    acc[date] = rest
    return acc
  }, {})
}

export function useStore() {
  const [loaded, setLoaded] = useState(false)
  const [prayers, _setPrayers] = useState(() => ls('prayers', {}))
  const [workouts, _setWorkouts] = useState(() => ls('workouts', {}))
  const [quranPages, _setQuranPages] = useState(() => ls('quran', {}))
  const [certStudy, _setCertStudy] = useState(() => ls('cert', {}))
  const [nutrition, _setNutrition] = useState(() => ls('nutrition', {}))
  const [morningRoutine, _setMorningRoutine] = useState(() => ls('morning', {}))
  const [eveningRoutine, _setEveningRoutine] = useState(() => ls('evening', {}))
  const [appointments, _setAppointments] = useState(() => ls('appointments', []))

  // Load from Supabase on mount
  useEffect(() => {
    async function load() {
      try {
        const [pRows, wRows, qRows, cRows, nRows, mRows, eRows, appts] = await Promise.all([
          fetchAllLogs('prayers'),
          fetchAllLogs('workouts'),
          fetchAllLogs('quran_pages'),
          fetchAllLogs('cert_study'),
          fetchAllLogs('nutrition'),
          fetchAllLogs('morning_routine'),
          fetchAllLogs('evening_routine'),
          fetchAppointments(),
        ])
        if (pRows.length) { const m = rowsToMap(pRows); _setPrayers(m); lsSet('prayers', m) }
        if (wRows.length) { const m = rowsToMap(wRows); _setWorkouts(m); lsSet('workouts', m) }
        if (qRows.length) { const m = rowsToMap(qRows); _setQuranPages(m); lsSet('quran', m) }
        if (cRows.length) { const m = rowsToMap(cRows); _setCertStudy(m); lsSet('cert', m) }
        if (nRows.length) { const m = rowsToMap(nRows); _setNutrition(m); lsSet('nutrition', m) }
        if (mRows.length) { const m = rowsToMap(mRows); _setMorningRoutine(m); lsSet('morning', m) }
        if (eRows.length) { const m = rowsToMap(eRows); _setEveningRoutine(m); lsSet('evening', m) }
        if (appts.length) { _setAppointments(appts); lsSet('appointments', appts) }
      } catch (e) { console.warn('Supabase load failed, using local storage', e) }
      setLoaded(true)
    }
    load()
  }, [])

  // ─── Setters with local+remote sync ─────────────────────────────────────────
  const setPrayers = useCallback((date, data) => {
    _setPrayers(prev => { const next = { ...prev, [date]: { ...prev[date], ...data } }; lsSet('prayers', next); return next })
    upsertDayLog('prayers', date, data)
  }, [])

  const setWorkouts = useCallback((date, data) => {
    _setWorkouts(prev => { const next = { ...prev, [date]: { ...prev[date], ...data } }; lsSet('workouts', next); return next })
    upsertDayLog('workouts', date, data)
  }, [])

  const setQuranPages = useCallback((date, data) => {
    _setQuranPages(prev => { const next = { ...prev, [date]: { ...prev[date], ...data } }; lsSet('quran', next); return next })
    upsertDayLog('quran_pages', date, data)
  }, [])

  const setCertStudy = useCallback((date, data) => {
    _setCertStudy(prev => { const next = { ...prev, [date]: { ...prev[date], ...data } }; lsSet('cert', next); return next })
    upsertDayLog('cert_study', date, data)
  }, [])

  const setNutrition = useCallback((date, data) => {
    _setNutrition(prev => { const next = { ...prev, [date]: { ...prev[date], ...data } }; lsSet('nutrition', next); return next })
    upsertDayLog('nutrition', date, data)
  }, [])

  const setMorningRoutine = useCallback((date, data) => {
    _setMorningRoutine(prev => { const next = { ...prev, [date]: { ...prev[date], ...data } }; lsSet('morning', next); return next })
    upsertDayLog('morning_routine', date, data)
  }, [])

  const setEveningRoutine = useCallback((date, data) => {
    _setEveningRoutine(prev => { const next = { ...prev, [date]: { ...prev[date], ...data } }; lsSet('evening', next); return next })
    upsertDayLog('evening_routine', date, data)
  }, [])

  const addAppointment = useCallback(async (appt) => {
    const saved = await upsertAppointment(appt)
    const final = saved || { ...appt, id: Date.now() }
    _setAppointments(prev => { const next = [...prev, final]; lsSet('appointments', next); return next })
  }, [])

  const removeAppointment = useCallback(async (id) => {
    await deleteAppointment(id)
    _setAppointments(prev => { const next = prev.filter(a => a.id !== id); lsSet('appointments', next); return next })
  }, [])

  return {
    loaded,
    prayers, setPrayers,
    workouts, setWorkouts,
    quranPages, setQuranPages,
    certStudy, setCertStudy,
    nutrition, setNutrition,
    morningRoutine, setMorningRoutine,
    eveningRoutine, setEveningRoutine,
    appointments, addAppointment, removeAppointment,
  }
}
