/**
 * In-memory call session store.
 *
 * Stores the conversation history and metadata for each active call.
 * Keyed by Twilio CallSid.
 *
 * NOTE: This works for single-server deployments. For multi-instance
 * production environments, replace with Redis or a database-backed store.
 */

import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

export interface CallSessionData {
  callSid: string
  restaurantId: string
  callerPhone: string
  messages: ChatCompletionMessageParam[]
  startedAt: Date
  callDbId?: string      // DB record ID once created
  lastActivity: Date
}

// Global session map (survives hot-reload in dev via global)
const globalForSessions = globalThis as unknown as {
  callSessions: Map<string, CallSessionData> | undefined
}

const callSessions: Map<string, CallSessionData> =
  globalForSessions.callSessions ?? new Map()

if (!globalForSessions.callSessions) {
  globalForSessions.callSessions = callSessions
}

// ── Session operations ─────────────────────────────────────────

export function createSession(
  callSid: string,
  restaurantId: string,
  callerPhone: string
): CallSessionData {
  const session: CallSessionData = {
    callSid,
    restaurantId,
    callerPhone,
    messages: [],
    startedAt: new Date(),
    lastActivity: new Date(),
  }
  callSessions.set(callSid, session)
  return session
}

export function getSession(callSid: string): CallSessionData | undefined {
  return callSessions.get(callSid)
}

export function getOrCreateSession(
  callSid: string,
  restaurantId: string,
  callerPhone: string
): CallSessionData {
  return callSessions.get(callSid) ?? createSession(callSid, restaurantId, callerPhone)
}

export function updateSession(
  callSid: string,
  updates: Partial<CallSessionData>
): void {
  const session = callSessions.get(callSid)
  if (session) {
    Object.assign(session, { ...updates, lastActivity: new Date() })
  }
}

export function addMessageToSession(
  callSid: string,
  role: 'user' | 'assistant',
  content: string
): void {
  const session = callSessions.get(callSid)
  if (session) {
    session.messages.push({ role, content })
    session.lastActivity = new Date()
  }
}

export function deleteSession(callSid: string): void {
  callSessions.delete(callSid)
}

export function getSessionMessages(callSid: string): ChatCompletionMessageParam[] {
  return callSessions.get(callSid)?.messages ?? []
}

// ── Session serialization (for DB storage) ──────────────────
export function serializeTranscript(session: CallSessionData): string {
  const transcript = session.messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      timestamp: new Date().toISOString(),
    }))
  return JSON.stringify(transcript)
}

// ── Cleanup stale sessions (call every hour or so) ────────────
export function cleanupStaleSessions(maxAgeMs: number = 2 * 60 * 60 * 1000): void {
  const now = Date.now()
  const staleKeys: string[] = []
  callSessions.forEach((session, sid) => {
    if (now - session.lastActivity.getTime() > maxAgeMs) {
      staleKeys.push(sid)
    }
  })
  staleKeys.forEach((sid) => callSessions.delete(sid))
}
