import { useState, useEffect, useCallback } from 'react'
import API from '../utils/api'
import { useToast } from '../components/Toast'

/* ─── tiny SVG icon ─── */
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

/* ─── icon paths ─── */
const ICONS = {
  plus: 'M12 5v14M5 12h14',
  edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  check: 'M20 6L9 17l-5-5',
  x: 'M18 6L6 18M6 6l12 12',
  tag: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  bag: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0',
  wrench: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z',
  cash: 'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  loader: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
}

/* ─── category config ─── */
const CATEGORY_CONFIG = [
  {
    key: 'expense',
    label: 'Expense Categories',
    description: 'Track where your money goes',
    icon: ICONS.cash,
    color: '#ef4444',
    lightBg: '#fef2f2',
    border: '#fecaca',
    accent: '#dc2626',
    apiBase: '/api/expenseCategory',
    responseKey: 'expenseCategories',
    idField: 'expense_category_id',
    nameField: 'expense_category_name',
  },
  {
    key: 'income',
    label: 'Income Categories',
    description: 'Classify your income sources',
    icon: ICONS.cash,
    color: '#10b981',
    lightBg: '#f0fdf4',
    border: '#a7f3d0',
    accent: '#059669',
    apiBase: '/api/incomeCategory',
    responseKey: 'incomeCategories',
    idField: 'income_category_id',
    nameField: 'income_category_name',
  },
  {
    key: 'product',
    label: 'Product Categories',
    description: 'Organise items you buy or sell',
    icon: ICONS.bag,
    color: '#f59e0b',
    lightBg: '#fffbeb',
    border: '#fde68a',
    accent: '#d97706',
    apiBase: '/api/productCategory',
    responseKey: 'productCategories',
    idField: 'product_category_id',
    nameField: 'product_category_name',
  },
  {
    key: 'service',
    label: 'Service Categories',
    description: 'Label subscriptions & services',
    icon: ICONS.wrench,
    color: '#6366f1',
    lightBg: '#eef2ff',
    border: '#c7d2fe',
    accent: '#4f46e5',
    apiBase: '/api/serviceCategory',
    responseKey: 'serviceCategories',
    idField: 'service_category_id',
    nameField: 'service_category_name',
  },
  {
    key: 'payment',
    label: 'Payment Categories',
    description: 'Classify loans, cards & payment types',
    icon: ICONS.tag,
    color: '#ec4899',
    lightBg: '#fdf2f8',
    border: '#fbcfe8',
    accent: '#db2777',
    apiBase: '/api/paymentCategory',
    responseKey: 'paymentCategories',
    idField: 'payment_category_id',
    nameField: 'payment_category_name',
  },
]

/* ─── animated overlay modal ─── */
const AnimatedModal = ({ open, onClose, children }) => {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 240)
      return () => clearTimeout(t)
    }
  }, [open])

  if (!mounted) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: `rgba(15,23,42,${visible ? 0.45 : 0})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.24s ease',
        backdropFilter: visible ? 'blur(3px)' : 'none',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 18,
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          padding: '28px 28px 24px',
          width: 380, maxWidth: 'calc(100vw - 40px)',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.96)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.26s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease',
        }}
      >
        {children}
      </div>
    </div>
  )
}

/* ─── delete confirm modal ─── */
const DeleteModal = ({ open, item, nameField, onClose, onConfirm, color }) => (
  <AnimatedModal open={open} onClose={onClose}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: '#fef2f2', display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 16px', color: '#ef4444',
      }}>
        <Icon d={ICONS.trash} size={24} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Delete Category?</h3>
      <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>
        <strong style={{ color: '#1e293b' }}>"{item?.[nameField]}"</strong> will be permanently removed. This action cannot be undone.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={{
          flex: 1, padding: '10px 0', borderRadius: 10, border: '1.5px solid #e2e8f0',
          background: '#f8fafc', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer',
        }}>Cancel</button>
        <button onClick={onConfirm} style={{
          flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
          background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}>Delete</button>
      </div>
    </div>
  </AnimatedModal>
)

/* ─── edit / add modal ─── */
const EditModal = ({ open, item, nameField, label, color, accent, onClose, onSave, isAdd }) => {
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setValue(isAdd ? '' : (item?.[nameField] || ''))
  }, [open, item, isAdd, nameField])

  const handle = async () => {
    if (!value.trim()) return
    setSaving(true)
    await onSave(value.trim())
    setSaving(false)
  }

  return (
    <AnimatedModal open={open} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: color + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent,
        }}>
          <Icon d={isAdd ? ICONS.plus : ICONS.edit} size={18} />
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>
          {isAdd ? `New ${label.replace(' Categories', '')} Category` : 'Rename Category'}
        </h3>
      </div>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, letterSpacing: '0.05em' }}>
        CATEGORY NAME
      </label>
      <input
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handle()}
        placeholder="e.g. Groceries"
        style={{
          width: '100%', border: `2px solid #e2e8f0`, borderRadius: 10,
          padding: '10px 14px', fontSize: 15, color: '#1e293b', outline: 'none',
          fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 20,
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = accent}
        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
      />
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={{
          flex: 1, padding: '10px 0', borderRadius: 10, border: '1.5px solid #e2e8f0',
          background: '#f8fafc', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer',
        }}>Cancel</button>
        <button onClick={handle} disabled={!value.trim() || saving} style={{
          flex: 2, padding: '10px 0', borderRadius: 10, border: 'none',
          background: value.trim() ? accent : '#c7d2fe',
          color: '#fff', fontWeight: 700, fontSize: 14,
          cursor: value.trim() && !saving ? 'pointer' : 'not-allowed',
          transition: 'background 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {saving
            ? <><Icon d={ICONS.loader} size={15} /> Saving…</>
            : <><Icon d={ICONS.check} size={15} /> {isAdd ? 'Create' : 'Save Changes'}</>
          }
        </button>
      </div>
    </AnimatedModal>
  )
}

/* ─── single category chip ─── */
const CategoryChip = ({ item, nameField, color, accent, lightBg, border, onEdit, onDelete, animDelay }) => {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), animDelay)
    return () => clearTimeout(t)
  }, [animDelay])

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderRadius: 12,
        border: `1.5px solid ${border}`,
        background: lightBg,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.28s ease, transform 0.28s ease',
      }}
    >
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: color, flexShrink: 0,
      }} />
      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: '#1e293b' }}>
        {item[nameField]}
      </span>
      <button
        onClick={() => onEdit(item)}
        title="Rename"
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 7,
          color: '#94a3b8', display: 'flex', transition: 'color 0.15s, background 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = accent; e.currentTarget.style.background = '#fff' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none' }}
      >
        <Icon d={ICONS.edit} size={14} />
      </button>
      <button
        onClick={() => onDelete(item)}
        title="Delete"
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 7,
          color: '#94a3b8', display: 'flex', transition: 'color 0.15s, background 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none' }}
      >
        <Icon d={ICONS.trash} size={14} />
      </button>
    </div>
  )
}

/* ─── one category panel ─── */
const CategoryPanel = ({ config, user }) => {
  const { label, description, icon, color, lightBg, border, accent, apiBase, idField, nameField, responseKey } = config
  const toast = useToast()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const [editItem, setEditItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [addOpen, setAddOpen] = useState(false)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await API.get(`${apiBase}/list`, {
        params: { user_id: user?.user_id }
      })
      const raw = res.data?.[responseKey] || []
      setItems(Array.isArray(raw) ? raw : [])
    } catch {
      // remove toast from here to avoid dependency issue
      console.error('Could not load categories.')
    } finally {
      setLoading(false)
    }
  }, [apiBase, responseKey, user?.user_id])  // ← only these 3, nothing else

  useEffect(() => {
    if (user?.user_id) fetchList()
  }, [user?.user_id, apiBase, responseKey])  // ← no fetchList here

  const handleAdd = async (name) => {
    try {
      await API.post(`${apiBase}/create`, {
        [nameField]: name,
        user_id: user.user_id    // ← this must be present
      })
      toast.success(`"${name}" added.`, label)
      setAddOpen(false)
      fetchList()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create.', label)
    }
  }

  const handleEdit = async (name) => {
    try {
      await API.put(`${apiBase}/update`, {
        [idField]: editItem._id || editItem[idField],
        [nameField]: name,
        user_id: user.user_id    // ← this must be present
      })
      toast.success(`Renamed to "${name}".`, label)
      setEditItem(null)
      fetchList()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update.', label)
    }
  }

  const handleDelete = async () => {
    try {
      await API.delete(`${apiBase}/delete`, {
        data: { [idField]: deleteItem._id || deleteItem[idField], user_id: user.user_id }
      })
      toast.success(`"${deleteItem[nameField]}" deleted.`, label)
      setDeleteItem(null)
      fetchList()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete.', label)
    }
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 18,
      boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
      overflow: 'hidden',
      border: '1px solid #f1f5f9',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header strip */}
      <div style={{
        padding: '18px 20px',
        borderBottom: `2px solid ${border}`,
        background: lightBg,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: '#fff',
          boxShadow: `0 2px 8px ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accent, flexShrink: 0,
        }}>
          <Icon d={icon} size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{label}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{description}</div>
        </div>
        <span style={{
          background: color + '18', color: accent,
          fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
        }}>
          {items.length}
        </span>
      </div>

      {/* List */}
      <div style={{ padding: '16px 16px 0', flex: 1, minHeight: 80 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 13 }}>
            Loading…
          </div>
        ) : items.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '24px 0',
            color: '#94a3b8', fontSize: 13, fontStyle: 'italic',
          }}>
            No categories yet. Add one below!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, i) => (
              <CategoryChip
                key={item._id || i}
                item={item}
                nameField={nameField}
                color={color}
                accent={accent}
                lightBg={lightBg}
                border={border}
                onEdit={setEditItem}
                onDelete={setDeleteItem}
                animDelay={i * 40}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add button */}
      <div style={{ padding: 16 }}>
        <button
          onClick={() => setAddOpen(true)}
          style={{
            width: '100%', padding: '9px 0', borderRadius: 10,
            border: `1.5px dashed ${border}`,
            background: 'transparent', color: accent,
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = lightBg; e.currentTarget.style.borderStyle = 'solid' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderStyle = 'dashed' }}
        >
          <Icon d={ICONS.plus} size={15} />
          Add Category
        </button>
      </div>

      {/* Modals */}
      <EditModal
        open={addOpen}
        isAdd
        label={label}
        nameField={nameField}
        color={color}
        accent={accent}
        onClose={() => setAddOpen(false)}
        onSave={handleAdd}
      />
      <EditModal
        open={!!editItem}
        item={editItem}
        label={label}
        nameField={nameField}
        color={color}
        accent={accent}
        onClose={() => setEditItem(null)}
        onSave={handleEdit}
      />
      <DeleteModal
        open={!!deleteItem}
        item={deleteItem}
        nameField={nameField}
        color={color}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

/* ─── main page ─── */
const Categories = ({ user }) => {
  return (
    <div style={{ maxWidth: 2000 }}>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>Categories</h1>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
          Manage all your expense, income, product, and service categories in one place
        </p>
      </div>

      {/* 2-column responsive grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))',
        gap: 20,
        alignItems: 'start',
      }}>
        {CATEGORY_CONFIG.map(cfg => (
          <CategoryPanel key={cfg.key} config={cfg} user={user} />
        ))}
      </div>
    </div>
  )
}

export default Categories