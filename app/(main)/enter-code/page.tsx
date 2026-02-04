import { EnterCodeForm } from '@/components/enter-code-form'

export const metadata = {
  title: 'Enter Access Code - Vite SEO',
}

export default function EnterCodePage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background selection:bg-primary/20 selection:text-primary">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="mb-10 text-center space-y-4">
           <div className="inline-flex items-center justify-center mb-6 relative group">
             <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-all duration-500" />
             <div className="relative w-16 h-16 rounded-2xl bg-black border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-sm">
                <span className="text-3xl font-bold font-heading text-primary">V</span>
             </div>
           </div>
          
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-heading text-white tracking-tight">
              Vite SEO
            </h1>
            <p className="text-xs font-bold text-primary/90 uppercase tracking-[0.2em]">
              Digital Advertising OPC
            </p>
          </div>

          <p className="text-muted-foreground text-sm pt-2">
            Secure Client Quotation Portal
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-1 bg-gradient-to-b from-white/10 to-transparent border border-white/10">
            <div className="bg-black/40 backdrop-blur-xl rounded-[20px] p-8 border border-white/5 shadow-2xl">
                <EnterCodeForm />
            </div>
        </div>
        
        <div className="mt-12 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground/40 font-mono uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                Protected by End-to-End Encryption
            </div>
        </div>
      </div>
    </main>
  )
}
