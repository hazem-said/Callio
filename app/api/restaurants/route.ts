import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  cuisineType: z.string().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
  aiName: z.string().default('Aria'),
  aiGreeting: z.string().optional(),
  aiPersonality: z.string().optional(),
  openingHours: z.string().default('{}'),
  acceptReservations: z.boolean().default(true),
  acceptOrders: z.boolean().default(true),
  maxPartySize: z.number().default(10),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const restaurants = await prisma.restaurant.findMany({
    where: { ownerId: session.user.id },
    include: {
      _count: {
        select: { calls: true, reservations: true, orders: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(restaurants)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        ...parsed.data,
        ownerId: session.user.id,
      },
    })

    return NextResponse.json(restaurant, { status: 201 })
  } catch (error) {
    console.error('[restaurants/POST]', error)
    return NextResponse.json({ error: 'Failed to create restaurant' }, { status: 500 })
  }
}
