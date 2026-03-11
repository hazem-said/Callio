/**
 * POST /api/voice/test
 *
 * Simulates a call turn without Twilio. Used by the in-dashboard call simulator.
 * Requires an active session (restaurant owner only).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { buildSystemPrompt } from '@/lib/ai/prompts'
import { processAgentTurn } from '@/lib/ai/agent'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { message, history, restaurantId } = await req.json() as {
      message: string
      history: ChatCompletionMessageParam[]
      restaurantId: string
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Verify restaurant belongs to this user
    const restaurant = await prisma.restaurant.findFirst({
      where: { id: restaurantId, ownerId: session.user.id },
      include: { menuItems: { where: { isAvailable: true } } },
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    const systemPrompt = buildSystemPrompt(restaurant)

    const result = await processAgentTurn(
      systemPrompt,
      history,
      message,
      restaurantId,
      '+15550000000' // Simulated caller number
    )

    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('[voice/test]', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
