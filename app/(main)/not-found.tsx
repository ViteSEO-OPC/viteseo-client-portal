import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-grid-pattern [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 text-center space-y-6 max-w-md">
        <h1 className="text-8xl font-bold font-heading text-white/5 tracking-tighter select-none">404</h1>
        <div className="space-y-2">
            <h2 className="text-2xl font-bold font-heading text-white">Page not found</h2>
            <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
        </div>
        <Link href="/enter-code">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
            Return to Portal
          </Button>
        </Link>
      </div>
    </main>
  )
}