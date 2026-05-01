import { useState } from 'react'

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const CALENDAR_ICON = 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z'
const CHEV_DOWN = 'M6 9l6 6 6-6'

const pad = (n) => String(n).padStart(2, '0')

export const PRESETS = [
  {
    label: 'Last 30 days',
    getValue: () => {
      const n = new Date()
      const from = new Date(n); from.setDate(n.getDate() - 29)
      return {
        from: `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(from.getDate())}`,
        to: `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`,
      }
    }
  },
  {
    label: 'This month',
    getValue: () => {
      const n = new Date()
      return {
        from: `${n.getFullYear()}-${pad(n.getMonth() + 1)}-01`,
        to: `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate())}`,
      }
    }
  },
  {
    label: 'Last month',
    getValue: () => {
      const n = new Date()
      const y = n.getMonth() === 0 ? n.getFullYear() - 1 : n.getFullYear()
      const m = n.getMonth() === 0 ? 12 : n.getMonth()
      return {
        from: `${y}-${pad(m)}-01`,
        to: `${y}-${pad(m)}-${pad(new Date(y, m, 0).getDate())}`,
      }
    }
  },
  {
    label: 'This year',
    getValue: () => {
      const n = new Date()
      return { from: `${n.getFullYear()}-01-01`, to: `${n.getFullYear()}-12-31` }
    }
  },
  { label: 'Pick a month', getValue: () => null },
  { label: 'Custom range', getValue: () => null },
]

export const calcLast30 = () => {
  const to = new Date()
  const from = new Date(); from.setDate(to.getDate() - 29)
  return {
    from: `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(from.getDate())}`,
    to: `${to.getFullYear()}-${pad(to.getMonth() + 1)}-${pad(to.getDate())}`,
  }
}

// DateRangeFilter component
// Props:
//   fromDate, toDate — current values
//   onApply(from, to) — called when user applies a filter
//   accentColor — optional color for active preset (default indigo)
const DateRangeFilter = ({ fromDate, toDate, onApply, accentColor = '#6366f1' }) => {
  const now = new Date()
  const [filterOpen, setFilterOpen] = useState(false)
  const [activePreset, setActivePreset] = useState(0)
  const [showCustom, setShowCustom] = useState(false)
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [localFrom, setLocalFrom] = useState(fromDate)
  const [localTo, setLocalTo] = useState(toDate)
  const [pickedMonth, setPickedMonth] = useState(`${now.getFullYear()}-${pad(now.getMonth() + 1)}`)

  const rangeLabel = activePreset === 4
    ? pickedMonth
    : activePreset === 5
      ? `${localFrom} → ${localTo}`
      : PRESETS[activePreset]?.label

  const handlePreset = (index) => {
    setActivePreset(index)
    setShowCustom(false)
    setShowMonthPicker(false)
    if (index === 4) { setShowMonthPicker(true); return }
    if (index === 5) { setShowCustom(true); return }
    const { from, to } = PRESETS[index].getValue()
    setLocalFrom(from); setLocalTo(to)
    onApply(from, to)
    setFilterOpen(false)
  }

  const handleMonthApply = () => {
    const [y, m] = pickedMonth.split('-').map(Number)
    const from = `${y}-${pad(m)}-01`
    const to = `${y}-${pad(m)}-${pad(new Date(y, m, 0).getDate())}`
    setLocalFrom(from); setLocalTo(to)
    onApply(from, to)
    setFilterOpen(false)
  }

  const handleCustomApply = () => {
    onApply(localFrom, localTo)
    setFilterOpen(false)
  }

  return (
    <>
      <style>{`
        .drf-preset-btn:hover { background: ${accentColor}18 !important; color: ${accentColor} !important; }
        .drf-dropdown { animation: drfDropIn 0.2s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes drfDropIn { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setFilterOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#fff', border: `1.5px solid ${filterOpen ? accentColor : '#e2e8f0'}`,
            borderRadius: 12, padding: '9px 16px', fontSize: 13, fontWeight: 600,
            color: '#1e293b', cursor: 'pointer', transition: 'all 0.15s',
            boxShadow: filterOpen ? `0 0 0 3px ${accentColor}20` : 'none',
          }}>
          <Icon d={CALENDAR_ICON} size={15} />
          {rangeLabel}
          <Icon d={CHEV_DOWN} size={14} />
        </button>

        {filterOpen && (
          <div className="drf-dropdown" style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 200,
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
            boxShadow: '0 16px 48px rgba(0,0,0,0.12)', padding: 16, minWidth: 240,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 10, textTransform: 'uppercase' }}>Quick select</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {PRESETS.map((p, i) => (
                <button key={p.label} className="drf-preset-btn"
                  onClick={() => handlePreset(i)}
                  style={{
                    padding: '9px 12px', borderRadius: 9, border: 'none', textAlign: 'left',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    background: activePreset === i ? `${accentColor}18` : 'transparent',
                    color: activePreset === i ? accentColor : '#1e293b',
                    transition: 'all 0.15s',
                  }}>
                  {p.label}
                </button>
              ))}
            </div>

            {showMonthPicker && (
              <div style={{ marginTop: 14, borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 10, textTransform: 'uppercase' }}>Select month</div>
                <input type="month" value={pickedMonth} onChange={e => setPickedMonth(e.target.value)}
                  style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1e293b', marginBottom: 10 }} />
                <button onClick={handleMonthApply}
                  style={{ width: '100%', padding: '9px 0', borderRadius: 9, border: 'none', background: accentColor, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Apply
                </button>
              </div>
            )}

            {showCustom && (
              <div style={{ marginTop: 14, borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 10, textTransform: 'uppercase' }}>Custom range</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>From</label>
                    <input type="date" value={localFrom} onChange={e => setLocalFrom(e.target.value)}
                      style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1e293b' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>To</label>
                    <input type="date" value={localTo} onChange={e => setLocalTo(e.target.value)}
                      style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1e293b' }} />
                  </div>
                  <button onClick={handleCustomApply}
                    style={{ width: '100%', padding: '9px 0', borderRadius: 9, border: 'none', background: accentColor, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginTop: 4 }}>
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Click outside overlay */}
      {filterOpen && <div onClick={() => setFilterOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />}
    </>
  )
}

export default DateRangeFilter