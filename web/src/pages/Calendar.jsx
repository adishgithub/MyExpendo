// pages/Calendar.jsx
import { useState, useEffect, useCallback } from 'react'
import API from '../utils/api'

const Icon = ({ d, size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
)

const ICONS = {
    prev: 'M15 18l-6-6 6-6',
    next: 'M9 18l6-6-6-6',
    expense: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H9l3-3 3 3h-2v4z',
    income: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 7h2v4h2l-3 3-3-3h2V9z',
    fire: 'M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z',
    avg: 'M3 12h18M3 6h18M3 18h18',
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
const fmtDate = (dateStr) => {
    if (!dateStr) return '—'
    const [, m, d] = dateStr.split('-')
    return `${parseInt(d)} ${MONTHS[parseInt(m) - 1]}`
}

// ── Stat card — matches Payments page style exactly ──
const StatCard = ({ label, value, sub, color, icon }) => (
    <div style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        padding: '18px 20px',
        flex: 1,
        minWidth: 0,
    }}>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
    </div>
)

// ── Day cell ──
const DayCell = ({ day, isToday, onSelect, selected }) => {
    if (!day) return <div />

    const hasExpense = day.expense > 0
    const hasIncome = day.income > 0
    const isSelected = selected?.date === day.date
    const maxBar = Math.max(day.expense, day.income, 1)

    return (
        <div
            onClick={() => onSelect(isSelected ? null : day)}
            className="cal-day"
            style={{
                background: isSelected ? '#eef2ff' : '#fff',
                border: isSelected
                    ? '1.5px solid #4f46e5'
                    : isToday
                        ? '1.5px solid #6366f1'
                        : '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '10px 10px 8px',
                cursor: 'pointer',
                transition: 'all .15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                minHeight: 88,
            }}
        >
            {/* Day number */}
            <span style={{
                fontSize: 13,
                fontWeight: isToday ? 800 : 600,
                color: isSelected ? '#4f46e5' : isToday ? '#4f46e5' : '#1e293b',
            }}>
                {parseInt(day.date.split('-')[2])}
            </span>

            {/* Mini bars */}
            {(hasExpense || hasIncome) && (
                <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 22, marginTop: 'auto' }}>
                    {hasExpense && (
                        <div style={{
                            flex: 1, borderRadius: 3, background: '#ef4444',
                            height: `${Math.max(25, (day.expense / maxBar) * 100)}%`,
                            minHeight: 4,
                        }} />
                    )}
                    {hasIncome && (
                        <div style={{
                            flex: 1, borderRadius: 3, background: '#10b981',
                            height: `${Math.max(25, (day.income / maxBar) * 100)}%`,
                            minHeight: 4,
                        }} />
                    )}
                </div>
            )}

            {/* Amount labels */}
            {(hasExpense || hasIncome) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {hasExpense && (
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: '#ef4444' }}>
                            −{fmt(day.expense)}
                        </span>
                    )}
                    {hasIncome && (
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: '#10b981' }}>
                            +{fmt(day.income)}
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}

// ── Day detail panel ──
const DayPanel = ({ day }) => {
    if (!day) return null
    const net = day.income - day.expense
    const weekday = new Date(day.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' })

    return (
        <div style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
            padding: '18px 20px', marginBottom: 20,
        }}>
            <div style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>{fmtDate(day.date)}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{weekday}</div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {[
                    { label: 'Expense', value: fmt(day.expense), count: day.expenseCount, color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
                    { label: 'Income', value: fmt(day.income), count: day.incomeCount, color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
                    {
                        label: 'Net',
                        value: (net >= 0 ? '+' : '') + fmt(net),
                        count: null,
                        color: net >= 0 ? '#4f46e5' : '#ef4444',
                        bg: net >= 0 ? '#eef2ff' : '#fef2f2',
                        border: net >= 0 ? '#c7d2fe' : '#fecaca',
                    },
                ].map(({ label, value, count, color, bg, border }) => (
                    <div key={label} style={{
                        flex: 1, minWidth: 100,
                        background: bg, borderRadius: 10,
                        padding: '12px 14px',
                        border: `1px solid ${border}`,
                    }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                            {label}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
                        {count !== null && (
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                                {count} transaction{count !== 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── Main Calendar Page ──
export default function Calendar({ user }) {
    const now = new Date()
    const [year, setYear] = useState(now.getFullYear())
    const [month, setMonth] = useState(now.getMonth() + 1)
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState(null)
    const [error, setError] = useState(null)

    const fetchData = useCallback(async () => {
        if (!user?.user_id) return
        setLoading(true)
        setError(null)
        setSelected(null)
        try {
            const res = await API.get('/api/calendar/monthly', {
                params: { user_id: user.user_id, year, month }
            })
            setData(res.data)
        } catch {
            setError('Failed to load calendar data.')
        } finally {
            setLoading(false)
        }
    }, [user?.user_id, year, month])

    useEffect(() => { fetchData() }, [fetchData])

    const prevMonth = () => {
        if (month === 1) { setYear(y => y - 1); setMonth(12) }
        else setMonth(m => m - 1)
    }
    const nextMonth = () => {
        if (month === 12) { setYear(y => y + 1); setMonth(1) }
        else setMonth(m => m + 1)
    }
    const canGoNext = !(year === now.getFullYear() && month === now.getMonth() + 1)

    const buildGrid = (days) => {
        if (!days?.length) return []
        const firstDow = new Date(`${year}-${String(month).padStart(2, '0')}-01`).getDay()
        const grid = []
        for (let i = 0; i < firstDow; i++) grid.push(null)
        days.forEach(d => grid.push(d))
        while (grid.length % 7 !== 0) grid.push(null)
        return grid
    }

    const grid = data ? buildGrid(data.days) : []
    const s = data?.summary
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    const years = []
    for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--) years.push(y)

    return (
        <div style={{ maxWidth: 2000, margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`
        .cal-day:hover  { background: #f8fafc !important; border-color: #6366f1 !important; }
        .cal-nav-btn:hover { background: #f1f5f9 !important; }
      `}</style>

            {/* ── Page header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>Calendar</h1>
                    <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Daily income & expense overview</p>
                </div>

                {/* Navigator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <select
                        value={year}
                        onChange={e => setYear(parseInt(e.target.value))}
                        style={{
                            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                            color: '#0f172a', fontSize: 13, fontWeight: 600,
                            padding: '8px 12px', cursor: 'pointer', outline: 'none',
                        }}
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>

                    <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <button onClick={prevMonth} className="cal-nav-btn"
                            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px 14px', display: 'flex', alignItems: 'center', transition: 'background .15s' }}>
                            <Icon d={ICONS.prev} size={16} />
                        </button>
                        <span style={{ color: '#0f172a', fontWeight: 700, fontSize: 14, minWidth: 90, textAlign: 'center' }}>
                            {MONTHS[month - 1]}
                        </span>
                        <button onClick={nextMonth} disabled={!canGoNext} className="cal-nav-btn"
                            style={{ background: 'none', border: 'none', color: canGoNext ? '#64748b' : '#e2e8f0', cursor: canGoNext ? 'pointer' : 'not-allowed', padding: '8px 14px', display: 'flex', alignItems: 'center', transition: 'background .15s' }}>
                            <Icon d={ICONS.next} size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Summary cards ── */}
            {s && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                    <StatCard label="Total Expense" value={fmt(s.totalExpense)} sub={`${s.daysInMonth} days in month`} color="#ef4444" icon={ICONS.expense} />
                    <StatCard label="Total Income" value={fmt(s.totalIncome)} sub={`Net: ${s.totalIncome - s.totalExpense >= 0 ? '+' : ''}${fmt(s.totalIncome - s.totalExpense)}`} color="#10b981" icon={ICONS.income} />
                    <StatCard label="Avg Expense / Day" value={fmt(s.avgExpensePerDay)} sub={`Over ${s.elapsedDays} day${s.elapsedDays !== 1 ? 's' : ''}`} />
                    <StatCard label="Avg Income / Day" value={fmt(s.avgIncomePerDay)} sub={`Over ${s.elapsedDays} day${s.elapsedDays !== 1 ? 's' : ''}`} color="#4f46e5" icon={ICONS.avg} />
                    <StatCard label="Most Expensive Day" value={s.mostExpensiveDay ? fmt(s.mostExpensiveDay.amount) : '—'} sub={s.mostExpensiveDay ? fmtDate(s.mostExpensiveDay.date) : 'No expenses yet'} color="#ef4444" icon={ICONS.fire} />
                    <StatCard label="Highest Income Day" value={s.mostIncomeDay ? fmt(s.mostIncomeDay.amount) : '—'} sub={s.mostIncomeDay ? fmtDate(s.mostIncomeDay.date) : 'No income yet'} color="#10b981" icon={ICONS.fire} />
                </div>
            )}

            {/* ── Selected day detail ── */}
            {selected && <DayPanel day={selected} />}

            {/* ── Loading spinner ── */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                    <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                    Loading…
                </div>
            )}

            {/* ── Error ── */}
            {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 18px', color: '#dc2626', fontSize: 14, marginBottom: 20 }}>
                    {error}
                </div>
            )}

            {/* ── Calendar grid ── */}
            {!loading && !error && data && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 18px' }}>

                    {/* Weekday headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
                        {WEEKDAYS.map(w => (
                            <div key={w} style={{
                                textAlign: 'center', fontSize: 11, fontWeight: 700,
                                color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 0',
                            }}>{w}</div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                        {grid.map((day, i) => (
                            <DayCell
                                key={i}
                                day={day}
                                isToday={day?.date === todayStr}
                                onSelect={setSelected}
                                selected={selected}
                            />
                        ))}
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 18, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                        {[['#ef4444', 'Expense'], ['#10b981', 'Income']].map(([c, l]) => (
                            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 3, background: c }} />
                                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{l}</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 3, border: '1.5px solid #4f46e5', background: '#eef2ff' }} />
                            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Today / Selected</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Empty state ── */}
            {!loading && !error && data && data.days.every(d => d.expense === 0 && d.income === 0) && (
                <div style={{ textAlign: 'center', padding: '28px 0 0', color: '#94a3b8', fontSize: 14 }}>
                    No transactions recorded for {MONTHS[month - 1]} {year}.
                </div>
            )}
        </div>
    )
}