import { useLocation, useNavigate } from 'react-router-dom'
import { RadialBarChart, RadialBar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { 
  FileDown, 
  Search, 
  BarChart3, 
  ClipboardList, 
  AlertTriangle,
  ArrowLeft
} from 'lucide-react'

async function downloadReport(item) {
  try {
    const response = await fetch('/api/compliance/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item.result)
    })
    if (!response.ok) throw new Error("Failed to generate PDF")
    
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `BISense_Report_${item.query.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error("PDF download error:", err)
    alert("Unable to generate PDF report. Please try again later.")
  }
}

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
    <div style={{ position: 'relative', zIndex: 1, paddingTop: '88px', paddingBottom: '80px', minHeight: '100vh', background: 'radial-gradient(circle at 50% -20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)' }}>
      <div className="container" style={{ animation: 'fade-in 0.8s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                <BarChart3 size={24} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Intelligence Report</span>
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-display)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              Compliance Dashboard
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '600px', lineHeight: 1.5 }}>
              Detailed analysis for: <span style={{ color: '#fff', fontWeight: 600 }}>"{result.original_query}"</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-gradient" onClick={() => downloadReport({ query: result.original_query, result })}>
              <FileDown size={18} /> Download PDF
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/compliance')}>
              <ArrowLeft size={18} /> New Check
            </button>
          </div>
        </div>

        {/* High-Level Metrics */}
        <div className="grid-4" style={{ marginBottom: '32px' }}>
          {[
            { label: 'Readiness Score', value: `${result.readiness_score}%`, color: result.readiness_score >= 75 ? '#00C896' : '#F59E0B', sub: 'Audit Ready' },
            { label: 'Standards Found', value: result.results.length, color: '#fff', sub: 'BIS Registry' },
            { label: 'Risk Level', value: result.risk_level, color: riskColor, sub: 'Compliance Risk' },
            { label: 'Analysis Time', value: `${result.latency_seconds}s`, color: '#fff', sub: 'Inference Speed' },
          ].map(m => (
            <div key={m.label} className="card" style={{ padding: '24px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>{m.label}</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: m.color, marginBottom: '4px', fontFamily: 'var(--font-display)' }}>{m.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ gap: '32px', marginBottom: '32px' }}>
          {/* Main Visual Score */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
            <ScoreGauge score={result.readiness_score} />
            <div style={{ width: '100%', marginTop: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Certification Probability</span>
                <span style={{ fontWeight: 800, color: riskColor }}>{result.risk_level} Risk</span>
              </div>
              <div className="progress-bar" style={{ height: '12px', background: 'rgba(255,255,255,0.05)' }}>
                <div className="progress-fill" style={{ width: `${result.readiness_score}%`, background: `linear-gradient(90deg, ${riskColor}, #fff)` }} />
              </div>
            </div>

            {result.readiness_flags?.length > 0 && (
              <div style={{ width: '100%', marginTop: '40px', padding: '20px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444', fontWeight: 700, fontSize: '0.85rem', marginBottom: '16px', textTransform: 'uppercase' }}>
                  <AlertTriangle size={16} /> Critical Gaps Identified
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {result.readiness_flags.map(f => (
                    <div key={f} className="flag-item" style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', display: 'flex', gap: '10px' }}>
                      <span style={{ color: '#EF4444' }}>•</span> {f}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Primary Result Detail */}
          <div className="card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>Primary Recommendation</div>
              {result.results[0] && (
                <div style={{ padding: '32px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>{result.results[0].standard_id}</div>
                  <div style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.4, marginBottom: '24px' }}>{result.results[0].title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="progress-bar" style={{ flex: 1, height: '8px' }}>
                      <div className="progress-fill" style={{ width: `${result.results[0].confidence_pct}%`, background: '#6366f1' }} />
                    </div>
                    <span style={{ fontWeight: 800, color: '#6366f1' }}>{result.results[0].confidence_pct}% Match</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Associated Standards</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {result.results.slice(1).map(r => (
                  <div key={r.standard_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{r.standard_id}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.category}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: r.confidence_pct >= 70 ? '#00C896' : '#F59E0B' }}>{r.confidence_pct}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Charts & Distribution */}
        <div className="grid-2" style={{ gap: '32px' }}>
          <div className="card" style={{ padding: '32px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>Category Distribution</div>
            <div style={{ height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label={({ name }) => name} labelLine={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ padding: '32px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>Compliance Roadmap</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Documentation Review', pct: 75, color: '#6366f1' },
                { label: 'Laboratory Testing', pct: 45, color: '#a855f7' },
                { label: 'Factory Inspection', pct: 20, color: '#ec4899' },
                { label: 'Final Certification', pct: 10, color: '#00C896' },
              ].map(step => (
                <div key={step.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{step.label}</span>
                    <span style={{ fontWeight: 800, color: step.color }}>{step.pct}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: '6px' }}>
                    <div className="progress-fill" style={{ width: `${step.pct}%`, background: step.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .flag-item {
          transition: all 0.2s;
        }
        .flag-item:hover {
          color: #fff !important;
          transform: translateX(4px);
        }
      `}</style>
    </div>
  )
}
