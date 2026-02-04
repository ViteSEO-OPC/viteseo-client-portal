import { EnterCodeForm } from '@/components/enter-code-form'

export const metadata = {
  title: 'Enter Access Code - Vite SEO',
}

export default function EnterCodePage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-grid-pattern [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none transform -translate-y-1/2" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center space-y-2">
           <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-6">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M8 11h8"/><path d="M8 15h8"/><path d="M11 7h2"/></svg>
           </div>
          <h1 className="text-4xl font-bold text-white tracking-tighter">
            Client Portal
          </h1>
          <p className="text-muted-foreground text-lg">
            Secure access for client quotations
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-8 transition-all duration-500 hover:shadow-primary/5 hover:border-primary/20">
          <EnterCodeForm />
        </div>
        
        <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground/60 font-mono uppercase tracking-widest">
                Protected by End-to-End Encryption
            </p>
        </div>
      </div>
    </main>
  )
}