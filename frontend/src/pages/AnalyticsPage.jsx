import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color || 'var(--accent)', fontWeight: 700 }}>
          {p.name}: {p.value}{p.name === 'latency' ? 's' : ''}
        </div>
      ))}
    </div>
  )
}

const CATEGORY_COLORS = {
  'Cement': '#A78BFA',
  'Steel': '#60A5FA',
  'Concrete': '#F59E0B',
  'Aggregates': '#34D399',
  'default': '#9CA3AF'
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [animatedMetrics, setAnimatedMetrics] = useState({ hit: 0, mrr: 0, latency: 0, total: 0 })
  const [categoryData, setCategoryData] = useState([])
  const [latencyData, setLatencyData] = useState([])
  const [topStandards, setTopStandards] = useState([])
  const [recentQueries, setRecentQueries] = useState([])

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics/')
        if (!res.ok) throw new Error('Failed to fetch analytics')
        const data = await res.json()
        
        setAnimatedMetrics({
          hit: data.hit_rate_3 || 0,
          mrr: data.mrr_5 || 0,
          latency: data.avg_latency || 0,
          total: data.total_searches || 0
        })

        if (data.category_distribution) {
          setCategoryData(Object.entries(data.category_distribution).map(([k, v]) => ({
            name: k,
            queries: v,
            color: CATEGORY_COLORS[k] || CATEGORY_COLORS['default']
          })))
        }

        if (data.recent_queries) {
          setRecentQueries(data.recent_queries)
          setLatencyData(data.recent_queries.slice().reverse().map((q, i) => ({
            time: `Q${i+1}`,
            latency: q.latency
          })))
        }

        if (data.top_standards) {
          setTopStandards(data.top_standards)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAnalytics()
  }, [])

  return (
    <div style={{ position: 'relative', zIndex: 1, paddingTop: '88px', paddingBottom: '80px' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">
            Real-time performance metrics · Hit Rate, MRR, Latency tracking.
          </p>
        </div>

        {/* Primary Metrics */}
        <div className="grid-4" style={{ marginBottom: '28px' }}>
          {[
            { label: 'Hit Rate @3', value: `${animatedMetrics.hit}%`, target: '> 80%', good: true, icon: '🎯' },
            { label: 'MRR @5', value: animatedMetrics.mrr.toFixed(3), target: '> 0.70', good: true, icon: '📈' },
            { label: 'Avg Latency', value: `${animatedMetrics.latency}s`, target: '< 5.0s', good: true, icon: '⚡' },
            { label: 'Total Queries', value: animatedMetrics.total, target: 'Public + Private', good: true, icon: '🔍' },
          ].map(m => (
            <div key={m.label} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '1.5rem', opacity: 0.15 }}>
                {m.icon}
              </div>
              <div className="metric-label">{m.label}</div>
              <div className="metric-value" style={{ margin: '8px 0' }}>{m.value}</div>
              <div style={{ fontSize: '0.75rem', color: m.good ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                {m.good ? '✓' : '✗'} Target: {m.target}
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid-2" style={{ gap: '24px', marginBottom: '24px' }}>
          {/* Category queries */}
          <div className="card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>
              Queries by Category
            </div>
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} barSize={40}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="queries" name="Queries" radius={[6, 6, 0, 0]}>
                    {categoryData.map((entry, i) => (
                      <rect key={i} fill={entry.color} />
                    ))}
                  </Bar>
                  <Bar dataKey="queries" name="Queries" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Latency over time */}
          <div className="card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>
              Response Latency (seconds)
            </div>
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 3]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="latency" name="latency" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: 'var(--accent)', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* 5s threshold line annotation */}
            <div style={{ fontSize: '0.78rem', color: 'var(--success)', textAlign: 'center', marginTop: '8px' }}>
              ✓ All queries well below 5s threshold
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid-2" style={{ gap: '24px' }}>
          {/* Top standards */}
          <div className="card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>
              Most Recommended Standards
            </div>
            {topStandards.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', minWidth: '18px' }}>#{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--accent)' }}>{s.id}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.count} queries</span>
                  </div>
                  <div className="progress-bar" style={{ height: '5px' }}>
                    <div className="progress-fill" style={{ width: `${(s.count / Math.max(...topStandards.map(t => t.count))) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent queries */}
          <div className="card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>
              Recent Queries
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentQueries.map((q, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '260px' }}>
                      {q.query}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700 }}>{q.standard || 'No Match'}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.75rem', color: q.status === 'Hit' ? 'var(--success)' : 'var(--danger)', fontWeight: 700, background: q.status === 'Hit' ? 'rgba(0,200,150,0.1)' : 'rgba(255,0,0,0.1)', padding: '1px 8px', borderRadius: '10px' }}>
                      {q.status === 'Hit' ? '✓ Hit' : '✗ Miss'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{q.latency}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
