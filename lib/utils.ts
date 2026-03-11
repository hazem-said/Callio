import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns'

// ── Tailwind class merging ────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Date/Time helpers ────────────────────────────────────────
export function formatDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMM d, yyyy')
  } catch {
    return dateStr
  }
}

export function formatTime(time: string): string {
  try {
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  } catch {
    return time
  }
}

export function formatDateTime(dateStr: string, time: string): string {
  return `${formatDate(dateStr)} at ${formatTime(time)}`
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

// ── Status helpers ───────────────────────────────────────────
export type ReservationStatus = 'confirmed' | 'cancelled' | 'completed' | 'no-show'
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
export type CallStatus = 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer'
export type CallOutcome = 'booked-reservation' | 'placed-order' | 'answered-query' | 'transferred' | 'no-outcome'

export const RESERVATION_STATUS_COLORS: Record<ReservationStatus, string> = {
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-gray-100 text-gray-600',
  'no-show': 'bg-red-100 text-red-700',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready: 'bg-emerald-100 text-emerald-700',
  delivered: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
}

export const CALL_OUTCOME_COLORS: Record<string, string> = {
  'booked-reservation': 'bg-emerald-100 text-emerald-700',
  'placed-order': 'bg-blue-100 text-blue-700',
  'answered-query': 'bg-purple-100 text-purple-700',
  transferred: 'bg-amber-100 text-amber-700',
  'no-outcome': 'bg-gray-100 text-gray-600',
}

export const CALL_OUTCOME_LABELS: Record<string, string> = {
  'booked-reservation': 'Reservation Booked',
  'placed-order': 'Order Placed',
  'answered-query': 'Query Answered',
  transferred: 'Transferred',
  'no-outcome': 'No Outcome',
}

// ── Order number generator ───────────────────────────────────
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

// ── Time slots generator ─────────────────────────────────────
export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  slotMinutes: number = 30,
  // Leave a buffer before closing (so you don't seat at close time)
  bufferMinutes: number = 90
): string[] {
  const slots: string[] = []
  const [openH, openM] = openTime.split(':').map(Number)
  const [closeH, closeM] = closeTime.split(':').map(Number)

  let current = openH * 60 + openM
  const end = closeH * 60 + closeM - bufferMinutes

  while (current <= end) {
    const h = Math.floor(current / 60)
    const m = current % 60
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
    current += slotMinutes
  }

  return slots
}

// ── Truncate text ────────────────────────────────────────────
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

// ── Capitalize first letter ──────────────────────────────────
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// ── Get initials ─────────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
