import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Ready']
const STATUS_COLORS = {
  'Not Started': 'var(--text-muted)',
  'In Progress': 'var(--warning)',
  'Ready': 'var(--success)',
}

const CHECKLISTS = {
  Steel: [
    'Identify steel grade (Fe415, Fe500, Fe550)',
    'Verify tensile strength requirements (UTS / YS)',
    'Check elongation percentage per grade',
    'Verify rib geometry for deformed bars',
    'Perform bend and rebend test',
    'Maintain mill test certificates for each heat',
    'Ensure BIS ISI mark on every bundle/coil',
    'Prepare dimensional inspection records',
    'Apply for BIS product certification (IS 1786)',
    'Prepare quality control plan for audit',
  ],
  Cement: [
    'Verify chemical composition (SiO₂, Al₂O₃, Fe₂O₃ within limits)',
    'Test compressive strength at 3, 7, and 28 days',
    'Check fineness (Blaine surface area)',
    'Perform initial and final setting time test',
    'Test soundness using Le Chatelier apparatus',
    'Maintain batch test certificates from BIS-approved lab',
    'Ensure BIS ISI mark on cement bags',
    'Prepare process control SOP for BIS audit',
    'Submit application to BIS for product certification',
  ],
  Concrete: [
    'Prepare mix design as per IS 10262',
    'Test compressive strength of cubes at 7 and 28 days',
    'Check workability using slump test',
    'Verify water-cement ratio',
    'Test aggregate quality as per IS 383',
    'Maintain pour cards and curing records',
    'Verify cover requirements for reinforcement',
    'Perform non-destructive testing (rebound hammer, UPV)',
    'Prepare QC plan for concrete production',
  ],
  Aggregates: [
    'Test grading and particle size distribution',
    'Check specific gravity and water absorption',
    'Test crushing value and impact value',
    'Check for deleterious materials (clay, silt, organic)',
    'Verify flakiness and elongation index',
    'Test alkali-silica reactivity',
    'Maintain quarry/source certificates',
    'Check fine aggregate zone classification',
  ]
}

const DEFAULT_CHECKLIST = CHECKLISTS.Concrete

export default function ChecklistPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const result = location.state?.result

  const category = result?.detected_category || 'Concrete'
  const baseChecklist = CHECKLISTS[category] || DEFAULT_CHECKLIST
  const [statuses, setStatuses] = useState(Object.fromEntries(baseChecklist.map((_, i) => [i, 'Not Started'])))

  const setStatus = (i, status) => setStatuses(prev => ({ ...prev, [i]: status }))

  const counts = {
    total: baseChecklist.length,
    ready: Object.values(statuses).filter(s => s === 'Ready').length,
    inProgress: Object.values(statuses).filter(s => s === 'In Progress').length,
    notStarted: Object.values(statuses).filter(s => s === 'Not Started').length,
  }

  const pctDone = Math.round((counts.ready / counts.total) * 100)

  const downloadCSV = () => {
    const rows = [['#', 'Task', 'Status']]
    baseChecklist.forEach((task, i) => rows.push([i + 1, task, statuses[i]]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `BISense_Checklist_${category}.csv`
    a.click()
  }

  return (
    <div style={{ position: 'relative', zIndex: 1, paddingTop: '88px', paddingBottom: '80px' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '6px' }}>
              MSME Compliance Checklist
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Category: <strong style={{ color: 'var(--accent)' }}>{category}</strong>
              {result?.results?.[0] && <> · Standard: <strong style={{ color: 'var(--text-primary)' }}>{result.results[0].standard_id}</strong></>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '8px 16px' }} onClick={downloadCSV}>
              ⬇️ Export CSV
            </button>
            <button className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '8px 16px' }} onClick={() => navigate('/dashboard', { state: { result } })}>
              📊 Dashboard
            </button>
          </div>
        </div>

        {/* Progress summary */}
        <div className="grid-4" style={{ marginBottom: '28px' }}>
          {[
            { label: 'Total Steps', value: counts.total, color: 'var(--text-primary)' },
            { label: 'Ready', value: counts.ready, color: 'var(--success)' },
            { label: 'In Progress', value: counts.inProgress, color: 'var(--warning)' },
            { label: 'Not Started', value: counts.notStarted, color: 'var(--text-muted)' },
          ].map(m => (
            <div key={m.label} className="metric-card">
              <div className="metric-label">{m.label}</div>
              <div className="metric-value" style={{ color: m.color, fontSize: '1.8rem' }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Overall progress */}
        <div className="card" style={{ marginBottom: '28px', padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Overall Compliance Progress</span>
            <span style={{ fontWeight: 800, color: pctDone >= 80 ? 'var(--success)' : pctDone >= 40 ? 'var(--warning)' : 'var(--text-muted)', fontSize: '1.1rem' }}>
              {pctDone}%
            </span>
          </div>
          <div className="progress-bar" style={{ height: '12px' }}>
            <div className="progress-fill" style={{ width: `${pctDone}%` }} />
          </div>
          <div style={{ display: 'flex', gap: '20px', marginTop: '12px', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--success)' }}>● Ready: {counts.ready}</span>
            <span style={{ color: 'var(--warning)' }}>● In Progress: {counts.inProgress}</span>
            <span style={{ color: 'var(--text-muted)' }}>● Not Started: {counts.notStarted}</span>
          </div>
        </div>

        {/* Checklist items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {baseChecklist.map((task, i) => {
            const status = statuses[i]
            return (
              <div
                key={i}
                className={`checklist-item ${status === 'Ready' ? 'done' : ''}`}
                onClick={() => {
                  const next = STATUS_OPTIONS[(STATUS_OPTIONS.indexOf(status) + 1) % STATUS_OPTIONS.length]
                  setStatus(i, next)
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="check-box">
                  {status === 'Ready' && '✓'}
                  {status === 'In Progress' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--warning)' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', minWidth: '20px' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span style={{
                      fontSize: '0.9rem',
                      color: status === 'Ready' ? 'var(--text-secondary)' : 'var(--text-primary)',
                      textDecoration: status === 'Ready' ? 'line-through' : 'none',
                      flex: 1
                    }}>
                      {task}
                    </span>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 700,
                      padding: '2px 10px', borderRadius: '12px',
                      background: status === 'Ready' ? 'rgba(0,200,150,0.15)' : status === 'In Progress' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
                      color: STATUS_COLORS[status],
                      border: `1px solid ${status === 'Ready' ? 'rgba(0,200,150,0.3)' : status === 'In Progress' ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
                      whiteSpace: 'nowrap'
                    }}>
                      {status}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: '24px', padding: '16px 20px', background: 'rgba(26,58,107,0.2)', border: '1px solid rgba(26,58,107,0.4)', borderRadius: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          💡 Click any item to cycle through: <strong>Not Started → In Progress → Ready</strong>
        </div>
      </div>
    </div>
  )
}
