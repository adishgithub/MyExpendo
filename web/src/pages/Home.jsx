import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../utils/api'

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const ICONS = {
  income: 'M12 19V5M5 12l7-7 7 7',
  expense: 'M12 5v14M5 12l7 7 7-7',
  savings: 'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  cart: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0',
  receipt: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6',
  arrowUp: 'M12 19V5M5 12l7-7 7 7',
  arrowDown: 'M12 5v14M5 12l7 7 7-7',
  empty: 'M9 17H7A5 5 0 017 7h1M15 7h1a5 5 0 010 10h-2M8 12h8',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  chevDown: 'M6 9l6 6 6-6',
}

// Animated counter
const useCountUp = (target, duration = 900, started = false) => {
  const [value, setValue] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    if (!started || target === 0) { setValue(target); return }
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * ease))
      if (progress < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, started, duration])
  return value
}

// Animated bar
const AnimatedBar = ({ pct, color, delay = 0 }) => {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay + 100)
    return () => clearTimeout(t)
  }, [pct, delay])
  return (
    <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${width}%`, background: color, borderRadius: 4, transition: 'width 0.7s cubic-bezier(0.34,1.56,0.64,1)' }} />
    </div>
  )
}

// Metric card
const MetricCard = ({ label, value, sub, color, icon, prefix = '₹', started, index }) => {
  const animated = useCountUp(value, 900 + index * 100, started)
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), index * 80); return () => clearTimeout(t) }, [index])
  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
      padding: '20px 22px', flex: 1, minWidth: 180,
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'opacity 0.4s ease, transform 0.4s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{label}</span>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          <Icon d={icon} size={17} />
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
        {prefix}{animated.toLocaleString('en-IN')}
      </div>
      {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

// Month bar with tooltip on hover
const MonthBar = ({ item, max, index, isCurrentMonth }) => {
  const [barH, setBarH] = useState(0)
  const [hovered, setHovered] = useState(false)

  const CHART_HEIGHT = 120
  const expPx = max > 0 ? Math.max((item.expenses / max) * CHART_HEIGHT, item.expenses > 0 ? 6 : 0) : 0
  const incPx = max > 0 ? Math.max((item.income / max) * CHART_HEIGHT, item.income > 0 ? 6 : 0) : 0

  useEffect(() => { const t = setTimeout(() => setBarH(1), index * 80 + 200); return () => clearTimeout(t) }, [index])

  const fmt = (v) => v >= 1000 ? `₹${(v / 1000).toFixed(1)}k` : `₹${v}`

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>

      {/* Tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          background: '#0f172a', color: '#fff', borderRadius: 10, padding: '10px 14px',
          fontSize: 12, whiteSpace: 'nowrap', zIndex: 50, marginBottom: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: '#94a3b8' }}>{item.label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981', display: 'inline-block' }} />
            <span style={{ color: '#94a3b8' }}>Income</span>
            <span style={{ fontWeight: 700, color: '#10b981', marginLeft: 4 }}>{fmt(item.income)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#ef4444', display: 'inline-block' }} />
            <span style={{ color: '#94a3b8' }}>Expenses</span>
            <span style={{ fontWeight: 700, color: '#ef4444', marginLeft: 4 }}>{fmt(item.expenses)}</span>
          </div>
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: 6, marginTop: 2 }}>
            <span style={{ color: '#94a3b8' }}>Savings </span>
            <span style={{ fontWeight: 700, color: item.savings >= 0 ? '#6366f1' : '#f59e0b' }}>{fmt(Math.abs(item.savings))}</span>
          </div>
          <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #0f172a' }} />
        </div>
      )}

      {/* Bars — fixed pixel heights */}
      <div style={{ width: '100%', display: 'flex', gap: 3, alignItems: 'flex-end', height: CHART_HEIGHT }}>
        {/* Income bar */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
          <div style={{
            width: '100%',
            background: hovered ? '#059669' : '#10b981',
            borderRadius: '4px 4px 0 0',
            height: barH ? incPx : 0,
            transition: `height 0.6s cubic-bezier(0.34,1.56,0.64,1) ${index * 60}ms, background 0.15s`,
          }} />
        </div>
        {/* Expense bar */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
          <div style={{
            width: '100%',
            background: hovered ? '#dc2626' : '#ef4444',
            borderRadius: '4px 4px 0 0',
            height: barH ? expPx : 0,
            transition: `height 0.6s cubic-bezier(0.34,1.56,0.64,1) ${index * 60 + 30}ms, background 0.15s`,
          }} />
        </div>
      </div>

      {/* Label */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: isCurrentMonth ? '#6366f1' : '#94a3b8', fontWeight: isCurrentMonth ? 700 : 400 }}>
          {item.label}
        </div>
        {(item.income > 0 || item.expenses > 0) && (
          <div style={{ fontSize: 9, color: '#cbd5e1', marginTop: 1 }}>
            {fmt(Math.max(item.income, item.expenses))}
          </div>
        )}
      </div>
    </div>
  )
}

// Transaction row
const TxRow = ({ item, type, index }) => {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), index * 50); return () => clearTimeout(t) }, [index])
  const isExpense = type === 'expense'
  const date = new Date(item.date)
  const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  const color = isExpense ? '#ef4444' : '#10b981'
  const bg = isExpense ? '#fef2f2' : '#f0fdf4'
  const catName = isExpense ? (item.expense_category_name || 'Uncategorised') : (item.income_category_name || 'Uncategorised')
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 0', borderBottom: '1px solid #f8fafc',
      opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-10px)',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        <Icon d={isExpense ? ICONS.arrowDown : ICONS.arrowUp} size={15} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.description || catName}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{catName} · {dateStr}</div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color, flexShrink: 0 }}>
        {isExpense ? '−' : '+'}₹{parseFloat(item.amount).toLocaleString('en-IN')}
      </div>
    </div>
  )
}

// Category bar row
const CatRow = ({ name, total, max, color, index }) => {
  const pct = max > 0 ? Math.round((total / max) * 100) : 0
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: '#1e293b', fontWeight: 500 }}>{name}</span>
        <span style={{ fontSize: 12, color: '#64748b' }}>₹{total.toLocaleString('en-IN')}</span>
      </div>
      <AnimatedBar pct={pct} color={color} delay={index * 80} />
    </div>
  )
}

const Card = ({ children, style = {} }) => (
  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '20px 22px', ...style }}>
    {children}
  </div>
)

const CardTitle = ({ children }) => (
  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>{children}</div>
)

// Range presets
const PRESETS = [
  { label: 'This month', getValue: () => { const n = new Date(); return { from: new Date(n.getFullYear(), n.getMonth(), 1).toISOString().slice(0, 10), to: new Date(n.getFullYear(), n.getMonth() + 1, 0).toISOString().slice(0, 10) } } },
  { label: 'Last month', getValue: () => { const n = new Date(); return { from: new Date(n.getFullYear(), n.getMonth() - 1, 1).toISOString().slice(0, 10), to: new Date(n.getFullYear(), n.getMonth(), 0).toISOString().slice(0, 10) } } },
  { label: 'Last 3 months', getValue: () => { const n = new Date(); return { from: new Date(n.getFullYear(), n.getMonth() - 2, 1).toISOString().slice(0, 10), to: new Date(n.getFullYear(), n.getMonth() + 1, 0).toISOString().slice(0, 10) } } },
  { label: 'This year', getValue: () => { const n = new Date(); return { from: `${n.getFullYear()}-01-01`, to: `${n.getFullYear()}-12-31` } } },
  { label: 'Custom', getValue: () => null },
]

// Main Dashboard
const Home = ({ user }) => {
  const navigate = useNavigate()
  const now = new Date()

  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [started, setStarted] = useState(false)
  const [activeTab, setActiveTab] = useState('expenses')
  const [activePreset, setActivePreset] = useState(0)
  const [fromDate, setFromDate] = useState(defaultFrom)
  const [toDate, setToDate] = useState(defaultTo)
  const [showCustom, setShowCustom] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)

  const fetchDashboard = async (from, to) => {
    if (!user?.user_id) return
    setLoading(true)
    setStarted(false)
    try {
      const res = await API.get('/api/dashboard', {
        params: { user_id: user.user_id, from_date: from, to_date: to }
      })
      setData(res.data.data)
      setTimeout(() => setStarted(true), 100)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDashboard(fromDate, toDate) }, [user?.user_id])

  const handlePreset = (index) => {
    setActivePreset(index)
    if (index === 4) { setShowCustom(true); return }
    setShowCustom(false)
    const { from, to } = PRESETS[index].getValue()
    setFromDate(from); setToDate(to)
    fetchDashboard(from, to)
    setFilterOpen(false)
  }

  const handleCustomApply = () => {
    fetchDashboard(fromDate, toDate)
    setFilterOpen(false)
  }

  const d = data || {}
  const monthMax = Math.max(...(d.monthlyTrend || []).map(m => Math.max(m.income, m.expenses)), 1)
  const expMax = Math.max(...(d.expenseByCategory || []).map(c => c.total), 1)
  const incMax = Math.max(...(d.incomeByCategory || []).map(c => c.total), 1)
  const catColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6']

  const rangeLabel = activePreset === 4
    ? `${fromDate} → ${toDate}`
    : PRESETS[activePreset]?.label

  return (
    <div style={{ maxWidth: 1200, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(4px) } to { opacity: 1; transform: translateX(-50%) translateY(0) } }
        .dash-tab { transition: all 0.2s ease; cursor: pointer; }
        .dash-tab:hover { background: #f1f5f9 !important; }
        .stat-badge { transition: transform 0.15s ease; }
        .stat-badge:hover { transform: translateY(-2px); }
        .nav-link-btn:hover { background: #f8fafc !important; }
        .preset-btn:hover { background: #eef2ff !important; color: #4f46e5 !important; }
        .filter-dropdown { animation: dropIn 0.2s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}, {user?.full_name?.split(' ')[0] || user?.username} 👋
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
            Financial overview · <span style={{ color: '#6366f1', fontWeight: 600 }}>{rangeLabel}</span>
          </p>
        </div>

        {/* Range filter */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setFilterOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12,
              padding: '9px 16px', fontSize: 13, fontWeight: 600, color: '#1e293b',
              cursor: 'pointer', transition: 'all 0.15s',
              boxShadow: filterOpen ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
              borderColor: filterOpen ? '#6366f1' : '#e2e8f0',
            }}>
            <Icon d={ICONS.calendar} size={15} />
            {rangeLabel}
            <Icon d={ICONS.chevDown} size={14} />
          </button>

          {filterOpen && (
            <div className="filter-dropdown" style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 100,
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
              boxShadow: '0 16px 48px rgba(0,0,0,0.12)', padding: 16, minWidth: 240,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 10, textTransform: 'uppercase' }}>Quick select</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {PRESETS.map((p, i) => (
                  <button key={p.label} className="preset-btn"
                    onClick={() => handlePreset(i)}
                    style={{
                      padding: '9px 12px', borderRadius: 9, border: 'none', textAlign: 'left',
                      fontSize: 13, fontWeight: 500, cursor: 'pointer',
                      background: activePreset === i ? '#eef2ff' : 'transparent',
                      color: activePreset === i ? '#4f46e5' : '#1e293b',
                      transition: 'all 0.15s',
                    }}>
                    {p.label}
                  </button>
                ))}
              </div>

              {showCustom && (
                <div style={{ marginTop: 14, borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 10, textTransform: 'uppercase' }}>Custom range</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>From</label>
                      <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                        style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1e293b' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>To</label>
                      <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                        style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1e293b' }} />
                    </div>
                    <button onClick={handleCustomApply}
                      style={{ width: '100%', padding: '9px 0', borderRadius: 9, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginTop: 4 }}>
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close filter */}
      {filterOpen && <div onClick={() => setFilterOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', flexDirection: 'column', gap: 16 }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ color: '#94a3b8', fontSize: 14 }}>Loading…</span>
        </div>
      ) : (
        <>
          {/* Metric cards */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            <MetricCard label="Total Income" value={d.totalIncome || 0} color="#10b981" icon={ICONS.income}
              sub={`Saved ${d.savingsRate || 0}% this period`} started={started} index={0} />
            <MetricCard label="Total Expenses" value={d.totalExpenses || 0} color="#ef4444" icon={ICONS.expense}
              sub="Spending this period" started={started} index={1} />
            <MetricCard label="Net Savings" value={Math.max(d.netSavings || 0, 0)} color="#6366f1" icon={ICONS.savings}
              sub={d.netSavings < 0 ? '⚠️ Overspending!' : 'Keep it up!'} started={started} index={2} />
            <MetricCard label="To Buy Items" value={d.toBuyCount?.total || 0} color="#f97316" icon={ICONS.cart}
              prefix="" sub={`${d.toBuyCount?.['not ordered'] || 0} pending · ${d.toBuyCount?.ordered || 0} ordered`} started={started} index={3} />
          </div>

          {/* Row 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 14, marginBottom: 24 }}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <CardTitle>6-month trend</CardTitle>
                <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#64748b' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981', display: 'inline-block' }} />Income
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444', display: 'inline-block' }} />Expenses
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 16 }}>Hover over bars to see details</div>
              {(d.monthlyTrend || []).every(m => m.income === 0 && m.expenses === 0) ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                  <Icon d={ICONS.empty} size={36} />
                  <div style={{ marginTop: 10, fontSize: 13 }}>No data yet</div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 160, paddingBottom: 4 }}>
                  {(d.monthlyTrend || []).map((m, i) => (
                    <MonthBar key={m.label} item={m} max={monthMax} index={i}
                      isCurrentMonth={i === (d.monthlyTrend?.length || 1) - 1} />
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <CardTitle>By category</CardTitle>
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, gap: 2 }}>
                  {['expenses', 'income'].map(tab => (
                    <button key={tab} className="dash-tab" onClick={() => setActiveTab(tab)}
                      style={{
                        padding: '5px 10px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        background: activeTab === tab ? '#fff' : 'transparent',
                        color: activeTab === tab ? '#0f172a' : '#64748b',
                        boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      }}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {activeTab === 'expenses'
                ? (d.expenseByCategory || []).length === 0
                  ? <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: 13 }}>No expenses this period</div>
                  : (d.expenseByCategory || []).map((c, i) => <CatRow key={c._id} name={c._id} total={c.total} max={expMax} color={catColors[i % catColors.length]} index={i} />)
                : (d.incomeByCategory || []).length === 0
                  ? <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: 13 }}>No income this period</div>
                  : (d.incomeByCategory || []).map((c, i) => <CatRow key={c._id} name={c._id} total={c.total} max={incMax} color={catColors[i % catColors.length]} index={i} />)
              }
            </Card>
          </div>

          {/* Row 3 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 14 }}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <CardTitle>Recent transactions</CardTitle>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => navigate('/expenses')} className="nav-link-btn"
                    style={{ fontSize: 12, color: '#6366f1', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: 8, transition: 'all 0.15s' }}>
                    Expenses →
                  </button>
                  <button onClick={() => navigate('/income')} className="nav-link-btn"
                    style={{ fontSize: 12, color: '#10b981', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: 8, transition: 'all 0.15s' }}>
                    Income →
                  </button>
                </div>
              </div>
              {(() => {
                const all = [
                  ...(d.recentExpenses || []).map(e => ({ ...e, _type: 'expense' })),
                  ...(d.recentIncomes || []).map(e => ({ ...e, _type: 'income' })),
                ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8)
                return all.length === 0
                  ? <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}><Icon d={ICONS.receipt} size={32} /><div style={{ marginTop: 10, fontSize: 13 }}>No transactions this period</div></div>
                  : all.map((item, i) => <TxRow key={item._id} item={item} type={item._type} index={i} />)
              })()}
            </Card>

            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <CardTitle>To buy summary</CardTitle>
                <button onClick={() => navigate('/tobuy')} className="nav-link-btn"
                  style={{ fontSize: 12, color: '#f97316', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: 8, transition: 'all 0.15s' }}>
                  View all →
                </button>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Pending', key: 'not ordered', color: '#f59e0b', bg: '#fffbeb' },
                  { label: 'Ordered', key: 'ordered', color: '#3b82f6', bg: '#eff6ff' },
                  { label: 'Done', key: 'done', color: '#10b981', bg: '#f0fdf4' },
                ].map(s => (
                  <div key={s.key} className="stat-badge"
                    style={{ flex: 1, background: s.bg, borderRadius: 12, padding: '12px 10px', textAlign: 'center', border: `1px solid ${s.color}20` }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{d.toBuyCount?.[s.key] || 0}</div>
                    <div style={{ fontSize: 11, color: s.color, fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Savings rate</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>{d.savingsRate || 0}%</span>
                </div>
                <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                  <AnimatedBar pct={Math.min(d.savingsRate || 0, 100)} color="#6366f1" delay={400} />
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                  {(d.savingsRate || 0) >= 20 ? '✅ Great savings rate!' : (d.savingsRate || 0) > 0 ? '💡 Aim for 20%+ savings' : '⚠️ No savings this period'}
                </div>
              </div>
              <div style={{
                marginTop: 14, borderRadius: 12, padding: '14px 16px',
                background: (d.netSavings || 0) >= 0 ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${(d.netSavings || 0) >= 0 ? '#bbf7d0' : '#fecaca'}`,
              }}>
                <div style={{ fontSize: 11, color: (d.netSavings || 0) >= 0 ? '#15803d' : '#dc2626', fontWeight: 600, marginBottom: 4 }}>
                  {(d.netSavings || 0) >= 0 ? 'NET SAVINGS THIS PERIOD' : 'OVERSPENT THIS PERIOD'}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: (d.netSavings || 0) >= 0 ? '#15803d' : '#dc2626' }}>
                  {(d.netSavings || 0) >= 0 ? '+' : '−'}₹{Math.abs(d.netSavings || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

export default Home