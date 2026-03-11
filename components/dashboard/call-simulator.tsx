'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Phone, PhoneOff, Send, RotateCcw, Bot, User,
  Mic, AlertCircle, CheckCircle2, ArrowRightLeft, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  toolsUsed?: string[]
}

interface CallSimulatorProps {
  restaurantId: string
  restaurantName: string
  aiName: string
}

const QUICK_PHRASES = [
  "What are your hours?",
  "I'd like to make a reservation for 2 tonight at 7pm",
  "Do you have vegetarian options?",
  "Can I place a pickup order?",
  "What's on the menu?",
  "I need to cancel my reservation",
]

export function CallSimulator({ restaurantId, restaurantName, aiName }: CallSimulatorProps) {
  const [callActive, setCallActive] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [history, setHistory] = useState<ChatCompletionMessageParam[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [callEnded, setCallEnded] = useState(false)
  const [callOutcome, setCallOutcome] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const startCall = () => {
    setCallActive(true)
    setCallEnded(false)
    setCallOutcome(null)
    setError(null)
    setMessages([
      {
        role: 'assistant',
        content: `Hello! Thank you for calling ${restaurantName}. I'm ${aiName}, your AI assistant. How can I help you today?`,
      },
    ])
    setHistory([])
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const endCall = () => {
    setCallActive(false)
    setCallEnded(true)
    setMessages((prev) => [
      ...prev,
      { role: 'system', content: '— Call ended —' },
    ])
  }

  const resetCall = () => {
    setCallActive(false)
    setCallEnded(false)
    setCallOutcome(null)
    setMessages([])
    setHistory([])
    setInput('')
    setError(null)
  }

  const sendMessage = async (text?: string) => {
    const messageText = (text ?? input).trim()
    if (!messageText || loading || !callActive) return

    setInput('')
    setError(null)

    // Add user message to UI
    setMessages((prev) => [...prev, { role: 'user', content: messageText }])

    // Add to history for AI context
    const newHistory: ChatCompletionMessageParam[] = [
      ...history,
      { role: 'user', content: messageText },
    ]

    setLoading(true)

    try {
      const res = await fetch('/api/voice/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history: history, // history BEFORE this message
          restaurantId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Request failed')
      }

      const result = await res.json()

      // Add AI response to history
      const updatedHistory: ChatCompletionMessageParam[] = [
        ...newHistory,
        { role: 'assistant', content: result.text },
      ]
      setHistory(updatedHistory)

      // Add to UI
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.text },
      ])

      // Handle call end / transfer
      if (result.shouldEndCall) {
        setCallOutcome(result.outcome ?? 'completed')
        setCallActive(false)
        setCallEnded(true)
        setMessages((prev) => [
          ...prev,
          { role: 'system', content: `— Call completed · ${result.outcome ?? 'no-outcome'} —` },
        ])
      } else if (result.shouldTransfer) {
        setCallOutcome('transferred')
        setCallActive(false)
        setCallEnded(true)
        setMessages((prev) => [
          ...prev,
          { role: 'system', content: '— Call transferred to staff —' },
        ])
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      // Remove the user message we added optimistically on error
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
      if (callActive) setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl shadow-sm',
            callActive ? 'bg-emerald-500 animate-pulse' : callEnded ? 'bg-slate-300' : 'bg-indigo-600'
          )}>
            <Mic className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">
              {callActive ? 'Call in progress…' : callEnded ? 'Call ended' : 'Ready to test'}
            </p>
            <p className="text-xs text-slate-500">
              {callActive
                ? `You're speaking with ${aiName} · ${restaurantName}`
                : 'Simulates a real phone call — no Twilio needed'}
            </p>
          </div>
        </div>

        {/* Status badge */}
        {callActive && (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            Live
          </Badge>
        )}
        {callOutcome && (
          <Badge variant="secondary" className="gap-1.5">
            <CheckCircle2 size={12} />
            {callOutcome}
          </Badge>
        )}
      </div>

      {/* ── Chat window ─────────────────────────────────────────── */}
      <div className="flex-1 min-h-[380px] max-h-[480px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
            <Phone size={40} className="opacity-20 mb-3" />
            <p className="text-sm font-medium text-slate-500">Press &quot;Start Call&quot; to begin</p>
            <p className="text-xs text-slate-400 mt-1">
              Type what a customer would say — the AI responds in real-time
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex gap-2.5',
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                msg.role === 'system' ? 'justify-center' : ''
              )}
            >
              {msg.role === 'system' ? (
                <span className="text-xs text-slate-400 italic py-1">{msg.content}</span>
              ) : (
                <>
                  {/* Avatar */}
                  <div className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-xs font-semibold mt-0.5',
                    msg.role === 'user' ? 'bg-slate-600' : 'bg-indigo-600'
                  )}>
                    {msg.role === 'user'
                      ? <User size={13} />
                      : <Bot size={13} />
                    }
                  </div>

                  {/* Bubble */}
                  <div className={cn(
                    'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-slate-700 text-white rounded-tr-sm'
                      : 'bg-white border border-slate-200 text-slate-800 shadow-sm rounded-tl-sm'
                  )}>
                    {msg.content}
                  </div>
                </>
              )}
            </div>
          ))
        )}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 mt-0.5">
              <Bot size={13} className="text-white" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <Loader2 size={14} className="text-indigo-500 animate-spin" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Error ───────────────────────────────────────────────── */}
      {error && (
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>
            {error.includes('invalid_api_key') || error.includes('API key')
              ? 'OpenAI API key is missing or invalid. Add your real key to .env.local → OPENAI_API_KEY'
              : error}
          </span>
        </div>
      )}

      {/* ── Quick phrases ────────────────────────────────────────── */}
      {callActive && !loading && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {QUICK_PHRASES.map((phrase) => (
            <button
              key={phrase}
              onClick={() => sendMessage(phrase)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
            >
              {phrase}
            </button>
          ))}
        </div>
      )}

      {/* ── Input row ────────────────────────────────────────────── */}
      <div className="mt-3 flex items-center gap-2">
        {!callActive && !callEnded && (
          <Button onClick={startCall} className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Phone size={16} />
            Start Call
          </Button>
        )}

        {callActive && (
          <>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Say something to ${aiName}…`}
              disabled={loading}
              className="flex-1"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              size="icon"
              className="shrink-0"
            >
              <Send size={15} />
            </Button>
            <Button
              onClick={endCall}
              variant="outline"
              size="icon"
              className="shrink-0 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
              title="End call"
            >
              <PhoneOff size={15} />
            </Button>
          </>
        )}

        {callEnded && (
          <>
            <Button onClick={resetCall} variant="outline" className="flex-1 gap-2">
              <RotateCcw size={15} />
              New Call
            </Button>
            <Button onClick={startCall} className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Phone size={16} />
              Call Again
            </Button>
          </>
        )}
      </div>

      {/* ── Footer hint ──────────────────────────────────────────── */}
      <p className="mt-3 text-center text-xs text-slate-400 flex items-center justify-center gap-1">
        <ArrowRightLeft size={11} />
        All bookings and orders placed here are real — they appear in your Reservations and Orders pages
      </p>
    </div>
  )
}
