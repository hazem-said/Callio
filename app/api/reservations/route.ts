import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const restaurantId = searchParams.get('restaurantId')
  const date = searchParams.get('date')
  const status = searchParams.get('status')

  // Verify ownership
  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId ?? '', ownerId: session.user.id },
  })
  if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const reservations = await prisma.reservation.findMany({
    where: {
      restaurantId: restaurant.id,
      ...(date ? { date } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  })

  return NextResponse.json(reservations)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { restaurantId, ...data } = body

    const restaurant = await prisma.restaurant.findFirst({
      where: { id: restaurantId, ownerId: session.user.id },
    })
    if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const reservation = await prisma.reservation.create({
      data: { ...data, restaurantId },
    })

    return NextResponse.json(reservation, { status: 201 })
  } catch (error) {
    console.error('[reservations/POST]', error)
    return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 })
  }
}
