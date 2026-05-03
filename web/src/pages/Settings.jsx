import { useState } from 'react'
import API from '../utils/api'
import { useToast } from '../components/Toast'

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const ICONS = {
  lock: 'M17 11V7a5 5 0 00-10 0v4M5 11h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2z',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z',
  eyeOff: 'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22',
  check: 'M20 6L9 17l-5-5',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z',
}

const inputBase = {
  width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10,
  padding: '10px 44px 10px 14px', fontSize: 14, color: '#1e293b', outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box', background: '#f8fafc',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
      {label}
    </label>
    {children}
  </div>
)

const PasswordField = ({ label, value, onChange, placeholder, hint }) => {
  const [show, setShow] = useState(false)
  const accent = '#4f46e5'
  return (
    <Field label={label}>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={inputBase}
          onFocus={e => { e.target.style.borderColor = accent; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)' }}
          onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 2 }}>
          <Icon d={show ? ICONS.eyeOff : ICONS.eye} size={16} />
        </button>
      </div>
      {hint && <div style={{ fontSize: 11.5, color: hint.color || '#94a3b8', marginTop: 5 }}>{hint.text}</div>}
    </Field>
  )
}

const getStrength = (pw) => {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

const strengthMeta = [
  { label: 'Too short', color: '#ef4444' },
  { label: 'Weak', color: '#ef4444' },
  { label: 'Fair', color: '#f59e0b' },
  { label: 'Good', color: '#10b981' },
  { label: 'Strong', color: '#10b981' },
]

const NAV_ITEMS = [
  { key: 'general', label: 'General', icon: ICONS.settings },
  { key: 'security', label: 'Security', icon: ICONS.lock },
]

const Settings = ({ user }) => {
  const toast = useToast()
  const [activeSection, setActiveSection] = useState('security')

  // Password form state
  const [form, setForm] = useState({ current: '', newPw: '', confirm: '' })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const strength = getStrength(form.newPw)
  const requirements = [
    { label: '8+ characters', pass: form.newPw.length >= 8 },
    { label: 'One uppercase letter', pass: /[A-Z]/.test(form.newPw) },
    { label: 'One number', pass: /[0-9]/.test(form.newPw) },
  ]
  const passwordsMatch = form.newPw && form.confirm && form.newPw === form.confirm
  const valid = form.current && form.newPw.length >= 8 && /[A-Z]/.test(form.newPw) && /[0-9]/.test(form.newPw) && passwordsMatch

  const handleReset = () => setForm({ current: '', newPw: '', confirm: '' })

  const handleSave = async () => {
    if (!valid) return
    setSaving(true)
    try {
      await API.put('/api/user/change-password', {
        currentPassword: form.current,
        newPassword: form.newPw,
      })
      toast.success('Password updated successfully.', 'Done')
      handleReset()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 860, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>Settings</h1>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Manage your account preferences and security</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20 }}>
        {/* Sidebar nav */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 8, height: 'fit-content' }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 13.5, fontWeight: activeSection === item.key ? 600 : 500,
                background: activeSection === item.key ? '#eef2ff' : 'transparent',
                color: activeSection === item.key ? '#4f46e5' : '#64748b',
                transition: 'all .15s', fontFamily: 'inherit', marginBottom: 2,
              }}
              onMouseEnter={e => { if (activeSection !== item.key) e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={e => { if (activeSection !== item.key) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon d={item.icon} size={16} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 28 }}>
          {activeSection === 'general' && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>General</div>
              <div style={{ fontSize: 13, color: '#64748b', paddingBottom: 20, borderBottom: '1px solid #f1f5f9', marginBottom: 24 }}>
                App preferences — more options coming soon.
              </div>
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                <Icon d={ICONS.settings} size={40} />
                <div style={{ marginTop: 12, fontSize: 14, fontWeight: 500 }}>General settings coming soon</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Head to Security to update your password</div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Change Password</div>
              <div style={{ fontSize: 13, color: '#64748b', paddingBottom: 20, borderBottom: '1px solid #f1f5f9', marginBottom: 24 }}>
                Update your password to keep your account secure. You'll need your current password to proceed.
              </div>

              <PasswordField
                label="Current Password"
                value={form.current}
                onChange={e => set('current', e.target.value)}
                placeholder="Enter your current password"
              />

              <PasswordField
                label="New Password"
                value={form.newPw}
                onChange={e => set('newPw', e.target.value)}
                placeholder="Enter new password"
              />

              {/* Strength bar */}
              {form.newPw && (
                <div style={{ marginTop: -12, marginBottom: 18 }}>
                  <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      width: `${(strength / 4) * 100}%`,
                      background: strengthMeta[strength].color,
                      transition: 'width 0.3s, background 0.3s',
                    }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {requirements.map(r => (
                      <div key={r.label} style={{ fontSize: 11.5, color: r.pass ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, transition: 'color .2s' }}>
                        <Icon d={r.pass ? ICONS.check : 'M12 5v14M5 12h14'} size={12} />
                        {r.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <PasswordField
                label="Confirm New Password"
                value={form.confirm}
                onChange={e => set('confirm', e.target.value)}
                placeholder="Re-enter new password"
                hint={
                  form.confirm
                    ? passwordsMatch
                      ? { text: '✓ Passwords match', color: '#10b981' }
                      : { text: '⚠ Passwords do not match', color: '#ef4444' }
                    : null
                }
              />

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  onClick={handleReset}
                  style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!valid || saving}
                  style={{
                    flex: 2, padding: '11px 0', borderRadius: 10, border: 'none',
                    background: valid ? '#4f46e5' : '#c7d2fe', color: '#fff',
                    fontWeight: 700, fontSize: 14, cursor: valid && !saving ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'background 0.15s, transform 0.15s', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { if (valid && !saving) { e.currentTarget.style.background = '#4338ca'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
                  onMouseLeave={e => { e.currentTarget.style.background = valid ? '#4f46e5' : '#c7d2fe'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <Icon d={ICONS.check} size={15} />
                  {saving ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings