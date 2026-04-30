import { useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Compliance Check', path: '/compliance' },
  { label: 'Dashboard', path: '/dashboard' },
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
        <div className="navbar-logo-icon">🏛️</div>
        <span>
          <span className="brand-bis">BI</span>
          <span className="brand-sense">Sense</span>
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
        <button className="nav-cta" onClick={() => navigate('/compliance')}>
          🔍 Start Check
        </button>
      </div>
    </nav>
  )
}
