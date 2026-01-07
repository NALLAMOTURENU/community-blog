import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isRoomMember } from '@/lib/utils/permissions'
import { Home, Users, BookOpen, PenTool, LogOut } from 'lucide-react'
import { AmbientBackground } from '@/components/ui/ambient-background'

interface RoomLayoutProps {
  children: React.ReactNode
  params: Promise<{ roomSlug: string }>
}

export default async function RoomLayout({ children, params }: RoomLayoutProps) {
  const { roomSlug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get room details
  const { data: room, error } = await supabase
    .from('rooms')
    .select('id, name, slug, join_code')
    .eq('slug', roomSlug)
    .single()

  if (error || !room) {
    redirect('/dashboard')
  }

  const roomData = room as any

  // Check if user is a member
  const isMember = await isRoomMember(roomData.id, user.id)
  if (!isMember) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-neutral-950 relative">
      <AmbientBackground />

      <div className="relative z-10">
        {/* Header */}
        <header className="glass border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  title="Dashboard"
                >
                  <Home size={20} strokeWidth={1.5} />
                </Link>
                <div className="h-6 w-[1px] bg-white/10"></div>
                <div>
                  <h1 className="text-lg font-semibold text-white">{roomData.name}</h1>
                </div>
              </div>
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

            {/* Navigation */}
            <nav className="flex gap-8 -mb-px">
              <Link
                href={`/${roomSlug}/people`}
                className="group pb-4 border-b-2 border-transparent hover:border-indigo-500/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-400 group-hover:text-white transition-colors">
                  <Users size={16} strokeWidth={1.5} />
                  People
                </div>
              </Link>
              <Link
                href={`/${roomSlug}/blogs`}
                className="group pb-4 border-b-2 border-transparent hover:border-indigo-500/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-400 group-hover:text-white transition-colors">
                  <BookOpen size={16} strokeWidth={1.5} />
                  Blogs
                </div>
              </Link>
              <Link
                href={`/${roomSlug}/write`}
                className="group pb-4 border-b-2 border-transparent hover:border-indigo-500/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-400 group-hover:text-white transition-colors">
                  <PenTool size={16} strokeWidth={1.5} />
                  Write Blog
                </div>
              </Link>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
