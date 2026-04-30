import { useState, useEffect } from 'react'

export default function StandardsPage() {
  const [standards, setStandards] = useState([])
  const [categories, setCategories] = useState([{ name: 'All', count: 0 }])
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Fetch categories first
        const catRes = await fetch('/api/standards/categories')
        const catData = await catRes.json()
        setCategories([{ name: 'All', count: 0 }, ...catData.categories])

        // Fetch all standards
        const res = await fetch('/api/standards')
        const data = await res.json()
        setStandards(data.standards || [])
        setLoading(false)
      } catch (err) {
        console.error('Failed to fetch standards:', err)
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filtered = standards.filter(s => {
    const matchCat = category === 'All' || s.category === category
    const matchSearch = !search || 
      s.standard_id.toLowerCase().includes(search.toLowerCase()) || 
      s.title.toLowerCase().includes(search.toLowerCase()) || 
      (s.keywords && s.keywords.some(k => k.toLowerCase().includes(search.toLowerCase())))
    return matchCat && matchSearch
  })

  const CAT_COLORS = { 
    Cement: 'cement', 
    Steel: 'steel', 
    Concrete: 'concrete', 
    Aggregates: 'aggregates',
    'Building Materials': 'verified' 
  }

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
            {categories.map(c => (
              <button
                key={c.name}
                onClick={() => setCategory(c.name)}
                style={{
                  padding: '8px 16px', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                  border: category === c.name ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: category === c.name ? 'rgba(255,140,0,0.12)' : 'rgba(255,255,255,0.04)',
                  color: category === c.name ? 'var(--accent)' : 'var(--text-secondary)',
                  transition: 'all 0.2s', fontFamily: 'var(--font-body)'
                }}
              >
                {c.name} {c.name !== 'All' && `(${c.count})`}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {loading ? 'Loading standards...' : `Showing ${filtered.length} standards`}
          </div>
        </div>

        {/* Standards Grid + Detail */}
        <div className="grid-2" style={{ gap: '24px', alignItems: 'start' }}>
          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '800px', overflowY: 'auto', paddingRight: '8px' }}>
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
                      <span className={`badge badge-${CAT_COLORS[s.category] || 'verified'}`}>{s.category}</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{s.title}</div>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>›</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No standards found matching your criteria.
              </div>
            )}
          </div>

          {/* Detail Panel */}
          <div style={{ position: 'sticky', top: '90px' }}>
            {selected ? (
              <div className="card" style={{ padding: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <span className={`badge badge-${CAT_COLORS[selected.category] || 'verified'}`}>{selected.category}</span>
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
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Scope & Keywords</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selected.keywords && selected.keywords.map(k => <span key={k} className="tag">{k}</span>)}
                    {!selected.keywords && <span className="tag">{selected.category}</span>}
                  </div>
                </div>
                <div style={{ padding: '14px', background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.2)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--success)' }}>
                  🔒 Verified from Official BIS Building Materials Dataset (Full SP 21)
                </div>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
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
