import { useState, useEffect } from 'react'
import { Search, FileCheck, Info, ChevronRight } from 'lucide-react'

const CATEGORIES = ['All', 'Cement', 'Steel', 'Concrete', 'Aggregates']

const ALL_STANDARDS = [
  { standard_id: 'IS 269: 1989', title: 'Ordinary Portland Cement, 33 Grade — Specification', category: 'Cement', keywords: ['OPC', '33 Grade', 'Chemical Requirements', 'Physical Requirements'] },
  { standard_id: 'IS 8112: 1989', title: 'Ordinary Portland Cement, 43 Grade — Specification', category: 'Cement', keywords: ['OPC', '43 Grade', 'High Strength'] },
  { standard_id: 'IS 12269: 1987', title: 'Ordinary Portland Cement, 53 Grade — Specification', category: 'Cement', keywords: ['OPC', '53 Grade', 'Prestressed'] },
  { standard_id: 'IS 455: 1989', title: 'Portland Slag Cement — Specification', category: 'Cement', keywords: ['Slag Cement', 'PSC', 'Blast Furnace'] },
  { standard_id: 'IS 1489 (Part 1): 1991', title: 'Portland Pozzolana Cement — Fly Ash Based', category: 'Cement', keywords: ['PPC', 'Fly Ash', 'Pozzolana'] },
  { standard_id: 'IS 1489 (Part 2): 1991', title: 'Portland Pozzolana Cement — Calcined Clay Based', category: 'Cement', keywords: ['PPC', 'Calcined Clay', 'Pozzolana'] },
  { standard_id: 'IS 3466: 1988', title: 'Masonry Cement — Specification', category: 'Cement', keywords: ['Masonry', 'Mortar', 'Non-structural'] },
  { standard_id: 'IS 6452: 1989', title: 'High Alumina Cement for Structural Use', category: 'Cement', keywords: ['Alumina', 'Refractory', 'Heat Resistant'] },
  { standard_id: 'IS 6909: 1990', title: 'Supersulphated Cement — Specification', category: 'Cement', keywords: ['Sulphate', 'Marine', 'Aggressive Water'] },
  { standard_id: 'IS 8042: 1989', title: 'White Portland Cement — Specification', category: 'Cement', keywords: ['White Cement', 'Architectural', 'Decorative'] },
  { standard_id: 'IS 8043: 1991', title: 'Hydrophobic Portland Cement — Specification', category: 'Cement', keywords: ['Hydrophobic', 'Water Resistant', 'Humid'] },
  { standard_id: 'IS 12330: 1988', title: 'Sulphate Resisting Portland Cement — Specification', category: 'Cement', keywords: ['SRPC', 'Sulphate Resistant', 'Aggressive Soil'] },
  { standard_id: 'IS 8041: 1990', title: 'Rapid Hardening Portland Cement — Specification', category: 'Cement', keywords: ['RHPC', 'Early Strength', 'Fast Setting'] },
  { standard_id: 'IS 1786: 1985', title: 'High Strength Deformed Steel Bars and Wires', category: 'Steel', keywords: ['TMT', 'HSD', 'Rebar', 'Reinforcement'] },
  { standard_id: 'IS 432 (Part 1): 1982', title: 'Mild Steel Bars for Concrete Reinforcement', category: 'Steel', keywords: ['Mild Steel', 'Reinforcement', 'Bars'] },
  { standard_id: 'IS 2062: 2011', title: 'Hot Rolled Medium and High Tensile Structural Steel', category: 'Steel', keywords: ['Structural Steel', 'Hot Rolled', 'Plates'] },
  { standard_id: 'IS 277: 1992', title: 'Galvanised Steel Sheets (Plain and Corrugated)', category: 'Steel', keywords: ['GI Sheets', 'Galvanised', 'Zinc Coated'] },
  { standard_id: 'IS 808: 1989', title: 'Hot Rolled Steel Beam, Column, Channel and Angle Sections', category: 'Steel', keywords: ['Beam', 'Column', 'Channel', 'Angle'] },
  { standard_id: 'IS 13990: 1994', title: 'Galvanised Corrugated Steel Sheets', category: 'Steel', keywords: ['Corrugated', 'Roofing', 'GI Sheet'] },
  { standard_id: 'IS 383: 1970', title: 'Coarse and Fine Aggregates from Natural Sources', category: 'Aggregates', keywords: ['Coarse Aggregate', 'Fine Aggregate', 'Natural', 'Concrete'] },
  { standard_id: 'IS 2116: 1980', title: 'Sand for Masonry Mortars — Specification', category: 'Aggregates', keywords: ['Sand', 'Masonry', 'Mortar'] },
  { standard_id: 'IS 9142: 1979', title: 'Artificial Lightweight Aggregates for Concrete Masonry Units', category: 'Aggregates', keywords: ['Lightweight', 'Artificial', 'Expanded Clay'] },
  { standard_id: 'IS 456: 2000', title: 'Plain and Reinforced Concrete — Code of Practice', category: 'Concrete', keywords: ['RCC', 'Structural Concrete', 'Design'] },
  { standard_id: 'IS 10262: 2009', title: 'Guidelines for Concrete Mix Design', category: 'Concrete', keywords: ['Mix Design', 'Water Cement Ratio', 'Workability'] },
  { standard_id: 'IS 458: 2003', title: 'Precast Concrete Pipes (with and without Reinforcement)', category: 'Concrete', keywords: ['Precast', 'Pipes', 'Water Mains'] },
  { standard_id: 'IS 2185 (Part 1): 1979', title: 'Concrete Masonry Units — Hollow and Solid Blocks', category: 'Concrete', keywords: ['Concrete Blocks', 'Hollow', 'Solid'] },
  { standard_id: 'IS 2185 (Part 2): 1983', title: 'Lightweight Concrete Masonry Blocks', category: 'Concrete', keywords: ['Lightweight', 'AAC Blocks', 'Aerated'] },
  { standard_id: 'IS 2185 (Part 3): 1984', title: 'Autoclaved Cellular Aerated Concrete Blocks', category: 'Concrete', keywords: ['AAC', 'Autoclaved', 'Lightweight'] },
  { standard_id: 'IS 459: 1992', title: 'Corrugated and Semi-Corrugated Asbestos Cement Sheets', category: 'Concrete', keywords: ['Roofing', 'Corrugated', 'Asbestos Cement'] },
  { standard_id: 'IS 1592: 2003', title: 'Asbestos Cement Pressure Pipes', category: 'Concrete', keywords: ['AC Pipes', 'Pressure Pipes', 'Water Supply'] },
]

const CAT_COLORS = { Cement: 'cement', Steel: 'steel', Concrete: 'concrete', Aggregates: 'aggregates' }

export default function StandardsPage() {
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = ALL_STANDARDS.filter(s => {
    const matchCat = category === 'All' || s.category === category
    const matchSearch = !search || s.standard_id.toLowerCase().includes(search.toLowerCase()) || s.title.toLowerCase().includes(search.toLowerCase()) || s.keywords.some(k => k.toLowerCase().includes(search.toLowerCase()))
    return matchCat && matchSearch
  })

  return (
    <div style={{ position: 'relative', zIndex: 1, paddingTop: '88px', paddingBottom: '80px' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 className="page-title">Standards Explorer</h1>
          <p className="page-subtitle">Browse and search the complete BIS Building Materials standards registry.</p>
        </div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <input
            className="input-field"
            style={{ flex: 1, minWidth: '240px' }}
            placeholder="Search by IS code, title, or keyword..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                style={{
                  padding: '8px 16px', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                  border: category === c ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: category === c ? 'rgba(255,140,0,0.12)' : 'rgba(255,255,255,0.04)',
                  color: category === c ? 'var(--accent)' : 'var(--text-secondary)',
                  transition: 'all 0.2s', fontFamily: 'var(--font-body)'
                }}
              >
                {c} {c !== 'All' && `(${ALL_STANDARDS.filter(s => s.category === c).length})`}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Showing {filtered.length} standards
        </div>

        {/* Standards Grid + Detail */}
        <div className="grid-2" style={{ gap: '24px', alignItems: 'start' }}>
          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(s => (
              <div
                key={s.standard_id}
                className="card"
                style={{ cursor: 'pointer', border: selected?.standard_id === s.standard_id ? '1px solid var(--accent)' : '1px solid var(--border)', background: selected?.standard_id === s.standard_id ? 'rgba(255,140,0,0.05)' : 'var(--bg-card)', padding: '16px 20px' }}
                onClick={() => setSelected(s)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '0.95rem', fontFamily: 'var(--font-display)' }}>{s.standard_id}</span>
                      <span className={`badge badge-${CAT_COLORS[s.category]}`}>{s.category}</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{s.title}</div>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>{selected?.standard_id === s.standard_id ? '›' : '›'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Detail Panel */}
          <div style={{ position: 'sticky', top: '90px' }}>
            {selected ? (
              <div className="card" style={{ padding: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <span className={`badge badge-${CAT_COLORS[selected.category]}`}>{selected.category}</span>
                  <span className="badge badge-verified">✓ Official BIS</span>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent)', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
                  {selected.standard_id}
                </h2>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px', lineHeight: 1.4 }}>
                  {selected.title}
                </h3>
                <div className="divider" />
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Keywords</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selected.keywords.map(k => <span key={k} className="tag">{k}</span>)}
                  </div>
                </div>
                <div style={{ padding: '14px', background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.2)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--success)' }}>
                  🔒 Verified from Official BIS Building Materials Dataset
                </div>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <FileCheck size={48} />
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 600 }}>Select a standard</div>
                <div style={{ fontSize: '0.875rem', marginTop: '8px' }}>Click any standard to view details</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
