// Shared TypeScript types across the app

export interface TranscriptMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface OpeningHoursDay {
  open: string   // "11:00"
  close: string  // "22:00"
  closed: boolean
}

export interface OpeningHours {
  mon: OpeningHoursDay
  tue: OpeningHoursDay
  wed: OpeningHoursDay
  thu: OpeningHoursDay
  fri: OpeningHoursDay
  sat: OpeningHoursDay
  sun: OpeningHoursDay
}

export interface DashboardStats {
  callsToday: number
  callsThisWeek: number
  reservationsToday: number
  reservationsThisWeek: number
  ordersToday: number
  ordersThisWeek: number
  revenueThisWeek: number
  avgCallDuration: number
  outcomeBreakdown: {
    outcome: string
    count: number
  }[]
  callsPerDay: {
    date: string
    calls: number
    reservations: number
  }[]
}

export interface CallSession {
  callSid: string
  restaurantId: string
  callerId: string
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: string
  }>
  startedAt: Date
  pendingReservation?: {
    guestName?: string
    guestPhone?: string
    date?: string
    time?: string
    partySize?: number
    notes?: string
  }
  pendingOrder?: {
    guestName?: string
    items?: Array<{ menuItemId: string; quantity: number; notes?: string }>
    type?: 'pickup' | 'delivery'
    deliveryAddress?: string
    notes?: string
  }
}
