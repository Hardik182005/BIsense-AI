import { useNavigate, useLocation } from 'react-router-dom'
import { ShieldCheck, Search } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Compliance Check', path: '/compliance' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Standards', path: '/standards' },
  { label: 'Graph', path: '/graph' },
  { label: 'History', path: '/history' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate('/')}>
        <div className="navbar-logo-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff' }}>
          <ShieldCheck size={20} />
        </div>
        <span>
          <span className="brand-bis" style={{ fontWeight: 800 }}>BI</span>
          <span className="brand-sense" style={{ fontWeight: 400, opacity: 0.8 }}>Sense</span>
        </span>
        <span className="brand-ai">AI</span>
      </div>

      <div className="navbar-links">
        {NAV_ITEMS.map(item => (
          <button
            key={item.path}
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </button>
        ))}
        <button className="nav-cta" onClick={() => navigate('/compliance')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={16} /> Start Check
        </button>
      </div>
    </nav>
  )
}
