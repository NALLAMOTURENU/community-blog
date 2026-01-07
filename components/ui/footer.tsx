import Link from 'next/link'
import { Layers } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-white/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center">
        {/* CTA Section */}
        <h2 className="text-3xl font-semibold text-white tracking-tight mb-4">
          Ready to join the conversation?
        </h2>
        <p className="text-neutral-400 mb-8">
          Create your free account today and start your first room.
        </p>
        
        <Link 
          href="/auth/signup"
          className="bg-white text-black hover:bg-neutral-200 text-sm font-semibold px-8 py-3 rounded-full transition-all active:scale-95 mb-20 inline-block"
        >
          Get Started for Free
        </Link>

        {/* Footer Bottom */}
        <div className="w-full border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-neutral-800 flex items-center justify-center">
              <Layers className="text-white" size={14} strokeWidth={1.5} />
            </div>
            <span className="text-xs text-neutral-500 font-mono">
              © 2024 LUMOS INC.
            </span>
          </div>
          <div className="flex gap-6">
            <Link href="#" className="text-xs text-neutral-500 hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="#" className="text-xs text-neutral-500 hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="#" className="text-xs text-neutral-500 hover:text-white transition-colors">
              Twitter
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

