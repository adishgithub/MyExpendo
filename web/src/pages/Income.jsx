import { useState, useEffect, useRef, useCallback } from 'react'
import API from '../utils/api'
import { useToast } from '../components/Toast'
import DateRangeFilter, { calcLast30 } from '../components/DateRangeFilter'

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const ICONS = {
  plus: 'M12 5v14M5 12h14',
  edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
  check: 'M20 6L9 17l-5-5',
  x: 'M18 6L6 18M6 6l12 12',
  chevLeft: 'M15 18l-6-6 6-6',
  chevRight: 'M9 18l6-6-6-6',
  income: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 7h2v4h2l-3 3-3-3h2V9z',
  empty: 'M9 17H7A5 5 0 017 7h1M15 7h1a5 5 0 010 10h-2M8 12h8',
  arrowUp: 'M12 19V5M5 12l7-7 7 7',
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
      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Delete Income?</h3>
      <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 8px', lineHeight: 1.6 }}>
        <strong style={{ color: '#1e293b' }}>₹{item?.amount}</strong> — {item?.income_category_name || 'Uncategorised'}
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

const inputBase = {
  width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10,
  padding: '10px 14px', fontSize: 14, color: '#1e293b', outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box', background: '#f8fafc',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

/* ── Add / Edit Modal ── */
const IncomeModal = ({ open, onClose, onSave, item, categories }) => {
  const isEdit = !!item
  const [form, setForm] = useState({ income_category_id: '', amount: '', date: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(isEdit ? {
        income_category_id: item.income_category_id || '',
        amount: item.amount || '',
        date: item.date ? item.date.slice(0, 10) : '',
        description: item.description || '',
      } : { income_category_id: '', amount: '', date: new Date().toISOString().slice(0, 10), description: '' })
    }
  }, [open, item, isEdit])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const focusStyle = e => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)' }
  const blurStyle = e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }

  const handle = async () => {
    if (!form.amount || !form.date) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <AnimatedModal open={open} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
          <Icon d={isEdit ? ICONS.edit : ICONS.plus} size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>{isEdit ? 'Edit Income' : 'New Income'}</h3>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{isEdit ? 'Update the income details' : 'Add a new income entry'}</p>
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
          style={{ ...inputBase, resize: 'vertical', minHeight: 80 }} />
      </Field>

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
        <button onClick={handle} disabled={!form.amount || !form.date || saving}
          style={{ flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', background: form.amount && form.date ? '#10b981' : '#a7f3d0', color: '#fff', fontWeight: 700, fontSize: 14, cursor: form.amount && form.date && !saving ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s' }}>
          <Icon d={ICONS.check} size={15} />
          {saving ? 'Saving…' : isEdit ? 'Update Income' : 'Add Income'}
        </button>
      </div>
    </AnimatedModal>
  )
}

/* ── Category Badge ── */
const CategoryBadge = ({ name }) => (
  <span style={{ background: '#f0fdf4', color: '#059669', borderRadius: 20, fontSize: 11.5, fontWeight: 600, padding: '3px 10px', whiteSpace: 'nowrap' }}>
    {name || 'Uncategorised'}
  </span>
)

/* ── Income Row ── */
const IncomeRow = ({ item, onEdit, onDelete, index }) => {
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
    }} className="income-row">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
          <Icon d={ICONS.arrowUp} size={16} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.description || '—'}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{dateStr}</div>
        </div>
      </div>
      <CategoryBadge name={item.income_category_name} />
      <div style={{ fontSize: 15, fontWeight: 700, color: '#10b981', whiteSpace: 'nowrap' }}>
        +₹{parseFloat(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => onEdit(item)} className="row-action-btn-inc" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 7, borderRadius: 8, color: '#94a3b8', display: 'flex', transition: 'all 0.15s' }}>
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
const Income = ({ user }) => {
  const toast = useToast()

  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ total: 0, offset: 0, limit: 20, hasNextPage: false, hasPrevPage: false })

  const [search, setSearch] = useState('')
  const _last30 = calcLast30()
  const [fromDate, setFromDate] = useState(_last30.from)
  const [toDate, setToDate] = useState(_last30.to)
  const [catFilter, setCatFilter] = useState('')

  const [totals, setTotals] = useState({ total: 0, count: 0 })
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)

  const searchTimer = useRef(null)

  const fetchCategories = useCallback(async () => {
    try {
      const res = await API.get('/api/incomeCategory/list', { params: { user_id: user?.user_id } })
      setCategories(res.data?.incomeCategories || [])
    } catch { /* silent */ }
  }, [user?.user_id])

  const fetchList = useCallback(async (offset = 0, overrides = {}) => {
    if (!user?.user_id) return
    setLoading(true)
    try {
      const params = {
        user_id: user.user_id,
        offset,
        limit: pagination.limit,
        search: overrides.search ?? search,
        from_date: overrides.fromDate ?? fromDate,
        to_date: overrides.toDate ?? toDate,
        income_category_id: overrides.catFilter ?? catFilter,
      }
      Object.keys(params).forEach(k => !params[k] && delete params[k])
      const res = await API.get('/api/incomeList/list', { params })
      setItems(res.data?.incomes || [])
      setPagination(res.data?.pagination || {})
      setTotals({ total: res.data?.totalAmount || 0, count: res.data?.pagination?.total || 0 })
    } catch {
      toast.error('Failed to load incomes.')
    } finally {
      setLoading(false)
    }
  }, [user?.user_id, search, fromDate, toDate, catFilter, pagination.limit])

  useEffect(() => {
    if (user?.user_id) {
      fetchCategories()
      fetchList(0, { fromDate: _last30.from, toDate: _last30.to })
    }
  }, [user?.user_id])

  const handleSearch = (val) => {
    setSearch(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchList(0, { search: val }), 400)
  }

  const handleFilter = (key, val) => {
    const overrides = {}
    if (key === 'fromDate') { setFromDate(val); overrides.fromDate = val }
    if (key === 'toDate') { setToDate(val); overrides.toDate = val }
    if (key === 'cat') { setCatFilter(val); overrides.catFilter = val }
    fetchList(0, overrides)
  }

  const handleAdd = async (form) => {
    try {
      await API.post('/api/incomeList/create', { ...form, user_id: user.user_id })
      toast.success('Income added successfully.', 'Added')
      setAddOpen(false)
      fetchList(pagination.offset)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add income.')
    }
  }

  const handleEdit = async (form) => {
    try {
      await API.put('/api/incomeList/update', { ...form, income_id: editItem._id })
      toast.success('Income updated.', 'Updated')
      setEditItem(null)
      fetchList(pagination.offset)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update income.')
    }
  }

  const handleDelete = async () => {
    try {
      await API.delete('/api/incomeList/delete', { data: { income_id: deleteItem._id } })
      toast.success('Income deleted.', 'Deleted')
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
        .income-row:hover { background: #f8fffe !important; }
        .row-action-btn-inc:hover { color: #10b981 !important; background: #f0fdf4 !important; }
        .row-action-btn-del:hover { color: #ef4444 !important; background: #fef2f2 !important; }
        .filter-input-inc:focus { border-color: #10b981 !important; box-shadow: 0 0 0 3px rgba(16,185,129,0.08) !important; }
        .page-btn-inc:hover:not(:disabled) { background: #10b981 !important; color: #fff !important; border-color: #10b981 !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>Income</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
            Track all your income sources
            {pagination.total > 0 && <span style={{ marginLeft: 8, background: '#f0fdf4', color: '#10b981', borderRadius: 20, fontSize: 12, fontWeight: 700, padding: '2px 10px' }}>{pagination.total} total</span>}
          </p>
        </div>

        <button onClick={() => setAddOpen(true)} style={{
          display: 'flex', alignItems: 'center', gap: 7, background: '#10b981',
          color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px',
          fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
          boxShadow: '0 4px 14px rgba(16,185,129,0.3)', transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#059669'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.transform = 'translateY(0)' }}>
          <Icon d={ICONS.plus} size={16} /> Add Income
        </button>
      </div>

      {/* Filters + Total */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ flex: '1 1 200px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
            <Icon d={ICONS.search} size={14} />
          </span>
          <input value={search} onChange={e => handleSearch(e.target.value)}
            placeholder="Search description, category, amount…"
            className="filter-input-inc"
            style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 12px 9px 34px', fontSize: 13, color: '#1e293b', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', transition: 'border-color 0.15s, box-shadow 0.15s' }} />
        </div>

        {/* Category */}
        <div style={{ flex: '1 1 160px' }}>
          <select value={catFilter} onChange={e => handleFilter('cat', e.target.value)}
            className="filter-input-inc"
            style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: catFilter ? '#1e293b' : '#94a3b8', outline: 'none', background: '#f8fafc', cursor: 'pointer', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s', appearance: 'none' }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c._id} value={c.income_category_id}>{c.income_category_name}</option>)}
          </select>
        </div>

        {/* Date range */}
        <DateRangeFilter
          fromDate={fromDate}
          toDate={toDate}
          onApply={(from, to) => {
            setFromDate(from)
            setToDate(to)
            fetchList(0, { fromDate: from, toDate: to })
          }}
          accentColor="#10b981"
        />

        {/* Clear */}
        {hasFilters && (
          <button onClick={clearFilters}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
            <Icon d={ICONS.x} size={13} /> Clear
          </button>
        )}

        {/* Divider */}
        {!loading && totals.total > 0 && (
          <div style={{ width: 1, height: 32, background: '#e2e8f0', flexShrink: 0 }} />
        )}

        {/* Total */}
        {!loading && totals.total > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {hasFilters ? 'Total' : 'Total'}
            </span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#10b981', letterSpacing: '-0.3px' }}>
              +₹{totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
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
            <div style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>{hasFilters ? 'No results match your filters' : 'No income entries yet'}</div>
            <div style={{ fontSize: 13, color: '#cbd5e1', marginTop: 4 }}>{hasFilters ? 'Try clearing the filters' : 'Add your first income entry above'}</div>
          </div>
        ) : (
          items.map((item, i) => (
            <IncomeRow key={item._id} item={item} index={i} onEdit={setEditItem} onDelete={setDeleteItem} />
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
            <button disabled={!pagination.hasPrevPage} className="page-btn-inc"
              onClick={() => fetchList(pagination.offset - pagination.limit)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', color: pagination.hasPrevPage ? '#1e293b' : '#cbd5e1', fontSize: 13, fontWeight: 600, cursor: pagination.hasPrevPage ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
              <Icon d={ICONS.chevLeft} size={14} /> Prev
            </button>
            <span style={{ fontSize: 13, color: '#64748b', padding: '0 8px' }}>Page {currentPage} of {totalPages}</span>
            <button disabled={!pagination.hasNextPage} className="page-btn-inc"
              onClick={() => fetchList(pagination.offset + pagination.limit)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', color: pagination.hasNextPage ? '#1e293b' : '#cbd5e1', fontSize: 13, fontWeight: 600, cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
              Next <Icon d={ICONS.chevRight} size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <IncomeModal open={addOpen} onClose={() => setAddOpen(false)} onSave={handleAdd} categories={categories} />
      <IncomeModal open={!!editItem} onClose={() => setEditItem(null)} onSave={handleEdit} item={editItem} categories={categories} />
      <DeleteModal open={!!deleteItem} item={deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} />
    </div>
  )
}

export default Income