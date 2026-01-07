'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, LogIn, Info } from 'lucide-react'
import { normalizeJoinCode, formatJoinCode } from '@/lib/utils/join-code'
import { AmbientBackground } from '@/components/ui/ambient-background'

export default function JoinRoomPage() {
  const router = useRouter()
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const normalizedCode = normalizeJoinCode(joinCode)

    if (normalizedCode.length !== 4) {
      setError('Please enter a valid 4-digit join code')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ joinCode: normalizedCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          // Already a member - redirect anyway
          router.push(`/${data.room.slug}/people`)
          return
        }
        setError(data.error || 'Failed to join room')
        return
      }

      // Successfully joined - redirect to the room
      router.push(`/${data.room.slug}/people`)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const normalized = normalizeJoinCode(e.target.value)
    setJoinCode(normalized)
  }

  return (
    <div className="min-h-screen bg-neutral-950 relative">
      <AmbientBackground />

      <div className="relative z-10">
        {/* Header */}
        <header className="glass border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} strokeWidth={1.5} />
              Back to Dashboard
            </Link>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 sm:px-6 py-12">
          <div className="glass-card rounded-2xl p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="w-14 h-14 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                <LogIn className="text-purple-400" size={28} strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2">Join a Room</h1>
              <p className="text-neutral-400 text-sm">
                Enter the 4-digit join code shared by the room creator
              </p>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-6">
              {error && (
                <div className="p-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <label htmlFor="joinCode" className="text-sm font-medium text-neutral-300 block text-center">
                  Join Code
                </label>
                <input
                  id="joinCode"
                  type="text"
                  placeholder="1234"
                  value={joinCode}
                  onChange={handleCodeChange}
                  required
                  disabled={loading}
                  maxLength={4}
                  pattern="[0-9]{4}"
                  className="w-full px-6 py-4 bg-neutral-900 border border-white/10 rounded-lg text-white text-center text-3xl font-mono tracking-[0.5em] focus:outline-none focus:border-purple-500/50 transition-colors disabled:opacity-50"
                />
                {joinCode && joinCode.length === 4 && (
                  <p className="text-sm text-neutral-400 text-center font-mono">
                    Code: {formatJoinCode(joinCode)}
                  </p>
                )}
              </div>

              <div className="bg-purple-500/5 border border-purple-500/20 p-4 rounded-lg">
                <div className="flex gap-3">
                  <Info className="text-purple-400 flex-shrink-0" size={18} strokeWidth={1.5} />
                  <p className="text-sm text-purple-300">
                    <strong className="font-semibold">Tip:</strong> Join codes are shared by room creators or admins.
                    You can find them in the room settings.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading || joinCode.length !== 4}
                  className="flex-1 bg-white text-neutral-950 hover:bg-neutral-200 font-semibold px-6 py-3 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Joining...' : 'Join Room'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  disabled={loading}
                  className="px-6 py-3 border border-white/10 text-neutral-300 rounded-lg font-medium hover:bg-white/5 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
