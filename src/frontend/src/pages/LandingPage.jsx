import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Zap, 
  Search, 
  BookOpen, 
  ShieldCheck, 
  Globe, 
  BarChart3, 
  Network, 
  Mic, 
  History, 
  Target,
  FileCheck,
  ClipboardList,
  AlertTriangle,
  ArrowRight
} from 'lucide-react'

const STATS = [
  { value: '500+', label: 'BIS Standards', icon: <FileCheck size={24} /> },
  { value: '92%', label: 'Hit Rate @3', icon: <Target size={24} /> },
  { value: '<2s', label: 'Response Time', icon: <Zap size={24} /> },
  { value: '0', label: 'Hallucinations', icon: <ShieldCheck size={24} /> },
]

const FEATURES = [
  {
    icon: <Search size={32} />,
    title: 'AI-Powered Discovery',
    desc: 'Hybrid BM25 + Semantic retrieval finds the right standard from your product description instantly.'
  },
  {
    icon: <ShieldCheck size={32} />,
    title: 'Hallucination Guard',
    desc: 'Every result is validated against the official BIS dataset. Zero fabricated standards.'
  },
  {
    icon: <Globe size={32} />,
    title: 'Regional Language Support',
    desc: 'Input in Hindi, Marathi, Gujarati, or Tamil. Our AI normalizes and understands your query.'
  },
  {
    icon: <BarChart3 size={32} />,
    title: 'Readiness Scoring',
    desc: 'Get a 0-100 compliance readiness score with actionable gap analysis for your product.'
  },
  {
    icon: <Network size={32} />,
    title: 'Compliance Graph',
    desc: 'Visualize relationships between primary, supporting, and related BIS standards.'
  },
  {
    icon: <Mic size={32} />,
    title: 'Voice Interaction',
    desc: 'Powered by Vertex AI Text-to-Speech and STT. Talk to your compliance assistant naturally.'
  },
  {
    icon: <History size={32} />,
    title: 'Analysis History',
    desc: 'Automatically save and replay your intelligence checks. Never lose a valuable insight.'
  },
]

const EXAMPLES = [
  'TMT steel bars for earthquake-resistant construction',
  '33 Grade Ordinary Portland Cement',
  'Coarse and fine aggregates for structural concrete',
  'निर्माण के लिए TMT स्टील बार',
]

const JOURNEY_STEPS = [
  { icon: <ClipboardList size={20} />, label: 'Product Input' },
  { icon: <Globe size={20} />, label: 'Language Detection' },
  { icon: <Zap size={20} />, label: 'AI Understanding' },
  { icon: <Search size={20} />, label: 'Hybrid Retrieval' },
  { icon: <FileCheck size={20} />, label: 'Validation' },
  { icon: <BarChart3 size={20} />, label: 'Readiness Score' },
  { icon: <ShieldCheck size={20} />, label: 'Checklist + Report' },
]

const TECH_STACK = [
  { name: 'Vertex AI / Gemini', desc: 'Product understanding & NLU' },
  { name: 'Hybrid BM25 + FAISS', desc: 'Dual retrieval engine' },
  { name: 'Cross-Encoder Reranking', desc: 'Precision scoring' },
  { name: 'FastAPI + React', desc: 'Full-stack SaaS platform' },
  { name: 'Google Cloud Run', desc: 'Serverless deployment' },
  { name: 'Sentence Transformers', desc: 'Semantic embeddings' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    setShowContent(true)
  }, [])

  const handleSearch = () => {
    if (query.trim()) {
      navigate(`/compliance?q=${encodeURIComponent(query)}`)
    } else {
      navigate('/compliance')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      {/* ── Hero ── */}
      <section style={{ paddingTop: '140px', paddingBottom: '80px', textAlign: 'center' }}>
        <div className="container" style={{ opacity: showContent ? 1 : 0, transform: showContent ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.8s ease' }}>
          {/* Pill badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '30px', padding: '6px 16px', marginBottom: '32px', fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00E676', animation: 'pulse-ring 2s infinite', display: 'inline-block' }} />
            BIS Standards Recommendation Engine · Hackathon 2026
          </div>

          <h1 style={{ fontSize: 'clamp(3.5rem, 8vw, 6rem)', fontWeight: 900, lineHeight: 0.95, marginBottom: '24px', fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>
            <span style={{ display: 'block', background: 'linear-gradient(135deg, #fff 30%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Discover BIS Standards</span>
            <span style={{ display: 'block', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
              in Seconds
            </span>
          </h1>

          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '680px', margin: '0 auto 56px', lineHeight: 1.6, fontWeight: 400 }}>
            The definitive AI co-pilot for Indian MSMEs. Identify BIS standards, 
            automate compliance checks, and secure certification <span style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>with 100% precision</span>.
          </p>

          {/* Hero Search */}
          <div style={{ maxWidth: '720px', margin: '0 auto 24px' }} className="search-hero">
            <div style={{ position: 'relative' }}>
              <textarea
                className="input-field"
                style={{ paddingRight: '160px', minHeight: '90px', fontSize: '1rem', fontFamily: 'var(--font-body)', resize: 'none' }}
                placeholder="Describe your product... e.g. TMT steel bars for earthquake-resistant construction"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
              />
              <button
                className="btn btn-primary"
                style={{ position: 'absolute', bottom: '12px', right: '12px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={handleSearch}
              >
                <Search size={18} /> Search
              </button>
            </div>

            {/* Example chips */}
            <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Try:</span>
              {EXAMPLES.map(ex => (
                <button
                  key={ex}
                  onClick={() => { setQuery(ex); navigate(`/compliance?q=${encodeURIComponent(ex)}`); }}
                  style={{ padding: '4px 12px', fontSize: '0.78rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-body)' }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ fontSize: '1rem', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => navigate('/compliance')}>
              <Zap size={20} /> Start Compliance Check
            </button>
            <button className="btn btn-outline" style={{ fontSize: '1rem', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => navigate('/standards')}>
              <BookOpen size={20} /> Explore Standards
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ padding: '20px 0 60px' }}>
        <div className="container">
          <div className="grid-4">
            {STATS.map(s => (
              <div key={s.label} className="metric-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{s.icon}</div>
                <div className="metric-value" style={{ fontSize: '2.5rem' }}>{s.value}</div>
                <div className="metric-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Compliance Journey ── */}
      <section style={{ padding: '60px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
            Complete Compliance Journey
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '48px' }}>
            From product description to certified compliance, every step covered.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', overflowX: 'auto', paddingBottom: '8px' }}>
            {JOURNEY_STEPS.map((step, i) => (
              <div key={step.label} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', padding: '0 8px' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem', margin: '0 auto 10px'
                  }}>
                    {step.icon}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, maxWidth: '70px' }}>
                    {step.label}
                  </div>
                </div>
                {i < JOURNEY_STEPS.length - 1 && (
                  <div style={{ width: '32px', height: '1px', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'var(--font-display)' }}>
              Built to Win. Built for MSMEs.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
              Not just a RAG chatbot — a verified compliance intelligence engine.
            </p>
          </div>
          <div className="grid-3">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div style={{ fontSize: '2rem', marginBottom: '14px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px', fontFamily: 'var(--font-display)' }}>{f.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 700, marginBottom: '40px', fontFamily: 'var(--font-display)' }}>
            Technology Stack
          </h2>
          <div className="grid-3">
            {TECH_STACK.map(t => (
              <div key={t.name} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '14px', textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>{t.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem / Solution ── */}
      <section style={{ padding: '60px 0 80px', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div className="grid-2" style={{ gap: '40px', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>😤 The Problem</div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '20px', fontFamily: 'var(--font-display)' }}>
                MSMEs Waste Weeks Finding Standards
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  'Sifting through hundreds of BIS PDFs manually',
                  'High consultant dependency and costs',
                  'Risk of using outdated or wrong standards',
                  'No regional language support',
                  'Compliance failures leading to product recalls',
                ].map(p => (
                  <div key={p} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--danger)', marginTop: '2px' }}>✗</span>
                    {p}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>✅ Our Solution</div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '20px', fontFamily: 'var(--font-display)' }}>
                AI-Powered Verified BIS Discovery
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  'Instant standard discovery from product description',
                  'Zero hallucinations — validated against official BIS dataset',
                  'Hindi, Marathi, Gujarati, Tamil support',
                  'Compliance graph + readiness scoring',
                  'AI Chatbot powered by Vertex AI (Gemini)',
                ].map(s => (
                  <div key={s} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--success)', marginTop: '2px' }}>✓</span>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="container">
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '16px', fontFamily: 'var(--font-display)' }}>
              Ready to achieve BIS compliance?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '36px', fontSize: '1.05rem' }}>
              Join thousands of Indian MSMEs using BISense AI for faster, smarter compliance.
            </p>
            <button className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '16px 40px' }} onClick={() => navigate('/compliance')}>
              🚀 Try BISense AI Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <div className="container">
          <p>© 2026 BISense AI · Built for BIS Standards Recommendation Engine Hackathon · India 🇮🇳</p>
          <p style={{ marginTop: '8px' }}>Powered by Vertex AI (Gemini) · All BIS standards from official dataset.</p>
        </div>
      </footer>
    </div>
  )
}
