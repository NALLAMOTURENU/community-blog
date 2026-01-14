import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanityClient } from '@/lib/sanity/config'
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug'
import { canWriteInRoom } from '@/lib/utils/permissions'
import { Tables } from '@/types/supabase'
import { z } from 'zod'
import { nanoid } from 'nanoid'

// Type aliases for database tables
type Room = Tables<'rooms'>
type Blog = Tables<'blogs'>

const createBlogSchema = z.object({
  roomId: z.string().uuid(),
  title: z.string().min(3).max(200),
  content: z.array(z.any()),
  excerpt: z.string().optional(),
  tone: z.enum(['professional', 'casual', 'technical', 'creative', 'academic']),
  language: z.enum(['en', 'es', 'fr', 'de', 'hi', 'zh']),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const result = createBlogSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      )
    }

    const { roomId, title, content, excerpt, tone, language } = result.data

    // Check if user can write in this room
    const canWrite = await canWriteInRoom(roomId, user.id)
    if (!canWrite) {
      return NextResponse.json(
        { error: 'You do not have permission to write in this room' },
        { status: 403 }
      )
    }

    // Get room details
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('slug')
      .eq('id', roomId)
      .single<Pick<Room, 'slug'>>()

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Generate unique slug
    const baseSlug = generateSlug(title)
    const { data: existingBlogs } = await supabase
      .from('blogs')
      .select('slug')
      .eq('room_id', roomId)
      .returns<Pick<Blog, 'slug'>[]>()

    const existingSlugs = existingBlogs?.map((b) => b.slug) || []
    const slug = generateUniqueSlug(title, existingSlugs)

    // Create document in Sanity first (draft)
    const sanityId = `draft-${nanoid()}`
    
    try {
      await sanityClient.create({
        _type: 'blogPost',
        _id: sanityId,
        title,
        slug: { current: slug, _type: 'slug' },
        roomSlug: room.slug,
        authorId: user.id,
        content,
        excerpt: excerpt || '',
        tone,
        language,
      })
    } catch (sanityError) {
      console.error('Error creating Sanity document:', sanityError)
      return NextResponse.json(
        { error: 'Failed to create blog content' },
        { status: 500 }
      )
    }

    // Create blog metadata in Supabase
    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      // @ts-expect-error - Supabase type inference issue with insert in strict mode
      .insert({
        room_id: roomId,
        author_id: user.id,
        title,
        slug,
        sanity_id: sanityId,
        excerpt: excerpt || null,
        published: false,
      })
      .select()
      .single<Blog>()

    if (blogError) {
      // Rollback: Delete Sanity document
      await sanityClient.delete(sanityId)
      console.error('Error creating blog:', blogError)
      return NextResponse.json(
        { error: 'Failed to create blog' },
        { status: 500 }
      )
    }

    return NextResponse.json({ blog }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


