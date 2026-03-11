import { format } from 'date-fns'
import type { Restaurant, MenuItem } from '@prisma/client'
import type { OpeningHours } from '@/types'
import { generateTimeSlots } from '@/lib/utils'

/**
 * Build the system prompt for the AI receptionist.
 * This is injected at the start of every conversation.
 */
export function buildSystemPrompt(
  restaurant: Restaurant & { menuItems: MenuItem[] }
): string {
  const now = new Date()
  const currentDate = format(now, 'EEEE, MMMM d, yyyy')
  const currentTime = format(now, 'HH:mm')
  const dayKey = format(now, 'EEE').toLowerCase() as keyof OpeningHours

  // Parse opening hours
  let hoursText = 'Contact restaurant for hours.'
  let todaySlots: string[] = []

  try {
    const hours = JSON.parse(restaurant.openingHours) as OpeningHours
    const todayHours = hours[dayKey]

    if (todayHours?.closed) {
      hoursText = 'Closed today.'
    } else if (todayHours) {
      hoursText = `Today (${format(now, 'EEEE')}): ${todayHours.open} – ${todayHours.close}`
      todaySlots = generateTimeSlots(
        todayHours.open,
        todayHours.close,
        restaurant.reservationSlotMinutes
      )
    }

    // Add full week hours
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const weekHours = days
      .map((d, i) => {
        const dh = hours[d]
        if (!dh) return null
        return dh.closed ? `${dayNames[i]}: Closed` : `${dayNames[i]}: ${dh.open}–${dh.close}`
      })
      .filter(Boolean)
      .join(', ')

    hoursText = weekHours || hoursText
  } catch {
    // ignore parse errors
  }

  // Build menu summary grouped by category
  const menuByCategory = restaurant.menuItems
    .filter((item) => item.isAvailable)
    .reduce<Record<string, MenuItem[]>>((acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    }, {})

  const menuText = Object.entries(menuByCategory)
    .map(([category, items]) => {
      const itemList = items
        .map((item) => {
          const tags: string[] = []
          if (item.isVegetarian) tags.push('V')
          if (item.isVegan) tags.push('VG')
          if (item.isGlutenFree) tags.push('GF')
          const tagStr = tags.length > 0 ? ` [${tags.join(',')}]` : ''
          return `  • ${item.name}${tagStr} – $${item.price.toFixed(2)}${item.description ? `: ${item.description}` : ''}`
        })
        .join('\n')
      return `${category}:\n${itemList}`
    })
    .join('\n\n')

  const availableSlotsText =
    todaySlots.length > 0
      ? todaySlots.join(', ')
      : 'Contact restaurant to check availability'

  const features: string[] = []
  if (restaurant.acceptReservations) features.push('make/modify/cancel reservations')
  if (restaurant.acceptOrders) features.push('take pickup and delivery orders')
  features.push('answer questions about hours, menu, location, and specials')

  const personalityNote = restaurant.aiPersonality
    ? `\n\nPersonality notes: ${restaurant.aiPersonality}`
    : ''

  return `You are ${restaurant.aiName}, the AI receptionist for ${restaurant.name}.
You handle phone calls on behalf of the restaurant. You can ${features.join(', ')}.${personalityNote}

CRITICAL VOICE RULES:
- You are speaking out loud – keep responses SHORT (1-3 sentences max).
- NEVER use bullet points, asterisks, numbered lists, markdown, or emojis.
- Speak naturally and conversationally. Use contractions (I'd, I'll, That's, etc.).
- Confirm key details before taking action (e.g., repeat back a reservation before booking it).
- If unsure about something, say so honestly rather than making something up.
- If a caller becomes abusive or the call is beyond your abilities, offer to transfer to a staff member.

RESTAURANT INFO:
Name: ${restaurant.name}
${restaurant.address ? `Address: ${restaurant.address}${restaurant.city ? `, ${restaurant.city}` : ''}${restaurant.state ? `, ${restaurant.state}` : ''}` : ''}
${restaurant.phone ? `Phone: ${restaurant.phone}` : ''}
${restaurant.website ? `Website: ${restaurant.website}` : ''}
Cuisine: ${restaurant.cuisineType ?? 'Various'}
${restaurant.description ? `About: ${restaurant.description}` : ''}

HOURS:
${hoursText}

CURRENT DATE & TIME: ${currentDate}, ${currentTime}

TODAY'S AVAILABLE RESERVATION SLOTS (if accepting reservations today):
${availableSlotsText}
Max party size: ${restaurant.maxPartySize} people

MENU:
${menuText || 'Menu information not available.'}${
  restaurant.aiMenuNotes
    ? `\n\nSPECIAL NOTES (daily specials, unavailable items, chef recommendations):\n${restaurant.aiMenuNotes}`
    : ''
}

CAPABILITIES:
${restaurant.acceptReservations ? '- RESERVATIONS: You CAN book, modify, and cancel reservations. Always confirm: guest name, phone, date, time, and party size before booking.' : '- RESERVATIONS: Not accepting reservations at this time.'}
${restaurant.acceptOrders ? '- ORDERS: You CAN take pickup and delivery orders. Confirm: guest name, phone, items with quantities, and pickup/delivery preference before placing.' : '- ORDERS: Not accepting phone orders at this time.'}
- TRANSFERS: If a caller needs to speak to a human, use the transfer_to_human function.
- END CALL: When the call is complete and the caller is satisfied, use end_call.

Always greet callers warmly and make them feel welcome. You represent ${restaurant.name}!`
}
