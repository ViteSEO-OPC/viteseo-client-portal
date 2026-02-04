import Link from 'next/link'
import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from '@clerk/nextjs'
import { LayoutDashboard, Users, FileText, Key, History, Activity } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SignedIn>
        <div className="min-h-screen bg-background">
          <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto max-w-7xl flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
              {/* Logo Area - Fixed */}
              <div className="flex flex-none items-center gap-2">
                 <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="font-bold text-primary">V</span>
                 </div>
                 <span className="hidden font-bold md:inline-block text-lg tracking-tight whitespace-nowrap">Vite SEO <span className="text-muted-foreground font-normal">Admin</span></span>
              </div>
              
              {/* Navigation - Fluid & Scrollable */}
              <nav className="flex flex-1 items-center justify-start md:justify-center gap-1 overflow-x-auto no-scrollbar mask-gradient px-2">
                <Link
                  href="/admin"
                  className="flex flex-none items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full text-muted-foreground hover:text-white hover:bg-white/5 transition-all whitespace-nowrap"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <Link
                  href="/admin/clients"
                  className="flex flex-none items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full text-muted-foreground hover:text-white hover:bg-white/5 transition-all whitespace-nowrap"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Clients</span>
                </Link>
                <Link
                  href="/admin/quotes"
                  className="flex flex-none items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full text-muted-foreground hover:text-white hover:bg-white/5 transition-all whitespace-nowrap"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Quotes</span>
                </Link>
                <Link
                  href="/admin/access-codes"
                  className="flex flex-none items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full text-muted-foreground hover:text-white hover:bg-white/5 transition-all whitespace-nowrap"
                >
                  <Key className="w-4 h-4" />
                  <span className="hidden sm:inline">Access Codes</span>
                </Link>
                <Link
                  href="/admin/sessions"
                  className="flex flex-none items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full text-muted-foreground hover:text-white hover:bg-white/5 transition-all whitespace-nowrap"
                >
                  <Activity className="w-4 h-4" />
                  <span className="hidden sm:inline">Sessions</span>
                </Link>
                <Link
                  href="/admin/audit-logs"
                  className="flex flex-none items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full text-muted-foreground hover:text-white hover:bg-white/5 transition-all whitespace-nowrap"
                >
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">Audit Logs</span>
                </Link>
              </nav>

              {/* User Area - Fixed */}
              <div className="flex flex-none items-center justify-end">
                <UserButton 
                    appearance={{
                        elements: {
                            userButtonAvatarBox: "h-9 w-9 ring-2 ring-white/10 hover:ring-white/20 transition-all",
                            userButtonPopoverCard: "bg-zinc-900 border border-white/10 shadow-2xl"
                        }
                    }}
                />
              </div>
            </div>
          </header>
          
          <main className="container mx-auto max-w-7xl py-10 px-4 sm:px-6 lg:px-8 relative">
             <div className="absolute inset-0 bg-grid-pattern [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none -z-10 opacity-20" />
             {children}
          </main>
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
