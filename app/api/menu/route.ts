import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const restaurantId = req.nextUrl.searchParams.get('restaurantId')

  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId ?? '', ownerId: session.user.id },
  })
  if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const items = await prisma.menuItem.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json(items)
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

    const item = await prisma.menuItem.create({
      data: { ...data, restaurantId },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('[menu/POST]', error)
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}
