import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── Generic upsert for daily logs ───────────────────────────────────────────
export async function upsertDayLog(table, date, data) {
  const { error } = await supabase
    .from(table)
    .upsert({ date, ...data }, { onConflict: 'date' })
  if (error) console.error(`upsert ${table}:`, error)
}

export async function fetchAllLogs(table) {
  const { data, error } = await supabase.from(table).select('*')
  if (error) { console.error(`fetch ${table}:`, error); return [] }
  return data
}

// Appointments
export async function fetchAppointments() {
  const { data } = await supabase.from('appointments').select('*').order('date')
  return data || []
}
export async function upsertAppointment(appt) {
  const { data, error } = await supabase.from('appointments').upsert(appt).select()
  if (error) console.error('upsert appointment:', error)
  return data?.[0]
}
export async function deleteAppointment(id) {
  await supabase.from('appointments').delete().eq('id', id)
}
