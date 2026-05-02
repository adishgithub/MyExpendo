import { useState, useEffect, useRef } from 'react'
import API from '../utils/api'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'

// ── Icon helper (same as rest of app) ────────────────────────────────────────
const Icon = ({ d, size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
)

const IC = {
    plus: 'M12 5v14M5 12h14',
    check: 'M20 6L9 17l-5-5',
    trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
    edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
    close: 'M18 6L6 18M6 6l12 12',
    card: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    chevron: 'M9 18l6-6-6-6',
    chevDown: 'M6 9l6 6 6-6',
    info: 'M12 16v-4M12 8h.01M22 12A10 10 0 112 12a10 10 0 0120 0z',
    loan: 'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
    arrowUp: 'M12 19V5M5 12l7-7 7 7',
    empty: 'M9 17H7A5 5 0 017 7h1M15 7h1a5 5 0 010 10h-2M8 12h8',
    calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
    back: 'M19 12H5M12 19l-7-7 7-7',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = v => `₹${parseFloat(v || 0).toLocaleString('en-IN')}`
const pct = (part, total) => total > 0 ? Math.min(Math.round((part / total) * 100), 100) : 0
const pad = n => String(n).padStart(2, '0')
const today = () => new Date().toISOString().slice(0, 10)

// ── Animated bar ──────────────────────────────────────────────────────────────
const Bar = ({ pct: p, color, delay = 0, height = 8 }) => {
    const [w, setW] = useState(0)
    useEffect(() => { const t = setTimeout(() => setW(p), delay + 80); return () => clearTimeout(t) }, [p, delay])
    return (
        <div style={{ height, background: '#f1f5f9', borderRadius: height / 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${w}%`, background: color, borderRadius: height / 2, transition: 'width 0.7s cubic-bezier(0.34,1.56,0.64,1)' }} />
        </div>
    )
}

// ── Animated modal wrapper (same as Layout.jsx) ───────────────────────────────
const Sheet = ({ open, onClose, children, width = 480, title }) => {
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
                padding: '0',
                width, maxWidth: 'calc(100vw - 32px)',
                maxHeight: '92vh', overflowY: 'auto',
                transform: visible ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.95)',
                opacity: visible ? 1 : 0,
                transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease',
            }}>
                {/* Sheet header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: '#fff', borderRadius: '20px 20px 0 0', zIndex: 1,
                }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{title}</span>
                    <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                        <Icon d={IC.close} size={14} />
                    </button>
                </div>
                <div style={{ padding: '20px 24px 24px' }}>
                    {children}
                </div>
            </div>
        </div>
    )
}

// ── Form field ────────────────────────────────────────────────────────────────
const Field = ({ label, required, children, hint }) => (
    <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
            {label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
        </label>
        {children}
        {hint && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{hint}</div>}
    </div>
)

const inputBase = {
    width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10,
    padding: '10px 14px', fontSize: 14, color: '#1e293b', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box', background: '#f8fafc',
    transition: 'border-color 0.15s, box-shadow 0.15s',
}
const useInputFocus = (accent = '#4f46e5') => ({
    onFocus: e => { e.target.style.borderColor = accent; e.target.style.boxShadow = `0 0 0 3px ${accent}18` },
    onBlur: e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' },
})

// ── Loan type badge ───────────────────────────────────────────────────────────
const LoanBadge = ({ type }) => (
    <span style={{
        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, letterSpacing: '0.04em',
        background: type === 'fixed' ? '#eff6ff' : '#fff7ed',
        color: type === 'fixed' ? '#1d4ed8' : '#c2410c',
        border: `1px solid ${type === 'fixed' ? '#bfdbfe' : '#fed7aa'}`,
    }}>{type === 'fixed' ? 'FIXED EMI' : 'FLEXIBLE'}</span>
)

const StatusBadge = ({ status }) => {
    const map = {
        active: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', label: 'Active' },
        closed: { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', label: 'Closed' },
        paused: { bg: '#fffbeb', color: '#92400e', border: '#fde68a', label: 'Paused' },
    }
    const s = map[status] || map.active
    return (
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
            {s.label}
        </span>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// ADD / EDIT LOAN MODAL
// ══════════════════════════════════════════════════════════════════════════════
const LoanModal = ({ open, onClose, user, loan, onSaved }) => {
    const toast = useToast()
    const focus = useInputFocus()
    const [cats, setCats] = useState([])
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({})

    const blank = {
        payment_category_id: '', loan_name: '', lender_name: '',
        loan_type: 'fixed', principal_amount: '', contributors: [],
        interest_rate: '', emi_amount: '', tenure_months: '', start_date: today(), emi_due_day: '5',
        notes: '',
    }

    useEffect(() => {
        if (!open) return
        setForm(loan ? {
            payment_category_id: loan.payment_category_id || '',
            loan_name: loan.loan_name || '',
            lender_name: loan.lender_name || '',
            loan_type: loan.loan_type || 'fixed',
            principal_amount: loan.principal_amount || '',
            interest_rate: loan.interest_rate || '',
            emi_amount: loan.emi_amount || '',
            tenure_months: loan.tenure_months || '',
            contributors: loan.contributors || [],
            start_date: loan.start_date ? loan.start_date.slice(0, 10) : today(),
            emi_due_day: loan.emi_due_day || '5',
            notes: loan.notes || '',
        } : { ...blank })

        API.get('/api/paymentCategory/list', { params: { user_id: user.user_id } })
            .then(r => setCats(r.data?.paymentCategories || []))
            .catch(() => { })
    }, [open, loan])

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

    const handle = async () => {
        if (!form.loan_name || !form.principal_amount || !form.payment_category_id) return
        setSaving(true)
        try {
            if (loan) {
                await API.put('/api/paymentAccount/update', { loan_id: loan.loan_id, ...form })
                toast.success('Loan account updated.', 'Saved')
            } else {
                await API.post('/api/paymentAccount/create', { user_id: user.user_id, ...form })
                toast.success('Loan account created.', 'Added')
            }
            onSaved()
            onClose()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save loan.')
        } finally {
            setSaving(false)
        }
    }

    const isFixed = form.loan_type === 'fixed'
    const valid = form.loan_name && form.principal_amount && form.payment_category_id

    return (
        <Sheet open={open} onClose={onClose} title={loan ? 'Edit loan account' : 'Add loan account'} width={500}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
                <Field label="Loan name" required>
                    <input {...focus} style={inputBase} placeholder="e.g. HDFC Home Loan"
                        value={form.loan_name || ''} onChange={e => set('loan_name', e.target.value)} />
                </Field>
                <Field label="Lender name">
                    <input {...focus} style={inputBase} placeholder="e.g. HDFC, Federal Bank"
                        value={form.lender_name || ''} onChange={e => set('lender_name', e.target.value)} />
                </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
                <Field label="Category" required>
                    <select {...focus} style={{ ...inputBase, appearance: 'none', cursor: 'pointer' }}
                        value={form.payment_category_id || ''} onChange={e => set('payment_category_id', e.target.value)}>
                        <option value="">— Select —</option>
                        {cats.map(c => <option key={c._id} value={c.payment_category_id}>{c.payment_category_name}</option>)}
                    </select>
                </Field>
                <Field label="Loan type" required>
                    <select {...focus} style={{ ...inputBase, appearance: 'none', cursor: 'pointer' }}
                        value={form.loan_type || 'fixed'} onChange={e => set('loan_type', e.target.value)}>
                        <option value="fixed">Fixed EMI</option>
                        <option value="flexible">Flexible</option>
                    </select>
                </Field>
            </div>

            <Field label="Principal amount (₹)" required>
                <input {...focus} type="number" min="0" style={inputBase} placeholder="0.00"
                    value={form.principal_amount || ''} onChange={e => set('principal_amount', e.target.value)} />
            </Field>

            {isFixed && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 14px' }}>
                        <Field label="Interest rate (% p.a.)" hint="Annual %">
                            <input {...focus} type="number" min="0" step="0.01" style={inputBase} placeholder="8.75"
                                value={form.interest_rate || ''} onChange={e => set('interest_rate', e.target.value)} />
                        </Field>
                        <Field label="EMI amount (₹)">
                            <input {...focus} type="number" min="0" style={inputBase} placeholder="0.00"
                                value={form.emi_amount || ''} onChange={e => set('emi_amount', e.target.value)} />
                        </Field>
                        <Field label="Tenure (months)">
                            <input {...focus} type="number" min="1" style={inputBase} placeholder="240"
                                value={form.tenure_months || ''} onChange={e => set('tenure_months', e.target.value)} />
                        </Field>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
                        <Field label="Start date">
                            <input {...focus} type="date" style={inputBase}
                                value={form.start_date || ''} onChange={e => set('start_date', e.target.value)} />
                        </Field>
                        <Field label="EMI due day" hint="Day of month (1–31)">
                            <input {...focus} type="number" min="1" max="31" style={inputBase} placeholder="5"
                                value={form.emi_due_day || ''} onChange={e => set('emi_due_day', e.target.value)} />
                        </Field>
                    </div>
                </>
            )}

            {/* Flexible info */}
            {!isFixed && (
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
                    For flexible loans, you record each payment manually with the exact amount, interest and principal as shown in your bank statement. The interest rate is calculated automatically from those values.
                </div>
            )}

            {(form.contributors || []).map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <input
                        {...focus}
                        style={{ ...inputBase, flex: 1 }}
                        placeholder="e.g. Adish, Suja, Brother"
                        value={c.name}
                        onChange={e => {
                            const next = [...(form.contributors || [])]
                            next[i] = { ...next[i], name: e.target.value }
                            set('contributors', next)
                        }}
                    />
                    {/* Toggle "this is me" */}
                    <button
                        title={c.user_id ? 'Marked as you — click to unmark' : 'Mark as you'}
                        onClick={() => {
                            const next = [...(form.contributors || [])]
                            next[i] = { ...next[i], user_id: c.user_id ? undefined : user.user_id }
                            set('contributors', next)
                        }}
                        style={{
                            padding: '8px 10px', borderRadius: 8, border: '1.5px solid',
                            borderColor: c.user_id ? '#4f46e5' : '#e2e8f0',
                            background: c.user_id ? '#eef2ff' : '#fff',
                            color: c.user_id ? '#4f46e5' : '#94a3b8',
                            cursor: 'pointer', fontSize: 11, fontWeight: 700, flexShrink: 0,
                        }}>
                        {c.user_id ? 'Me ✓' : 'Me?'}
                    </button>
                    <button
                        onClick={() => set('contributors', (form.contributors || []).filter((_, j) => j !== i))}
                        style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #fee2e2', background: '#fff', color: '#ef4444', cursor: 'pointer' }}>
                        <Icon d={IC.close} size={13} />
                    </button>
                </div>
            ))}
            <Field label="Notes">
                <textarea {...focus} rows={2} style={{ ...inputBase, resize: 'vertical', minHeight: 60 }}
                    placeholder="Optional notes about this loan…"
                    value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
            </Field>

            <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                    Cancel
                </button>
                <button onClick={handle} disabled={!valid || saving}
                    style={{ flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', background: valid ? '#4f46e5' : '#c7d2fe', color: '#fff', fontWeight: 700, fontSize: 14, cursor: valid && !saving ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Icon d={IC.check} size={15} />
                    {saving ? 'Saving…' : loan ? 'Save changes' : 'Add loan'}
                </button>
            </div>
        </Sheet>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// ADD PAYMENT MODAL
// ══════════════════════════════════════════════════════════════════════════════
const PaymentModal = ({ open, onClose, loan, onSaved }) => {
    const toast = useToast()
    const focus = useInputFocus('#10b981')
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({ contributor_splits: [] })

    useEffect(() => {
        if (open) setForm({
            amount_paid: '', principal_component: '', interest_component: '',
            penalty_component: '0', payment_date: today(),
            payment_type: loan?.loan_type === 'fixed' ? 'emi' : 'partial',
            payment_mode: '', notes: '', contributor_splits: [],
        })
    }, [open, loan])

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

    // Back-calculate interest rate for preview
    const outstanding = loan?.outstanding_balance || 0
    const iAmt = parseFloat(form.interest_component) || 0
    const pAmt = parseFloat(form.principal_component) || 0
    const total = parseFloat(form.amount_paid) || 0
    const ratePreview = outstanding > 0 && iAmt > 0
        ? ((iAmt / outstanding) * 12 * 100).toFixed(2)
        : null

    const balanceAfter = Math.max(0, outstanding - pAmt)
    const splitOk = total > 0 && Math.abs((iAmt + pAmt) - total) < 0.01

    const handle = async () => {
        if (!total || !form.payment_date || !splitOk) return
        setSaving(true)
        try {
            await API.post('/api/paymentTransaction/create', {
                loan_id: loan.loan_id,
                user_id: loan.user_id,
                amount_paid: total,
                principal_component: pAmt,
                interest_component: iAmt,
                penalty_component: parseFloat(form.penalty_component) || 0,
                payment_date: form.payment_date,
                payment_type: form.payment_type,
                payment_mode: form.payment_mode || undefined,
                notes: form.notes || undefined,
                contributor_splits: (form.contributor_splits || [])
                    .filter(s => s.name && parseFloat(s.amount) > 0)
                    .map(s => ({
                        name: s.name,
                        amount: parseFloat(s.amount),
                        user_id: loan.contributors?.find(c => c.name === s.name)?.user_id || null,
                    })),
            })
            toast.success('Payment recorded and added to expenses.', 'Saved')
            onSaved()
            onClose()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to record payment.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Sheet open={open} onClose={onClose} title={`Record payment — ${loan?.loan_name || ''}`} width={460}>
            {loan && (
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#64748b' }}>Outstanding balance</span>
                    <span style={{ fontWeight: 700, color: '#ef4444' }}>{fmt(outstanding)}</span>
                </div>
            )}

            <Field label="Payment date" required>
                <input {...focus} type="date" style={inputBase}
                    value={form.payment_date || ''} onChange={e => set('payment_date', e.target.value)} />
            </Field>

            <Field label="Total amount paid (₹)" required>
                <input {...focus} type="number" min="0" step="0.01" style={inputBase} placeholder="15000"
                    value={form.amount_paid || ''} onChange={e => set('amount_paid', e.target.value)} />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
                <Field label="Interest component (₹)" required hint="As shown in bank statement">
                    <input {...focus} type="number" min="0" step="0.01" style={inputBase} placeholder="0.00"
                        value={form.interest_component || ''} onChange={e => set('interest_component', e.target.value)} />
                </Field>
                <Field label="Principal component (₹)" required hint="Amount reducing outstanding">
                    <input {...focus} type="number" min="0" step="0.01" style={inputBase} placeholder="0.00"
                        value={form.principal_component || ''} onChange={e => set('principal_component', e.target.value)} />
                </Field>
            </div>

            {/* Split validation + preview */}
            {total > 0 && (iAmt > 0 || pAmt > 0) && (
                <div style={{
                    borderRadius: 10, padding: '12px 14px', marginBottom: 16,
                    background: splitOk ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${splitOk ? '#bbf7d0' : '#fecaca'}`,
                    fontSize: 12,
                }}>
                    {splitOk ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ color: '#15803d', fontWeight: 600 }}>Split looks correct</span>
                                {ratePreview && <span style={{ color: '#15803d' }}>Rate: ~{ratePreview}% p.a.</span>}
                            </div>
                            {/* Visual split bar */}
                            <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                                <div style={{ width: `${pct(pAmt, total)}%`, background: '#4f46e5' }} />
                                <div style={{ width: `${pct(iAmt, total)}%`, background: '#ef4444' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 14, color: '#64748b' }}>
                                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#4f46e5', marginRight: 4 }} />Principal {fmt(pAmt)}</span>
                                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#ef4444', marginRight: 4 }} />Interest {fmt(iAmt)}</span>
                            </div>
                            <div style={{ marginTop: 8, color: '#15803d', fontWeight: 600 }}>
                                Balance after payment: {fmt(balanceAfter)}
                            </div>
                        </>
                    ) : (
                        <span style={{ color: '#dc2626' }}>
                            Interest ({fmt(iAmt)}) + Principal ({fmt(pAmt)}) = {fmt(iAmt + pAmt)} — must equal Amount paid ({fmt(total)})
                        </span>
                    )}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
                <Field label="Penalty / late fee (₹)">
                    <input {...focus} type="number" min="0" style={inputBase} placeholder="0"
                        value={form.penalty_component || ''} onChange={e => set('penalty_component', e.target.value)} />
                </Field>
                <Field label="Payment mode">
                    <select {...focus} style={{ ...inputBase, appearance: 'none', cursor: 'pointer' }}
                        value={form.payment_mode || ''} onChange={e => set('payment_mode', e.target.value)}>
                        <option value="">— Optional —</option>
                        <option value="auto_debit">Auto-debit</option>
                        <option value="upi">UPI</option>
                        <option value="netbanking">Net banking</option>
                        <option value="cash">Cash</option>
                        <option value="cheque">Cheque</option>
                        <option value="other">Other</option>
                    </select>
                </Field>
            </div>
            {/* Contributor splits — only shown if loan has contributors */}
            {(loan?.contributors?.length > 0) && (
                <Field label="Split by contributor" hint="Optional — who contributed what amount">
                    {(form.contributor_splits || []).map((s, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                            <select
                                {...focus}
                                style={{ ...inputBase, flex: 2, appearance: 'none' }}
                                value={s.name}
                                onChange={e => {
                                    const next = [...form.contributor_splits]
                                    next[i] = { ...next[i], name: e.target.value }
                                    set('contributor_splits', next)
                                }}>
                                <option value="">— Select —</option>
                                {loan.contributors.map(c => (
                                    <option key={c.name} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                            <input
                                {...focus}
                                type="number" min="0" step="0.01"
                                style={{ ...inputBase, flex: 1 }}
                                placeholder="₹0"
                                value={s.amount || ''}
                                onChange={e => {
                                    const next = [...form.contributor_splits]
                                    next[i] = { ...next[i], amount: e.target.value }
                                    set('contributor_splits', next)
                                }}
                            />
                            <button
                                onClick={() => set('contributor_splits', form.contributor_splits.filter((_, j) => j !== i))}
                                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #fee2e2', background: '#fff', color: '#ef4444', cursor: 'pointer', flexShrink: 0 }}>
                                <Icon d={IC.close} size={13} />
                            </button>
                        </div>
                    ))}

                    {/* Split total validation */}
                    {form.contributor_splits.length > 0 && total > 0 && (() => {
                        const splitTotal = form.contributor_splits.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0)
                        const contribSplitOk = Math.abs(splitTotal - total) < 0.01
                        return (
                            <div style={{
                                fontSize: 12, padding: '6px 10px', borderRadius: 8, marginBottom: 8,
                                background: contribSplitOk ? '#f0fdf4' : '#fef2f2',
                                color: contribSplitOk ? '#15803d' : '#dc2626'
                            }}>
                                {contribSplitOk
                                    ? `✓ Split matches total (${fmt(splitTotal)})`
                                    : `Split total ${fmt(splitTotal)} ≠ amount paid ${fmt(total)}`}
                            </div>
                        )
                    })()}

                    <button
                        onClick={() => set('contributor_splits', [...(form.contributor_splits || []), { name: '', amount: '' }])}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1.5px dashed #e2e8f0', borderRadius: 8, padding: '7px 12px', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                        <Icon d={IC.plus} size={13} /> Add row
                    </button>
                </Field>
            )}

            <Field label="Notes">
                <input {...focus} style={inputBase} placeholder="e.g. May 2026 — paid at branch"
                    value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
            </Field>

            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 16 }}>
                This payment will be automatically added to your expense list.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handle} disabled={!splitOk || saving}
                    style={{ flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', background: splitOk ? '#10b981' : '#a7f3d0', color: '#fff', fontWeight: 700, fontSize: 14, cursor: splitOk && !saving ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Icon d={IC.check} size={15} />
                    {saving ? 'Saving…' : 'Record payment'}
                </button>
            </div>
        </Sheet>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// LOAN DETAIL VIEW
// ══════════════════════════════════════════════════════════════════════════════
const LoanDetail = ({ loan, user, onBack, onRefresh }) => {
    const toast = useToast()
    const [detail, setDetail] = useState(null)
    const [loading, setLoading] = useState(true)
    const [paymentOpen, setPayOpen] = useState(false)
    const [deleteTarget, setDelTarget] = useState(null)

    const load = async () => {
        setLoading(true)
        try {
            const r = await API.get('/api/paymentAccount/detail', { params: { loan_id: loan.loan_id, user_id: user.user_id } })
            setDetail(r.data)
        } catch { toast.error('Failed to load loan details.') }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [loan.loan_id])

    const deleteTransaction = async () => {
        try {
            await API.delete('/api/paymentTransaction/delete', { data: { payment_id: deleteTarget.payment_id } })
            toast.success('Transaction deleted and balance reversed.', 'Deleted')
            setDelTarget(null)
            load()
            onRefresh()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete.')
        }
    }

    const acc = detail?.account || loan
    const stats = detail?.stats || {}
    const txns = detail?.transactions || []

    const totalRepayment = acc.loan_type === 'fixed' && acc.emi_amount && acc.tenure_months
        ? acc.emi_amount * acc.tenure_months
        : null

    const paidPct = pct(stats.total_paid || 0, acc.principal_amount)

    const payoffDate = stats.months_remaining
        ? (() => {
            const d = new Date()
            d.setMonth(d.getMonth() + stats.months_remaining)
            return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
        })()
        : null

    const modeLabel = { auto_debit: 'Auto-debit', upi: 'UPI', netbanking: 'Net banking', cash: 'Cash', cheque: 'Cheque', other: 'Other' }

    return (
        <div style={{ maxWidth: 900, fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`.tx-row:hover { background: #f8fafc !important; }`}</style>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                <button onClick={onBack} style={{ background: '#f1f5f9', border: 'none', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#475569', fontSize: 13, fontWeight: 600 }}>
                    <Icon d={IC.back} size={15} /> Back
                </button>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{acc.loan_name}</span>
                        <LoanBadge type={acc.loan_type} />
                        <StatusBadge status={acc.status} />
                    </div>
                    {acc.lender_name && <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{acc.lender_name}{acc.start_date ? ` · Started ${new Date(acc.start_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : ''}</div>}
                </div>
                {acc.status === 'active' && (
                    <button onClick={() => setPayOpen(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        <Icon d={IC.plus} size={15} /> Record payment
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>Loading…</div>
            ) : (
                <>
                    {/* Stats grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                        {[
                            { label: 'Outstanding balance', value: fmt(acc.outstanding_balance), color: '#ef4444' },
                            { label: 'Total paid', value: fmt(stats.total_paid || 0), color: '#1e293b' },
                            { label: 'Interest paid', value: fmt(stats.total_interest_paid || 0), color: '#f59e0b' },
                            { label: 'Principal repaid', value: fmt(stats.total_principal_paid || 0), color: '#4f46e5' },
                            ...(acc.loan_type === 'fixed' ? [
                                { label: 'Months remaining', value: stats.months_remaining != null ? `${stats.months_remaining} months` : '—', color: '#1e293b' },
                                { label: 'Projected payoff', value: payoffDate || '—', color: '#10b981' },
                            ] : [
                                { label: 'Payments made', value: `${txns.length}`, color: '#1e293b' },
                                { label: 'Original principal', value: fmt(acc.principal_amount), color: '#1e293b' },
                            ]),
                        ].map((s, i) => (
                            <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 18px' }}>
                                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>{s.label}</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                            </div>
                        ))}
                    </div>
                    {/* Contributors summary + avg interest */}
                    {(acc.contributors?.length > 0 || stats.avg_interest_rate) && (
                        <div style={{ display: 'grid', gridTemplateColumns: acc.contributors?.length > 0 ? '1fr 1fr' : '1fr', gap: 12, marginBottom: 20 }}>

                            {/* Contributors card */}
                            {acc.contributors?.length > 0 && (
                                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px' }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Contributors</div>
                                    {acc.contributors.map(c => {
                                        const contributed = txns.flatMap(tx => tx.contributor_splits || [])
                                            .filter(s => s.name === c.name)
                                            .reduce((sum, s) => sum + (s.amount || 0), 0)
                                        return (
                                            <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f8fafc' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                                                        {c.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span style={{ fontSize: 13, color: '#1e293b', fontWeight: 600 }}>{c.name}</span>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#4f46e5' }}>{fmt(contributed)}</div>
                                                    <div style={{ fontSize: 10, color: '#94a3b8' }}>
                                                        {pct(contributed, stats.total_paid || 0)}% of total
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Avg interest card */}
                            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Interest overview</div>
                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Average interest rate</div>
                                    <div style={{ fontSize: 26, fontWeight: 800, color: '#f59e0b' }}>
                                        {txns.length > 0
                                            ? (txns.reduce((s, tx) => s + (tx.interest_rate_applied || 0), 0) / txns.filter(tx => tx.interest_rate_applied).length || 0).toFixed(2)
                                            : '—'
                                        }{txns.length > 0 ? '%' : ''}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>p.a. across {txns.length} payment{txns.length !== 1 ? 's' : ''}</div>
                                </div>
                                {txns.length > 1 && (
                                    <>
                                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>Rate history</div>
                                        {[...txns].reverse().slice(-5).map((tx, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', padding: '3px 0' }}>
                                                <span>{new Date(tx.payment_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                                                <span style={{ fontWeight: 600, color: '#f59e0b' }}>{tx.interest_rate_applied ? `${tx.interest_rate_applied.toFixed(2)}%` : '—'}</span>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Progress + amortisation (fixed loans only) */}
                    {acc.loan_type === 'fixed' && acc.principal_amount > 0 && (
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
                                <span style={{ fontWeight: 600, color: '#0f172a' }}>Repayment progress</span>
                                <span style={{ color: '#64748b' }}>{paidPct}% complete</span>
                            </div>
                            <Bar pct={paidPct} color="#4f46e5" height={10} />

                            {totalRepayment && (
                                <>
                                    <div style={{ marginTop: 14, fontSize: 12, color: '#64748b', marginBottom: 6 }}>Total repayment breakdown</div>
                                    <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                                        <div style={{ width: `${pct(acc.principal_amount, totalRepayment)}%`, background: '#4f46e5' }} />
                                        <div style={{ width: `${pct(totalRepayment - acc.principal_amount, totalRepayment)}%`, background: '#f09595' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b' }}>
                                        <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#4f46e5', marginRight: 4 }} />Principal {fmt(acc.principal_amount)} ({pct(acc.principal_amount, totalRepayment)}%)</span>
                                        <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#f09595', marginRight: 4 }} />Interest {fmt(totalRepayment - acc.principal_amount)} ({pct(totalRepayment - acc.principal_amount, totalRepayment)}%)</span>
                                        <span style={{ marginLeft: 'auto', fontWeight: 600, color: '#0f172a' }}>Total: {fmt(totalRepayment)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Transaction history */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Payment history</div>
                        {txns.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                                <Icon d={IC.empty} size={36} />
                                <div style={{ marginTop: 10, fontSize: 13 }}>No payments recorded yet</div>
                            </div>
                        ) : (
                            <div>
                                {/* Table header */}
                                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr 1fr 100px 1fr 80px', gap: 8, padding: '6px 12px', borderBottom: '1px solid #f1f5f9', fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                    <span>Date</span><span>Amount paid</span><span>Principal</span><span>Interest</span><span>Rate</span><span>Contributors</span><span></span>
                                </div>
                                {txns.map((tx, i) => (
                                    <div key={tx._id} className="tx-row" style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr 1fr 100px 1fr 80px', gap: 8, padding: '10px 12px', borderBottom: i < txns.length - 1 ? '1px solid #f8fafc' : 'none', borderRadius: 8, transition: 'background 0.15s', alignItems: 'center' }}>
                                        <span style={{ fontSize: 12, color: '#64748b' }}>{new Date(tx.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>{fmt(tx.amount_paid)}</span>
                                        <span style={{ fontSize: 13, color: '#4f46e5', fontWeight: 600 }}>{fmt(tx.principal_component)}</span>
                                        <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>{fmt(tx.interest_component)}</span>
                                        <span style={{ fontSize: 12, color: '#64748b' }}>{tx.interest_rate_applied ? `${tx.interest_rate_applied.toFixed(1)}%` : '—'}</span>
                                        <span style={{ fontSize: 11, color: '#64748b', lineHeight: 1.8 }}>
                                            {tx.contributor_splits?.length > 0
                                                ? tx.contributor_splits.map(s => (
                                                    <span key={s.name} style={{ display: 'inline-block', background: '#f1f5f9', borderRadius: 6, padding: '1px 7px', marginRight: 4, marginBottom: 2 }}>
                                                        {s.name}: {fmt(s.amount)}
                                                    </span>
                                                ))
                                                : <span style={{ color: '#cbd5e1' }}>—</span>}
                                        </span>
                                        <button onClick={() => setDelTarget(tx)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '4px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                            onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}>
                                            <Icon d={IC.trash} size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            <PaymentModal open={paymentOpen} onClose={() => setPayOpen(false)} loan={{ ...acc, user_id: user.user_id }} onSaved={() => { load(); onRefresh() }} />

            <Modal open={!!deleteTarget} onClose={() => setDelTarget(null)} onConfirm={deleteTransaction}
                variant="danger" title="Delete this payment?"
                message="This will reverse the principal reduction on the outstanding balance and remove the linked expense entry."
                confirmLabel="Yes, delete" cancelLabel="Keep it" />
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAYMENTS PAGE
// ══════════════════════════════════════════════════════════════════════════════
const Payments = ({ user }) => {
    const toast = useToast()
    const [accounts, setAccounts] = useState([])
    const [summary, setSummary] = useState({})
    const [loading, setLoading] = useState(true)
    const [detailLoan, setDetailLoan] = useState(null)
    const [addOpen, setAddOpen] = useState(false)
    const [editLoan, setEditLoan] = useState(null)
    const [payLoan, setPayLoan] = useState(null)
    const [deleteTarget, setDelTarget] = useState(null)
    const [filterStatus, setFilterStatus] = useState('active')

    const load = async () => {
        if (!user?.user_id) return
        setLoading(true)
        try {
            const r = await API.get('/api/paymentAccount/list', {
                params: { user_id: user.user_id, ...(filterStatus !== 'all' && { status: filterStatus }) }
            })
            setAccounts(r.data?.accounts || [])
            setSummary(r.data?.summary || {})
        } catch { toast.error('Failed to load loan accounts.') }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [user?.user_id, filterStatus])

    const deleteAccount = async () => {
        try {
            await API.delete('/api/paymentAccount/delete', { data: { loan_id: deleteTarget.loan_id } })
            toast.success('Loan account and all payments deleted.', 'Deleted')
            setDelTarget(null)
            load()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete.')
        }
    }

    if (detailLoan) {
        return <LoanDetail loan={detailLoan} user={user} onBack={() => setDetailLoan(null)} onRefresh={load} />
    }

    const catColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899']

    return (
        <div style={{ maxWidth: 1100, fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`
        .loan-card { transition: box-shadow 0.2s, transform 0.2s; cursor: pointer; }
        .loan-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; transform: translateY(-2px); }
        .filter-pill { transition: all 0.15s; cursor: pointer; }
        .filter-pill:hover { background: #eef2ff !important; color: #4f46e5 !important; }
        .icon-btn:hover { background: #f1f5f9 !important; }
      `}</style>

            {/* Page header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>Payments / EMI</h1>
                    <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Manage your loans and track every payment</p>
                </div>
                <button onClick={() => setAddOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Icon d={IC.plus} size={15} /> Add loan
                </button>
            </div>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                {[
                    { label: 'Total outstanding', value: fmt(summary.total_outstanding || 0), color: '#ef4444' },
                    { label: 'Total interest paid', value: fmt(summary.total_interest_paid || 0), color: '#f59e0b' },
                    { label: 'Principal repaid', value: fmt(summary.total_principal_paid || 0), color: '#4f46e5' },
                    { label: 'Active loans', value: summary.active_loans || 0, color: '#10b981', prefix: '' },
                ].map((s, i) => (
                    <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px' }}>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{s.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.prefix !== '' ? s.value : s.value}</div>
                    </div>
                ))}
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {[{ key: 'active', label: 'Active' }, { key: 'all', label: 'All' }, { key: 'closed', label: 'Closed' }, { key: 'paused', label: 'Paused' }].map(f => (
                    <button key={f.key} className="filter-pill" onClick={() => setFilterStatus(f.key)}
                        style={{
                            padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                            background: filterStatus === f.key ? '#4f46e5' : '#f1f5f9',
                            color: filterStatus === f.key ? '#fff' : '#64748b',
                        }}>{f.label}</button>
                ))}
            </div>

            {/* Loan cards */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                    <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                    Loading…
                </div>
            ) : accounts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
                    <Icon d={IC.card} size={48} />
                    <div style={{ marginTop: 14, fontSize: 16, fontWeight: 600, color: '#64748b' }}>No loans found</div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>Add your first loan account to get started.</div>
                    <button onClick={() => setAddOpen(true)}
                        style={{ marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        <Icon d={IC.plus} size={15} /> Add loan
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                    {accounts.map((acc, idx) => {
                        const color = catColors[idx % catColors.length]
                        const progress = pct(acc.total_principal_paid || 0, acc.principal_amount)
                        const monthlyPct = acc.emi_amount
                            ? pct(acc.emi_amount, (summary.total_monthly_emi || acc.emi_amount))
                            : 0

                        return (
                            <div key={acc.loan_id} className="loan-card"
                                onClick={() => setDetailLoan(acc)}
                                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

                                {/* Card header */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                                            <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{acc.loan_name}</span>
                                            <LoanBadge type={acc.loan_type} />
                                        </div>
                                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                            {acc.lender_name || 'No lender'}{acc.payment_category_name ? ` · ${acc.payment_category_name}` : ''}
                                        </div>
                                    </div>
                                    <StatusBadge status={acc.status} />
                                </div>

                                {/* Outstanding */}
                                <div style={{ marginBottom: 14 }}>
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Outstanding balance</div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: acc.status === 'closed' ? '#10b981' : '#ef4444' }}>
                                        {acc.status === 'closed' ? 'Paid off' : fmt(acc.outstanding_balance)}
                                    </div>
                                </div>

                                {/* Stats row */}
                                <div style={{ display: 'flex', gap: 0, marginBottom: 14, borderTop: '1px solid #f8fafc', borderBottom: '1px solid #f8fafc', padding: '10px 0' }}>
                                    {[
                                        { label: 'Principal', value: fmt(acc.principal_amount) },
                                        { label: 'Paid', value: fmt(acc.total_paid || 0) },
                                        ...(acc.loan_type === 'fixed' && acc.emi_amount ? [{ label: 'EMI/month', value: fmt(acc.emi_amount) }] : [{ label: 'Payments', value: `${acc.payment_count || 0}` }]),
                                    ].map((s, i) => (
                                        <div key={i} style={{ flex: 1, textAlign: i === 1 ? 'center' : i === 2 ? 'right' : 'left' }}>
                                            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>{s.label}</div>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{s.value}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Progress */}
                                <div style={{ marginBottom: 14 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                                        <span>Repayment progress</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <Bar pct={progress} color={color} height={6} />
                                </div>

                                {/* Action buttons */}
                                <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 8 }}>
                                    {acc.status === 'active' && (
                                        <button onClick={() => setPayLoan(acc)}
                                            style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', background: '#f0fdf4', color: '#15803d', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                            <Icon d={IC.plus} size={13} /> Payment
                                        </button>
                                    )}
                                    <button onClick={() => setEditLoan(acc)}
                                        className="icon-btn"
                                        style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                        <Icon d={IC.edit} size={14} />
                                    </button>
                                    <button onClick={() => setDelTarget(acc)}
                                        className="icon-btn"
                                        style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #fee2e2', background: '#fff', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                        <Icon d={IC.trash} size={14} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Modals */}
            <LoanModal open={addOpen} onClose={() => setAddOpen(false)} user={user} loan={null} onSaved={load} />
            <LoanModal open={!!editLoan} onClose={() => setEditLoan(null)} user={user} loan={editLoan} onSaved={load} />
            <PaymentModal open={!!payLoan} onClose={() => setPayLoan(null)} loan={payLoan ? { ...payLoan, user_id: user.user_id } : null} onSaved={load} />

            <Modal open={!!deleteTarget} onClose={() => setDelTarget(null)} onConfirm={deleteAccount}
                variant="danger" title="Delete this loan?"
                message={`This will permanently delete "${deleteTarget?.loan_name}" and all ${deleteTarget?.payment_count || 0} payment records. This cannot be undone.`}
                confirmLabel="Yes, delete" cancelLabel="Keep it" />
        </div>
    )
}

export default Payments