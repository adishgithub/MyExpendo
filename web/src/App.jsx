// App.jsx — Updated routing with Layout + Account page
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Account from './pages/Account'
import Categories from './pages/Categories'
import Expenses from './pages/Expenses'
import Income from './pages/Income'
// import other pages here (Dashboard, Expenses, etc.)

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const res = await axios.get('/api/user/me', {
            headers: { Authorization: `Bearer ${token}` }
          })
          setUser(res.data.user || res.data)
        } catch (err) {
          localStorage.removeItem('token')
        }
      }
      setLoading(false)
    }
    fetchUser()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  // After login: store user from response
  const handleLogin = (userData) => {
    setUser(userData.user)
    localStorage.setItem('token', userData.token)
  }

  const handleUpdate = (updatedUser) => {
    setUser(updatedUser)
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'DM Sans, sans-serif', color: '#6366f1', fontSize: 15
    }}>
      Loading…
    </div>
  )

  // Protected wrapper
  const Protected = ({ children }) => {
    if (!user) return <Navigate to="/login" replace />
    return (
      <Layout user={user} onLogout={handleLogout}>
        {children}
      </Layout>
    )
  }

  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route path="/" element={<Protected><div style={{ color: '#1e293b' }}>Dashboard coming soon</div></Protected>} />
        <Route path="/account" element={<Protected><Account user={user} onLogout={handleLogout} onUpdate={handleUpdate} /></Protected>} />
        <Route path="/categories" element={<Protected><Categories user={user} /></Protected>} />
        <Route path="/expenses" element={<Protected><Expenses user={user} /></Protected>} />
        <Route path="/income" element={<Protected><Income user={user} /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App