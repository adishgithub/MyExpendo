// src/components/HeroPanel.jsx

const features = [
  {
    color: 'rgba(99,153,34,0.18)',
    stroke: '#7dc842',
    title: 'Track Every Expense',
    desc: 'Categorise and monitor all your spending in real-time with auto-tagging and monthly summaries.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    color: 'rgba(79,110,247,0.18)',
    stroke: '#6e8ffb',
    title: 'Smart To-Buy List',
    desc: 'Plan purchases before you spend. Set budgets, add items, and tick them off as you buy.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    color: 'rgba(234,159,39,0.18)',
    stroke: '#efae40',
    title: 'EMI & Payment Tracking',
    desc: 'Never miss a due date. Track all your EMIs, subscriptions, and recurring bills in one place.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    color: 'rgba(93,202,165,0.15)',
    stroke: '#4dc9a0',
    title: 'Analytics & Reports',
    desc: 'Visual charts and weekly reports help you understand spending patterns and save more.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
  },
]

export default function HeroPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative flex-col overflow-hidden px-10 py-10
                    bg-linear-to-br from-[#0e1a3a] via-[#0b1120] to-[#060910]">

      {/* Dot pattern */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.065) 1px,transparent 1px)',
        backgroundSize: '22px 22px',
      }} />

      {/* Glow orbs */}
      <div className="absolute -top-16 -left-12 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'rgba(79,110,247,0.15)', filter: 'blur(55px)' }} />
      <div className="absolute -bottom-12 -right-10 w-52 h-52 rounded-full pointer-events-none"
        style={{ background: 'rgba(100,60,220,0.12)', filter: 'blur(45px)' }} />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-2">
        <div className="w-8 h-8 bg-[#4f6ef7] rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              fill="rgba(255,255,255,0.9)" />
            <path d="M9 22V12h6v10" stroke="#4f6ef7" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <span className="font-extrabold text-white text-base tracking-tight">My ERP</span>
      </div>

      {/* Headline */}
      <div className="relative z-10 mt-10">
        <h1 className="text-3xl font-extrabold text-white leading-tight tracking-tight">
          Take control of your<br />finance &amp; purchases<br />
          <span style={{ color: '#6e8ffb' }}>in one place</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed max-w-xs"
          style={{ color: 'rgba(255,255,255,0.42)' }}>
          Smart, simple &amp; powerful ERP to manage your salary, expenses,
          plans &amp; payments — all from one dashboard.
        </p>
      </div>

      {/* Feature cards */}
      <div className="relative z-10 mt-8 flex flex-col gap-3 flex-1">
        {features.map((f) => (
          <div key={f.title}
            className="flex items-start gap-3 rounded-xl px-4 py-3"
            style={{
              background: 'rgba(255,255,255,0.045)',
              border: '0.5px solid rgba(255,255,255,0.10)',
            }}>

            {/* Icon bubble */}
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: f.color, color: f.stroke }}>
              {f.icon}
            </div>

            {/* Text */}
            <div>
              <p className="text-xs font-bold text-white mb-0.5">{f.title}</p>
              <p className="text-xs leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.42)' }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA note */}
      <div className="relative z-10 mt-6 flex items-center gap-3 rounded-xl px-4 py-3"
        style={{
          background: 'rgba(79,110,247,0.12)',
          border: '0.5px solid rgba(79,110,247,0.30)',
        }}>
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none"
          stroke="#6e8ffb" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.60)' }}>
          <span className="text-white font-bold">Get started in 2 minutes.</span> No credit
          card required. Your data is end-to-end encrypted and 100% private.
        </p>
      </div>

    </div>
  )
}