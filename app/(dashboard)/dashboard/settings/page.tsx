import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/dashboard/header'
import { SettingsClient } from '@/components/dashboard/settings-client'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: session.user.id },
  })

  return (
    <div>
      <Header
        title={restaurant ? 'Settings' : 'Get Started'}
        subtitle={restaurant ? 'Configure your restaurant and AI receptionist' : 'Set up your restaurant to unlock the full dashboard'}
      />
      <div className="p-6">
        <SettingsClient restaurant={restaurant} />
      </div>
    </div>
  )
}
