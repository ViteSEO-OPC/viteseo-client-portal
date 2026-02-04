import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Check if Clerk is properly configured at build time
const CLERK_CONFIGURED = (() => {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  return key && key.startsWith('pk_') && key.length > 50
})()

// Route matchers (simple regex-based to avoid Clerk dependency when not configured)
const isAdminRoute = (path: string) => path.startsWith('/admin')
const isAPIRoute = (path: string) => path.startsWith('/api')

// Security headers for all responses
const securityHeaders = {
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'X-DNS-Prefetch-Control': 'off',
  'X-Download-Options': 'noopen',
  'X-Permitted-Cross-Domain-Policies': 'none',
}

async function basicMiddleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const response = NextResponse.next()

  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Block admin routes when Clerk is not configured
  if (isAdminRoute(path)) {
    return NextResponse.json(
      {
        error: 'Admin authentication not configured',
        message: 'Please set valid NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in your .env file'
      },
      { status: 503 }
    )
  }

  // For API routes, add additional security headers
  if (isAPIRoute(path)) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  return response
}

async function clerkMiddleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  // Dynamic import to avoid initialization when not configured
  const { clerkMiddleware: createClerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server')

  const isAdminMatcher = createRouteMatcher(['/admin(.*)'])

  const handler = createClerkMiddleware(async (auth, request: NextRequest) => {
    const response = NextResponse.next()

    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Add HSTS in production
    if (process.env.NODE_ENV === 'production') {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      )
    }

    // Protect admin routes
    if (isAdminMatcher(request)) {
      await auth.protect()
    }

    // API route headers
    if (isAPIRoute(request.nextUrl.pathname)) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
    }

    return response
  })

  return handler(req)
}

export default async function middleware(req: NextRequest) {
  if (CLERK_CONFIGURED) {
    return clerkMiddleware(req)
  }
  return basicMiddleware(req)
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
