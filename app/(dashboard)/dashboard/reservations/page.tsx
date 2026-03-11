import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/dashboard/header'
import { ReservationsClient } from '@/components/dashboard/reservations-client'

export default async function ReservationsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: session.user.id },
  })
  if (!restaurant) redirect('/dashboard/settings')

  return (
    <div>
      <Header title="Reservations" subtitle="Manage all table bookings" />
      <div className="p-6">
        <ReservationsClient restaurantId={restaurant.id} />
      </div>
    </div>
  )
}
