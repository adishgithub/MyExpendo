// App.jsx — Updated routing with Layout + Account page
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import API from './utils/api'
import expendoLogo from './assets/icon.svg'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Account from './pages/Account'
import Categories from './pages/Categories'
import Expenses from './pages/Expenses'
import Income from './pages/Income'
import ToBuyList from './pages/ToBuyList'
import Home from './pages/Home'
import Payments from './pages/Payments'
import Calendar from './pages/Calendar'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        // Retry up to 5 times with 800ms delay (handles backend startup lag)
        for (let i = 0; i < 5; i++) {
          try {
            const res = await API.get('/api/user/me')
            setUser(res.data.user || res.data)
            break
          } catch (err) {
            if (err.code === 'ECONNREFUSED' || err.response === undefined) {
              await new Promise(r => setTimeout(r, 800))
              continue
            }
            // Actual auth failure — clear token and stop retrying
            localStorage.removeItem('token')
            break
          }
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

  const handleLogin = (userData) => {
    setUser(userData.user)
    localStorage.setItem('token', userData.token)
  }

  const handleUpdate = (updatedUser) => {
    setUser(updatedUser)
  }

  // Add this inline SVG as a constant at the top of App.jsx
  const ExpendoLogo = () => (
    <svg width="80" height="80" viewBox="0 0 998.96 998.96" style={{ borderRadius: 20, display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lg1" x1="996.96" y1="786.7" x2="2" y2="212.26" gradientUnits="userSpaceOnUse">
          <stop offset=".19" stopColor="#5317cd" /><stop offset=".41" stopColor="#631fd7" />
          <stop offset=".83" stopColor="#8f35f3" /><stop offset="1" stopColor="#a33fff" />
        </linearGradient>
        <linearGradient id="lg2" x1="444.82" y1="378.61" x2="555.38" y2="378.61" gradientUnits="userSpaceOnUse">
          <stop offset=".22" stopColor="#5317cd" stopOpacity=".7" /><stop offset="1" stopColor="#a33fff" />
        </linearGradient>
      </defs>
      <path fill="url(#lg1)" d="M704.14,0h-409.32C131.99,0,0,132,0,294.82v409.32c0,162.82,131.99,294.82,294.82,294.82h409.32c162.82,0,294.82-132,294.82-294.82v-409.32C998.96,132,866.96,0,704.14,0ZM523.21,331.18c1.67,2.69,2.45,5.21,2.83,6.9,9.78.02,19.56.03,29.34.05-3.51,4.23-7.02,8.47-10.54,12.71-6.25.01-12.5.03-18.75.04-.23,1.59-.69,3.84-1.7,6.38-.45,1.14-2.31,5.57-7.37,10.58-5.23,5.19-10.53,7.65-14.69,9.55-2.96,1.34-10.46,4.47-20.65,5.38-2.92.26-5.4.28-7.23.24,20.17,20.27,40.35,40.54,60.52,60.8-9.04.02-18.08.03-27.12.05-19.28-19.46-38.57-38.92-57.86-58.38,0-4.01.02-8.01.04-12.01,7.4-.02,14.81-.03,22.21-.04,4.36-.04,12.63-.78,20.59-5.95,3.1-2.02,8.1-5.27,10.35-11.52.74-2.06.98-3.89,1.06-5.17-19.81-.01-39.62-.02-59.42-.04,3.25-4.24,6.49-8.48,9.74-12.72,15.7.02,31.4.03,47.09.04-1.81-2.6-3.68-4.28-5.03-5.32-4.9-3.76-10.3-4.75-14.35-5.49-1.51-.27-2.82-.43-5.42-.74-3.57-.43-6.53-.66-8.56-.79-7.78-.02-15.55-.03-23.32-.05,3.28-4.08,6.55-8.16,9.83-12.24,33.27-.02,66.55-.04,99.82-.07-3.11,4.07-6.23,8.13-9.35,12.19-8.99.02-17.98.03-26.98.05,1.35,1.09,3.25,2.9,4.92,5.57Z" />
      <path fill="#fff" d="M498.36,236.41c-135.58,0-245.48,58.89-245.48,131.52,0,33.88,23.9,64.76,63.16,88.09,44.93,26.67,109.97,43.45,182.32,43.45s137.38-16.78,182.31-43.45c39.27-23.33,63.17-54.21,63.17-88.09,0-72.63-109.91-131.52-245.48-131.52Z" />
      <path fill="url(#lg2)" d="M474.45,383.01c20.17,20.27,40.35,40.54,60.52,60.8-9.04.02-18.08.03-27.12.05-19.28-19.46-38.57-38.92-57.86-58.38,0-4.01.02-8.01.04-12.01,7.4-.02,14.81-.03,22.21-.04,4.36-.04,12.63-.78,20.59-5.95,3.1-2.02,8.1-5.27,10.35-11.52.74-2.06.98-3.89,1.06-5.17-19.81-.01-39.62-.02-59.42-.04,3.25-4.24,6.49-8.48,9.74-12.72,15.7.02,31.4.03,47.09.04-1.81-2.6-3.68-4.28-5.03-5.32-4.9-3.76-10.3-4.75-14.35-5.49-1.51-.27-2.82-.43-5.42-.74-3.57-.43-6.53-.66-8.56-.79-7.78-.02-15.55-.03-23.32-.05,3.28-4.08,6.55-8.16,9.83-12.24,33.27-.02,66.55-.04,99.82-.07-3.11,4.07-6.23,8.13-9.35,12.19-8.99.02-17.98.03-26.98.05,1.35,1.09,3.25,2.9,4.92,5.57,1.67,2.69,2.45,5.21,2.83,6.9,9.78.02,19.56.03,29.34.05-3.51,4.23-7.02,8.47-10.54,12.71-6.25.01-12.5.03-18.75.04-.23,1.59-.69,3.84-1.7,6.38-.45,1.14-2.31,5.57-7.37,10.58-5.23,5.19-10.53,7.65-14.69,9.55-2.96,1.34-10.46,4.47-20.65,5.38-2.92.26-5.4.28-7.23.24Z" />
      <path fill="#fff" d="M493.82,677.48c-20.96-.17-58.96-.75-106.58-13.61-50.53-13.64-89.22-35-115.09-52.16-1.86-.79-6.09-2.25-10.2-.57-5.19,2.12-7.04,7.95-7.94,10.77-7.73,24.33,7.94,53.86,7.94,53.86,21,39.58,62.35,56.62,87.31,66.9,29.78,12.27,54.14,15.9,80.5,19.84,10.52,1.57,45.26,6.39,91.28,4.54,21.81-.88,48.03-2.07,81.64-10.2,38.96-9.43,62.85-22.14,68.03-24.94,11.6-6.29,26.98-15.85,42.52-30.61,16.1-15.29,21.24-25.6,23.24-30.05,5.24-11.64,6.14-21.26,6.8-28.35,1.72-18.4-2.73-24.96-3.97-26.65-1.1-1.5-4.32-5.87-9.07-6.24-4.31-.33-7.75,2.81-9.07,3.97-5.55,4.87-15.63,11.58-34.58,21.35-15.66,7.49-37.35,16.7-64.06,24.57-19.16,5.64-66.38,18.09-128.69,17.57Z" />
      <path fill="#fff" d="M495.22,543.7c-20.96-.17-58.96-.75-106.58-13.61-50.53-13.64-89.22-35-115.09-52.16-1.86-.79-6.09-2.25-10.2-.57-5.19,2.12-7.04,7.95-7.94,10.77-7.73,24.33,7.94,53.86,7.94,53.86,21,39.58,62.35,56.62,87.31,66.9,29.78,12.27,54.14,15.9,80.5,19.84,10.52,1.57,45.26,6.39,91.28,4.54,21.81-.88,48.03-2.07,81.64-10.2,38.96-9.43,62.85-22.14,68.03-24.94,11.6-6.29,26.98-15.85,42.52-30.61,16.1-15.29,21.24-25.6,23.24-30.05,5.24-11.64,6.14-21.26,6.8-28.35,1.72-18.4-2.73-24.96-3.97-26.65-1.1-1.5-4.32-5.87-9.07-6.24-4.31-.33-7.75,2.81-9.07,3.97-5.55,4.87-15.63,11.58-34.58,21.35-15.66,7.49-37.35,16.7-64.06,24.57-19.16,5.64-66.38,18.09-128.69,17.57Z" />
    </svg>
  )

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0f172a', fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes pulse {
        0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
        40% { transform: scale(1.15); opacity: 1; }
      }
    `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>

        {/* Logo with spinning rings */}
        <img
          src={expendoLogo}
          alt="My Expendo"
          style={{ width: 80, height: 80, borderRadius: 20, display: 'block' }}
        />

        {/* Brand name */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', margin: 0 }}>
            My Expendo<span style={{ color: '#818cf8' }}> !</span>
          </p>
          <p style={{ fontSize: 13, color: '#475569', letterSpacing: '0.04em', margin: 0, fontWeight: 500 }}>
            Your personal finance tracker
          </p>
        </div>

        {/* Animated dots */}
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          {[['#4f46e5', '0s'], ['#6366f1', '0.18s'], ['#818cf8', '0.36s']].map(([color, delay], i) => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: '50%', background: color,
              animation: `pulse 1.3s ease-in-out ${delay} infinite`,
            }} />
          ))}
        </div>

      </div>
    </div>
  )

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
        <Route path="/" element={<Protected><Home user={user} /></Protected>} />
        <Route path="/account" element={<Protected><Account user={user} onLogout={handleLogout} onUpdate={handleUpdate} /></Protected>} />
        <Route path="/categories" element={<Protected><Categories user={user} /></Protected>} />
        <Route path="/expenses" element={<Protected><Expenses user={user} /></Protected>} />
        <Route path="/income" element={<Protected><Income user={user} /></Protected>} />
        <Route path="/tobuy" element={<Protected><ToBuyList user={user} /></Protected>} />
        <Route path="/payments" element={<Protected><Payments user={user} /></Protected>} />
        <Route path="/calendar" element={<Protected><Calendar user={user} /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App