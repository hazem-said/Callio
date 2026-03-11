'use client'

import { useEffect, useState } from 'react'
import {
  Phone,
  CalendarDays,
  ShoppingBag,
  Clock,
  TrendingUp,
  PhoneCall,
  ArrowUpRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  formatCurrency,
  formatDuration,
  CALL_OUTCOME_LABELS,
} from '@/lib/utils'
import type { DashboardStats } from '@/types'

const OUTCOME_COLORS: Record<string, string> = {
  'booked-reservation': '#6366f1',
  'placed-order': '#10b981',
  'answered-query': '#f59e0b',
  transferred: '#64748b',
  'no-outcome': '#e2e8f0',
}

interface OverviewDashboardProps {
  restaurantId: string
  restaurantName: string
}

export function OverviewDashboard({ restaurantId, restaurantName }: OverviewDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/dashboard/stats?restaurantId=${restaurantId}`)
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false))
  }, [restaurantId])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-200 animate-pulse" />
        ))}
      </div>
    )
  }

  const statCards = [
    {
      title: "Today's Calls",
      value: stats?.callsToday ?? 0,
      sub: `${stats?.callsThisWeek ?? 0} this week`,
      icon: Phone,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      title: "Today's Reservations",
      value: stats?.reservationsToday ?? 0,
      sub: `${stats?.reservationsThisWeek ?? 0} this week`,
      icon: CalendarDays,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: "Today's Orders",
      value: stats?.ordersToday ?? 0,
      sub: `${stats?.ordersThisWeek ?? 0} this week`,
      icon: ShoppingBag,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Weekly Revenue',
      value: formatCurrency(stats?.revenueThisWeek ?? 0),
      sub: `Avg call: ${formatDuration(stats?.avgCallDuration ?? 0)}`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  const pieData = (stats?.outcomeBreakdown ?? []).map((o) => ({
    name: CALL_OUTCOME_LABELS[o.outcome] ?? o.outcome,
    value: o.count,
    key: o.outcome,
  }))

  return (
    <div className="space-y-6">
      {/* Restaurant name + live indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{restaurantName}</h2>
          <p className="text-sm text-slate-500 mt-0.5">Your AI receptionist is active</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1.5 text-sm font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          AI Online
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-xl ${card.bg}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-400" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-slate-900">{card.value}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{card.title}</div>
                  <div className="text-xs text-slate-400 mt-1">{card.sub}</div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calls per day bar chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneCall size={18} className="text-indigo-600" />
              Calls & Reservations (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats?.callsPerDay ?? []} barSize={16} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="calls" fill="#6366f1" radius={[4, 4, 0, 0]} name="Calls" />
                <Bar dataKey="reservations" fill="#10b981" radius={[4, 4, 0, 0]} name="Reservations" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 justify-center">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className="h-2 w-2 rounded-full bg-indigo-500" />Calls
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />Reservations
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outcome breakdown pie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={18} className="text-indigo-600" />
              Call Outcomes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={OUTCOME_COLORS[entry.key] ?? '#cbd5e1'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {pieData.map((entry) => (
                    <div key={entry.key} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: OUTCOME_COLORS[entry.key] ?? '#cbd5e1' }}
                        />
                        <span className="text-slate-600 truncate max-w-[130px]">{entry.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">{entry.value}</Badge>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <Phone size={32} className="opacity-30 mb-2" />
                <p className="text-sm">No calls yet this week</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
