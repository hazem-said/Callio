import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const restaurantId = searchParams.get('restaurantId')
  const status = searchParams.get('status')

  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId ?? '', ownerId: session.user.id },
  })
  if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const orders = await prisma.order.findMany({
    where: {
      restaurantId: restaurant.id,
      ...(status ? { status } : {}),
    },
    include: {
      items: { include: { menuItem: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(orders)
}
