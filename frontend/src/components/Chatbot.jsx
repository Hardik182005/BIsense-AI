import { useState, useRef, useEffect } from 'react'

const API_BASE = '/api'

const WELCOME_MSG = {
  role: 'bot',
  text: '👋 Hi! I\'m BISense AI Assistant powered by Vertex AI. Ask me about BIS standards, compliance requirements, or describe your product for instant recommendations.'
}

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([WELCOME_MSG])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEnd = useRef(null)

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', text: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, history: messages.slice(-6).map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text })) })
      })

      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'bot', text: data.response }])
    } catch {
      // Fallback for when backend is offline
      const fallback = getFallbackResponse(input)
      setMessages(prev => [...prev, { role: 'bot', text: fallback }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* FAB */}
      <button className="chatbot-fab" onClick={() => setOpen(!open)} title="AI Assistant">
        {open ? '✕' : '💬'}
      </button>

      {/* Panel */}
      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>🤖</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>BISense AI Assistant</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Powered by Vertex AI · Gemini</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-msg ${msg.role}`}>
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="chatbot-msg bot" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                Thinking...
              </div>
            )}
            <div ref={messagesEnd} />
          </div>

          <div className="chatbot-input-row">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about BIS standards..."
              disabled={loading}
            />
            <button onClick={sendMessage} disabled={loading}>Send</button>
          </div>
        </div>
      )}
    </>
  )
}

function getFallbackResponse(query) {
  const q = query.toLowerCase()
  if (q.includes('cement') || q.includes('opc'))
    return '🏗️ For cement products, key BIS standards include:\n\n• IS 269:1989 — OPC 33 Grade\n• IS 8112:1989 — OPC 43 Grade\n• IS 12269:1987 — OPC 53 Grade\n• IS 455:1989 — Portland Slag Cement\n\nWould you like me to run a full compliance check?'
  if (q.includes('steel') || q.includes('tmt'))
    return '🔩 For steel/TMT products:\n\n• IS 1786:1985 — High Strength Deformed Steel Bars\n• IS 2062:2011 — Hot Rolled Structural Steel\n• IS 432:1982 — Mild Steel Bars\n\nDescribe your specific product for tailored recommendations!'
  if (q.includes('aggregate') || q.includes('sand'))
    return '🪨 For aggregates:\n\n• IS 383:1970 — Coarse & Fine Aggregates\n• IS 2116:1980 — Sand for Masonry\n\nTell me about your construction application for better results.'
  if (q.includes('hello') || q.includes('hi'))
    return '👋 Hello! I can help you with:\n\n• Finding applicable BIS standards\n• Understanding compliance requirements\n• Product certification guidance\n• Regional language queries\n\nDescribe your product to get started!'
  return '🔍 I can help you find the right BIS standards. Try describing your product — for example:\n\n• "TMT steel bars for earthquake-resistant construction"\n• "33 Grade Ordinary Portland Cement"\n• "Aggregates for concrete mix"\n\nI\'ll match it against the official BIS registry instantly!'
}
