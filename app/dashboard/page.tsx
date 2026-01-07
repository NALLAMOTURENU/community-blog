import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatJoinCode } from '@/lib/utils/join-code'
import { Plus, LogIn as LoginIcon, LogOut, Home, MessageSquare } from 'lucide-react'
import { AmbientBackground } from '@/components/ui/ambient-background'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  // Get user's rooms
  const { data: memberships } = await supabase
    .from('room_members')
    .select(`
      room_id,
      role,
      joined_at,
      rooms (
        id,
        name,
        slug,
        join_code,
        description,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  const rooms = memberships?.map(m => ({
    ...m.rooms,
    role: m.role,
  })) || []

  return (
    <div className="min-h-screen bg-neutral-950 relative">
      <AmbientBackground />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="glass border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-white tracking-tight">Dashboard</h1>
                <p className="text-sm text-neutral-400 mt-1">
                  Welcome back, <span className="text-indigo-400 font-medium">{profile?.username}</span>!
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link 
                  href="/"
                  className="text-neutral-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                  title="Home"
                >
                  <Home size={20} strokeWidth={1.5} />
                </Link>
                <form action="/api/auth/signout" method="post">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg border border-white/10 bg-neutral-900/50 text-neutral-300 hover:bg-neutral-800 hover:text-white transition-all text-sm font-medium flex items-center gap-2"
                  >
                    <LogOut size={16} strokeWidth={1.5} />
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Link
              href="/create-room"
              className="group flex-1 glass-card rounded-xl p-6 hover:border-indigo-500/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                  <Plus className="text-indigo-400" size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Create New Room</h3>
                  <p className="text-sm text-neutral-400">Start a new community space</p>
                </div>
              </div>
            </Link>

            <Link
              href="/join-room"
              className="group flex-1 glass-card rounded-xl p-6 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                  <LoginIcon className="text-purple-400" size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Join Room</h3>
                  <p className="text-sm text-neutral-400">Enter a 4-digit join code</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Rooms Section */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">Your Rooms</h2>
            
            {rooms.length === 0 ? (
              <div className="glass-card rounded-xl p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="text-neutral-500" size={28} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-white font-semibold mb-2">No rooms yet</h3>
                  <p className="text-neutral-400 text-sm mb-6">
                    You haven&apos;t joined any rooms yet. Create a new room or join an existing one to get started!
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link
                      href="/create-room"
                      className="px-6 py-2 bg-white text-neutral-950 rounded-lg font-medium text-sm hover:bg-neutral-200 transition-all"
                    >
                      Create Room
                    </Link>
                    <Link
                      href="/join-room"
                      className="px-6 py-2 border border-white/10 text-neutral-300 rounded-lg font-medium text-sm hover:bg-white/5 transition-all"
                    >
                      Join Room
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room: any) => (
                  <Link key={room.id} href={`/${room.slug}/people`}>
                    <div className="glass-card rounded-xl p-6 hover:border-neutral-700 transition-all group cursor-pointer h-full">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">
                          {room.name}
                        </h3>
                        {room.role === 'admin' && (
                          <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-1 rounded-full font-bold tracking-wide uppercase">
                            Admin
                          </span>
                        )}
                      </div>
                      
                      {room.description && (
                        <p className="text-neutral-400 text-sm mb-4 line-clamp-2">
                          {room.description}
                        </p>
                      )}
                      
                      <div className="pt-4 border-t border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-neutral-500">Join Code</span>
                          <span className="font-mono font-semibold text-neutral-300">
                            {formatJoinCode(room.join_code)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-500">Created</span>
                          <span className="text-neutral-400">
                            {new Date(room.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
