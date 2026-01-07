import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanityClient } from '@/lib/sanity/config'
import { z } from 'zod'

const editBlogSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.array(z.any()),
  excerpt: z.string().optional(),
})

interface RouteParams {
  params: Promise<{
    blogId: string
  }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { blogId } = await params
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
    const result = editBlogSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      )
    }

    const { title, content, excerpt } = result.data

    // Get blog details and verify ownership
    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      .select('author_id, sanity_id, room_id')
      .eq('id', blogId)
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

    // Verify user is still a room member
    const { data: membership } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', blog.room_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a room member to edit this blog' },
        { status: 403 }
      )
    }

    // Update content in Sanity
    try {
      await sanityClient
        .patch(blog.sanity_id)
        .set({
          title,
          content,
          excerpt: excerpt || '',
        })
        .commit()
    } catch (sanityError) {
      console.error('Error updating Sanity document:', sanityError)
      return NextResponse.json(
        { error: 'Failed to update blog content' },
        { status: 500 }
      )
    }

    // Update metadata in Supabase (title, excerpt, updated_at)
    const { data: updatedBlog, error: updateError } = await supabase
      .from('blogs')
      .update({
        title,
        excerpt: excerpt || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', blogId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating blog metadata:', updateError)
      return NextResponse.json(
        { error: 'Failed to update blog metadata' },
        { status: 500 }
      )
    }

    return NextResponse.json({ blog: updatedBlog }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

