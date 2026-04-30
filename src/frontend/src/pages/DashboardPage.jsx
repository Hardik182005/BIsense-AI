import { useLocation, useNavigate } from 'react-router-dom'
import { RadialBarChart, RadialBar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

const RISK_COLORS = { Low: 'var(--success)', Medium: 'var(--warning)', High: 'var(--danger)' }

function ScoreGauge({ score }) {
  const color = score >= 75 ? '#00C896' : score >= 50 ? '#F59E0B' : '#EF4444'
  const r = 52
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ * 0.75
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: '160px', height: '140px', margin: '0 auto' }}>
        <svg width="160" height="140" style={{ transform: 'rotate(135deg)' }}>
          <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} />
          <circle cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="12"
            strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: '10px' }}>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ 100</div>
        </div>
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
        BIS Readiness Score
      </div>
    </div>
  )
}

const MOCK_RESULT = {
  results: [
    { standard_id: 'IS 1786: 1985', title: 'High Strength Deformed Steel Bars', category: 'Steel', confidence_pct: 96, matched_terms: ['tmt', 'steel', 'reinforcement'] },
    { standard_id: 'IS 456: 2000', title: 'Plain and Reinforced Concrete — Code of Practice', category: 'Concrete', confidence_pct: 74, matched_terms: ['concrete', 'reinforcement'] },
    { standard_id: 'IS 432 (Part 1): 1982', title: 'Mild Steel Bars for Concrete Reinforcement', category: 'Steel', confidence_pct: 61, matched_terms: ['steel', 'bars'] },
  ],
  readiness_score: 82,
  risk_level: 'Medium',
  readiness_flags: ['Specify steel grade (Fe415/Fe500)', 'Add dimensions of bars', 'Mention intended structure type'],
  detected_category: 'Steel',
  original_query: 'TMT steel bars for earthquake-resistant construction',
  compliance_graph: { primary: 'IS 1786: 1985', supporting: ['IS 456: 2000'], related: ['IS 432 (Part 1): 1982'] },
  latency_seconds: 0.98,
}

export default function DashboardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const result = location.state?.result || MOCK_RESULT

  const catDist = result.results.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(catDist).map(([name, value]) => ({ name, value }))
  const PIE_COLORS = ['#60A5FA', '#A78BFA', '#34D399', '#F59E0B']

  const riskColor = RISK_COLORS[result.risk_level] || 'var(--warning)'

  return (
    <div style={{ position: 'relative', zIndex: 1, paddingTop: '88px', paddingBottom: '80px' }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '6px' }}>
              Compliance Intelligence Dashboard
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Query: <em style={{ color: 'var(--text-primary)' }}>"{result.original_query}"</em>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '8px 16px' }} onClick={() => navigate('/compliance')}>
              ← New Search
            </button>
            <button className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '8px 16px' }} onClick={() => navigate('/analytics', { state: { result } })}>
              📊 Analytics
            </button>
            <button className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '8px 16px' }} onClick={() => navigate('/checklist', { state: { result } })}>
              📋 Checklist
            </button>
          </div>
        </div>

        {/* Top metrics row */}
        <div className="grid-4" style={{ marginBottom: '24px' }}>
          <div className="metric-card">
            <div className="metric-label">Readiness Score</div>
            <div className="metric-value" style={{ color: result.readiness_score >= 75 ? 'var(--success)' : result.readiness_score >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
              {result.readiness_score}/100
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Standards Found</div>
            <div className="metric-value">{result.results.length}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Risk Level</div>
            <div className="metric-value" style={{ color: riskColor, fontSize: '1.5rem' }}>{result.risk_level}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Query Latency</div>
            <div className="metric-value">{result.latency_seconds}s</div>
          </div>
        </div>

        {/* Main dashboard grid */}
        <div className="grid-2" style={{ gap: '24px', marginBottom: '24px' }}>
          {/* Score gauge card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '36px' }}>
            <ScoreGauge score={result.readiness_score} />
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Compliance Readiness</span>
                <span style={{ color: riskColor, fontWeight: 700 }}>{result.risk_level} Risk</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{
                  width: `${result.readiness_score}%`,
                  background: result.readiness_score >= 75 ? 'var(--success)' : result.readiness_score >= 50 ? 'var(--warning)' : 'var(--danger)'
                }} />
              </div>
            </div>
            {/* Flags */}
            {result.readiness_flags?.length > 0 && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Missing Information
                </div>
                {result.readiness_flags.map(f => (
                  <div key={f} className="flag-item">⚠️ {f}</div>
                ))}
              </div>
            )}
          </div>

          {/* Primary standard card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Primary Standard
            </div>
            {result.results[0] && (
              <div style={{ padding: '20px', background: 'rgba(255,140,0,0.06)', border: '1px solid rgba(255,140,0,0.25)', borderRadius: '14px' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--accent)', fontFamily: 'var(--font-display)', marginBottom: '6px' }}>
                  {result.results[0].standard_id}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
                  {result.results[0].title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Confidence:</span>
                  <div className="progress-bar" style={{ flex: 1 }}>
                    <div className="progress-fill" style={{ width: `${result.results[0].confidence_pct}%` }} />
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent)' }}>{result.results[0].confidence_pct}%</span>
                </div>
              </div>
            )}

            {/* Supporting standards */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                Supporting Standards
              </div>
              {result.results.slice(1).map(r => (
                <div key={r.standard_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{r.standard_id}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.title.substring(0, 45)}...</div>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: r.confidence_pct >= 70 ? 'var(--success)' : 'var(--warning)' }}>
                    {r.confidence_pct}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid-2" style={{ gap: '24px' }}>
          {/* Category distribution */}
          <div className="card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>
              Standards by Category
            </div>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Compliance effort estimate */}
          <div className="card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>
              Compliance Effort Estimate
            </div>
            {[
              { label: 'Documentation', pct: 70, color: '#60A5FA' },
              { label: 'Testing Required', pct: 55, color: '#A78BFA' },
              { label: 'Certification Prep', pct: 40, color: '#F59E0B' },
              { label: 'Overall Readiness', pct: result.readiness_score, color: '#00C896' },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ color: item.color, fontWeight: 700 }}>{item.pct}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${item.pct}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
