import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/dashboard/header'
import { OverviewDashboard } from '@/components/dashboard/overview'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  // Get the user's first (or only) restaurant
  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: session.user.id },
  })

  // Redirect to onboarding if no restaurant yet
  if (!restaurant) redirect('/dashboard/settings')

  return (
    <div>
      <Header title="Overview" subtitle={`Welcome back, ${session.user.name?.split(' ')[0] ?? 'there'}!`} />
      <div className="p-6">
        <OverviewDashboard restaurantId={restaurant.id} restaurantName={restaurant.name} />
      </div>
    </div>
  )
}
