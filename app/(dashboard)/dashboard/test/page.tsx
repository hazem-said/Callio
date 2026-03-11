import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/dashboard/header'
import { CallSimulator } from '@/components/dashboard/call-simulator'

export default async function TestCallPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: session.user.id },
  })
  if (!restaurant) redirect('/dashboard/settings')

  return (
    <div>
      <Header
        title="Test Call"
        subtitle="Simulate a customer call to test your AI receptionist"
      />
      <div className="p-6">
        <CallSimulator
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          aiName={restaurant.aiName}
        />
      </div>
    </div>
  )
}
