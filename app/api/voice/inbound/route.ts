/**
 * POST /api/voice/inbound?restaurantId=xxx
 *
 * Twilio webhook – called when a phone call arrives.
 * 1. Looks up the restaurant by ID (or Twilio number)
 * 2. Creates a call record in the DB
 * 3. Creates an in-memory session for conversation tracking
 * 4. Returns TwiML: greet + listen
 *
 * Configure this URL in your Twilio phone number settings as:
 *   https://your-domain.com/api/voice/inbound?restaurantId=RESTAURANT_ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  buildGreetingTwiml,
  buildFarewellTwiml,
} from '@/lib/twilio/client'
import { createSession } from '@/lib/voice/session'

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData()
    const callSid = body.get('CallSid') as string
    const from = body.get('From') as string
    const to = body.get('To') as string

    const restaurantId = req.nextUrl.searchParams.get('restaurantId')

    // Find restaurant – by explicit ID param first, then by Twilio number
    let restaurant = restaurantId
      ? await prisma.restaurant.findUnique({ where: { id: restaurantId } })
      : await prisma.restaurant.findUnique({ where: { twilioNumber: to } })

    if (!restaurant || !restaurant.isActive) {
      const twiml = buildFarewellTwiml(
        "We're sorry, this number is not currently in service. Please try again later."
      )
      return new NextResponse(twiml, {
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    // Create call record in DB
    const callRecord = await prisma.call.create({
      data: {
        twilioCallSid: callSid,
        from,
        to,
        status: 'in-progress',
        restaurantId: restaurant.id,
      },
    })

    // Create in-memory session
    const session = createSession(callSid, restaurant.id, from)
    session.callDbId = callRecord.id

    // Build greeting
    const greeting =
      restaurant.aiGreeting ??
      `Hello! Thank you for calling ${restaurant.name}. I'm ${restaurant.aiName}, your AI assistant. How can I help you today?`

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get('host')}`
    const gatherUrl = `${baseUrl}/api/voice/gather?restaurantId=${restaurant.id}&callDbId=${callRecord.id}`

    const twiml = buildGreetingTwiml(greeting, gatherUrl, restaurant.aiLanguage)

    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    })
  } catch (error) {
    console.error('[voice/inbound] Error:', error)
    const twiml = buildFarewellTwiml(
      "We're experiencing technical difficulties. Please call back later. We apologize for the inconvenience."
    )
    return new NextResponse(twiml, {
      status: 200, // Always 200 to Twilio
      headers: { 'Content-Type': 'text/xml' },
    })
  }
}
