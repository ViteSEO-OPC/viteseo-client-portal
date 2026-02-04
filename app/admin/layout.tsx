import Link from 'next/link'
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, UserButton } from '@clerk/nextjs'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <SignedIn>
        <div className="min-h-screen bg-background">
          <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center">
              <div className="mr-4 hidden md:flex">
                <Link href="/admin" className="mr-6 flex items-center space-x-2">
                  <span className="hidden font-bold sm:inline-block">Vite SEO Admin</span>
                </Link>
                <nav className="flex items-center space-x-6 text-sm font-medium">
                  <Link
                    href="/admin"
                    className="transition-colors hover:text-foreground/80 text-foreground/60"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/clients"
                    className="transition-colors hover:text-foreground/80 text-foreground/60"
                  >
                    Clients
                  </Link>
                  <Link
                    href="/admin/quotes"
                    className="transition-colors hover:text-foreground/80 text-foreground/60"
                  >
                    Quotes
                  </Link>
                </nav>
              </div>
              <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                <div className="w-full flex-1 md:w-auto md:flex-none">
                  {/* Add search here if needed */}
                </div>
                <UserButton afterSignOutUrl="/admin/sign-in" appearance={{
                    elements: {
                        userButtonAvatarBox: "h-8 w-8"
                    }
                }}/>
              </div>
            </div>
          </header>
          <main className="container max-w-screen-2xl py-6">{children}</main>
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </ClerkProvider>
  )
}
