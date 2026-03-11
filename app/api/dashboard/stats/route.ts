import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const restaurantId = req.nextUrl.searchParams.get('restaurantId')

  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId ?? '', ownerId: session.user.id },
  })
  if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const weekStart = startOfDay(subDays(now, 7))
  const todayStr = format(now, 'yyyy-MM-dd')

  const [
    callsToday,
    callsThisWeek,
    reservationsToday,
    reservationsThisWeek,
    ordersToday,
    ordersThisWeek,
    recentOrders,
    avgDurationResult,
    outcomeBreakdown,
  ] = await Promise.all([
    prisma.call.count({
      where: { restaurantId: restaurant.id, createdAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.call.count({
      where: { restaurantId: restaurant.id, createdAt: { gte: weekStart } },
    }),
    prisma.reservation.count({
      where: { restaurantId: restaurant.id, date: todayStr, status: 'confirmed' },
    }),
    prisma.reservation.count({
      where: {
        restaurantId: restaurant.id,
        createdAt: { gte: weekStart },
        status: { in: ['confirmed', 'completed'] },
      },
    }),
    prisma.order.count({
      where: { restaurantId: restaurant.id, createdAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.order.count({
      where: { restaurantId: restaurant.id, createdAt: { gte: weekStart } },
    }),
    prisma.order.findMany({
      where: {
        restaurantId: restaurant.id,
        createdAt: { gte: weekStart },
        status: { not: 'cancelled' },
      },
      select: { totalAmount: true },
    }),
    prisma.call.aggregate({
      where: {
        restaurantId: restaurant.id,
        createdAt: { gte: weekStart },
        duration: { not: null },
      },
      _avg: { duration: true },
    }),
    prisma.call.groupBy({
      by: ['outcome'],
      where: {
        restaurantId: restaurant.id,
        createdAt: { gte: weekStart },
        outcome: { not: null },
      },
      _count: true,
    }),
  ])

  const revenueThisWeek = recentOrders.reduce((sum, o) => sum + o.totalAmount, 0)

  // Build calls-per-day chart data for last 7 days
  const callsPerDay = []
  for (let i = 6; i >= 0; i--) {
    const day = subDays(now, i)
    const dayStr = format(day, 'yyyy-MM-dd')
    const dayStart = startOfDay(day)
    const dayEnd = endOfDay(day)

    const [dayCalls, dayReservations] = await Promise.all([
      prisma.call.count({
        where: { restaurantId: restaurant.id, createdAt: { gte: dayStart, lte: dayEnd } },
      }),
      prisma.reservation.count({
        where: { restaurantId: restaurant.id, date: dayStr, status: 'confirmed' },
      }),
    ])

    callsPerDay.push({
      date: format(day, 'EEE'),
      calls: dayCalls,
      reservations: dayReservations,
    })
  }

  return NextResponse.json({
    callsToday,
    callsThisWeek,
    reservationsToday,
    reservationsThisWeek,
    ordersToday,
    ordersThisWeek,
    revenueThisWeek,
    avgCallDuration: Math.round(avgDurationResult._avg.duration ?? 0),
    outcomeBreakdown: outcomeBreakdown.map((o) => ({
      outcome: o.outcome ?? 'no-outcome',
      count: o._count,
    })),
    callsPerDay,
  })
}
