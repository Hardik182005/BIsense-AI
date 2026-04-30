import { useState, useRef, useEffect, useCallback } from 'react'

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
  const recognitionRef = useRef(null)
  const inputRef = useRef('')

  // Keep inputRef in sync
  useEffect(() => {
    inputRef.current = input
  }, [input])

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── TTS: Browser-native speechSynthesis (works instantly, no API needed) ──
  const speak = useCallback((text) => {
    // Stop if already speaking
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      setIsSpeaking(false)
      return
    }

    // Clean text for speech (remove emojis and bullet markers)
    const cleanText = text
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
      .replace(/[•●■▪]/g, '')
      .replace(/\n+/g, '. ')
      .trim()

    if (!cleanText) return

    // Try Cloud TTS first (higher quality), fallback to browser
    setIsSpeaking(true)

    // Use browser speechSynthesis - works everywhere, no API needed
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = 'en-IN'
    utterance.rate = 1.0
    utterance.pitch = 1.0
    
    // Try to pick a good voice
    const voices = window.speechSynthesis.getVoices()
    const indianVoice = voices.find(v => v.lang === 'en-IN') 
      || voices.find(v => v.lang.startsWith('en-'))
      || voices[0]
    if (indianVoice) utterance.voice = indianVoice

    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.cancel() // Clear any pending
    window.speechSynthesis.speak(utterance)
  }, [isSpeaking])

  // ── STT: Web Speech API ──
  const startListening = useCallback(() => {
    // Stop if already listening
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome.")
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognition.continuous = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      console.log('[STT] Listening started...')
      setIsListening(true)
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      console.log('[STT] Transcript:', transcript)
      setInput(transcript)
      setIsListening(false)
      
      // Auto-send after a short delay to let React state update
      setTimeout(() => {
        autoSend(transcript)
      }, 300)
    }

    recognition.onerror = (event) => {
      console.error('[STT] Error:', event.error)
      setIsListening(false)
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone permissions in your browser settings.')
      }
    }

    recognition.onend = () => {
      console.log('[STT] Listening ended')
      setIsListening(false)
    }

    try {
      recognition.start()
    } catch (err) {
      console.error('[STT] Failed to start:', err)
      setIsListening(false)
    }
  }, [isListening])

  // Direct send function that doesn't depend on React state for the message
  const autoSend = async (text) => {
    if (!text.trim()) return
    
    const userMsg = { role: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text, 
          history: [] 
        })
      })

      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      const botText = data.response
      setMessages(prev => [...prev, { role: 'bot', text: botText }])
      
      // Auto-speak the response
      if (botText && botText.length < 500) {
        setTimeout(() => speak(botText), 200)
      }
    } catch {
      const fallback = getFallbackResponse(text)
      setMessages(prev => [...prev, { role: 'bot', text: fallback }])
      setTimeout(() => speak(fallback), 200)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return
    await autoSend(text)
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
                    style={{ 
                      position: 'absolute', bottom: '-20px', right: '0', 
                      background: 'none', border: 'none', fontSize: '0.75rem', 
                      color: isSpeaking ? 'var(--accent)' : 'var(--text-muted)', 
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                    }}
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
              style={{ 
                background: isListening ? '#ff4444' : 'rgba(255,255,255,0.05)', 
                border: isListening ? '2px solid #ff6666' : 'none', 
                borderRadius: '50%', width: '40px', height: '40px', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                transition: 'all 0.2s',
                animation: isListening ? 'pulse 1.5s infinite' : 'none'
              }}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? '🛑' : '🎤'}
            </button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={isListening ? "🎧 Listening... speak now" : "Ask about BIS standards..."}
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
    return 'For cement products, key BIS standards include: IS 269:1989 for OPC 33 Grade, IS 8112:1989 for OPC 43 Grade, IS 12269:1987 for OPC 53 Grade, and IS 455:1989 for Portland Slag Cement. Would you like me to run a full compliance check?'
  if (q.includes('steel') || q.includes('tmt'))
    return 'For steel and TMT products: IS 1786:1985 covers High Strength Deformed Steel Bars, IS 2062:2011 covers Hot Rolled Structural Steel, and IS 432:1982 covers Mild Steel Bars. Describe your specific product for tailored recommendations!'
  if (q.includes('aggregate') || q.includes('sand'))
    return 'For aggregates: IS 383:1970 covers Coarse and Fine Aggregates, and IS 2116:1980 covers Sand for Masonry. Tell me about your construction application for better results.'
  if (q.includes('hello') || q.includes('hi'))
    return 'Hello! I can help you find applicable BIS standards, understand compliance requirements, provide product certification guidance, and handle regional language queries. Describe your product to get started!'
  if (q.includes('what is bis') || q.includes('about bis') || q.includes('full form') || q.includes('who is bis'))
    return 'The Bureau of Indian Standards, or BIS, is the National Standard Body of India. Established under the BIS Act 2016, it ensures quality, safety, and reliability of products through standardization, certification, and testing. I am your specialized AI assistant for BIS standards in the building materials sector!'
  return 'I can help you find the right BIS standards. Try describing your product, for example: TMT steel bars for earthquake-resistant construction, or 33 Grade Ordinary Portland Cement, or Aggregates for concrete mix. I will match it against the official BIS registry instantly!'
}
