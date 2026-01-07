'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LogIn, Layers } from 'lucide-react'
import { AmbientBackground } from '@/components/ui/ambient-background'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Client-side auth check: redirect authenticated users to dashboard
  // This prevents authenticated users from seeing the sign-in form
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // User is already authenticated - redirect to dashboard
        router.replace('/dashboard')
      }
    }
    
    checkAuth()
  }, [router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4 relative">
      <AmbientBackground />
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 flex items-center justify-center group-hover:border-indigo-500/50 transition-colors">
            <Layers className="text-white" size={20} strokeWidth={1.5} />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white group-hover:text-indigo-400 transition-colors">
            LUMOS
          </span>
        </Link>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-white mb-2">Welcome back</h1>
            <p className="text-neutral-400 text-sm">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-6">
            {error && (
              <div className="p-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-neutral-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-neutral-900 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-neutral-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-neutral-900 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-neutral-950 hover:bg-neutral-200 font-semibold px-6 py-3 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <LogIn size={18} strokeWidth={1.5} />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-sm text-center text-neutral-400">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                Sign up
              </Link>
            </p>
          </form>
        </div>

        {/* Back to home link */}
        <Link 
          href="/"
          className="block text-center mt-6 text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  )
}


