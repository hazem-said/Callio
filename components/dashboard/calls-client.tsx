'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Phone, PhoneIncoming, Clock, ChevronRight, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  formatPhone,
  formatDuration,
  CALL_OUTCOME_COLORS,
  CALL_OUTCOME_LABELS,
} from '@/lib/utils'
import { format } from 'date-fns'

interface Call {
  id: string
  from: string
  to: string
  status: string
  duration: number | null
  outcome: string | null
  summary: string | null
  createdAt: string
}

interface CallsClientProps {
  restaurantId: string
}

export function CallsClient({ restaurantId }: CallsClientProps) {
  const [calls, setCalls] = useState<Call[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch(`/api/calls?restaurantId=${restaurantId}&limit=50`)
      .then((r) => r.json())
      .then((data) => {
        setCalls(data.calls ?? [])
        setTotal(data.total ?? 0)
      })
      .finally(() => setLoading(false))
  }, [restaurantId])

  const filtered = calls.filter(
    (c) =>
      !search ||
      c.from.includes(search) ||
      c.summary?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-200 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search + count */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by phone or summary…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-slate-500">
          {total} total calls
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Phone size={48} className="opacity-20 mb-4" />
            <p className="text-lg font-medium text-slate-500">No calls yet</p>
            <p className="text-sm mt-1">Calls will appear here once your AI receptionist handles them.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((call) => (
            <Link key={call.id} href={`/dashboard/calls/${call.id}`}>
              <Card className="hover:shadow-md hover:border-indigo-200 transition-all duration-150 cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                      <PhoneIncoming size={18} className="text-indigo-600" />
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900">
                          {formatPhone(call.from)}
                        </span>
                        {call.outcome && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${CALL_OUTCOME_COLORS[call.outcome] ?? 'bg-gray-100 text-gray-600'}`}
                          >
                            {CALL_OUTCOME_LABELS[call.outcome] ?? call.outcome}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5 truncate">
                        {call.summary ?? 'No summary available'}
                      </p>
                    </div>

                    {/* Meta */}
                    <div className="text-right shrink-0 space-y-1">
                      <div className="text-xs text-slate-400">
                        {format(new Date(call.createdAt), 'MMM d, h:mm a')}
                      </div>
                      {call.duration != null && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 justify-end">
                          <Clock size={12} />
                          {formatDuration(call.duration)}
                        </div>
                      )}
                    </div>

                    <ChevronRight size={16} className="text-slate-300 shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
