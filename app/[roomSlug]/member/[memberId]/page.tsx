import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isRoomMember } from '@/lib/utils/permissions'
import { BookOpenText, User, Calendar, ArrowLeft, FileText } from 'lucide-react'
import { AmbientBackground } from '@/components/ui/ambient-background'
import { Tables } from '@/types/supabase'

interface MemberBlogsPageProps {
  params: Promise<{
    roomSlug: string
    memberId: string
  }>
}

export default async function MemberBlogsPage({ params }: MemberBlogsPageProps) {
  const { roomSlug, memberId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get room
  const { data: room } = await supabase
    .from('rooms')
    .select('id, name, slug')
    .eq('slug', roomSlug)
    .single<Pick<Tables<'rooms'>, 'id' | 'name' | 'slug'>>()

  if (!room) {
    redirect('/dashboard')
  }

  // Check if current user is a member
  const isMember = await isRoomMember(room.id, user.id)
  if (!isMember) {
    redirect('/dashboard')
  }

  // Get member profile
  const { data: memberProfile } = await supabase
    .from('profiles')
    .select('id, username, email, avatar_url, created_at')
    .eq('id', memberId)
    .single<Pick<Tables<'profiles'>, 'id' | 'username' | 'email' | 'avatar_url' | 'created_at'>>()

  if (!memberProfile) {
    redirect(`/${roomSlug}/people`)
  }

  // Check if this member is part of the room
  const { data: memberInRoom } = await supabase
    .from('room_members')
    .select('joined_at, role')
    .eq('room_id', room.id)
    .eq('user_id', memberId)
    .single<Pick<Tables<'room_members'>, 'joined_at' | 'role'>>()

  if (!memberInRoom) {
    redirect(`/${roomSlug}/people`)
  }

  // Get member's published blogs in this room
  const { data: blogs, error } = await supabase
    .from('blogs_with_authors')
    .select('*')
    .eq('room_id', room.id)
    .eq('author_id', memberId)
    .eq('published', true)
    .order('published_at', { ascending: false })
    .returns<Tables<'blogs_with_authors'>[]>()

  if (error) {
    console.error('Error fetching member blogs:', error)
  }

  return (
    <div className="min-h-screen bg-neutral-950 relative">
      <AmbientBackground />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        {/* Back Button */}
        <Link
          href={`/${roomSlug}/people`}
          className="inline-flex items-center gap-2 px-4 py-2 border border-white/10 text-neutral-300 rounded-lg font-medium text-sm hover:bg-white/5 transition-all"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          Back to People
        </Link>

        {/* Member Profile Card */}
        <div className="glass-card rounded-xl p-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
              {memberProfile.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-semibold text-white mb-2">
                {memberProfile.username}
              </h1>
              <p className="text-neutral-400 mb-4">{memberProfile.email}</p>
              <div className="flex items-center gap-6 text-sm">
                {memberInRoom.role === 'admin' && (
                  <span className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full font-bold tracking-wide uppercase">
                    Admin
                  </span>
                )}
                <div className="flex items-center gap-2 text-neutral-500">
                  <Calendar size={14} strokeWidth={1.5} />
                  <span>
                    Joined {new Date(memberInRoom.joined_at || '').toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-neutral-500">
                  <FileText size={14} strokeWidth={1.5} />
                  <span>{blogs?.length || 0} {blogs?.length === 1 ? 'Blog' : 'Blogs'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Blogs Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <BookOpenText className="text-indigo-400" size={24} strokeWidth={1.5} />
            <h2 className="text-2xl font-semibold text-white">
              Blogs by {memberProfile.username}
            </h2>
          </div>

          {blogs && blogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <Link
                  key={blog.id}
                  href={`/${roomSlug}/blog/${blog.slug}`}
                  className="glass-card rounded-xl p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200 ease-out"
                >
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2 leading-tight">
                      {blog.title}
                    </h3>
                    {blog.excerpt && (
                      <p className="text-sm text-neutral-400 mb-4 line-clamp-3">
                        {blog.excerpt}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Calendar size={12} strokeWidth={1.5} />
                      <span>
                        {new Date(blog.published_at || '').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-xl p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpenText className="text-neutral-600" size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Blogs Yet</h3>
              <p className="text-neutral-400">
                {memberProfile.username} hasn't published any blogs in this room yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

