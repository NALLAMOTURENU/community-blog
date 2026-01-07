import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { sanityClientPublic } from '@/lib/sanity/config'
import { isRoomMember } from '@/lib/utils/permissions'
import { ArrowLeft, Calendar, User, Edit } from 'lucide-react'
import { AmbientBackground } from '@/components/ui/ambient-background'

interface BlogPageProps {
  params: Promise<{ roomSlug: string; blogSlug: string }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { roomSlug, blogSlug } = await params
  const supabase = await createClient()

  try {
    const { data: room } = await supabase
      .from('rooms')
      .select('id, name')
      .eq('slug', roomSlug)
      .single()

    const roomId = (room as any)?.id as string
    const roomName = (room as any)?.name as string
    if (!roomId) {
      return { title: 'Blog Not Found' }
    }

    const { data: blog } = await supabase
      .from('blogs_with_authors')
      .select('*')
      .eq('room_id', roomId)
      .eq('slug', blogSlug)
      .eq('published', true)
      .single()

    const blogData = blog as any
    if (!blogData) {
      return { title: 'Blog Not Found' }
    }

    return {
      title: blogData.title,
      description: blogData.excerpt || `Read ${blogData.title} on ${roomName}`,
      authors: [{ name: blogData.author_username }],
      openGraph: {
        title: blogData.title,
        description: blogData.excerpt || '',
        type: 'article',
        publishedTime: blogData.published_at,
        authors: [blogData.author_username],
      },
      twitter: {
        card: 'summary_large_image',
        title: blogData.title,
        description: blogData.excerpt || '',
      },
    }
  } catch (error) {
    return { title: 'Blog Not Found' }
  }
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { roomSlug, blogSlug } = await params
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
  
  // Check if user is a member
  const isMember = await isRoomMember(roomData.id, user.id)
  if (!isMember) {
    redirect('/dashboard')
  }

  // Get blog metadata
  const { data: blog } = await supabase
    .from('blogs_with_authors')
    .select('*')
    .eq('room_id', roomData.id)
    .eq('slug', blogSlug)
    .eq('published', true)
    .single()

  const blogData = blog as any
  if (!blogData) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center relative">
        <AmbientBackground />
        <div className="text-center relative z-10">
          <h1 className="text-2xl font-bold mb-4 text-white">Blog Not Found</h1>
          <Link 
            href={`/${roomSlug}/people`}
            className="inline-block bg-white text-neutral-950 hover:bg-neutral-200 font-semibold px-6 py-3 rounded-lg transition-all active:scale-95"
          >
            Back to Room
          </Link>
        </div>
      </div>
    )
  }

  // Get blog content from Sanity
  let blogContent: any = null
  try {
    blogContent = await sanityClientPublic.getDocument(blogData.sanity_id)
  } catch (error) {
    console.error('Error fetching blog content:', error)
  }

  if (!blogContent) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center relative">
        <AmbientBackground />
        <div className="text-center relative z-10">
          <h1 className="text-2xl font-bold mb-4 text-white">Blog Content Not Available</h1>
          <Link 
            href={`/${roomSlug}/people`}
            className="inline-block bg-white text-neutral-950 hover:bg-neutral-200 font-semibold px-6 py-3 rounded-lg transition-all active:scale-95"
          >
            Back to Room
          </Link>
        </div>
      </div>
    )
  }

  const renderContent = (content: any[]) => {
    return content.map((block, index) => {
      // Handle image blocks
      if (block._type === 'image') {
        return (
          <div key={index} className="my-8">
            <img
              src={block.url}
              alt={block.alt || 'Blog image'}
              className="w-full rounded-xl border border-white/10"
            />
            {block.caption && (
              <p className="text-sm text-neutral-400 text-center mt-2 italic">
                {block.caption}
              </p>
            )}
          </div>
        )
      }

      if (block._type === 'block') {
        const children = block.children || []
        const style = block.style || 'normal'

        const renderChildren = () => {
          return children.map((child: any, childIndex: number) => {
            let text = child.text || ''
            const marks = child.marks || []

            let element = <span key={childIndex}>{text}</span>

            if (marks.includes('strong')) {
              element = <strong key={childIndex} className="font-bold">{text}</strong>
            }
            if (marks.includes('em')) {
              element = <em key={childIndex} className="italic">{text}</em>
            }
            if (marks.includes('code')) {
              element = (
                <code key={childIndex} className="bg-neutral-800 px-2 py-0.5 rounded text-sm text-indigo-300 font-mono">
                  {text}
                </code>
              )
            }

            return element
          })
        }

        switch (style) {
          case 'h1':
            return (
              <h1 key={index} className="text-4xl font-bold mt-8 mb-4 text-white">
                {renderChildren()}
              </h1>
            )
          case 'h2':
            return (
              <h2 key={index} className="text-3xl font-bold mt-6 mb-3 text-white">
                {renderChildren()}
              </h2>
            )
          case 'h3':
            return (
              <h3 key={index} className="text-2xl font-bold mt-5 mb-2 text-white">
                {renderChildren()}
              </h3>
            )
          case 'h4':
            return (
              <h4 key={index} className="text-xl font-bold mt-4 mb-2 text-white">
                {renderChildren()}
              </h4>
            )
          case 'blockquote':
            return (
              <blockquote
                key={index}
                className="border-l-4 border-indigo-500 pl-6 py-2 italic my-6 text-neutral-300"
              >
                {renderChildren()}
              </blockquote>
            )
          default:
            return (
              <p key={index} className="mb-4 leading-relaxed text-neutral-300">
                {renderChildren()}
              </p>
            )
        }
      }
      return null
    })
  }

  return (
    <div className="min-h-screen bg-neutral-950 relative">
      <AmbientBackground />

      <div className="relative z-10">
        {/* Header */}
        <header className="glass border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <Link
              href={`/${roomSlug}/people`}
              className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} strokeWidth={1.5} />
              Back to {roomData.name}
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <article className="glass-card rounded-2xl p-8 md:p-12">
            {/* Blog Header */}
            <header className="mb-8 border-b border-white/5 pb-8">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight flex-1">
                  {blogData.title}
                </h1>
                {user?.id === blogData.author_id && (
                  <Link
                    href={`/${roomSlug}/blog/${blogSlug}/edit`}
                    className="ml-4 px-4 py-2 border border-white/10 bg-neutral-900/50 text-neutral-300 rounded-lg font-medium text-sm hover:bg-neutral-800 hover:text-white hover:border-indigo-500/50 transition-all flex items-center gap-2"
                  >
                    <Edit size={16} strokeWidth={1.5} />
                    Edit
                  </Link>
                )}
              </div>
              {blogData.excerpt && (
                <p className="text-xl text-neutral-400 italic mb-6 leading-relaxed">
                  {blogData.excerpt}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {blogData.author_username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex items-center gap-1">
                    <User size={14} strokeWidth={1.5} />
                    <span className="font-medium text-neutral-300">{blogData.author_username}</span>
                  </div>
                </div>
                <span className="text-neutral-600">•</span>
                <div className="flex items-center gap-1">
                  <Calendar size={14} strokeWidth={1.5} />
                  <time dateTime={blogData.published_at}>
                    {new Date(blogData.published_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                </div>
                {blogData.updated_at && blogData.updated_at !== blogData.published_at && (
                  <>
                    <span className="text-neutral-600">•</span>
                    <div className="flex items-center gap-1 text-indigo-400">
                      <Edit size={14} strokeWidth={1.5} />
                      <span className="text-xs">
                        Updated {new Date(blogData.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </header>

            {/* Blog Content */}
            <div className="prose prose-invert prose-lg max-w-none">
              {renderContent(blogContent.content || [])}
            </div>
          </article>

          {/* Navigation */}
          <div className="mt-8 flex justify-center">
            <Link 
              href={`/${roomSlug}/people`}
              className="px-6 py-3 border border-white/10 text-neutral-300 rounded-lg font-medium hover:bg-white/5 transition-all"
            >
              Back to Room
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
