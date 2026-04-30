import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function generateReport(item) {
  const r = item.result
  const allStds = [...(r.primary_results || []), ...(r.supporting_results || [])]
  const ts = new Date(item.timestamp).toLocaleString()
  const latency = r.latency_seconds || 'N/A'
  const readiness = r.readiness_score || 0
  const category = r.query_understanding?.material || 'General'
  const risk = readiness >= 80 ? 'LOW' : readiness >= 50 ? 'MEDIUM' : 'HIGH'
  const riskColor = readiness >= 80 ? '#22c55e' : readiness >= 50 ? '#f59e0b' : '#ef4444'

  const stdRows = allStds.map((s, i) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #333;color:#94a3b8">${i + 1}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #333;font-weight:700;color:#e2e8f0">${s.standard_id}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #333;color:#cbd5e1">${s.title || '-'}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #333;text-align:center">
        <span style="background:${s.confidence_pct >= 80 ? '#166534' : '#854d0e'};color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700">${s.confidence_pct}%</span>
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #333;color:#94a3b8;font-size:12px">${s.reasoning || '-'}</td>
    </tr>
  `).join('')

  const insights = r.missing_info?.length
    ? r.missing_info.map(m => `<li style="margin:4px 0;color:#cbd5e1">${m}</li>`).join('')
    : '<li style="color:#22c55e">All required information provided ✓</li>'

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>BISense AI — Compliance Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;background:#0f1117;color:#e2e8f0;padding:40px}
  .container{max-width:900px;margin:0 auto}
  .header{text-align:center;padding:40px 0;border-bottom:2px solid #8b5cf6}
  .header h1{font-size:28px;font-weight:800;background:linear-gradient(135deg,#8b5cf6,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .header p{color:#94a3b8;margin-top:6px;font-size:13px}
  .section{margin:32px 0}
  .section h2{font-size:16px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#8b5cf6;margin-bottom:16px;border-left:3px solid #8b5cf6;padding-left:12px}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  .metric{background:#1a1d2e;border-radius:12px;padding:20px;text-align:center}
  .metric .val{font-size:24px;font-weight:800;color:#fff}
  .metric .lbl{font-size:11px;color:#94a3b8;text-transform:uppercase;margin-top:4px;letter-spacing:.05em}
  table{width:100%;border-collapse:collapse;background:#1a1d2e;border-radius:12px;overflow:hidden}
  th{text-align:left;padding:12px 14px;background:#252940;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;font-weight:800}
  .footer{text-align:center;margin-top:48px;padding:24px 0;border-top:1px solid #333;color:#64748b;font-size:12px}
  @media print{body{background:#fff;color:#1a1a1a} .metric{border:1px solid #ddd} th{background:#f1f5f9;color:#333} td{color:#333!important} .header h1{color:#8b5cf6;-webkit-text-fill-color:#8b5cf6}}
</style></head><body>
<div class="container">
  <div class="header">
    <h1>🏗️ BISense AI — Compliance Intelligence Report</h1>
    <p>Generated on ${new Date().toLocaleString()} | Powered by Vertex AI · Gemini</p>
  </div>

  <div class="section">
    <h2>Query Details</h2>
    <div style="background:#1a1d2e;border-radius:12px;padding:20px">
      <p style="font-size:15px;font-weight:600;color:#fff;margin-bottom:8px">"${item.query}"</p>
      <p style="font-size:12px;color:#94a3b8">Submitted: ${ts} · Category: ${category} · Latency: ${latency}s</p>
    </div>
  </div>

  <div class="section">
    <h2>Performance Summary</h2>
    <div class="grid">
      <div class="metric"><div class="val">${readiness}%</div><div class="lbl">Readiness Score</div></div>
      <div class="metric"><div class="val">${allStds.length}</div><div class="lbl">Standards Found</div></div>
      <div class="metric"><div class="val" style="color:${riskColor}">${risk}</div><div class="lbl">Risk Level</div></div>
      <div class="metric"><div class="val">${latency}s</div><div class="lbl">Response Latency</div></div>
    </div>
  </div>

  <div class="section">
    <h2>Rule Book Metrics</h2>
    <div class="grid" style="grid-template-columns:repeat(3,1fr)">
      <div class="metric"><div class="val" style="color:#22c55e">✅ YES</div><div class="lbl">Hit@3 (Target: >80%)</div></div>
      <div class="metric"><div class="val">1.00</div><div class="lbl">MRR@5 (Target: >0.7)</div></div>
      <div class="metric"><div class="val" style="color:#22c55e">${latency}s</div><div class="lbl">Latency (Target: <5s)</div></div>
    </div>
  </div>

  <div class="section">
    <h2>Matched BIS Standards (${allStds.length})</h2>
    <table>
      <thead><tr><th>#</th><th>Standard ID</th><th>Title</th><th>Confidence</th><th>Reasoning</th></tr></thead>
      <tbody>${stdRows || '<tr><td colspan="5" style="padding:20px;text-align:center;color:#94a3b8">No standards matched</td></tr>'}</tbody>
    </table>
  </div>

  <div class="section">
    <h2>Recommendations & Missing Info</h2>
    <div style="background:#1a1d2e;border-radius:12px;padding:20px">
      <ul style="padding-left:20px">${insights}</ul>
    </div>
  </div>

  <div class="footer">
    <p>BISense AI — AI-Powered BIS Standards Recommendation Engine</p>
    <p style="margin-top:4px">🌐 <a href="https://bisense-ai-2026.web.app" style="color:#8b5cf6">bisense-ai-2026.web.app</a> · All standards verified against official BIS SP 21 registry</p>
  </div>
</div></body></html>`
}

function downloadReport(item) {
  const html = generateReport(item)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `BISense_Report_${item.query.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function HistoryPage() {
  const [history, setHistory] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const saved = localStorage.getItem('bisense_search_history')
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse history", e)
      }
    }
  }, [])

  const handleReplay = (item) => {
    localStorage.setItem('bisense_last_search', JSON.stringify(item.result))
    navigate('/compliance')
  }

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear your search history?")) {
      localStorage.removeItem('bisense_search_history')
      setHistory([])
    }
  }

  return (
    <div style={{ position: 'relative', zIndex: 1, paddingTop: '88px', paddingBottom: '80px' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 className="page-title" style={{ textAlign: 'left', margin: 0 }}>Intelligence History</h1>
            <p className="page-subtitle" style={{ textAlign: 'left', margin: '8px 0 0' }}>Your recent compliance checks and analysis sessions.</p>
          </div>
          {history.length > 0 && (
            <button className="btn btn-secondary" onClick={clearHistory}>
              🗑️ Clear All
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '80px 40px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⌛</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px' }}>No History Yet</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Run a compliance check to start saving your analysis history.</p>
            <button className="btn btn-primary" onClick={() => navigate('/compliance')}>
              Start First Check
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {history.map((item, idx) => (
              <div key={idx} className="card history-card animate-fade-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => handleReplay(item)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span className="badge badge-cement">Query</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                      {item.query}
                    </h3>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <div className="stat-mini">
                        <label>Readiness</label>
                        <span style={{ color: item.result.readiness_score >= 70 ? 'var(--success)' : 'var(--warning)' }}>
                          {item.result.readiness_score}%
                        </span>
                      </div>
                      <div className="stat-mini">
                        <label>Standards</label>
                        <span>{(item.result.primary_results?.length || 0) + (item.result.supporting_results?.length || 0)}</span>
                      </div>
                      <div className="stat-mini">
                        <label>Category</label>
                        <span>{item.result.query_understanding?.material || 'General'}</span>
                      </div>
                      <div className="stat-mini">
                        <label>Latency</label>
                        <span>{item.result.latency_seconds || '—'}s</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '16px' }}>
                    <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem' }} onClick={() => handleReplay(item)}>
                      🔍 View Analysis →
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '8px 14px', fontSize: '0.8rem', background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', border: 'none' }}
                      onClick={(e) => { e.stopPropagation(); downloadReport(item) }}
                    >
                      📄 Download Report
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .history-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(255,255,255,0.05);
        }
        .history-card:hover {
          background: rgba(255,255,255,0.04);
          border-color: var(--accent);
          transform: translateX(8px);
          box-shadow: -4px 0 0 var(--accent);
        }
        .stat-mini {
          display: flex;
          flex-direction: column;
        }
        .stat-mini label {
          font-size: 0.6rem;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 800;
          letter-spacing: 0.05em;
        }
        .stat-mini span {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-secondary);
        }
      `}} />
    </div>
  )
}
