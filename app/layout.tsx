import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SessionProvider } from '@/components/session-provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Callio – AI Restaurant Receptionist',
    template: '%s | Callio',
  },
  description:
    'Callio handles your restaurant phone calls 24/7 with AI – books reservations, takes orders, answers questions, and more.',
  keywords: ['AI receptionist', 'restaurant AI', 'phone answering', 'reservations'],
  openGraph: {
    title: 'Callio – AI Restaurant Receptionist',
    description: 'Never miss a call again. Callio answers your phones 24/7.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
