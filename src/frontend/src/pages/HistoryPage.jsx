import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

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
    // Save to last search so CompliancePage picks it up
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
              <div key={idx} className="card history-card animate-fade-up" style={{ animationDelay: `${idx * 0.05}s`, cursor: 'pointer' }} onClick={() => handleReplay(item)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
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
                        <span>{item.result.primary_results.length + item.result.supporting_results.length}</span>
                      </div>
                      <div className="stat-mini">
                        <label>Category</label>
                        <span>{item.result.query_understanding.material || 'General'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="history-action">
                    <button className="btn btn-secondary" style={{ padding: '8px 12px' }}>
                      View Analysis →
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
