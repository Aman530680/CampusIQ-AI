import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader } from 'lucide-react'
import { chatbotService } from '../../services'
import type { ChatMessage } from '../../types'

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hello! I'm CampusIQ AI Assistant. I can help you analyze academic data, find at-risk students, check placement statistics, and more. Type 'help' to see what I can do!", timestamp: new Date() }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await chatbotService.chat(input, sessionId)
      setSessionId(res.session_id)
      setMessages(prev => [...prev, { role: 'assistant', content: res.response, timestamp: new Date() }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: new Date() }])
    } finally {
      setLoading(false)
    }
  }

  const suggestions = [
    'Show students below 75% attendance',
    'Find at-risk students',
    'Placement statistics',
    'Top performers by CGPA',
    'Department comparison',
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="card flex-1 flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">CampusIQ AI Assistant</p>
            <p className="text-xs text-green-500">● Online</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-gray-200 dark:bg-gray-700'}`}>
                {msg.role === 'assistant' ? <Bot className="w-4 h-4 text-primary-600" /> : <User className="w-4 h-4 text-gray-600" />}
              </div>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${msg.role === 'assistant' ? 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200' : 'bg-primary-600 text-white'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-600" />
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-3">
                <Loader className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {suggestions.map(s => (
              <button key={s} onClick={() => setInput(s)} className="text-xs px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full hover:bg-primary-100 transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Ask about students, attendance, placements..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
            />
            <button onClick={send} disabled={loading || !input.trim()} className="btn-primary px-3">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
