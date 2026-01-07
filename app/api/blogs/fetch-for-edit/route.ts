import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanityClientPublic } from '@/lib/sanity/config'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const roomSlug = searchParams.get('roomSlug')
    const blogSlug = searchParams.get('blogSlug')

    if (!roomSlug || !blogSlug) {
      return NextResponse.json({ error: 'Room slug and blog slug are required' }, { status: 400 })
    }

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get room
    const { data: room } = await supabase
      .from('rooms')
      .select('id')
      .eq('slug', roomSlug)
      .single()

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Get blog metadata
    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      .select('*')
      .eq('room_id', room.id)
      .eq('slug', blogSlug)
      .single()

    if (blogError || !blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    }

    // Verify user is the author
    if (blog.author_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own blogs' },
        { status: 403 }
      )
    }

    // Get blog content from Sanity
    const content = await sanityClientPublic.getDocument(blog.sanity_id)

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    return NextResponse.json({ blog, content }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

