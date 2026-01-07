'use client'

import Link from 'next/link'
import { Layers, Search } from 'lucide-react'

interface NavbarProps {
  isAuthenticated?: boolean
}

export function Navbar({ isAuthenticated = false }: NavbarProps) {
  return (
    <nav className="fixed top-0 w-full z-50 glass h-16 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 flex items-center justify-center group-hover:border-indigo-500/50 transition-colors">
            <Layers className="text-white" size={18} strokeWidth={1.5} />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white group-hover:text-indigo-400 transition-colors">
            LUMOS
          </span>
        </Link>

        {/* Nav Links - Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/dashboard" className="text-xs font-medium text-neutral-400 hover:text-white transition-colors">
            Rooms
          </Link>
          <Link href="/dashboard" className="text-xs font-medium text-neutral-400 hover:text-white transition-colors">
            Writers
          </Link>
          <Link href="/dashboard" className="text-xs font-medium text-neutral-400 hover:text-white transition-colors">
            AI Studio
          </Link>
        </div>

        {/* Right Actions - Conditional based on auth state */}
        <div className="flex items-center gap-4">
          <button className="text-neutral-400 hover:text-white transition-colors">
            <Search size={18} strokeWidth={1.5} />
          </button>
          <div className="h-4 w-[1px] bg-neutral-800"></div>
          
          {isAuthenticated ? (
            // Authenticated user - show dashboard button
            <Link 
              href="/dashboard" 
              className="bg-white text-black hover:bg-neutral-200 text-xs font-semibold px-4 py-2 rounded-full transition-all active:scale-95 shadow-lg shadow-white/5"
            >
              Go to Dashboard
            </Link>
          ) : (
            // Not authenticated - show sign in & get started
            <>
              <Link 
                href="/auth/signin" 
                className="text-xs font-medium text-neutral-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/signup" 
                className="bg-white text-black hover:bg-neutral-200 text-xs font-semibold px-4 py-2 rounded-full transition-all active:scale-95 shadow-lg shadow-white/5"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

