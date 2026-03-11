/**
 * POST /api/voice/status
 *
 * Twilio status callback – called when a call ends (regardless of how).
 * Updates the call record and cleans up the in-memory session.
 *
 * Configure this as the "Status Callback" URL in Twilio console.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession, deleteSession, serializeTranscript } from '@/lib/voice/session'

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData()
    const callSid = body.get('CallSid') as string
    const callStatus = body.get('CallStatus') as string
    const callDuration = body.get('CallDuration') as string | null
    const recordingUrl = body.get('RecordingUrl') as string | null

    const session = getSession(callSid)

    // Update call in DB
    try {
      await prisma.call.updateMany({
        where: { twilioCallSid: callSid },
        data: {
          status: normalizeStatus(callStatus),
          duration: callDuration ? parseInt(callDuration, 10) : undefined,
          recordingUrl: recordingUrl ?? undefined,
          // Save transcript if not already saved
          ...(session
            ? { transcript: serializeTranscript(session) }
            : {}),
        },
      })
    } catch {
      // Call might not exist yet in edge cases – ignore
    }

    // Clean up session
    if (session) {
      deleteSession(callSid)
    }

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('[voice/status] Error:', error)
    return new NextResponse('Error', { status: 500 })
  }
}

function normalizeStatus(twilioStatus: string): string {
  const map: Record<string, string> = {
    completed: 'completed',
    failed: 'failed',
    busy: 'busy',
    'no-answer': 'no-answer',
    canceled: 'failed',
    'in-progress': 'in-progress',
    ringing: 'in-progress',
    queued: 'in-progress',
  }
  return map[twilioStatus] ?? twilioStatus
}
