import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const restaurantId = searchParams.get('restaurantId')
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const limit = parseInt(searchParams.get('limit') ?? '20', 10)
  const skip = (page - 1) * limit

  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId ?? '', ownerId: session.user.id },
  })
  if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [calls, total] = await Promise.all([
    prisma.call.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.call.count({ where: { restaurantId: restaurant.id } }),
  ])

  return NextResponse.json({ calls, total, page, pages: Math.ceil(total / limit) })
}
