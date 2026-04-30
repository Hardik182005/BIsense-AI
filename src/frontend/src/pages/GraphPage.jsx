import { useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

const GRAPH_DATA = {
  'IS 1786: 1985': {
    label: 'TMT Steel Bar',
    nodes: [
      { id: 'IS 1786: 1985', type: 'primary', label: 'IS 1786: 1985', sub: 'High Strength Deformed Steel Bars', x: 50, y: 10 },
      { id: 'IS 456: 2000', type: 'secondary', label: 'IS 456: 2000', sub: 'Reinforced Concrete', x: 20, y: 40 },
      { id: 'IS 432 (Part 1): 1982', type: 'secondary', label: 'IS 432', sub: 'Mild Steel Bars', x: 50, y: 40 },
      { id: 'IS 2062: 2011', type: 'secondary', label: 'IS 2062: 2011', sub: 'Structural Steel', x: 80, y: 40 },
      { id: 'IS 383: 1970', type: 'related', label: 'IS 383: 1970', sub: 'Aggregates', x: 10, y: 70 },
      { id: 'IS 10262: 2009', type: 'related', label: 'IS 10262: 2009', sub: 'Mix Design', x: 35, y: 70 },
      { id: 'IS 808: 1989', type: 'related', label: 'IS 808: 1989', sub: 'Steel Sections', x: 75, y: 70 },
    ],
    edges: [
      ['IS 1786: 1985', 'IS 456: 2000'],
      ['IS 1786: 1985', 'IS 432 (Part 1): 1982'],
      ['IS 1786: 1985', 'IS 2062: 2011'],
      ['IS 456: 2000', 'IS 383: 1970'],
      ['IS 456: 2000', 'IS 10262: 2009'],
      ['IS 2062: 2011', 'IS 808: 1989'],
    ]
  },
  'IS 269: 1989': {
    label: 'OPC Cement',
    nodes: [
      { id: 'IS 269: 1989', type: 'primary', label: 'IS 269: 1989', sub: 'Ordinary Portland Cement 33G', x: 50, y: 10 },
      { id: 'IS 8112: 1989', type: 'secondary', label: 'IS 8112: 1989', sub: 'OPC 43 Grade', x: 20, y: 40 },
      { id: 'IS 12269: 1987', type: 'secondary', label: 'IS 12269: 1987', sub: 'OPC 53 Grade', x: 50, y: 40 },
      { id: 'IS 455: 1989', type: 'secondary', label: 'IS 455: 1989', sub: 'Portland Slag Cement', x: 80, y: 40 },
      { id: 'IS 456: 2000', type: 'related', label: 'IS 456: 2000', sub: 'Concrete Code', x: 25, y: 70 },
      { id: 'IS 10262: 2009', type: 'related', label: 'IS 10262', sub: 'Mix Design', x: 65, y: 70 },
    ],
    edges: [
      ['IS 269: 1989', 'IS 8112: 1989'],
      ['IS 269: 1989', 'IS 12269: 1987'],
      ['IS 269: 1989', 'IS 455: 1989'],
      ['IS 8112: 1989', 'IS 456: 2000'],
      ['IS 455: 1989', 'IS 10262: 2009'],
    ]
  },
  'IS 383: 1970': {
    label: 'Aggregates',
    nodes: [
      { id: 'IS 383: 1970', type: 'primary', label: 'IS 383: 1970', sub: 'Coarse & Fine Aggregates', x: 50, y: 10 },
      { id: 'IS 2116: 1980', type: 'secondary', label: 'IS 2116: 1980', sub: 'Sand for Mortars', x: 20, y: 40 },
      { id: 'IS 9142: 1979', type: 'secondary', label: 'IS 9142: 1979', sub: 'Lightweight Aggregates', x: 80, y: 40 },
      { id: 'IS 456: 2000', type: 'related', label: 'IS 456: 2000', sub: 'Concrete Code', x: 50, y: 70 },
    ],
    edges: [
      ['IS 383: 1970', 'IS 2116: 1980'],
      ['IS 383: 1970', 'IS 9142: 1979'],
      ['IS 383: 1970', 'IS 456: 2000'],
    ]
  }
}

const DEFAULT_GRAPH = GRAPH_DATA['IS 1786: 1985']

const TYPE_STYLES = {
  primary: { bg: 'rgba(255,140,0,0.15)', border: 'rgba(255,140,0,0.6)', color: 'var(--accent)', glow: 'rgba(255,140,0,0.3)' },
  secondary: { bg: 'rgba(26,58,107,0.4)', border: 'rgba(36,81,163,0.7)', color: '#60A5FA', glow: 'rgba(36,81,163,0.3)' },
  related: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.15)', color: 'var(--text-secondary)', glow: 'none' },
}

export default function GraphPage() {
  const location = useLocation()
  const [result, setResult] = useState(location.state?.result || null)
  const [loading, setLoading] = useState(!location.state?.result)

  useEffect(() => {
    if (!result) {
      try {
        const saved = localStorage.getItem('bisense_last_search')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && parsed.primary_results) {
            setResult(parsed)
          }
        }
      } catch (e) {
        console.error("Error parsing history:", e)
      } finally {
        setLoading(false)
      }
    }
  }, [result])

  const primaryId = result?.compliance_graph?.primary || result?.primary_results?.[0]?.standard_id || 'IS 1786: 1985'
  
  let graphData = GRAPH_DATA[primaryId]
  if (!graphData && result?.compliance_graph) {
    // Dynamically build graph data
    const nodes = []
    const edges = []
    
    nodes.push({
      id: primaryId,
      type: 'primary',
      label: primaryId,
      sub: result?.primary_results?.[0]?.title || 'Primary Standard',
      x: 50, y: 10
    })

    const secondary = result.compliance_graph.supporting || []
    secondary.forEach((sec, i) => {
      const px = 50 + (i - (secondary.length - 1) / 2) * 30
      nodes.push({ id: sec, type: 'secondary', label: sec, sub: 'Supporting Standard', x: px, y: 40 })
      edges.push([primaryId, sec])
    })

    const related = result.compliance_graph.related || []
    related.forEach((rel, i) => {
      const px = 50 + (i - (related.length - 1) / 2) * 30
      nodes.push({ id: rel, type: 'related', label: rel, sub: 'Related Standard', x: px, y: 70 })
      if (secondary.length > 0) {
        edges.push([secondary[i % secondary.length], rel])
      } else {
        edges.push([primaryId, rel])
      }
    })

    graphData = { label: 'Dynamic Graph', nodes, edges }
  } else if (!graphData) {
    graphData = GRAPH_DATA[Object.keys(GRAPH_DATA)[0]]
  }

  const WIDTH = 700
  const HEIGHT = 400

  const getPos = (node) => ({
    x: (node.x / 100) * (WIDTH - 160) + 80,
    y: (node.y / 100) * (HEIGHT - 100) + 50
  })

  const nodeMap = Object.fromEntries(graphData.nodes.map(n => [n.id, n]))

  return (
    <div style={{ position: 'relative', zIndex: 1, paddingTop: '88px', paddingBottom: '80px' }}>
      <div className="container">
        {loading && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Syncing graph with latest search...</div>}
        {!loading && <>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 className="page-title">Compliance Graph</h1>
          <p className="page-subtitle">
            Visual relationship map between primary, supporting, and related BIS standards.
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '28px', flexWrap: 'wrap' }}>
          {[
            { type: 'primary', label: 'Primary Standard' },
            { type: 'secondary', label: 'Supporting Standards' },
            { type: 'related', label: 'Related Standards' },
          ].map(l => (
            <div key={l.type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: TYPE_STYLES[l.type].bg, border: `2px solid ${TYPE_STYLES[l.type].border}` }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{l.label}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* SVG Graph */}
          <div className="card" style={{ flex: '1 1 600px', padding: '24px', overflow: 'hidden' }}>
            <div style={{ marginBottom: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Compliance Dependency Graph — {graphData.label}
            </div>
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              style={{ width: '100%', height: 'auto', background: 'rgba(255,255,255,0.01)', borderRadius: '12px' }}
            >
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="rgba(255,255,255,0.2)" />
                </marker>
                {Object.entries(TYPE_STYLES).map(([type, style]) => (
                  <filter key={type} id={`glow-${type}`}>
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                ))}
              </defs>

              {/* Edges */}
              {graphData.edges.map(([from, to], i) => {
                const f = nodeMap[from], t = nodeMap[to]
                if (!f || !t) return null
                const fp = getPos(f), tp = getPos(t)
                return (
                  <line key={i}
                    x1={fp.x} y1={fp.y} x2={tp.x} y2={tp.y}
                    stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"
                    markerEnd="url(#arrow)"
                    strokeDasharray={f.type === 'secondary' ? '4 4' : ''}
                  />
                )
              })}

              {/* Nodes */}
              {graphData.nodes.map(node => {
                const pos = getPos(node)
                const style = TYPE_STYLES[node.type]
                const rx = node.type === 'primary' ? 70 : 60
                const ry = node.type === 'primary' ? 28 : 22

                return (
                  <g key={node.id} filter={node.type !== 'related' ? `url(#glow-${node.type})` : ''}>
                    <ellipse cx={pos.x} cy={pos.y} rx={rx} ry={ry}
                      fill={style.bg} stroke={style.border} strokeWidth={node.type === 'primary' ? 2.5 : 1.5} />
                    <text x={pos.x} y={pos.y - 5} textAnchor="middle" fill={style.color}
                      fontSize={node.type === 'primary' ? '13' : '11'} fontWeight={node.type === 'primary' ? '700' : '600'}
                      fontFamily="Inter, sans-serif">
                      {node.label}
                    </text>
                    <text x={pos.x} y={pos.y + 11} textAnchor="middle" fill="rgba(255,255,255,0.4)"
                      fontSize="9" fontFamily="Inter, sans-serif">
                      {node.sub.length > 25 ? node.sub.substring(0, 22) + '...' : node.sub}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Node list */}
          <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              Standards in Graph
            </div>
            {graphData.nodes.map(node => {
              const style = TYPE_STYLES[node.type]
              return (
                <div key={node.id} className="card" style={{ padding: '12px 16px', border: `1px solid ${style.border}`, background: style.bg }}>
                  <div style={{ fontWeight: 800, color: style.color, fontSize: '0.9rem', fontFamily: 'var(--font-display)', marginBottom: '2px' }}>
                    {node.label}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{node.sub}</div>
                  <div style={{ fontSize: '0.7rem', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: style.color, opacity: 0.7 }}>
                    {node.type} Standard
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        </>}
      </div>
    </div>
  )
}
