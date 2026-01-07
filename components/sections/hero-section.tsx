import Link from 'next/link'
import { ArrowRight, Telescope } from 'lucide-react'

interface HeroSectionProps {
  isAuthenticated?: boolean
}

export function HeroSection({ isAuthenticated = false }: HeroSectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center py-20 md:py-32">
      {/* Badge */}
      <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0.1s' }}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-[10px] font-medium tracking-wide uppercase mb-8 hover:bg-indigo-500/20 transition-colors cursor-default">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          AI-Assisted Publishing 2.0
        </div>
      </div>

      {/* Headline */}
      <h1 
        className="animate-fade-in-up opacity-0 text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tighter text-white mb-6 leading-[1.1] max-w-4xl" 
        style={{ animationDelay: '0.2s' }}
      >
        Write better, <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-200 via-neutral-500 to-neutral-400">
          together.
        </span>
      </h1>

      {/* Subhead */}
      <p 
        className="animate-fade-in-up opacity-0 text-base md:text-lg text-neutral-400 max-w-xl leading-relaxed mb-10" 
        style={{ animationDelay: '0.3s' }}
      >
        The community platform for modern creators. Generate ideas with AI, collaborate in real-time rooms, and publish instantly to the world.
      </p>

      {/* CTA Group - Conditional based on auth state */}
      <div 
        className="animate-fade-in-up opacity-0 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto" 
        style={{ animationDelay: '0.4s' }}
      >
        {isAuthenticated ? (
          // Authenticated - show Go to Dashboard
          <Link 
            href="/dashboard"
            className="w-full sm:w-auto group relative px-8 py-3 rounded-full bg-white text-neutral-950 font-semibold text-sm transition-all hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] active:scale-95 flex items-center justify-center gap-2"
          >
            Go to Dashboard
            <ArrowRight className="group-hover:translate-x-0.5 transition-transform" size={16} strokeWidth={1.5} />
          </Link>
        ) : (
          // Not authenticated - show Start Writing + Explore
          <>
            <Link 
              href="/auth/signup"
              className="w-full sm:w-auto group relative px-8 py-3 rounded-full bg-white text-neutral-950 font-semibold text-sm transition-all hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] active:scale-95 flex items-center justify-center gap-2"
            >
              Start Writing
              <ArrowRight className="group-hover:translate-x-0.5 transition-transform" size={16} strokeWidth={1.5} />
            </Link>
            <Link 
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3 rounded-full border border-neutral-800 bg-neutral-900/50 text-neutral-300 font-medium text-sm hover:bg-neutral-800 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Telescope size={16} strokeWidth={1.5} />
              Explore Rooms
            </Link>
          </>
        )}
      </div>

      {/* Social Proof */}
      <div 
        className="animate-fade-in-up opacity-0 mt-20 pt-10 border-t border-white/5 w-full max-w-2xl flex justify-between items-center opacity-50 grayscale hover:grayscale-0 transition-all duration-500" 
        style={{ animationDelay: '0.6s' }}
      >
        <div className="flex items-center gap-8 mx-auto">
          <span className="text-sm font-semibold tracking-widest text-neutral-600">ACME</span>
          <span className="text-sm font-semibold tracking-widest text-neutral-600">VERCEL</span>
          <span className="text-sm font-semibold tracking-widest text-neutral-600">STRIPE</span>
          <span className="text-sm font-semibold tracking-widest text-neutral-600">LINEAR</span>
        </div>
      </div>
    </section>
  )
}

