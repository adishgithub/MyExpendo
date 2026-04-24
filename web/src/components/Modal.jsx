import { useEffect, useCallback } from 'react'

/**
 * Modal — generic animated confirmation/alert dialog
 *
 * Props:
 *   open        boolean
 *   onClose     () => void
 *   onConfirm   () => void   (optional — if omitted, only Close button shows)
 *   title       string
 *   message     string | ReactNode
 *   confirmLabel  string  (default "Confirm")
 *   cancelLabel   string  (default "Cancel")
 *   variant     'danger' | 'warning' | 'info'  (default 'info')
 *   icon        ReactNode (optional override)
 */

const VARIANTS = {
  danger:  { bg: '#fef2f2', iconBg: '#fee2e2', iconColor: '#dc2626', btn: '#dc2626', btnHover: '#b91c1c', ring: '#fca5a5' },
  warning: { bg: '#fffbeb', iconBg: '#fef3c7', iconColor: '#d97706', btn: '#f59e0b', btnHover: '#d97706', ring: '#fcd34d' },
  info:    { bg: '#eef2ff', iconBg: '#e0e7ff', iconColor: '#4f46e5', btn: '#4f46e5', btnHover: '#4338ca', ring: '#a5b4fc' },
}

const DEFAULT_ICONS = {
  danger: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  warning: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  info: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
}

export default function Modal({
  open, onClose, onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  variant      = 'info',
  icon,
}) {
  const v = VARIANTS[variant] || VARIANTS.info

  // Close on Escape
  const onKey = useCallback((e) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onKey])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(15,23,42,0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'backdropIn 0.2s ease forwards',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20,
          padding: '32px 28px 24px',
          width: '100%', maxWidth: 420,
          boxShadow: `0 24px 64px rgba(0,0,0,0.18), 0 0 0 1px ${v.ring}`,
          animation: 'modalIn 0.35s cubic-bezier(0.34,1.4,0.64,1) forwards',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
          textAlign: 'center',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: v.iconBg, color: v.iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 18,
          boxShadow: `0 0 0 8px ${v.iconBg}88`,
          animation: 'iconPop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.1s both',
        }}>
          {icon || DEFAULT_ICONS[variant]}
        </div>

        {/* Title */}
        <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
          {title}
        </div>

        {/* Message */}
        {message && (
          <div style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.6, marginBottom: 24, maxWidth: 320 }}>
            {message}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '11px 0', borderRadius: 11,
              border: '1.5px solid #e2e8f0', background: '#f8fafc',
              fontSize: 13.5, fontWeight: 600, color: '#475569',
              cursor: 'pointer', transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0' }}
          >
            {cancelLabel}
          </button>

          {onConfirm && (
            <button
              onClick={() => { onConfirm(); onClose() }}
              style={{
                flex: 1, padding: '11px 0', borderRadius: 11,
                border: 'none', background: v.btn,
                fontSize: 13.5, fontWeight: 600, color: '#fff',
                cursor: 'pointer', transition: 'all .15s',
                boxShadow: `0 4px 12px ${v.btn}55`,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = v.btnHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = v.btn;      e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes backdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.88) translateY(20px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes iconPop {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  )
}