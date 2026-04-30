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
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEnd = useRef(null)
  const audioRef = useRef(null)

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const speak = async (text) => {
    if (isSpeaking) {
      audioRef.current?.pause()
      setIsSpeaking(false)
      return
    }

    try {
      setIsSpeaking(true)
      const res = await fetch(`${API_BASE}/voice/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      if (!res.ok) throw new Error('TTS error')
      const data = await res.json()
      
      const audio = new Audio(`data:audio/mp3;base64,${data.audio_content}`)
      audioRef.current = audio
      audio.onended = () => setIsSpeaking(false)
      audio.play()
    } catch (err) {
      console.error(err)
      setIsSpeaking(false)
    }
  }

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      setIsListening(false)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognition.start()
  }

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
              <div key={i} className={`chatbot-msg ${msg.role}`} style={{ position: 'relative' }}>
                {msg.text}
                {msg.role === 'bot' && (
                  <button 
                    onClick={() => speak(msg.text)} 
                    style={{ position: 'absolute', bottom: '-20px', right: '0', background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {isSpeaking ? '⏹️ Stop' : '🔊 Listen'}
                  </button>
                )}
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

          <div className="chatbot-input-row" style={{ display: 'flex', gap: '8px', padding: '12px 16px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
            <button 
              onClick={startListening} 
              style={{ background: isListening ? 'var(--danger)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              title="Voice Input"
            >
              {isListening ? '🛑' : '🎤'}
            </button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={isListening ? "Listening..." : "Ask about BIS standards..."}
              disabled={loading}
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '20px', padding: '0 16px', color: '#fff', fontSize: '0.875rem' }}
            />
            <button 
              onClick={sendMessage} 
              disabled={loading || !input.trim()} 
              style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '20px', padding: '0 16px', fontWeight: 600, cursor: 'pointer', opacity: (loading || !input.trim()) ? 0.5 : 1 }}
            >
              Send
            </button>
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
  if (q.includes('what is bis') || q.includes('about bis'))
    return 'The Bureau of Indian Standards (BIS) is the National Standard Body of India. It ensures quality, safety and reliability of products. I can help you find specific standards for your building materials!'
  return '🔍 I can help you find the right BIS standards. Try describing your product — for example:\n\n• "TMT steel bars for earthquake-resistant construction"\n• "33 Grade Ordinary Portland Cement"\n• "Aggregates for concrete mix"\n\nI\'ll match it against the official BIS registry instantly!'
}
