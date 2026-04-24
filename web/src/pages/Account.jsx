import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import { useState, useEffect } from 'react'
import { useToast } from '../components/Toast'
import axios from 'axios'

const Icon = ({ d, size = 18 }) => {
  if (!d) return null
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const Avatar = ({ name = '', size = 80 }) => {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', fontSize: size * 0.36,
      background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
    }}>
      {initials || '?'}
    </div>
  )
}

// PUT THIS ABOVE the Account component (outside it completely)
const InfoRow = ({ label, value, icon, field, editing, form, setForm }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
    <div style={{
      width: 38, height: 38, borderRadius: 10, background: '#eef2ff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', flexShrink: 0
    }}>
      <Icon d={icon} size={17} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginBottom: 4 }}>{label}</div>
      {editing && field !== 'createdAt' ? (
        <input
          value={form[field] || ''}
          onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
          style={{
            width: '100%', border: '1.5px solid #a5b4fc', borderRadius: 8,
            padding: '7px 10px', fontSize: 14, color: '#1e293b', outline: 'none',
            background: '#f8faff', fontFamily: 'inherit', boxSizing: 'border-box',
            transition: 'border .15s',
          }}
          onFocus={e => e.target.style.borderColor = '#6366f1'}
          onBlur={e => e.target.style.borderColor = '#a5b4fc'}
        />
      ) : (
        <div style={{ fontSize: 14.5, color: value && value !== 'Not provided' ? '#1e293b' : '#94a3b8', fontWeight: 600 }}>
          {value || '—'}
        </div>
      )}
    </div>
  </div>
)

const Account = ({ user, onLogout, onUpdate }) => {
  const navigate = useNavigate()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  useEffect(() => {
    setForm({
      full_name: user?.full_name || '',
      username: user?.username || '',
      email: user?.email || '',
      phone: user?.phone || '',
    })
  }, [user])

  const toast = useToast()
  const isComplete = !!(user?.full_name && user?.username && user?.email && user?.phone)


  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await axios.put('/api/user/update', {
        _id: user?._id,
        full_name: form.full_name,
        username: form.username,
        email: form.email,
        phone: form.phone,
      })
      // Update the user in App state so sidebar/topbar refresh too
      if (onLogout) {
        // Re-fetch or patch — simplest: patch locally via callback
      }


      toast.success('Your profile has been updated.', 'Profile Saved')
      if (onUpdate) onUpdate(res.data.user)
      setEditing(false)


    } catch (err) {
      const msg = err.response?.data?.message || 'Could not save changes.'
      toast.error(msg, 'Update Failed')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    if (onLogout) onLogout()
    navigate('/login')
  }

  const infoItems = [
    { label: 'Full Name', field: 'full_name', value: form.full_name, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { label: 'Username', field: 'username', value: form.username, icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z' },
    { label: 'Email Address', field: 'email', value: form.email, icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { label: 'Phone Number', field: 'phone', value: form.phone || 'Not provided', icon: 'M3 5a2 2 0 012-2h3.28a2 2 0 011.91 1.42l.94 3.77a2 2 0 01-.45 1.95l-2.28 2.28a16 16 0 006.86 6.86l2.28-2.28a2 2 0 011.95-.45l3.77.94A2 2 0 0121 19V22a2 2 0 01-2 2h-1C9.16 24 3 17.84 3 10V5z' },
    { label: 'Member Since', field: 'createdAt', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : null, icon: 'M12 8v4l3 3M6 2a9 9 0 100 18 9 9 0 000-18z' },
  ]

  return (
    <div style={{ maxWidth: 620 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>My Account</h1>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>View and manage your profile details</p>
      </div>

      {/* Profile card */}
      <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden' }}>

        {/* Hero band */}
        <div style={{ height: 100, background: 'linear-gradient(135deg,#4f46e5 0%,#818cf8 100%)', position: 'relative' }}>
          <div style={{ position: 'absolute', bottom: -44, left: 28 }}>
            <Avatar name={user?.full_name || user?.username || ''} size={88} />
          </div>
        </div>

        <div style={{ paddingTop: 52, paddingLeft: 28, paddingRight: 28, paddingBottom: 8 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
            {user?.full_name || user?.username}
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>@{user?.username}</div>
        </div>

        {/* Info rows */}
        <div style={{ marginTop: 12 }}>
          {infoItems.map(item => (
            <InfoRow key={item.label} {...item} editing={editing} form={form} setForm={setForm} />
          ))}
        </div>

        {/* Logout */}
        <div style={{ padding: '16px 20px', alignContent: 'center', display: 'flex', }}>
          <button onClick={() => setLogoutOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2',
              color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: 10,
              padding: '10px 20px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
              transition: 'all .18s',
            }}
            className="logout-btn"
            onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626' }}
          >
            <Icon d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" size={16} />
            Sign Out
          </button>
          <button
            onClick={() => {
              if (editing) {
                handleSave()
              } else {
                setEditing(true)
                setForm({
                  full_name: user?.full_name || '',
                  username: user?.username || '',
                  email: user?.email || '',
                  phone: user?.phone || '',
                })
              }
            }}
            disabled={saving}
            style={{
              marginLeft: 12, display: 'flex', alignItems: 'center', gap: 8,
              background: editing ? '#dcfce7' : '#e0e7ff',
              color: editing ? '#15803d' : '#3730a3',
              border: `1.5px solid ${editing ? '#86efac' : '#c7d2fe'}`,
              borderRadius: 10, padding: '10px 20px',
              fontSize: 13.5, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all .18s', opacity: saving ? 0.7 : 1,
            }}
            onMouseEnter={e => {
              if (!saving) {
                e.currentTarget.style.background = editing ? '#15803d' : '#3730a3'
                e.currentTarget.style.color = '#fff'
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = editing ? '#dcfce7' : '#e0e7ff'
              e.currentTarget.style.color = editing ? '#15803d' : '#3730a3'
            }}
          >
            <Icon
              d={editing
                ? 'M20 6L9 17l-5-5'
                : 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z'
              }
              size={16}
            />
            {saving ? 'Saving…' : editing ? 'Save Changes' : isComplete ? 'Edit Profile' : 'Complete Profile'}
          </button>
          {editing && (
            <button
              onClick={() => setEditing(false)}
              style={{
                marginLeft: 8, display: 'flex', alignItems: 'center', gap: 6,
                background: '#f8fafc', color: '#64748b',
                border: '1.5px solid #e2e8f0', borderRadius: 10,
                padding: '10px 16px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                transition: 'all .18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc' }}
            >
              Cancel
            </button>
          )}
          {/* Logout confirmation modal */}
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
        </div>
      </div>
    </div>
  )
}

export default Account