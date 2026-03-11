import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Redirect root /dashboard → /dashboard (handled by page.tsx)
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const { pathname } = req.nextUrl

        // Public paths – always accessible
        if (
          pathname === '/' ||
          pathname.startsWith('/login') ||
          pathname.startsWith('/register') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/api/voice') // Twilio webhooks (no session)
        ) {
          return true
        }

        // All other paths require a session
        return !!token
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - Static files (_next/static)
     * - Images (_next/image)
     * - Favicon
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
