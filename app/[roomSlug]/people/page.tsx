import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatJoinCode } from '@/lib/utils/join-code'
import { Users, Key, Calendar } from 'lucide-react'

interface PeoplePageProps {
  params: Promise<{ roomSlug: string }>
}

export default async function PeoplePage({ params }: PeoplePageProps) {
  const { roomSlug } = await params
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
    .select('id, name, slug, join_code, description')
    .eq('slug', roomSlug)
    .single()

  if (!room) {
    redirect('/dashboard')
  }

  const roomData = room as any

  // Get members
  const { data: members } = await supabase
    .from('room_members_with_profiles')
    .select('*')
    .eq('room_id', roomData.id)
    .order('joined_at', { ascending: true })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Room Information */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Key className="text-indigo-400" size={20} strokeWidth={1.5} />
          Room Information
        </h2>
        <div className="space-y-4">
          {roomData.description && (
            <div>
              <p className="text-sm font-medium text-neutral-400 mb-1">Description</p>
              <p className="text-neutral-200">{roomData.description}</p>
            </div>
          )}
          <div className="pt-4 border-t border-white/5">
            <p className="text-sm font-medium text-neutral-400 mb-2">Join Code</p>
            <p className="text-3xl font-mono font-bold text-indigo-400 mb-2">
              {formatJoinCode(roomData.join_code)}
            </p>
            <p className="text-xs text-neutral-500">
              Share this code with others to invite them to this room
            </p>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Users className="text-purple-400" size={20} strokeWidth={1.5} />
          Members <span className="text-neutral-500 text-base">({members?.length || 0})</span>
        </h2>
        
        {!members || members.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Users className="text-neutral-500" size={28} strokeWidth={1.5} />
            </div>
            <p className="text-neutral-400">No members found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member: any) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-neutral-900/50 border border-white/5 rounded-lg hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-white">{member.username}</p>
                    <p className="text-sm text-neutral-400">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {member.role === 'admin' && (
                    <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-1 rounded-full font-bold tracking-wide uppercase">
                      Admin
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <Calendar size={12} strokeWidth={1.5} />
                    {new Date(member.joined_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blogs Section Preview */}
      <div className="glass-card rounded-xl p-6 text-center">
        <p className="text-neutral-400 text-sm mb-3">
          Want to see what this room has created?
        </p>
        <p className="text-xs text-neutral-500">
          Blog browsing feature coming soon! For now, use the Write Blog tab to create content.
        </p>
      </div>
    </div>
  )
}
