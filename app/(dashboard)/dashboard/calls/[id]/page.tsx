import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/dashboard/header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  formatPhone,
  formatDuration,
  CALL_OUTCOME_COLORS,
  CALL_OUTCOME_LABELS,
} from '@/lib/utils'
import { format } from 'date-fns'
import { Phone, Clock, User, MessageSquare, CheckCircle } from 'lucide-react'
import type { TranscriptMessage } from '@/types'

export default async function CallDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const call = await prisma.call.findFirst({
    where: { id: params.id, restaurant: { ownerId: session.user.id } },
    include: {
      reservations: true,
      orders: { include: { items: { include: { menuItem: true } } } },
    },
  })

  if (!call) notFound()

  const transcript: TranscriptMessage[] = call.transcript
    ? JSON.parse(call.transcript as string)
    : []

  return (
    <div>
      <Header title="Call Detail" subtitle={`Call from ${formatPhone(call.from)}`} />
      <div className="p-6 space-y-6">
        {/* Meta */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Caller', value: formatPhone(call.from), icon: Phone },
            { label: 'Duration', value: call.duration ? formatDuration(call.duration) : 'N/A', icon: Clock },
            { label: 'Date', value: format(new Date(call.createdAt), 'MMM d, yyyy h:mm a'), icon: User },
            { label: 'Status', value: call.status, icon: CheckCircle },
          ].map((meta) => {
            const Icon = meta.icon
            return (
              <Card key={meta.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon size={18} className="text-indigo-500 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">{meta.label}</p>
                    <p className="text-sm font-semibold text-slate-900 capitalize">{meta.value}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Outcome + Summary */}
        {(call.outcome || call.summary) && (
          <Card>
            <CardContent className="p-5 flex items-start gap-3">
              <CheckCircle size={20} className="text-emerald-500 mt-0.5 shrink-0" />
              <div>
                {call.outcome && (
                  <span className={`text-sm px-2.5 py-0.5 rounded-full font-medium ${CALL_OUTCOME_COLORS[call.outcome] ?? 'bg-gray-100 text-gray-600'}`}>
                    {CALL_OUTCOME_LABELS[call.outcome] ?? call.outcome}
                  </span>
                )}
                {call.summary && (
                  <p className="text-slate-600 text-sm mt-2">{call.summary}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Linked reservations */}
        {call.reservations.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Reservation Booked</CardTitle></CardHeader>
            <CardContent className="p-0">
              {call.reservations.map((r) => (
                <div key={r.id} className="px-6 py-3 border-b last:border-b-0 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{r.guestName}</p>
                    <p className="text-sm text-slate-500">{r.date} at {r.time} · {r.partySize} guests</p>
                  </div>
                  <Badge variant="success">Confirmed</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Linked orders */}
        {call.orders.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Order Placed</CardTitle></CardHeader>
            <CardContent className="p-0">
              {call.orders.map((o) => (
                <div key={o.id} className="px-6 py-3 border-b last:border-b-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900">#{o.orderNumber}</p>
                    <Badge variant="info">{o.type}</Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {o.items.map((i) => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                  </p>
                  <p className="text-sm font-semibold text-slate-700 mt-1">${o.totalAmount.toFixed(2)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Transcript */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare size={18} className="text-indigo-600" />
              Conversation Transcript
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transcript.length === 0 ? (
              <p className="text-slate-400 text-sm italic">No transcript available for this call.</p>
            ) : (
              <div className="space-y-4">
                {transcript.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                  >
                    {msg.role === 'user' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600 mt-0.5">
                        C
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.role === 'user'
                          ? 'bg-slate-100 text-slate-800 rounded-tl-sm'
                          : 'bg-indigo-600 text-white rounded-tr-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.role === 'assistant' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white mt-0.5">
                        AI
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
