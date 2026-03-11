/**
 * AI Agent – processes each turn of a phone conversation.
 *
 * Flow per turn:
 *  1. Receive user speech + conversation history
 *  2. Call OpenAI with tools enabled
 *  3. If AI calls a tool → execute it → feed result back
 *  4. Loop until AI sends a plain text reply
 *  5. Return text + whether to end the call
 */

import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { prisma } from '@/lib/db'
import { generateOrderNumber, generateTimeSlots } from '@/lib/utils'
import { restaurantTools } from './functions'
import type { OpeningHours } from '@/types'
import { format, parse, isAfter, isBefore, startOfDay } from 'date-fns'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface AgentResult {
  text: string
  shouldEndCall: boolean
  shouldTransfer: boolean
  outcome?: string
  summary?: string
}

// ── Tool executor ──────────────────────────────────────────────
async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  restaurantId: string,
  callerPhone: string
): Promise<string> {
  try {
    switch (toolName) {
      // ── Check availability ──────────────────────────────────
      case 'check_reservation_availability': {
        const { date, time, party_size } = args as {
          date: string
          time: string
          party_size: number
        }

        const restaurant = await prisma.restaurant.findUnique({
          where: { id: restaurantId },
        })
        if (!restaurant) return 'Restaurant not found.'
        if (!restaurant.acceptReservations) return 'This restaurant is not currently accepting reservations.'
        if (party_size > restaurant.maxPartySize) {
          return `Sorry, the maximum party size is ${restaurant.maxPartySize}. For larger groups, please call us directly.`
        }

        // Check day of week
        const dayKey = format(parse(date, 'yyyy-MM-dd', new Date()), 'EEE').toLowerCase() as keyof OpeningHours
        const hours = JSON.parse(restaurant.openingHours) as OpeningHours
        const dayHours = hours[dayKey]

        if (!dayHours || dayHours.closed) {
          return `The restaurant is closed on that day. Please choose a different date.`
        }

        // Check if requested time is within valid slots
        const validSlots = generateTimeSlots(
          dayHours.open,
          dayHours.close,
          restaurant.reservationSlotMinutes
        )

        if (!validSlots.includes(time)) {
          const nearest = validSlots.slice(0, 5).join(', ')
          return `${time} is not a valid slot. Available times include: ${nearest} (and more). Please choose a valid time.`
        }

        // Count existing reservations at that slot
        const existingCount = await prisma.reservation.count({
          where: {
            restaurantId,
            date,
            time,
            status: { in: ['confirmed'] },
          },
        })

        if (existingCount >= 5) {
          // Simple cap per slot – in real app you'd track table capacity
          return `Unfortunately ${time} on ${date} is fully booked. Would you like to try a nearby time?`
        }

        return `Great news – ${time} on ${date} for ${party_size} people is available!`
      }

      // ── Create reservation ──────────────────────────────────
      case 'create_reservation': {
        const { guest_name, guest_phone, date, time, party_size, notes } = args as {
          guest_name: string
          guest_phone: string
          date: string
          time: string
          party_size: number
          notes?: string
        }

        const reservation = await prisma.reservation.create({
          data: {
            guestName: guest_name,
            guestPhone: guest_phone || callerPhone,
            date,
            time,
            partySize: party_size,
            notes: notes ?? null,
            status: 'confirmed',
            restaurantId,
          },
        })

        return `Reservation confirmed! Booking ID: ${reservation.id.slice(-6).toUpperCase()}. Table for ${party_size} on ${date} at ${time} under ${guest_name}.`
      }

      // ── Cancel reservation ──────────────────────────────────
      case 'cancel_reservation': {
        const { guest_name, guest_phone, date } = args as {
          guest_name: string
          guest_phone: string
          date?: string
        }

        const reservation = await prisma.reservation.findFirst({
          where: {
            restaurantId,
            guestName: { contains: guest_name.split(' ')[0] },
            guestPhone: { contains: guest_phone.slice(-4) },
            status: 'confirmed',
            ...(date ? { date } : {}),
          },
          orderBy: { date: 'asc' },
        })

        if (!reservation) {
          return `I couldn't find a confirmed reservation under ${guest_name}. Could you double-check the name or date?`
        }

        await prisma.reservation.update({
          where: { id: reservation.id },
          data: { status: 'cancelled' },
        })

        return `Done! I've cancelled the reservation for ${reservation.guestName} on ${reservation.date} at ${reservation.time}. We hope to see you soon!`
      }

      // ── Get menu info ───────────────────────────────────────
      case 'get_menu_info': {
        const { query } = args as { query: string }
        const queryLower = query.toLowerCase()

        const items = await prisma.menuItem.findMany({
          where: {
            restaurantId,
            isAvailable: true,
            OR: [
              { category: { contains: query } },
              { name: { contains: query } },
              ...(queryLower.includes('veg') ? [{ isVegetarian: true }] : []),
              ...(queryLower.includes('vegan') ? [{ isVegan: true }] : []),
              ...(queryLower.includes('gluten') ? [{ isGlutenFree: true }] : []),
            ],
          },
          take: 5,
        })

        if (items.length === 0) {
          // Return general menu summary
          const allItems = await prisma.menuItem.findMany({
            where: { restaurantId, isAvailable: true },
            take: 8,
          })
          if (allItems.length === 0) return 'Menu information is not available right now.'
          const names = allItems.slice(0, 5).map((i) => `${i.name} ($${i.price})`).join(', ')
          return `Some of our popular items include: ${names}. I can answer questions about specific dishes.`
        }

        const results = items
          .map((i) => {
            const tags = [
              i.isVegetarian ? 'vegetarian' : '',
              i.isVegan ? 'vegan' : '',
              i.isGlutenFree ? 'gluten-free' : '',
            ]
              .filter(Boolean)
              .join(', ')
            return `${i.name} at $${i.price}${i.description ? ' – ' + i.description : ''}${tags ? ' (' + tags + ')' : ''}`
          })
          .join('. ')

        return results
      }

      // ── Place order ─────────────────────────────────────────
      case 'place_order': {
        const { guest_name, guest_phone, order_type, items, delivery_address, notes } = args as {
          guest_name: string
          guest_phone: string
          order_type: 'pickup' | 'delivery'
          items: Array<{ item_name: string; quantity: number; notes?: string }>
          delivery_address?: string
          notes?: string
        }

        if (order_type === 'delivery' && !delivery_address) {
          return 'I need a delivery address to place a delivery order. Could you provide your address?'
        }

        // Match item names to menu items
        const orderItems: Array<{
          menuItemId: string
          quantity: number
          price: number
          notes?: string | null
        }> = []

        let totalAmount = 0

        for (const item of items) {
          const menuItem = await prisma.menuItem.findFirst({
            where: {
              restaurantId,
              isAvailable: true,
              name: { contains: item.item_name.split(' ')[0] },
            },
          })

          if (!menuItem) {
            return `I'm sorry, I couldn't find "${item.item_name}" on the menu. Could you clarify the item name?`
          }

          orderItems.push({
            menuItemId: menuItem.id,
            quantity: item.quantity,
            price: menuItem.price,
            notes: item.notes ?? null,
          })
          totalAmount += menuItem.price * item.quantity
        }

        const order = await prisma.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            guestName: guest_name,
            guestPhone: guest_phone || callerPhone,
            type: order_type,
            status: 'confirmed',
            totalAmount,
            deliveryAddress: delivery_address ?? null,
            notes: notes ?? null,
            restaurantId,
            items: {
              create: orderItems,
            },
          },
        })

        const itemSummary = items
          .map((i) => `${i.quantity}x ${i.item_name}`)
          .join(', ')

        return `Order placed! Order #${order.orderNumber}. ${itemSummary}. Total: $${totalAmount.toFixed(2)}. ${order_type === 'pickup' ? 'Ready in approximately 20-30 minutes.' : `Delivery to ${delivery_address} – estimated 45-60 minutes.`}`
      }

      // ── Get restaurant info ─────────────────────────────────
      case 'get_restaurant_info': {
        const { info_type } = args as { info_type: string }
        const restaurant = await prisma.restaurant.findUnique({
          where: { id: restaurantId },
        })
        if (!restaurant) return 'Restaurant information not available.'

        switch (info_type) {
          case 'hours': {
            const hours = JSON.parse(restaurant.openingHours) as OpeningHours
            const lines = Object.entries(hours).map(([day, h]) => {
              const dayName = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' }[day]
              return h.closed ? `${dayName}: Closed` : `${dayName}: ${h.open} to ${h.close}`
            })
            return lines.join('. ')
          }
          case 'address':
            return `We're located at ${restaurant.address}, ${restaurant.city}, ${restaurant.state} ${restaurant.zipCode}.`
          case 'contact':
            return `You can reach us at ${restaurant.phone ?? 'the number you called'}. ${restaurant.website ? 'Our website is ' + restaurant.website + '.' : ''}`
          case 'parking':
            return 'Parking information is available on our website or by calling us during business hours.'
          default:
            return `${restaurant.name} is ${restaurant.description ?? 'a great restaurant'}. ${restaurant.address ? 'Located at ' + restaurant.address + ', ' + restaurant.city + '.' : ''} ${restaurant.phone ? 'Phone: ' + restaurant.phone + '.' : ''}`
        }
      }

      // ── Transfer ────────────────────────────────────────────
      case 'transfer_to_human': {
        const { reason } = args as { reason: string }
        return `TRANSFER_REQUESTED:${reason}`
      }

      // ── End call ────────────────────────────────────────────
      case 'end_call': {
        const { summary, outcome } = args as { summary: string; outcome: string }
        return `END_CALL:${summary}:${outcome}`
      }

      default:
        return `Unknown function: ${toolName}`
    }
  } catch (error) {
    console.error(`Tool error [${toolName}]:`, error)
    return 'I encountered an issue completing that request. Please try again or speak to our staff directly.'
  }
}

// ── Main agent turn ────────────────────────────────────────────
export async function processAgentTurn(
  systemPrompt: string,
  conversationMessages: ChatCompletionMessageParam[],
  userMessage: string,
  restaurantId: string,
  callerPhone: string
): Promise<AgentResult> {
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...conversationMessages,
    { role: 'user', content: userMessage },
  ]

  let shouldEndCall = false
  let shouldTransfer = false
  let finalOutcome: string | undefined
  let finalSummary: string | undefined

  // Loop to handle tool calls
  for (let iterations = 0; iterations < 5; iterations++) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools: restaurantTools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 300, // Keep responses short for voice
    })

    const message = response.choices[0].message

    // If no tool calls, we have our final text response
    if (!message.tool_calls || message.tool_calls.length === 0) {
      const text = message.content ?? "I'm sorry, I didn't catch that. Could you repeat?"
      return { text, shouldEndCall, shouldTransfer, outcome: finalOutcome, summary: finalSummary }
    }

    // Add assistant message with tool calls
    messages.push(message)

    // Execute each tool call
    for (const toolCall of message.tool_calls) {
      const args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>
      const result = await executeTool(
        toolCall.function.name,
        args,
        restaurantId,
        callerPhone
      )

      // Check for special signals
      if (result.startsWith('TRANSFER_REQUESTED:')) {
        shouldTransfer = true
      } else if (result.startsWith('END_CALL:')) {
        const parts = result.split(':')
        finalSummary = parts[1]
        finalOutcome = parts[2]
        shouldEndCall = true
      }

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: result,
      })
    }
  }

  // Fallback if we hit iteration limit
  return {
    text: "I'm sorry, I'm having a little trouble right now. Let me transfer you to a staff member.",
    shouldEndCall: false,
    shouldTransfer: true,
  }
}
