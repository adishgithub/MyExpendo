import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Input from '../components/Input'
import Button from '../components/Button'
import HeroPanel from '../components/HeroPanel'
import { useToast } from '../components/Toast'

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)
const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)
const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)
const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const Login = ({ onLogin }) => {
  const navigate = useNavigate()
  const toast = useToast()
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (field) => (e) => {
    setFormData(p => ({ ...p, [field]: e.target.value }))
    setErrors(p => ({ ...p, [field]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!formData.username.trim()) errs.username = 'Username is required'
    if (!formData.password) errs.password = 'Password is required'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const res = await API.post('/api/user/login', formData)
      if (onLogin) onLogin(res.data)
      toast.success(
        `Welcome back, ${res.data.user?.full_name || res.data.user?.username}!`,
        'Login Successful'
      )
      navigate('/account')
    } catch (err) {
      const msg = err.response?.data?.message || ''
      if (msg.toLowerCase().includes('password')) {
        toast.error('The password you entered is incorrect. Please try again.', 'Wrong Password')
      } else if (msg.toLowerCase().includes('user') || msg.toLowerCase().includes('username') || msg.toLowerCase().includes('found')) {
        toast.error('No account found with that username.', 'User Not Found')
      } else {
        toast.error(msg || 'Something went wrong. Please try again.', 'Login Failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSocialClick = (provider) => {
    toast.construction(
      `${provider} sign-in is not available yet. Please use username & password for now.`,
      'Coming Soon'
    )
  }

  return (
    <div className="min-h-screen flex font-sans">
      <HeroPanel />
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-sm">
          <div className="text-center mb-7">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Welcome Back 👋</h2>
            <p className="text-sm text-gray-500 mt-1.5">Sign in to continue to your My ERP dashboard</p>
          </div>

          <div className="flex gap-3 mb-5">
            {[
              { icon: <GoogleIcon />, label: 'Continue with Google', provider: 'Google' },
              { icon: <MailIcon />, label: 'Continue with Email', provider: 'Email' },
            ].map(b => (
              <button key={b.label}
                onClick={() => handleSocialClick(b.provider)}
                className="flex-1 flex items-center justify-center gap-2 border border-gray-200
                           rounded-xl py-2.5 text-xs font-medium text-gray-700
                           hover:bg-gray-50 transition-colors cursor-pointer">
                {b.icon} {b.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-5">
            <hr className="flex-1 border-gray-200" />
            <span className="text-xs text-gray-400">or sign in with username</span>
            <hr className="flex-1 border-gray-200" />
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Input label="Username" placeholder="Enter your username"
              value={formData.username} onChange={set('username')}
              icon={<UserIcon />} error={errors.username} required />
            <Input label="Password" type="password" placeholder="Enter your password"
              value={formData.password} onChange={set('password')}
              icon={<LockIcon />} error={errors.password} required />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 select-none">
                <input type="checkbox" checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 accent-brand-500 rounded" />
                Remember me
              </label>
              <button type="button"
                onClick={() => toast.construction('Password reset is not available yet.', 'Coming Soon')}
                className="text-sm font-semibold text-brand-500 hover:text-brand-700 transition-colors">
                Forgot password?
              </button>
            </div>

            <Button type="submit" fullWidth loading={loading} className="mt-1">Login</Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-500 hover:text-brand-700 transition-colors">
              Register now →
            </Link>
          </p>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-gray-400 text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Your data is encrypted &amp; secure
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login