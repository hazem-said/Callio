import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function getRestaurantForOwner(id: string, ownerId: string) {
  return prisma.restaurant.findFirst({
    where: { id, ownerId },
  })
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const restaurant = await prisma.restaurant.findFirst({
    where: { id: params.id, ownerId: session.user.id },
    include: {
      menuItems: { orderBy: { category: 'asc' } },
      _count: { select: { calls: true, reservations: true, orders: true } },
    },
  })

  if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(restaurant)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owned = await getRestaurantForOwner(params.id, session.user.id)
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await req.json()
    const updated = await prisma.restaurant.update({
      where: { id: params.id },
      data: body,
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('[restaurants/PATCH]', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owned = await getRestaurantForOwner(params.id, session.user.id)
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.restaurant.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
