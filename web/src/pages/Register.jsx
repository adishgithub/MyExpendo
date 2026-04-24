import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Input from '../components/Input'
import Button from '../components/Button'
import HeroPanel from '../components/HeroPanel'

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)
const NameIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)
const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

function getStrength(pw) {
  if (!pw) return { score: 0, color: '' }
  let score = 0
  if (pw.length >= 8)          score++
  if (/[A-Z]/.test(pw))        score++
  if (/[0-9]/.test(pw))        score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const colors = ['', 'bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-emerald-500']
  return { score, color: colors[score] }
}

function StepIndicator({ current }) {
  const steps = [
    { num: 1, label: 'Account Info' },
    { num: 2, label: 'Set Password' },
  ]
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => {
        const done   = current > s.num
        const active = current === s.num
        return (
          <div key={s.num} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                transition-all duration-300
                ${done   ? 'bg-[#4f6ef7] text-white ring-2 ring-blue-200' : ''}
                ${active ? 'bg-[#4f6ef7] text-white ring-4 ring-blue-100' : ''}
                ${!done && !active ? 'bg-gray-100 text-gray-400' : ''}
              `}>
                {done ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4"
                    viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd" />
                  </svg>
                ) : s.num}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap
                ${active ? 'text-[#4f6ef7]' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-16 h-px mb-4 transition-colors duration-300
                ${done ? 'bg-[#4f6ef7]' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    username: '', fullName: '', email: '',
    password: '', confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }))
    setErrors(p => ({ ...p, [field]: '' }))
  }

  const validateStep1 = () => {
    const errs = {}
    if (!form.username.trim())  errs.username = 'Username is required'
    else if (form.username.length < 3) errs.username = 'Min 3 characters'
    if (!form.fullName.trim())  errs.fullName = 'Full name is required'
    if (!form.email.trim())     errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email'
    return errs
  }

  const validateStep2 = () => {
    const errs = {}
    if (!form.password)         errs.password = 'Password is required'
    else if (form.password.length < 3) errs.password = 'Min 3 characters'
    if (!form.confirmPassword)  errs.confirmPassword = 'Please confirm password'
    else if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match'
    return errs
  }

  const handleContinue = (e) => {
    e.preventDefault()
    const errs = validateStep1()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setStep(2)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    const errs = validateStep2()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      // Map fullName → full_name to match your API's expected field name
      await axios.post('/api/user/register', {
        username:  form.username,
        password:  form.password,
        full_name: form.fullName,
        email:     form.email,
      })

      // On success → go to login
      navigate('/login')
    } catch (err) {
      setErrors({ form: err?.response?.data?.message || 'Registration failed. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const strength = getStrength(form.password)

  return (
    <div className="min-h-screen flex font-sans">

      <HeroPanel />

      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-sm">

          <StepIndicator current={step} />

          <div className="text-center mb-6">
            {step === 1 ? (
              <>
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  Create Your Account
                </h2>
                <p className="text-sm text-gray-500 mt-1.5">Enter your details to get started</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  Set Your Password
                </h2>
                <p className="text-sm text-gray-500 mt-1.5">
                  Create a strong password to secure your account
                </p>
              </>
            )}
          </div>

          {errors.form && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200
                            rounded-xl px-4 py-3">
              {errors.form}
            </div>
          )}

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <form onSubmit={handleContinue} noValidate className="flex flex-col gap-4">
              <Input
                label="Username"
                placeholder="Choose a username"
                value={form.username}
                onChange={set('username')}
                icon={<UserIcon />}
                error={errors.username}
                required
              />
              <Input
                label="Full Name"
                placeholder="Your full name"
                value={form.fullName}
                onChange={set('fullName')}
                icon={<NameIcon />}
                error={errors.fullName}
                required
              />
              <Input
                label="Email ID"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                icon={<MailIcon />}
                error={errors.email}
                required
              />

              <Button type="submit" fullWidth className="mt-2">
                Continue
              </Button>

              <p className="text-center text-sm text-gray-500 mt-1">
                Already have an account?{' '}
                <Link to="/login"
                  className="font-semibold text-[#4f6ef7] hover:text-[#2e47e8] transition-colors">
                  Login
                </Link>
              </p>
            </form>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <form onSubmit={handleRegister} noValidate className="flex flex-col gap-4">
              <div>
                <Input
                  label="Password"
                  type="password"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={set('password')}
                  icon={<LockIcon />}
                  error={errors.password}
                  required
                />
                {form.password && (
                  <div className="mt-2.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300
                            ${i <= strength.score ? strength.color : 'bg-gray-100'}`} />
                      ))}
                    </div>
                    <div className="flex gap-3 mt-2 flex-wrap">
                      {[
                        { test: form.password.length >= 8,   label: 'At least 8 characters' },
                        { test: /[A-Z]/.test(form.password), label: 'One uppercase letter' },
                        { test: /[0-9]/.test(form.password), label: 'One number' },
                      ].map(r => (
                        <span key={r.label}
                          className={`text-xs flex items-center gap-1
                            ${r.test ? 'text-emerald-500' : 'text-gray-400'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3"
                            viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd" />
                          </svg>
                          {r.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                icon={<LockIcon />}
                error={errors.confirmPassword}
                required
              />

              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center justify-center w-11 h-11 rounded-xl
                             border-2 border-gray-200 text-gray-500 shrink-0
                             hover:border-[#4f6ef7] hover:text-[#4f6ef7] transition-colors"
                  aria-label="Go back"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <Button type="submit" fullWidth loading={loading}
                  icon={
                    !loading &&
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  }>
                  Register Account
                </Button>
              </div>

              <p className="text-center text-sm text-gray-500 mt-1">
                Already have an account?{' '}
                <Link to="/login"
                  className="font-semibold text-[#4f6ef7] hover:text-[#2e47e8] transition-colors">
                  Login
                </Link>
              </p>
            </form>
          )}

          <div className="mt-5 flex items-center justify-center gap-1.5 text-gray-400 text-xs">
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