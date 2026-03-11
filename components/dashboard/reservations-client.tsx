'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import {
  CalendarDays,
  Users,
  Clock,
  Phone,
  Search,
  Plus,
  Check,
  X,
  StickyNote,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDate, formatTime, formatPhone, RESERVATION_STATUS_COLORS } from '@/lib/utils'
import type { ReservationStatus } from '@/lib/utils'

interface Reservation {
  id: string
  guestName: string
  guestPhone: string
  partySize: number
  date: string
  time: string
  status: string
  notes: string | null
  createdAt: string
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no-show', label: 'No-Show' },
]

export function ReservationsClient({ restaurantId }: { restaurantId: string }) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchReservations = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ restaurantId })
    if (statusFilter !== 'all') params.set('status', statusFilter)

    fetch(`/api/reservations?${params}`)
      .then((r) => r.json())
      .then(setReservations)
      .finally(() => setLoading(false))
  }, [restaurantId, statusFilter])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchReservations()
  }

  const filtered = reservations.filter(
    (r) =>
      !search ||
      r.guestName.toLowerCase().includes(search.toLowerCase()) ||
      r.guestPhone.includes(search)
  )

  // Group by date
  const grouped = filtered.reduce<Record<string, Reservation[]>>((acc, r) => {
    if (!acc[r.date]) acc[r.date] = []
    acc[r.date].push(r)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort()

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto text-sm text-slate-500">{filtered.length} reservations</div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-slate-400">
            <CalendarDays size={48} className="opacity-20 mb-4" />
            <p className="text-lg font-medium text-slate-500">No reservations found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays size={16} className="text-indigo-600" />
                <h3 className="font-semibold text-slate-700">{formatDate(date)}</h3>
                <span className="text-xs text-slate-400">({grouped[date].length} bookings)</span>
              </div>
              <div className="space-y-2">
                {grouped[date].map((r) => (
                  <Card key={r.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4 flex-wrap">
                        {/* Time */}
                        <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-2 min-w-[80px]">
                          <Clock size={14} className="text-slate-400" />
                          <span className="text-sm font-semibold text-slate-700">{formatTime(r.time)}</span>
                        </div>

                        {/* Guest info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-900">{r.guestName}</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${RESERVATION_STATUS_COLORS[r.status as ReservationStatus] ?? 'bg-gray-100 text-gray-600'}`}
                            >
                              {r.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-sm text-slate-500">
                            <span className="flex items-center gap-1"><Phone size={12} />{formatPhone(r.guestPhone)}</span>
                            <span className="flex items-center gap-1"><Users size={12} />{r.partySize} guests</span>
                            {r.notes && <span className="flex items-center gap-1"><StickyNote size={12} />{r.notes}</span>}
                          </div>
                        </div>

                        {/* Actions */}
                        {r.status === 'confirmed' && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => updateStatus(r.id, 'completed')}
                            >
                              <Check size={14} />
                              Seated
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(r.id, 'no-show')}
                            >
                              No-Show
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateStatus(r.id, 'cancelled')}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
