import { useState, useEffect, useRef, useCallback } from 'react'
import API from '../utils/api'
import { useToast } from '../components/Toast'

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const ICONS = {
  plus:       'M12 5v14M5 12h14',
  edit:       'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  trash:      'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  search:     'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
  filter:     'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
  check:      'M20 6L9 17l-5-5',
  x:          'M18 6L6 18M6 6l12 12',
  chevLeft:   'M15 18l-6-6 6-6',
  chevRight:  'M9 18l6-6-6-6',
  calendar:   'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  tag:        'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01',
  receipt:    'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  arrowUp:    'M12 19V5M5 12l7-7 7 7',
  arrowDown:  'M12 5v14M5 12l7 7 7-7',
  empty:      'M9 17H7A5 5 0 017 7h1M15 7h1a5 5 0 010 10h-2M8 12h8',
  rupee:      'M6 3h12M6 8h12M9 3v18M13 8l-4 13',
}

/* ── Animated Modal ── */
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
      position: 'fixed', inset: 0, zIndex: 300,
      background: `rgba(15,23,42,${visible ? 0.5 : 0})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background 0.25s ease',
      backdropFilter: visible ? 'blur(4px)' : 'none',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20,
        boxShadow: '0 32px 80px rgba(0,0,0,0.2)',
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

/* ── Delete Modal ── */
const DeleteModal = ({ open, item, onClose, onConfirm }) => (
  <AnimatedModal open={open} onClose={onClose} width={380}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', color: '#ef4444' }}>
        <Icon d={ICONS.trash} size={26} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Delete Expense?</h3>
      <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 8px', lineHeight: 1.6 }}>
        <strong style={{ color: '#1e293b' }}>₹{item?.amount}</strong> — {item?.expense_category_name || 'Uncategorised'}
      </p>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 24px' }}>This cannot be undone.</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
        <button onClick={onConfirm} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Delete</button>
      </div>
    </div>
  </AnimatedModal>
)

/* ── Form Field ── */
const Field = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>{label}</label>
    {children}
  </div>
)

const inputStyle = (accent = '#4f46e5') => ({
  width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10,
  padding: '10px 14px', fontSize: 14, color: '#1e293b', outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box', background: '#f8fafc',
  transition: 'border-color 0.15s, box-shadow 0.15s',
})

/* ── Add / Edit Modal ── */
const ExpenseModal = ({ open, onClose, onSave, item, categories }) => {
  const isEdit = !!item
  const [form, setForm] = useState({ expense_category_id: '', amount: '', date: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(isEdit ? {
        expense_category_id: item.expense_category_id || '',
        amount: item.amount || '',
        date: item.date ? item.date.slice(0, 10) : '',
        description: item.description || '',
      } : { expense_category_id: '', amount: '', date: new Date().toISOString().slice(0, 10), description: '' })
    }
  }, [open, item, isEdit])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handle = async () => {
    if (!form.amount || !form.date) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  const focusStyle = e => { e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)' }
  const blurStyle  = e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }

  return (
    <AnimatedModal open={open} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
          <Icon d={isEdit ? ICONS.edit : ICONS.plus} size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>{isEdit ? 'Edit Expense' : 'New Expense'}</h3>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{isEdit ? 'Update the expense details' : 'Add a new expense entry'}</p>
        </div>
      </div>

      <Field label="Category">
        <select value={form.expense_category_id} onChange={e => set('expense_category_id', e.target.value)}
          onFocus={focusStyle} onBlur={blurStyle}
          style={{ ...inputStyle(), appearance: 'none', cursor: 'pointer' }}>
          <option value="">— Select category —</option>
          {categories.map(c => <option key={c._id} value={c.expense_category_id}>{c.expense_category_name}</option>)}
        </select>
      </Field>

      <Field label="Amount (₹)">
        <input type="number" min="0" step="0.01" placeholder="0.00"
          value={form.amount} onChange={e => set('amount', e.target.value)}
          onFocus={focusStyle} onBlur={blurStyle} style={inputStyle()} />
      </Field>

      <Field label="Date">
        <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
          onFocus={focusStyle} onBlur={blurStyle} style={inputStyle()} />
      </Field>

      <Field label="Description">
        <textarea placeholder="What was this expense for?" rows={3}
          value={form.description} onChange={e => set('description', e.target.value)}
          onFocus={focusStyle} onBlur={blurStyle}
          style={{ ...inputStyle(), resize: 'vertical', minHeight: 80 }} />
      </Field>

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
        <button onClick={handle} disabled={!form.amount || !form.date || saving}
          style={{ flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', background: form.amount && form.date ? '#4f46e5' : '#c7d2fe', color: '#fff', fontWeight: 700, fontSize: 14, cursor: form.amount && form.date && !saving ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s' }}>
          <Icon d={ICONS.check} size={15} />
          {saving ? 'Saving…' : isEdit ? 'Update Expense' : 'Add Expense'}
        </button>
      </div>
    </AnimatedModal>
  )
}

/* ── Category Badge ── */
const CategoryBadge = ({ name }) => (
  <span style={{ background: '#eef2ff', color: '#4f46e5', borderRadius: 20, fontSize: 11.5, fontWeight: 600, padding: '3px 10px', whiteSpace: 'nowrap' }}>
    {name || 'Uncategorised'}
  </span>
)

/* ── Expense Row ── */
const ExpenseRow = ({ item, onEdit, onDelete, index }) => {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), index * 35); return () => clearTimeout(t) }, [index])
  const date = new Date(item.date)
  const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto auto auto', alignItems: 'center', gap: 16,
      padding: '14px 20px', borderBottom: '1px solid #f1f5f9',
      opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-12px)',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
    }} className="expense-row">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
          <Icon d={ICONS.receipt} size={16} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.description || '—'}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{dateStr}</div>
        </div>
      </div>
      <CategoryBadge name={item.expense_category_name} />
      <div style={{ fontSize: 15, fontWeight: 700, color: '#ef4444', whiteSpace: 'nowrap' }}>
        ₹{parseFloat(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => onEdit(item)} className="row-action-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 7, borderRadius: 8, color: '#94a3b8', display: 'flex', transition: 'all 0.15s' }}>
          <Icon d={ICONS.edit} size={14} />
        </button>
        <button onClick={() => onDelete(item)} className="row-action-btn-del" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 7, borderRadius: 8, color: '#94a3b8', display: 'flex', transition: 'all 0.15s' }}>
          <Icon d={ICONS.trash} size={14} />
        </button>
      </div>
    </div>
  )
}

/* ── Main Page ── */
const Expenses = ({ user }) => {
  const toast = useToast()

  const [items, setItems]         = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]     = useState(true)
  const [pagination, setPagination] = useState({ total: 0, offset: 0, limit: 20, hasNextPage: false, hasPrevPage: false })

  const [search, setSearch]       = useState('')
  const [fromDate, setFromDate]   = useState('')
  const [toDate, setToDate]       = useState('')
  const [catFilter, setCatFilter] = useState('')

  const [addOpen, setAddOpen]     = useState(false)
  const [editItem, setEditItem]   = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)

  const searchTimer = useRef(null)

  const fetchCategories = useCallback(async () => {
    try {
      const res = await API.get('/api/expenseCategory/list', { params: { user_id: user?.user_id } })
      setCategories(res.data?.expenseCategories || [])
    } catch { /* silent */ }
  }, [user?.user_id])

  const fetchList = useCallback(async (offset = 0, overrides = {}) => {
    if (!user?.user_id) return
    setLoading(true)
    try {
      const params = {
        user_id:   user.user_id,
        offset,
        limit:     pagination.limit,
        search:    overrides.search    ?? search,
        from_date: overrides.fromDate  ?? fromDate,
        to_date:   overrides.toDate    ?? toDate,
        expense_category_id: overrides.catFilter ?? catFilter,
      }
      // remove empty params
      Object.keys(params).forEach(k => !params[k] && delete params[k])
      const res = await API.get('/api/expenseList/list', { params })
      setItems(res.data?.expenses || [])
      setPagination(res.data?.pagination || {})
    } catch {
      toast.error('Failed to load expenses.')
    } finally {
      setLoading(false)
    }
  }, [user?.user_id, search, fromDate, toDate, catFilter, pagination.limit])

  useEffect(() => {
    if (user?.user_id) {
      fetchCategories()
      fetchList(0)
    }
  }, [user?.user_id])

  // Debounced search
  const handleSearch = (val) => {
    setSearch(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchList(0, { search: val }), 400)
  }

  const handleFilter = (key, val) => {
    const overrides = {}
    if (key === 'fromDate') { setFromDate(val); overrides.fromDate = val }
    if (key === 'toDate')   { setToDate(val);   overrides.toDate   = val }
    if (key === 'cat')      { setCatFilter(val); overrides.catFilter = val }
    fetchList(0, overrides)
  }

  const handleAdd = async (form) => {
    try {
      await API.post('/api/expenseList/create', { ...form, user_id: user.user_id })
      toast.success('Expense added successfully.', 'Added')
      setAddOpen(false)
      fetchList(pagination.offset)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add expense.')
    }
  }

  const handleEdit = async (form) => {
    try {
      await API.put('/api/expenseList/update', { ...form, expense_id: editItem._id })
      toast.success('Expense updated.', 'Updated')
      setEditItem(null)
      fetchList(pagination.offset)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update expense.')
    }
  }

  const handleDelete = async () => {
    try {
      await API.delete('/api/expenseList/delete', { data: { expense_id: deleteItem._id } })
      toast.success('Expense deleted.', 'Deleted')
      setDeleteItem(null)
      fetchList(pagination.offset)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete.')
    }
  }

  const clearFilters = () => {
    setSearch(''); setFromDate(''); setToDate(''); setCatFilter('')
    fetchList(0, { search: '', fromDate: '', toDate: '', catFilter: '' })
  }

  const hasFilters = search || fromDate || toDate || catFilter
  const totalPages = Math.ceil(pagination.total / pagination.limit)
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1

  return (
    <div style={{ maxWidth: 2000 }}>
      <style>{`
        .expense-row:hover { background: #fafbff !important; }
        .row-action-btn:hover { color: #4f46e5 !important; background: #eef2ff !important; }
        .row-action-btn-del:hover { color: #ef4444 !important; background: #fef2f2 !important; }
        .filter-input:focus { border-color: #4f46e5 !important; box-shadow: 0 0 0 3px rgba(79,70,229,0.08) !important; }
        .page-btn:hover:not(:disabled) { background: #4f46e5 !important; color: #fff !important; border-color: #4f46e5 !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>Expenses</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
            Track and manage all your expenses
            {pagination.total > 0 && <span style={{ marginLeft: 8, background: '#fef2f2', color: '#ef4444', borderRadius: 20, fontSize: 12, fontWeight: 700, padding: '2px 10px' }}>{pagination.total} total</span>}
          </p>
        </div>
        <button onClick={() => setAddOpen(true)} style={{
          display: 'flex', alignItems: 'center', gap: 7, background: '#ef4444',
          color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px',
          fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
          boxShadow: '0 4px 14px rgba(239,68,68,0.3)', transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.transform = 'translateY(0)' }}>
          <Icon d={ICONS.plus} size={16} /> Add Expense
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {/* Search */}
        <div style={{ flex: '1 1 200px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
            <Icon d={ICONS.search} size={14} />
          </span>
          <input value={search} onChange={e => handleSearch(e.target.value)}
            placeholder="Search description, category, amount…"
            className="filter-input"
            style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 12px 9px 34px', fontSize: 13, color: '#1e293b', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', transition: 'border-color 0.15s, box-shadow 0.15s' }} />
        </div>

        {/* Category */}
        <div style={{ flex: '1 1 160px' }}>
          <select value={catFilter} onChange={e => handleFilter('cat', e.target.value)}
            className="filter-input"
            style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: catFilter ? '#1e293b' : '#94a3b8', outline: 'none', background: '#f8fafc', cursor: 'pointer', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s', appearance: 'none' }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c._id} value={c.expense_category_id}>{c.expense_category_name}</option>)}
          </select>
        </div>

        {/* From date */}
        <div style={{ flex: '0 1 150px' }}>
          <input type="date" value={fromDate} onChange={e => handleFilter('fromDate', e.target.value)}
            className="filter-input"
            style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: fromDate ? '#1e293b' : '#94a3b8', outline: 'none', background: '#f8fafc', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' }} />
        </div>

        {/* To date */}
        <div style={{ flex: '0 1 150px' }}>
          <input type="date" value={toDate} onChange={e => handleFilter('toDate', e.target.value)}
            className="filter-input"
            style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: toDate ? '#1e293b' : '#94a3b8', outline: 'none', background: '#f8fafc', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' }} />
        </div>

        {/* Clear */}
        {hasFilters && (
          <button onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
            <Icon d={ICONS.x} size={13} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 16, padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Description / Date</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Category</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Amount</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Actions</span>
        </div>

        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: '56px 0', textAlign: 'center' }}>
            <div style={{ color: '#cbd5e1', marginBottom: 12 }}><Icon d={ICONS.empty} size={40} /></div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>{hasFilters ? 'No results match your filters' : 'No expenses yet'}</div>
            <div style={{ fontSize: 13, color: '#cbd5e1', marginTop: 4 }}>{hasFilters ? 'Try clearing the filters' : 'Add your first expense above'}</div>
          </div>
        ) : (
          items.map((item, i) => (
            <ExpenseRow key={item._id} item={item} index={i} onEdit={setEditItem} onDelete={setDeleteItem} />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, padding: '0 4px' }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>
            Showing <strong>{pagination.offset + 1}–{Math.min(pagination.offset + pagination.limit, pagination.total)}</strong> of <strong>{pagination.total}</strong>
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button disabled={!pagination.hasPrevPage} className="page-btn"
              onClick={() => fetchList(pagination.offset - pagination.limit)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', color: pagination.hasPrevPage ? '#1e293b' : '#cbd5e1', fontSize: 13, fontWeight: 600, cursor: pagination.hasPrevPage ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
              <Icon d={ICONS.chevLeft} size={14} /> Prev
            </button>
            <span style={{ fontSize: 13, color: '#64748b', padding: '0 8px' }}>Page {currentPage} of {totalPages}</span>
            <button disabled={!pagination.hasNextPage} className="page-btn"
              onClick={() => fetchList(pagination.offset + pagination.limit)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', color: pagination.hasNextPage ? '#1e293b' : '#cbd5e1', fontSize: 13, fontWeight: 600, cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
              Next <Icon d={ICONS.chevRight} size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ExpenseModal open={addOpen} onClose={() => setAddOpen(false)} onSave={handleAdd} categories={categories} />
      <ExpenseModal open={!!editItem} onClose={() => setEditItem(null)} onSave={handleEdit} item={editItem} categories={categories} />
      <DeleteModal open={!!deleteItem} item={deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} />
    </div>
  )
}

export default Expenses