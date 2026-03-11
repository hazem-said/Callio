import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/dashboard/header'
import { OrdersClient } from '@/components/dashboard/orders-client'

export default async function OrdersPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: session.user.id },
  })
  if (!restaurant) redirect('/dashboard/settings')

  return (
    <div>
      <Header title="Orders" subtitle="Manage pickup and delivery orders" />
      <div className="p-6">
        <OrdersClient restaurantId={restaurant.id} />
      </div>
    </div>
  )
}
