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
  plus: 'M12 5v14M5 12h14',
  edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
  check: 'M20 6L9 17l-5-5',
  x: 'M18 6L6 18M6 6l12 12',
  chevLeft: 'M15 18l-6-6 6-6',
  chevRight: 'M9 18l6-6-6-6',
  empty: 'M9 17H7A5 5 0 017 7h1M15 7h1a5 5 0 010 10h-2M8 12h8',
  cart: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0',
  flame: 'M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z',
  tag: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01',
  arrowUp: 'M12 19V5M5 12l7-7 7 7',
}

const STATUS_OPTIONS = ['Not Ordered', 'Ordered', 'Done']

const STATUS_STYLE = {
  'not ordered': { bg: '#fef3c7', color: '#d97706', label: 'Not Ordered' },
  'ordered': { bg: '#dbeafe', color: '#2563eb', label: 'Ordered' },
  'done': { bg: '#dcfce7', color: '#16a34a', label: 'Done' },
}

const getStatusStyle = (status = '') => STATUS_STYLE[status.toLowerCase()] || STATUS_STYLE['not ordered']

/* ── Animated Modal ── */
const AnimatedModal = ({ open, onClose, children, width = 460 }) => {
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
      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Remove Item?</h3>
      <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 8px', lineHeight: 1.6 }}>
        <strong style={{ color: '#1e293b' }}>{item?.item_name}</strong>
      </p>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 24px' }}>This cannot be undone.</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
        <button onClick={onConfirm} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Remove</button>
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

const ACCENT = '#f97316' // orange — distinct from expenses (indigo) and income (emerald)

/* ── Add Modal ── */
const AddModal = ({ open, onClose, onSave, categories }) => {
  const [form, setForm] = useState({ item_name: '', product_category_id: '', expected_price: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm({ item_name: '', product_category_id: '', expected_price: '' })
  }, [open])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const focusStyle = e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = `0 0 0 3px rgba(249,115,22,0.1)` }
  const blurStyle = e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }

  const handle = async () => {
    if (!form.item_name || !form.expected_price) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  const valid = form.item_name && form.expected_price

  return (
    <AnimatedModal open={open} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT }}>
          <Icon d={ICONS.plus} size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Add to Buy List</h3>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Track something you want to buy</p>
        </div>
      </div>

      <Field label="Item Name">
        <input placeholder="e.g. Running Shoes, Laptop Stand…"
          value={form.item_name} onChange={e => set('item_name', e.target.value)}
          onFocus={focusStyle} onBlur={blurStyle} style={inputBase} />
      </Field>

      <Field label="Category">
        <select value={form.product_category_id} onChange={e => set('product_category_id', e.target.value)}
          onFocus={focusStyle} onBlur={blurStyle}
          style={{ ...inputBase, appearance: 'none', cursor: 'pointer' }}>
          <option value="">— Select category —</option>
          {categories.map(c => <option key={c._id} value={c.product_category_id}>{c.product_category_name}</option>)}
        </select>
      </Field>

      <Field label="Expected Price (₹)">
        <input type="number" min="0" step="0.01" placeholder="0.00"
          value={form.expected_price} onChange={e => set('expected_price', e.target.value)}
          onFocus={focusStyle} onBlur={blurStyle} style={inputBase} />
      </Field>

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
        <button onClick={handle} disabled={!valid || saving}
          style={{ flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', background: valid ? ACCENT : '#fed7aa', color: '#fff', fontWeight: 700, fontSize: 14, cursor: valid && !saving ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s' }}>
          <Icon d={ICONS.check} size={15} />
          {saving ? 'Adding…' : 'Add Item'}
        </button>
      </div>
    </AnimatedModal>
  )
}

/* ── Edit Modal ── */
const EditModal = ({ open, onClose, onSave, item, categories }) => {
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && item) {
      setForm({
        item_name: item.item_name || '',
        product_category_id: item.product_category_id || '',
        status: item.status || 'Not Ordered',
        expected_price: item.expected_price || '',
        actual_price: item.actual_price || '',
        bought_date: item.bought_date ? item.bought_date.slice(0, 10) : '',
      })
    }
  }, [open, item])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const focusStyle = e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = `0 0 0 3px rgba(249,115,22,0.1)` }
  const blurStyle = e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }

  const handle = async () => {
    if (!form.item_name) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  const isDone = form.status?.toLowerCase() === 'done'

  return (
    <AnimatedModal open={open} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT }}>
          <Icon d={ICONS.edit} size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Edit Item</h3>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Update item details</p>
        </div>
      </div>

      <Field label="Item Name">
        <input value={form.item_name} onChange={e => set('item_name', e.target.value)}
          onFocus={focusStyle} onBlur={blurStyle} style={inputBase} />
      </Field>

      <Field label="Category">
        <select value={form.product_category_id} onChange={e => set('product_category_id', e.target.value)}
          onFocus={focusStyle} onBlur={blurStyle}
          style={{ ...inputBase, appearance: 'none', cursor: 'pointer' }}>
          <option value="">— Select category —</option>
          {categories.map(c => <option key={c._id} value={c.product_category_id}>{c.product_category_name}</option>)}
        </select>
      </Field>

      <Field label="Status">
        <select value={form.status} onChange={e => set('status', e.target.value)}
          onFocus={focusStyle} onBlur={blurStyle}
          style={{ ...inputBase, appearance: 'none', cursor: 'pointer' }}>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Expected Price (₹)">
          <input type="number" min="0" step="0.01" placeholder="0.00"
            value={form.expected_price} onChange={e => set('expected_price', e.target.value)}
            onFocus={focusStyle} onBlur={blurStyle} style={inputBase} />
        </Field>
        <Field label="Actual Price (₹)">
          <input type="number" min="0" step="0.01" placeholder="0.00"
            value={form.actual_price} onChange={e => set('actual_price', e.target.value)}
            onFocus={focusStyle} onBlur={blurStyle} style={inputBase} />
        </Field>
      </div>

      {isDone && (
        <Field label="Bought Date">
          <input type="date" value={form.bought_date} onChange={e => set('bought_date', e.target.value)}
            onFocus={focusStyle} onBlur={blurStyle} style={inputBase} />
        </Field>
      )}

      {isDone && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#15803d', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon d={ICONS.check} size={14} />
          Marking as Done will automatically add this to your expenses.
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
        <button onClick={handle} disabled={!form.item_name || saving}
          style={{ flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', background: form.item_name ? ACCENT : '#fed7aa', color: '#fff', fontWeight: 700, fontSize: 14, cursor: form.item_name && !saving ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s' }}>
          <Icon d={ICONS.check} size={15} />
          {saving ? 'Saving…' : 'Update Item'}
        </button>
      </div>
    </AnimatedModal>
  )
}

/* ── Status Badge ── */
const StatusBadge = ({ status }) => {
  const s = getStatusStyle(status)
  return (
    <span style={{ textAlign:'center',background: s.bg, color: s.color, borderRadius: 20, fontSize: 14, fontWeight: 600, padding: '5px 5px', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

/* ── Priority Button ── */
const PriorityBadge = ({ value, onIncrement, loading }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
    <span style={{
      background: value >= 5 ? '#fff7ed' : '#f8fafc',
      color: value >= 5 ? '#f97316' : '#64748b',
      border: `1.5px solid ${value >= 5 ? '#fed7aa' : '#e2e8f0'}`,
      borderRadius: 8, fontSize: 13, fontWeight: 700,
      padding: '3px 10px', minWidth: 32, textAlign: 'center',
      transition: 'all 0.2s',
    }}>
      {value}
    </span>
    <button
      onClick={onIncrement}
      disabled={loading}
      title="Increase priority"
      className="priority-inc-btn"
      style={{
        width: 22, height: 22, borderRadius: 6, border: '1.5px solid #e2e8f0',
        background: '#f8fafc', color: '#94a3b8', cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0, transition: 'all 0.15s', flexShrink: 0,
      }}>
      <Icon d={ICONS.plus} size={11} />
    </button>
  </div>
)

/* ── Row ── */
const ToBuyRow = ({ item, onEdit, onDelete, onIncrementPriority, priorityLoading, index }) => {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), index * 35); return () => clearTimeout(t) }, [index])

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 90px 140px 140px 130px 70px',
      alignItems: 'center', gap: 16,
      padding: '12px 20px', borderBottom: '1px solid #f1f5f9',
      opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-12px)',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
    }} className="tobuy-row">
      {/* Item info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT, flexShrink: 0 }}>
          <Icon d={ICONS.cart} size={16} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.item_name}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
            {item.product_category_name || 'Uncategorised'}
          </div>
        </div>
      </div>

      {/* Priority */}
      <PriorityBadge
        value={item.priority_point || 1}
        onIncrement={() => onIncrementPriority(item)}
        loading={priorityLoading === item.item_id}
      />

      {/* Status */}
      <StatusBadge status={item.status} />

      {/* Expected price */}
      <div style={{ fontSize: 15, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>
        ₹{parseFloat(item.expected_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </div>

      {/* Actual price (only if set) */}
      <div style={{ fontSize: 15, fontWeight: 700, color: '#f97316', whiteSpace: 'nowrap' }}>
        {item.actual_price
          ? `₹${parseFloat(item.actual_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
          : <span style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 400 }}>—</span>
        }
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => onEdit(item)} className="row-action-btn-buy" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 7, borderRadius: 8, color: '#94a3b8', display: 'flex', transition: 'all 0.15s' }}>
          <Icon d={ICONS.edit} size={14} />
        </button>
        <button onClick={() => onDelete(item)} className="row-action-btn-del-buy" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 7, borderRadius: 8, color: '#94a3b8', display: 'flex', transition: 'all 0.15s' }}>
          <Icon d={ICONS.trash} size={14} />
        </button>
      </div>
    </div>
  )
}

/* ── Main Page ── */
const ToBuyList = ({ user }) => {
  const toast = useToast()

  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ total: 0, offset: 0, limit: 20, hasNextPage: false, hasPrevPage: false })
  const [priorityLoading, setPriorityLoading] = useState(null)

  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)

  const searchTimer = useRef(null)

  const fetchCategories = useCallback(async () => {
    try {
      const res = await API.get('/api/productCategory/list', { params: { user_id: user?.user_id } })
      setCategories(res.data?.productCategories || [])
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
      }
      Object.keys(params).forEach(k => (params[k] === '' || params[k] === undefined) && delete params[k])
      const res = await API.get('/api/toBuyList/list', { params })
      setItems(res.data?.items || [])
      setPagination(res.data?.pagination || {})
    } catch {
      toast.error('Failed to load buy list.')
    } finally {
      setLoading(false)
    }
  }, [user?.user_id, search, pagination.limit])

  useEffect(() => {
    if (user?.user_id) {
      fetchCategories()
      fetchList(0)
    }
  }, [user?.user_id])

  const handleSearch = (val) => {
    setSearch(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchList(0, { search: val }), 400)
  }

  const handleAdd = async (form) => {
    try {
      await API.post('/api/toBuyList/create', { ...form, user_id: user.user_id })
      toast.success('Item added to buy list.', 'Added')
      setAddOpen(false)
      fetchList(pagination.offset)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add item.')
    }
  }

  const handleEdit = async (form) => {
    try {
      await API.put('/api/toBuyList/update', { ...form, item_id: editItem.item_id })
      toast.success('Item updated.', 'Updated')
      setEditItem(null)
      fetchList(pagination.offset)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update item.')
    }
  }

  const handleDelete = async () => {
    try {
      await API.delete('/api/toBuyList/delete', { data: { item_id: deleteItem.item_id } })
      toast.success('Item removed.', 'Removed')
      setDeleteItem(null)
      fetchList(pagination.offset)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete item.')
    }
  }

  const handleIncrementPriority = async (item) => {
    setPriorityLoading(item.item_id)
    // Optimistically update UI
    setItems(prev => prev.map(i =>
      i.item_id === item.item_id ? { ...i, priority_point: (i.priority_point || 1) + 1 } : i
    ))
    try {
      await API.put('/api/toBuyList/update', {
        item_id: item.item_id,
        priority_point: (item.priority_point || 1) + 1,
      })
    } catch {
      // Roll back on failure
      setItems(prev => prev.map(i =>
        i.item_id === item.item_id ? { ...i, priority_point: item.priority_point } : i
      ))
      toast.error('Failed to update priority.')
    } finally {
      setPriorityLoading(null)
    }
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit)
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1

  return (
    <div style={{ maxWidth: 2000 }}>
      <style>{`
        .tobuy-row:hover           { background: #fffbf7 !important; }
        .row-action-btn-buy:hover  { color: ${ACCENT} !important; background: #fff7ed !important; }
        .row-action-btn-del-buy:hover { color: #ef4444 !important; background: #fef2f2 !important; }
        .filter-input-buy:focus    { border-color: ${ACCENT} !important; box-shadow: 0 0 0 3px rgba(249,115,22,0.08) !important; }
        .page-btn-buy:hover:not(:disabled) { background: ${ACCENT} !important; color: #fff !important; border-color: ${ACCENT} !important; }
        .priority-inc-btn:hover    { background: #fff7ed !important; color: ${ACCENT} !important; border-color: #fed7aa !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>To Buy List</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
            Plan and track items you want to purchase
            {pagination.total > 0 && (
              <span style={{ marginLeft: 8, background: '#fff7ed', color: ACCENT, borderRadius: 20, fontSize: 12, fontWeight: 700, padding: '2px 10px' }}>
                {pagination.total} items
              </span>
            )}
          </p>
        </div>
        <button onClick={() => setAddOpen(true)} style={{
          display: 'flex', alignItems: 'center', gap: 7, background: ACCENT,
          color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px',
          fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
          boxShadow: '0 4px 14px rgba(249,115,22,0.3)', transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#ea580c'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.transform = 'translateY(0)' }}>
          <Icon d={ICONS.plus} size={16} /> Add Item
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
            <Icon d={ICONS.search} size={14} />
          </span>
          <input value={search} onChange={e => handleSearch(e.target.value)}
            placeholder="Search item name, category, price…"
            className="filter-input-buy"
            style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 12px 9px 34px', fontSize: 13, color: '#1e293b', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', transition: 'border-color 0.15s, box-shadow 0.15s' }} />
        </div>
        {search && (
          <button onClick={() => handleSearch('')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
            <Icon d={ICONS.x} size={13} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 150px 70px 200px 70px', gap: 16, padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          {['Item / Category', 'Priority', 'Status', 'Expected', 'Actual', 'Actions'].map((h, i) => (
            <span key={h} style={{
              fontSize: 11, fontWeight: 700, color: '#94a3b8',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              textAlign: i === 0 ? 'left' : 'center'
            }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: '56px 0', textAlign: 'center' }}>
            <div style={{ color: '#cbd5e1', marginBottom: 12 }}><Icon d={ICONS.cart} size={40} /></div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>{search ? 'No results match your search' : 'Your buy list is empty'}</div>
            <div style={{ fontSize: 13, color: '#cbd5e1', marginTop: 4 }}>{search ? 'Try a different search term' : 'Add the first item you want to buy'}</div>
          </div>
        ) : (
          items.map((item, i) => (
            <ToBuyRow
              key={item.item_id}
              item={item}
              index={i}
              onEdit={setEditItem}
              onDelete={setDeleteItem}
              onIncrementPriority={handleIncrementPriority}
              priorityLoading={priorityLoading}
            />
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
            <button disabled={!pagination.hasPrevPage} className="page-btn-buy"
              onClick={() => fetchList(pagination.offset - pagination.limit)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', color: pagination.hasPrevPage ? '#1e293b' : '#cbd5e1', fontSize: 13, fontWeight: 600, cursor: pagination.hasPrevPage ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
              <Icon d={ICONS.chevLeft} size={14} /> Prev
            </button>
            <span style={{ fontSize: 13, color: '#64748b', padding: '0 8px' }}>Page {currentPage} of {totalPages}</span>
            <button disabled={!pagination.hasNextPage} className="page-btn-buy"
              onClick={() => fetchList(pagination.offset + pagination.limit)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', color: pagination.hasNextPage ? '#1e293b' : '#cbd5e1', fontSize: 13, fontWeight: 600, cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
              Next <Icon d={ICONS.chevRight} size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddModal open={addOpen} onClose={() => setAddOpen(false)} onSave={handleAdd} categories={categories} />
      <EditModal open={!!editItem} onClose={() => setEditItem(null)} onSave={handleEdit} item={editItem} categories={categories} />
      <DeleteModal open={!!deleteItem} item={deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} />
    </div>
  )
}

export default ToBuyList