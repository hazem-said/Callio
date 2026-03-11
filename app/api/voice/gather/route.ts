/**
 * POST /api/voice/gather?restaurantId=xxx&callDbId=xxx
 *
 * Twilio webhook – called after the caller speaks.
 * Receives the transcribed speech, runs the AI agent, returns TwiML.
 *
 * This is the main conversational loop.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  buildSpeakAndListenTwiml,
  buildFarewellTwiml,
  buildTransferTwiml,
} from '@/lib/twilio/client'
import {
  getOrCreateSession,
  addMessageToSession,
  getSessionMessages,
  updateSession,
  serializeTranscript,
} from '@/lib/voice/session'
import { buildSystemPrompt } from '@/lib/ai/prompts'
import { processAgentTurn } from '@/lib/ai/agent'

export async function POST(req: NextRequest) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get('host')}`

  try {
    const body = await req.formData()
    const callSid = body.get('CallSid') as string
    const speechResult = body.get('SpeechResult') as string | null
    const from = body.get('From') as string

    const restaurantId = req.nextUrl.searchParams.get('restaurantId') ?? ''
    const callDbId = req.nextUrl.searchParams.get('callDbId') ?? ''

    // No speech detected – prompt again
    if (!speechResult || speechResult.trim() === '') {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
      })
      const gatherUrl = `${baseUrl}/api/voice/gather?restaurantId=${restaurantId}&callDbId=${callDbId}`
      const twiml = buildSpeakAndListenTwiml(
        "I'm sorry, I didn't catch that. Could you please repeat your request?",
        gatherUrl,
        restaurant?.aiLanguage ?? 'en-US'
      )
      return new NextResponse(twiml, {
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    // Fetch restaurant with full menu for system prompt
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { menuItems: { where: { isAvailable: true } } },
    })

    if (!restaurant) {
      const twiml = buildFarewellTwiml(
        "I'm having trouble accessing restaurant information. Please call back later."
      )
      return new NextResponse(twiml, {
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    // Get or create conversation session
    const session = getOrCreateSession(callSid, restaurantId, from)
    if (!session.callDbId && callDbId) {
      updateSession(callSid, { callDbId })
    }

    // Get conversation history (excluding system prompt)
    const conversationMessages = getSessionMessages(callSid)

    // Add user message to history BEFORE processing
    addMessageToSession(callSid, 'user', speechResult)

    // Build system prompt with current restaurant context
    const systemPrompt = buildSystemPrompt(restaurant)

    // Run the AI agent
    const result = await processAgentTurn(
      systemPrompt,
      conversationMessages,
      speechResult,
      restaurantId,
      from
    )

    // Add AI response to history
    addMessageToSession(callSid, 'assistant', result.text)

    const gatherUrl = `${baseUrl}/api/voice/gather?restaurantId=${restaurantId}&callDbId=${callDbId}`

    // Handle transfer
    if (result.shouldTransfer) {
      const transferNumber =
        restaurant.phone ?? process.env.TWILIO_PHONE_NUMBER ?? from

      // Persist transcript to DB
      await finalizeCall(callSid, callDbId, 'completed', 'transferred', result.summary)

      const twiml = buildTransferTwiml(
        result.text,
        transferNumber,
        restaurant.aiLanguage
      )
      return new NextResponse(twiml, {
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    // Handle end call
    if (result.shouldEndCall) {
      await finalizeCall(
        callSid,
        callDbId,
        'completed',
        result.outcome,
        result.summary
      )

      const twiml = buildFarewellTwiml(result.text, restaurant.aiLanguage)
      return new NextResponse(twiml, {
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    // Normal turn – speak and listen
    const twiml = buildSpeakAndListenTwiml(result.text, gatherUrl, restaurant.aiLanguage)
    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    })
  } catch (error) {
    console.error('[voice/gather] Error:', error)
    const twiml = buildFarewellTwiml(
      "I'm experiencing technical difficulties. I'll need to end the call. Please try again. I'm sorry for the inconvenience."
    )
    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  }
}

/**
 * Persist call transcript and outcome to the database.
 */
async function finalizeCall(
  callSid: string,
  callDbId: string,
  status: string,
  outcome?: string,
  summary?: string
) {
  try {
    const { getSession, serializeTranscript } = await import('@/lib/voice/session')
    const session = getSession(callSid)

    if (callDbId) {
      const duration = session
        ? Math.round((Date.now() - session.startedAt.getTime()) / 1000)
        : undefined

      await prisma.call.update({
        where: { id: callDbId },
        data: {
          status,
          outcome: outcome ?? 'no-outcome',
          summary: summary ?? null,
          duration,
          transcript: session ? serializeTranscript(session) : undefined,
        },
      })
    }
  } catch (error) {
    console.error('[voice/gather] Failed to finalize call:', error)
  }
}
