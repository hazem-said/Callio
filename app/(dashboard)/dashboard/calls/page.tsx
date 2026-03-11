import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/dashboard/header'
import { CallsClient } from '@/components/dashboard/calls-client'

export default async function CallsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: session.user.id },
  })
  if (!restaurant) redirect('/dashboard/settings')

  return (
    <div>
      <Header title="Call Logs" subtitle="All incoming calls handled by your AI receptionist" />
      <div className="p-6">
        <CallsClient restaurantId={restaurant.id} />
      </div>
    </div>
  )
}
