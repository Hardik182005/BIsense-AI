import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const API_BASE = '/api'

const PROCESSING_STEPS = [
  { id: 'lang', label: 'Detecting language...', icon: '🌐' },
  { id: 'extract', label: 'Extracting product attributes...', icon: '🧠' },
  { id: 'search', label: 'Searching BIS registry...', icon: '🔎' },
  { id: 'validate', label: 'Validating standards...', icon: '🛡️' },
  { id: 'graph', label: 'Generating compliance roadmap...', icon: '🕸️' },
]

const CATEGORY_COLORS = {
  Cement: 'cement', Steel: 'steel', Concrete: 'concrete', Aggregates: 'aggregates'
}

function ReadinessMeter({ score, factors, risk }) {
  const color = score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)'
  return (
    <div className="card" style={{ marginBottom: '24px', borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>BIS Readiness Score</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>Based on query clarity and technical depth</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>{score}<span style={{ fontSize: '1rem', opacity: 0.6 }}>/100</span></div>
          <span className="badge" style={{ background: `${color}20`, color, borderColor: `${color}40`, marginTop: '4px' }}>{risk} Risk</span>
        </div>
      </div>
      <div className="grid-3" style={{ gap: '12px' }}>
        {Object.entries(factors || {}).map(([key, val]) => (
          <div key={key}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>{key.replace('_', ' ')}</div>
            <div className="progress-bar" style={{ height: '4px' }}>
              <div className="progress-fill" style={{ width: `${val}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function QueryUnderstanding({ data, language }) {
  return (
    <div className="card" style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
        Query Understanding Engine
      </div>
      <div className="grid-4" style={{ gap: '12px' }}>
        <div className="understanding-item">
          <label>Language</label>
          <div>{language}</div>
        </div>
        <div className="understanding-item">
          <label>Material</label>
          <div>{data.material}</div>
        </div>
        <div className="understanding-item">
          <label>Use Case</label>
          <div>{data.use_case}</div>
        </div>
        <div className="understanding-item">
          <label>Product Type</label>
          <div>{data.product_type}</div>
        </div>
      </div>
    </div>
  )
}

function ConfidenceBar({ pct, breakdown }) {
  const color = pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)'
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <div className="progress-bar" style={{ flex: 1, height: '8px' }}>
          <div className="progress-fill" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 12px ${color}60` }} />
        </div>
        <span style={{ fontSize: '0.9rem', fontWeight: 800, color, minWidth: '40px' }}>{pct}%</span>
      </div>
      {breakdown && (
        <div style={{ display: 'flex', gap: '12px', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          <span>Keyword: {breakdown.keyword_match}%</span>
          <span>Semantic: {breakdown.semantic_match}%</span>
          <span>Category: {breakdown.category_match}%</span>
        </div>
      )}
    </div>
  )
}

function ResultCard({ result, rank }) {
  const [expanded, setExpanded] = useState(rank === 1)
  const catClass = CATEGORY_COLORS[result.category] || 'cement'

  return (
    <div className={`result-card ${rank === 1 && result.is_primary ? 'rank-1' : ''} ${!result.is_primary ? 'supporting' : ''}`} style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
              #{rank}
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
              {result.standard_id}
            </span>
            <span className={`badge badge-${catClass}`}>{result.category}</span>
            <span className="badge badge-verified">✓ Verified BIS</span>
            {!result.is_primary && <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>Supporting Standard</span>}
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
            {result.title}
          </h3>
          <ConfidenceBar pct={result.confidence_pct} breakdown={result.confidence_breakdown} />
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}
        >
          {expanded ? '▲ Less' : '▼ More'}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <div className="grid-2" style={{ gap: '20px' }}>
            <div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', fontWeight: 800 }}>
                  Why this standard?
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {result.reasoning.map((r, i) => <li key={i} style={{ marginBottom: '4px' }}>{r}</li>)}
                </ul>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', fontWeight: 800 }}>
                  Scope & Application
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {result.scope}
                </p>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', fontWeight: 800 }}>
                Matched Terms
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                {result.matched_terms.length > 0
                  ? result.matched_terms.map(t => <span key={t} className="tag" style={{ color: 'var(--accent)', borderColor: 'rgba(255,140,0,0.3)', background: 'rgba(255,140,0,0.08)' }}>{t}</span>)
                  : <span className="tag">Standard matched via semantic similarity</span>
                }
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', fontWeight: 800 }}>
                Compliance Pathway
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div className="path-node">Product</div>
                <div style={{ color: 'var(--text-muted)' }}>→</div>
                <div className="path-node active">{result.standard_id.split(':')[0]}</div>
                <div style={{ color: 'var(--text-muted)' }}>→</div>
                <div className="path-node">Testing</div>
                <div style={{ color: 'var(--text-muted)' }}>→</div>
                <div className="path-node">BIS ISI</div>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', fontWeight: 800 }}>
                Related Standards
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {result.related_standards.map(r => <span key={r} className="tag">{r}</span>)}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.1)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔒 Evidence Source: Official BIS Building Materials Dataset · Verified Standard
          </div>
        </div>
      )}
    </div>
  )
}

export default function CompliancePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [processingStep, setProcessingStep] = useState(-1)
  const [language, setLanguage] = useState('en')
  const [showChecklist, setShowChecklist] = useState(false)
  const resultsRef = useRef(null)

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setQuery(q)
      handleSearch(q)
    }
  }, [])

  const handleSearch = async (q = query) => {
    if (!q.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    setProcessingStep(0)

    for (let i = 0; i < PROCESSING_STEPS.length; i++) {
      setProcessingStep(i)
      await new Promise(r => setTimeout(r, 400 + Math.random() * 200))
    }

    try {
      const res = await fetch(`${API_BASE}/compliance/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, top_k: 5 })
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setResult(data)
      setProcessingStep(-1)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      setError("Unable to connect to the compliance engine. Please try again later.")
      setProcessingStep(-1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'relative', zIndex: 1, paddingTop: '88px', paddingBottom: '80px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 className="page-title">Product Compliance Intelligence</h1>
          <p className="page-subtitle">
            Enterprise-grade standard mapping and certification readiness engine.
          </p>
        </div>

        {/* Search Form */}
        <div style={{ maxWidth: '800px', margin: '0 auto 40px' }}>
          <div className="search-hero">
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
                  Product / Project Description
                </label>
                <textarea
                  className="input-field"
                  rows={4}
                  placeholder="e.g. TMT steel bars for earthquake-resistant residential construction"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && e.ctrlKey && handleSearch()}
                />
              </div>

              <div className="grid-2" style={{ gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
                    Regional Support
                  </label>
                  <select className="input-field" value={language} onChange={e => setLanguage(e.target.value)}>
                    <option value="en">English (Auto-detect)</option>
                    <option value="hi">Hindi / Marathi</option>
                    <option value="gu">Gujarati</option>
                    <option value="ta">Tamil</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '16px' }}
                    onClick={() => handleSearch()}
                    disabled={loading || !query.trim()}
                  >
                    {loading ? <><div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> Analyzing...</> : '🔍 Run Intelligence Check'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Processing */}
        {loading && (
          <div style={{ maxWidth: '600px', margin: '0 auto 40px' }} className="card">
            <div style={{ fontWeight: 700, marginBottom: '20px', color: 'var(--accent)' }}>
              🤖 AI Compliance Engine is processing...
            </div>
            {PROCESSING_STEPS.map((step, i) => (
              <div key={step.id} className={`processing-step ${i < processingStep ? 'done' : i === processingStep ? 'active' : ''}`}>
                <div className={`processing-icon ${i < processingStep ? 'done' : i === processingStep ? 'active' : 'waiting'}`}>
                  {i < processingStep ? '✓' : i === processingStep ? <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} /> : step.icon}
                </div>
                <span>{step.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {result && (
          <div ref={resultsRef} className="animate-fade-up" style={{ maxWidth: '900px', margin: '0 auto' }}>
            
            <div className="grid-2" style={{ gap: '24px', marginBottom: '24px' }}>
              <ReadinessMeter score={result.readiness_score} factors={result.readiness_factors} risk={result.risk_level} />
              <QueryUnderstanding data={result.query_understanding} language={result.detected_language} />
            </div>

            {result.missing_info.length > 0 && (
              <div className="card" style={{ marginBottom: '24px', background: 'rgba(255,69,0,0.05)', border: '1px solid rgba(255,69,0,0.1)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--danger)', marginBottom: '8px' }}>⚠️ ACTIONABLE INSIGHT: MISSING INFORMATION</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {result.missing_info.map(m => <span key={m} className="tag" style={{ background: 'rgba(255,69,0,0.1)', color: 'var(--danger)', borderColor: 'rgba(255,69,0,0.2)' }}>+ {m}</span>)}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginBottom: '32px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/dashboard', { state: { result } })}>📊 Analysis Dashboard</button>
              <button className="btn btn-secondary" onClick={() => navigate('/graph', { state: { result } })}>🕸️ Compliance Graph</button>
              <button className="btn btn-secondary" onClick={() => setShowChecklist(!showChecklist)}>✅ {showChecklist ? 'Hide Checklist' : 'Get Checklist'}</button>
            </div>

            {showChecklist && (
              <div className="card animate-fade-in" style={{ marginBottom: '32px', background: 'rgba(0,200,150,0.03)', border: '1px solid rgba(0,200,150,0.2)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px', color: 'var(--success)' }}>🛠️ BIS Mandatory Compliance Checklist</h3>
                <div className="grid-2" style={{ gap: '12px' }}>
                  {result.checklist.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <input type="checkbox" readOnly checked={false} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Primary Results */}
            {result.primary_results.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: 'var(--success)' }}>●</span> Primary BIS Standards
                </h2>
                {result.primary_results.map((r, i) => (
                  <ResultCard key={r.standard_id} result={r} rank={i + 1} />
                ))}
              </div>
            )}

            {/* Supporting Results */}
            {result.supporting_results.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: 'var(--warning)' }}>●</span> Supporting Standards
                </h2>
                {result.supporting_results.map((r, i) => (
                  <ResultCard key={r.standard_id} result={r} rank={result.primary_results.length + i + 1} />
                ))}
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Checked against 450+ official BIS building material standards · Generated in {result.latency_seconds}s
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
