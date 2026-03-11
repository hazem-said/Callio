import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/dashboard/header'
import { MenuClient } from '@/components/dashboard/menu-client'

export default async function MenuPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: session.user.id },
    include: { menuItems: { where: { isAvailable: true }, orderBy: { category: 'asc' } } },
  })
  if (!restaurant) redirect('/dashboard/settings')

  return (
    <div>
      <Header title="Menu" subtitle="Manage your menu — every change is instantly reflected in the AI" />
      <div className="p-6">
        <MenuClient
          restaurantId={restaurant.id}
          aiMenuNotes={restaurant.aiMenuNotes ?? ''}
          initialMenuItems={restaurant.menuItems}
        />
      </div>
    </div>
  )
}
