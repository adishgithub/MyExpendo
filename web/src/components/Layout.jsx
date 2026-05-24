import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import API from '../utils/api'
import expendoLogo from '../assets/icon.svg'
import { useToast } from './Toast'
import Modal from './Modal'

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const ICONS = {
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  expenses: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H9l3-3 3 3h-2v4z',
  income: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 7h2v4h2l-3 3-3-3h2V9z',
  tobuy: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18 M16 10a4 4 0 01-8 0',
  payments: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  categories: 'M4 6h16M4 12h16M4 18h7',
  analytics: 'M18 20V10M12 20V4M6 20v-6',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  budgets: 'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  reports: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z',
  help: 'M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01',
  menu: 'M4 6h16M4 12h16M4 18h16',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
  bell: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
  plus: 'M12 5v14M5 12h14',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  check: 'M20 6L9 17l-5-5',
}

const BUILT_ROUTES = ['/', '/account', '/categories', '/expenses', '/income', '/tobuy', '/payments', '/calendar', '/settings']

const TOOLS_NAV = [
  { label: 'Calendar', icon: ICONS.calendar, to: '/calendar' },
  // { label: 'Budgets', icon: ICONS.budgets, to: '/budgets' },
  // { label: 'Reports', icon: ICONS.reports, to: '/reports' },
]
const BOTTOM_NAV = [
  { label: 'Settings', icon: ICONS.settings, to: '/settings' },
  { label: 'Help', icon: ICONS.help, to: '/help' },
]

const APP_VERSION = '1.0.1'

const Avatar = ({ name = '', size = 36 }) => {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', fontSize: size * 0.38,
      background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, flexShrink: 0,
    }}>
      {initials || '?'}
    </div>
  )
}

/* ── Animated Quick-Add Modal (shared) ── */
const AnimatedModal = ({ open, onClose, children, width = 440 }) => {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (open) { setMounted(true); requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true))) }
    else { setVisible(false); const t = setTimeout(() => setMounted(false), 250); return () => clearTimeout(t) }
  }, [open])
  if (!mounted) return null
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: `rgba(15,23,42,${visible ? 0.5 : 0})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background 0.25s ease',
      backdropFilter: visible ? 'blur(4px)' : 'none',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20,
        boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
        padding: '28px 28px 24px',
        width, maxWidth: 'calc(100vw - 32px)',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.95)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {children}
      </div>
    </div>
  )
}

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>{label}</label>
    {children}
  </div>
)

const inputBase = {
  width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10,
  padding: '10px 14px', fontSize: 14, color: '#1e293b', outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box', background: '#f8fafc',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

/* ── Quick Add Expense Modal ── */
const QuickAddExpenseModal = ({ open, onClose, user }) => {
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ expense_category_id: '', amount: '', date: new Date().toISOString().slice(0, 10), description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && user?.user_id) {
      setForm({ expense_category_id: '', amount: '', date: new Date().toISOString().slice(0, 10), description: '' })
      API.get('/api/expenseCategory/dropdown', { params: { user_id: user.user_id } })
        .then(res => setCategories(res.data?.expenseCategories || []))
        .catch(() => { })
    }
  }, [open, user?.user_id])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const accent = '#4f46e5'
  const focusStyle = e => { e.target.style.borderColor = accent; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)' }
  const blurStyle = e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }

  const handle = async () => {
    if (!form.amount || !form.date) return
    setSaving(true)
    try {
      await API.post('/api/expenseList/create', { ...form, user_id: user.user_id })
      toast.success('Expense added successfully.', 'Added')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add expense.')
    } finally {
      setSaving(false)
    }
  }

  const valid = form.amount && form.date

  return (
    <AnimatedModal open={open} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
          <Icon d={ICONS.plus} size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>New Expense</h3>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Add a new expense entry</p>
        </div>
      </div>

      <Field label="Category">
        <select value={form.expense_category_id} onChange={e => set('expense_category_id', e.target.value)}
          onFocus={focusStyle} onBlur={blurStyle}
          style={{ ...inputBase, appearance: 'none', cursor: 'pointer' }}>
          <option value="">— Select category —</option>
          {categories.map(c => <option key={c._id} value={c.expense_category_id}>{c.expense_category_name}</option>)}
        </select>
      </Field>
      <Field label="Amount (₹)">
        <input type="number" min="0" step="0.01" placeholder="0.00"
          value={form.amount} onChange={e => set('amount', e.target.value)}
          onFocus={focusStyle} onBlur={blurStyle} style={inputBase} />
      </Field>
      <Field label="Date">
        <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
          onFocus={focusStyle} onBlur={blurStyle} style={inputBase} />
      </Field>
      <Field label="Description">
        <textarea placeholder="What was this expense for?" rows={3}
          value={form.description} onChange={e => set('description', e.target.value)}
          onFocus={focusStyle} onBlur={blurStyle}
          style={{ ...inputBase, resize: 'vertical', minHeight: 76 }} />
      </Field>

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
        <button onClick={handle} disabled={!valid || saving}
          style={{ flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', background: valid ? accent : '#c7d2fe', color: '#fff', fontWeight: 700, fontSize: 14, cursor: valid && !saving ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s' }}>
          <Icon d={ICONS.check} size={15} />
          {saving ? 'Saving…' : 'Add Expense'}
        </button>
      </div>
    </AnimatedModal>
  )
}

/* ── Quick Add Income Modal ── */
const QuickAddIncomeModal = ({ open, onClose, user }) => {
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ income_category_id: '', amount: '', date: new Date().toISOString().slice(0, 10), description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && user?.user_id) {
      setForm({ income_category_id: '', amount: '', date: new Date().toISOString().slice(0, 10), description: '' })
      API.get('/api/incomeCategory/dropdown', { params: { user_id: user.user_id } })
        .then(res => setCategories(res.data?.incomeCategories || []))
        .catch(() => { })
    }
  }, [open, user?.user_id])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const accent = '#10b981'
  const focusStyle = e => { e.target.style.borderColor = accent; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)' }
  const blurStyle = e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }

  const handle = async () => {
    if (!form.amount || !form.date) return
    setSaving(true)
    try {
      await API.post('/api/incomeList/create', { ...form, user_id: user.user_id })
      toast.success('Income added successfully.', 'Added')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add income.')
    } finally {
      setSaving(false)
    }
  }

  const valid = form.amount && form.date

  return (
    <AnimatedModal open={open} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
          <Icon d={ICONS.plus} size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>New Income</h3>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Add a new income entry</p>
        </div>
      </div>

      <Field label="Category">
        <select value={form.income_category_id} onChange={e => set('income_category_id', e.target.value)}
          onFocus={focusStyle} onBlur={blurStyle}
          style={{ ...inputBase, appearance: 'none', cursor: 'pointer' }}>
          <option value="">— Select category —</option>
          {categories.map(c => <option key={c._id} value={c.income_category_id}>{c.income_category_name}</option>)}
        </select>
      </Field>
      <Field label="Amount (₹)">
        <input type="number" min="0" step="0.01" placeholder="0.00"
          value={form.amount} onChange={e => set('amount', e.target.value)}
          onFocus={focusStyle} onBlur={blurStyle} style={inputBase} />
      </Field>
      <Field label="Date">
        <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
          onFocus={focusStyle} onBlur={blurStyle} style={inputBase} />
      </Field>
      <Field label="Description">
        <textarea placeholder="Source or notes about this income…" rows={3}
          value={form.description} onChange={e => set('description', e.target.value)}
          onFocus={focusStyle} onBlur={blurStyle}
          style={{ ...inputBase, resize: 'vertical', minHeight: 76 }} />
      </Field>

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
        <button onClick={handle} disabled={!valid || saving}
          style={{ flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', background: valid ? accent : '#a7f3d0', color: '#fff', fontWeight: 700, fontSize: 14, cursor: valid && !saving ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s' }}>
          <Icon d={ICONS.check} size={15} />
          {saving ? 'Saving…' : 'Add Income'}
        </button>
      </div>
    </AnimatedModal>
  )
}

/* ── Sidebar ── */
export const Sidebar = ({ collapsed, user, onLogout }) => {
  const navigate = useNavigate()
  const toast = useToast()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [toBuyCount, setToBuyCount] = useState(null)

  // In Sidebar, replace the useEffect that fetches toBuyCount:

  useEffect(() => {
    if (!user?.user_id) return
    API.get('/api/toBuyList/list', {
      params: { user_id: user.user_id, limit: 1, offset: 0, status: 'not ordered' }
    })
      .then(res => setToBuyCount(res.data?.pagination?.total || null))
      .catch(() => { })
  }, [user?.user_id])

  // ADD THIS — defined inside Sidebar so it has access to toBuyCount
  const MAIN_NAV = [
    { label: 'Dashboard', icon: ICONS.dashboard, to: '/' },
    { label: 'Expenses', icon: ICONS.expenses, to: '/expenses' },
    { label: 'Income', icon: ICONS.income, to: '/income' },
    { label: 'To Buy List', icon: ICONS.tobuy, to: '/tobuy', badge: toBuyCount },
    { label: 'Payments / EMI', icon: ICONS.payments, to: '/payments' },
    { label: 'Categories', icon: ICONS.categories, to: '/categories' },
    // { label: 'Analytics', icon: ICONS.analytics, to: '/analytics' },
  ]

  const handleNavClick = (item, e) => {
    if (!BUILT_ROUTES.includes(item.to)) {
      e.preventDefault()
      toast.construction(
        `The ${item.label} page is under development. It'll be ready soon!`,
        'Not Available Yet'
      )
    }
  }

  const NavItem = ({ item }) => {
    const isBuilt = BUILT_ROUTES.includes(item.to)
    return (
      <NavLink to={item.to}
        onClick={(e) => handleNavClick(item, e)}
        style={({ isActive }) => ({
          display: 'flex', alignItems: 'center', gap: 10,
          padding: collapsed ? '10px 0' : '9px 12px',
          borderRadius: 10, cursor: 'pointer', textDecoration: 'none', position: 'relative',
          color: isActive && isBuilt ? '#4f46e5' : '#F0F2F4',
          background: isActive && isBuilt ? '#eef2ff' : 'transparent',
          fontWeight: isActive && isBuilt ? 600 : 400,
          fontSize: 13.5, transition: 'all .18s ease',
          justifyContent: collapsed ? 'center' : 'flex-start',
        })}
        className="sidebar-navitem"
      >
        <span style={{ flexShrink: 0, opacity: 0.85 }}>
          <Icon d={item.icon} size={17} />
        </span>
        {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{item.label}</span>}
        {!collapsed && item.badge > 0 && (
          <span style={{
            marginLeft: 'auto', background: '#4f46e5', color: '#fff',
            borderRadius: 20, fontSize: 10.5, fontWeight: 700, padding: '1px 7px'
          }}>{item.badge}</span>
        )}
        {!isBuilt && collapsed && (
          <span style={{
            position: 'absolute', top: 7, right: 7,
            width: 6, height: 6, borderRadius: '50%',
            background: '#f59e0b', border: '1.5px solid #0f172a',
          }} />
        )}
      </NavLink>
    )
  }

  return (
    <>
      <aside style={{
        width: collapsed ? 64 : 220,
        height: '100vh',
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width .25s ease',
        overflow: 'hidden',
        flexShrink: 0,
        top: 0,
        zIndex: 40,
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '18px 0' : '18px 18px',
          display: 'flex', alignItems: 'center', gap: 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 6,
        }}>
          <div style={{ width: 34, height: 34, flexShrink: 0 }}>
            <img
              src={expendoLogo}
              alt="My Expendo"
              style={{ width: 34, height: 34, borderRadius: 9 }}
            />          </div>
          {!collapsed && (
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>
              My Expendo !
            </span>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '6px 8px' : '6px 10px' }}>
          {!collapsed && (
            <p style={{ color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', padding: '8px 4px 4px', textTransform: 'uppercase' }}>MAIN</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {MAIN_NAV.map(item => <NavItem key={item.to} item={item} />)}
          </div>
          {!collapsed && (
            <p style={{ color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', padding: '14px 4px 4px', textTransform: 'uppercase' }}>TOOLS</p>
          )}
          {collapsed && <div style={{ height: 12 }} />}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {TOOLS_NAV.map(item => <NavItem key={item.to} item={item} />)}
          </div>
        </div>

        {/* Bottom section */}
        <div style={{ padding: collapsed ? '6px 8px' : '6px 10px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {BOTTOM_NAV.map(item => <NavItem key={item.to} item={item} />)}
          </div>

          {/* Logout */}
          <button
            onClick={() => setLogoutOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: collapsed ? '10px 0' : '9px 12px',
              borderRadius: 10, cursor: 'pointer', border: 'none',
              background: 'transparent', width: '100%', marginTop: 2,
              color: '#f87171', fontSize: 13.5, fontWeight: 500,
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'all .18s',
            }}
            className="sidebar-logout"
          >
            <Icon d={ICONS.logout} size={17} />
            {!collapsed && <span>Logout</span>}
          </button>

          {/* User row */}
          {user && (
            <div onClick={() => navigate('/account')}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: collapsed ? '10px 0' : '10px 8px',
                marginTop: 4, borderRadius: 10, cursor: 'pointer',
                transition: 'background .15s',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
              className="sidebar-user">
              <Avatar name={user.full_name || user.username} size={32} />
              {!collapsed && (
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.full_name || user.username}
                  </div>
                  <div style={{ color: '#64748b', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Version */}
          {!collapsed && (
            <div style={{ textAlign: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#334155', fontSize: 10.5, fontWeight: 500, letterSpacing: '0.04em' }}>
                v{APP_VERSION}
              </span>
            </div>
          )}
        </div>

        <style>{`
          .sidebar-navitem:hover { background: rgba(99,102,241,0.12) !important; color: #818cf8 !important; }
          .sidebar-user:hover    { background: rgba(255,255,255,0.05) !important; }
          .sidebar-logout:hover  { background: rgba(239,68,68,0.12) !important; color: #ef4444 !important; }
        `}</style>
      </aside>

      <Modal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={onLogout}
        variant="danger"
        title="Sign out?"
        message="You'll be returned to the login screen. Any unsaved changes will be lost."
        confirmLabel="Yes, sign out"
        cancelLabel="Stay logged in"
      />
    </>
  )
}

/* ── Topbar ── */
export const Topbar = ({ collapsed, toggleSidebar, user, onLogout }) => {
  const [notifOpen, setNotifOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [incomeOpen, setIncomeOpen] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  return (
    <>
      <header style={{
        height: 60, background: '#fff', display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 12, borderBottom: '1px solid #e2e8f0',
        position: 'sticky', top: 0, zIndex: 30, flexShrink: 0,
      }}>
        <button onClick={toggleSidebar}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 7, borderRadius: 8, color: '#64748b', display: 'flex', transition: 'background .15s' }}
          className="topbar-icon-btn">
          <Icon d={ICONS.menu} size={20} />
        </button>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: 380, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
            <Icon d={ICONS.search} size={15} />
          </span>
          <input
            placeholder="Search expenses, items…"
            readOnly
            style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '8px 12px 8px 36px', fontSize: 13, color: '#1e293b', outline: 'none', background: '#f8fafc', transition: 'border .15s', boxSizing: 'border-box', cursor: 'pointer' }}
            onFocus={e => {
              e.target.blur()
              toast.search("Search isn't available yet — we're building it. Stay tuned!", 'Search Coming Soon')
            }}
          />
        </div>

        <div style={{ flex: 1 }} />

        {/* Add Income */}
        <button
          onClick={() => setIncomeOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#059669'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.transform = 'translateY(0)' }}>
          <Icon d={ICONS.plus} size={16} /> Add Income
        </button>

        {/* Add Expense */}
        <button
          onClick={() => setExpenseOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap' }}
          className="add-expense-btn">
          <Icon d={ICONS.plus} size={15} /> Add Expense
        </button>

        {/* Bell */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setNotifOpen(o => !o)}
            style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, color: '#64748b', display: 'flex', transition: 'background .15s' }}
            className="topbar-icon-btn">
            <Icon d={ICONS.bell} size={20} />
            <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '2px solid #fff' }} />
          </button>
          {notifOpen && (
            <div style={{ position: 'absolute', right: 0, top: 44, width: 280, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 16, zIndex: 100 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 12 }}>Notifications</div>
              {['Bank Loan due Oct 1', 'Track Suit added to list', '3 EMIs pending this month'].map((n, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none', fontSize: 13, color: '#475569' }}>• {n}</div>
              ))}
            </div>
          )}
        </div>

        {/* Avatar */}
        <button onClick={() => navigate('/account')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', borderRadius: '50%', padding: 0, transition: 'opacity .15s' }}
          className="topbar-avatar-btn">
          <Avatar name={user?.full_name || user?.username || ''} size={36} />
        </button>

        <style>{`
          .topbar-icon-btn:hover   { background: #f1f5f9 !important; }
          .add-expense-btn:hover   { background: #4338ca !important; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(79,70,229,0.3); }
          .topbar-avatar-btn:hover { opacity: 0.8; }
        `}</style>
      </header>

      {/* Quick-add modals rendered outside header so z-index is clean */}
      <QuickAddExpenseModal open={expenseOpen} onClose={() => setExpenseOpen(false)} user={user} />
      <QuickAddIncomeModal open={incomeOpen} onClose={() => setIncomeOpen(false)} user={user} />
    </>
  )
}

/* ── Layout wrapper ── */
const Layout = ({ children, user, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <Sidebar collapsed={collapsed} user={user} onLogout={onLogout} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <Topbar collapsed={collapsed} toggleSidebar={() => setCollapsed(c => !c)} user={user} onLogout={onLogout} />
        <main style={{ flex: 1, padding: '28px 28px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout