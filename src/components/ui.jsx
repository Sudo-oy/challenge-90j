import { APPT_COLORS } from '../lib/constants'

export function Card({ children, style = {} }) {
  return <div style={{ background: '#0d0d1a', border: '1px solid #1a1a2e', borderRadius: 12, padding: '18px 20px', ...style }}>{children}</div>
}

export function CardTitle({ children }) {
  return <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>{children}</div>
}

export function ProgressBar({ pct, color = '#d4af37', height = 4 }) {
  return (
    <div style={{ height, background: '#1a1a2e', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
    </div>
  )
}

export function BigNumber({ value, label, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 48, fontWeight: 900, color, fontFamily: "'Cinzel', serif", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 }}>{label}</div>
    </div>
  )
}

export function ToggleButton({ done, onToggle, labelDone, labelUndone, color = '#d4af37' }) {
  return (
    <button
      onClick={onToggle}
      style={{
        padding: '10px 20px', borderRadius: 8, border: `1px solid ${color}`,
        background: done ? color + '22' : '#1a1a2e', color: done ? color : '#aaa',
        cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'all 0.2s',
      }}>
      {done ? `✓ ${labelDone}` : labelUndone}
    </button>
  )
}

export function Input({ value, onChange, placeholder, type = 'text', style = {} }) {
  return (
    <input
      type={type} value={value || ''} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', background: '#080810', border: '1px solid #2a2a3e',
        borderRadius: 6, padding: '8px 12px', color: '#e0e0e0', fontSize: 13,
        outline: 'none', boxSizing: 'border-box', ...style
      }} />
  )
}

export function Select({ value, onChange, options }) {
  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', background: '#080810', border: '1px solid #2a2a3e', borderRadius: 6, padding: '8px 12px', color: '#e0e0e0', fontSize: 13, outline: 'none' }}>
      {options.map(o => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

export function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea value={value || ''} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      style={{ width: '100%', background: '#080810', border: '1px solid #2a2a3e', borderRadius: 6, padding: '8px 12px', color: '#e0e0e0', fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginTop: 8 }} />
  )
}

export function Label({ children }) {
  return <div style={{ fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{children}</div>
}

export function ApptTag({ type }) {
  const color = APPT_COLORS[type] || '#666'
  return (
    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase', background: color + '22', color }}>
      {type}
    </span>
  )
}
