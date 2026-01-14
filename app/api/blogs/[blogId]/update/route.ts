import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanityClient } from '@/lib/sanity/config'
import { canEditBlog } from '@/lib/utils/permissions'
import { Tables, TablesUpdate } from '@/types/supabase'
import { z } from 'zod'

// Type alias for Blog table
type Blog = Tables<'blogs'>

const updateBlogSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  content: z.array(z.any()).optional(),
  excerpt: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ blogId: string }> }
) {
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

    // Check if user can edit this blog
    const canEdit = await canEditBlog(blogId, user.id)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'You cannot edit this blog (already published or not the author)' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const result = updateBlogSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      )
    }

    const updates = result.data

    // Get blog details
    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      .select('sanity_id, title')
      .eq('id', blogId)
      .single<Pick<Blog, 'sanity_id' | 'title'>>()

    if (blogError || !blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    }

    // Update content in Sanity
    if (updates.content || updates.title || updates.excerpt !== undefined) {
      try {
        const sanityUpdates: any = {}
        if (updates.title) sanityUpdates.title = updates.title
        if (updates.content) sanityUpdates.content = updates.content
        if (updates.excerpt !== undefined) sanityUpdates.excerpt = updates.excerpt

        await sanityClient
          .patch(blog.sanity_id)
          .set(sanityUpdates)
          .commit()
      } catch (sanityError) {
        console.error('Error updating Sanity document:', sanityError)
        return NextResponse.json(
          { error: 'Failed to update blog content' },
          { status: 500 }
        )
      }
    }

    // Update metadata in Supabase
    const supabaseUpdates: TablesUpdate<'blogs'> = {}
    if (updates.title) supabaseUpdates.title = updates.title
    if (updates.excerpt !== undefined) supabaseUpdates.excerpt = updates.excerpt || null

    if (Object.keys(supabaseUpdates).length > 0) {
      const { data: updatedBlog, error: updateError } = await supabase
        .from('blogs')
        // @ts-expect-error - Supabase type inference issue with update
        .update(supabaseUpdates)
        .eq('id', blogId)
        .select()
        .single<Blog>()

      if (updateError) {
        console.error('Error updating blog:', updateError)
        return NextResponse.json(
          { error: 'Failed to update blog' },
          { status: 500 }
        )
      }

      return NextResponse.json({ blog: updatedBlog }, { status: 200 })
    }

    return NextResponse.json({ message: 'Blog updated successfully' }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

