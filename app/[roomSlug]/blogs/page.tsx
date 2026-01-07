import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, User, Calendar, ArrowRight } from 'lucide-react'

interface BlogsPageProps {
  params: Promise<{ roomSlug: string }>
}

export default async function BlogsPage({ params }: BlogsPageProps) {
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
    .select('id, name, slug')
    .eq('slug', roomSlug)
    .single()

  if (!room) {
    redirect('/dashboard')
  }

  const roomData = room as any

  // Get all published blogs for this room with author info
  const { data: blogs } = await supabase
    .from('blogs_with_authors')
    .select('*')
    .eq('room_id', roomData.id)
    .eq('published', true)
    .order('published_at', { ascending: false })

  const blogsList = (blogs || []) as any[]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <BookOpen className="text-indigo-400" size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Blog Posts</h1>
            <p className="text-neutral-400 text-sm">
              {blogsList.length} {blogsList.length === 1 ? 'post' : 'posts'} published in {roomData.name}
            </p>
          </div>
        </div>
      </div>

      {/* Blogs List */}
      {blogsList.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-neutral-800 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="text-neutral-500" size={32} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No blogs yet</h3>
          <p className="text-neutral-400 mb-6">
            Be the first to write a blog post in this room!
          </p>
          <Link
            href={`/${roomSlug}/write`}
            className="inline-block bg-white text-neutral-950 hover:bg-neutral-200 font-semibold px-6 py-3 rounded-lg transition-all active:scale-95"
          >
            Write Your First Blog
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogsList.map((blog) => (
            <Link
              key={blog.id}
              href={`/${roomSlug}/blog/${blog.slug}`}
              className="glass-card rounded-xl p-6 hover:scale-[1.02] transition-all group"
            >
              {/* Blog Card */}
              <article className="h-full flex flex-col">
                {/* Title */}
                <h2 className="text-xl font-semibold text-white mb-3 line-clamp-2 group-hover:text-indigo-400 transition-colors">
                  {blog.title}
                </h2>

                {/* Excerpt */}
                {blog.excerpt && (
                  <p className="text-neutral-400 text-sm mb-4 line-clamp-3 flex-grow">
                    {blog.excerpt}
                  </p>
                )}

                {/* Metadata */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  {/* Author */}
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                      {blog.author_username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-400">
                      <User size={12} strokeWidth={1.5} />
                      <span className="text-neutral-300 font-medium">
                        {blog.author_username}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1.5 text-sm text-neutral-400">
                    <Calendar size={12} strokeWidth={1.5} />
                    <time dateTime={blog.published_at}>
                      {new Date(blog.published_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </time>
                  </div>

                  {/* Read More */}
                  <div className="flex items-center gap-2 text-indigo-400 font-medium text-sm pt-2">
                    Read more
                    <ArrowRight 
                      size={14} 
                      strokeWidth={2} 
                      className="group-hover:translate-x-1 transition-transform" 
                    />
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

