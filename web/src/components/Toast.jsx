import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

/* ── Icons ── */
const icons = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  construction: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
}

const STYLES = {
  success:      { bg: '#f0fdf4', border: '#86efac', icon: '#16a34a', bar: '#22c55e', text: '#15803d' },
  error:        { bg: '#fef2f2', border: '#fca5a5', icon: '#dc2626', bar: '#ef4444', text: '#b91c1c' },
  warning:      { bg: '#fffbeb', border: '#fcd34d', icon: '#d97706', bar: '#f59e0b', text: '#b45309' },
  info:         { bg: '#eef2ff', border: '#a5b4fc', icon: '#4f46e5', bar: '#6366f1', text: '#4338ca' },
  search:       { bg: '#f8fafc', border: '#cbd5e1', icon: '#64748b', bar: '#94a3b8', text: '#475569' },
  construction: { bg: '#fff7ed', border: '#fdba74', icon: '#ea580c', bar: '#f97316', text: '#c2410c' },
}

/* ── Single Toast ── */
function Toast({ toast, onRemove }) {
  const s = STYLES[toast.type] || STYLES.info
  const [leaving, setLeaving] = useState(false)

  const dismiss = useCallback(() => {
    setLeaving(true)
    setTimeout(() => onRemove(toast.id), 350)
  }, [toast.id, onRemove])

  return (
    <div
      style={{
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'flex-start', gap: 12,
        background: s.bg, border: `1.5px solid ${s.border}`,
        borderRadius: 14, padding: '14px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)',
        minWidth: 300, maxWidth: 380,
        animation: leaving ? 'toastOut 0.35s ease forwards' : 'toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
        fontFamily: "'DM Sans', sans-serif",
        cursor: 'default',
      }}
    >
      {/* Colour bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
        background: s.bar, borderRadius: '14px 0 0 14px',
      }} />

      {/* Icon */}
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        background: `${s.bar}18`, color: s.icon,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginLeft: 4,
      }}>
        {icons[toast.type] || icons.info}
      </div>

      {/* Text */}
      <div style={{ flex: 1, paddingTop: 1 }}>
        {toast.title && (
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a', marginBottom: 2 }}>
            {toast.title}
          </div>
        )}
        <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.45 }}>
          {toast.message}
        </div>
      </div>

      {/* Close */}
      <button onClick={dismiss} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#94a3b8', padding: 2, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'color .15s',
        flexShrink: 0,
      }}
        onMouseEnter={e => e.currentTarget.style.color = '#475569'}
        onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {/* Progress bar */}
      {toast.duration && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, height: 2.5,
          background: s.bar, borderRadius: '0 0 14px 14px', opacity: 0.5,
          animation: `toastProgress ${toast.duration}ms linear forwards`,
        }} />
      )}
    </div>
  )
}

/* ── Provider ── */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const show = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = ++counter.current
    setToasts(p => [...p, { id, type, title, message, duration }])
    if (duration) setTimeout(() => remove(id), duration)
  }, [])

  const remove = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}

      {/* Toast stack — top right */}
      <div style={{
        position: 'fixed', top: 20, right: 20, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'all' }}>
            <Toast toast={t} onRemove={remove} />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(60px) scale(0.92); }
          to   { opacity: 1; transform: translateX(0)    scale(1); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0)    scale(1); }
          to   { opacity: 0; transform: translateX(60px) scale(0.92); }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

/* ── Hook ── */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')

  return {
    success:      (message, title = 'Success')      => ctx.show({ type: 'success',      title, message }),
    error:        (message, title = 'Error')         => ctx.show({ type: 'error',        title, message }),
    warning:      (message, title = 'Warning')       => ctx.show({ type: 'warning',      title, message }),
    info:         (message, title = 'Info')          => ctx.show({ type: 'info',         title, message }),
    search:       (message, title)                   => ctx.show({ type: 'search',       title, message }),
    construction: (message, title = 'Coming Soon')   => ctx.show({ type: 'construction', title, message }),
    custom:       (opts)                             => ctx.show(opts),
  }
}