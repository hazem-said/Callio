import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const reservation = await prisma.reservation.findFirst({
    where: {
      id: params.id,
      restaurant: { ownerId: session.user.id },
    },
  })
  if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const updated = await prisma.reservation.update({
    where: { id: params.id },
    data: body,
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const reservation = await prisma.reservation.findFirst({
    where: { id: params.id, restaurant: { ownerId: session.user.id } },
  })
  if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.reservation.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
