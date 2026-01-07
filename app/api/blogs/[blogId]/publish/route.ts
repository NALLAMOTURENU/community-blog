import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanityClient } from '@/lib/sanity/config'
import { canEditBlog, isBlogAuthor } from '@/lib/utils/permissions'
import { nanoid } from 'nanoid'

export async function POST(
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

    // Get blog details
    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', blogId)
      .single()

    if (blogError || !blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    }

    const blogData = blog as any

    // Check if user is the author
    const isAuthor = await isBlogAuthor(blogId, user.id)
    if (!isAuthor) {
      return NextResponse.json(
        { error: 'Only the author can publish this blog' },
        { status: 403 }
      )
    }

    // Check if already published
    if (blogData.published) {
      return NextResponse.json(
        { error: 'Blog is already published' },
        { status: 400 }
      )
    }

    // Get the draft content from Sanity
    const draftDoc = await sanityClient.getDocument(blogData.sanity_id)
    
    if (!draftDoc) {
      return NextResponse.json(
        { error: 'Blog content not found' },
        { status: 404 }
      )
    }

    // Create a new published document in Sanity (remove draft prefix)
    const publishedId = blogData.sanity_id.replace('draft-', 'published-')
    
    try {
      // Create published version
      await sanityClient.create({
        ...draftDoc,
        _id: publishedId,
        publishedAt: new Date().toISOString(),
      })

      // Delete draft version
      await sanityClient.delete(blogData.sanity_id)
    } catch (sanityError) {
      console.error('Error publishing in Sanity:', sanityError)
      return NextResponse.json(
        { error: 'Failed to publish blog content' },
        { status: 500 }
      )
    }

    // Update blog in Supabase
    const updateData: any = {
      published: true,
      published_at: new Date().toISOString(),
      sanity_id: publishedId,
    }
    const { data: updatedBlog, error: updateError } = await (supabase as any)
      .from('blogs')
      .update(updateData)
      .eq('id', blogId)
      .select()
      .single()

    if (updateError) {
      // Rollback: Restore draft in Sanity
      await sanityClient.create({ ...draftDoc, _id: blogData.sanity_id })
      await sanityClient.delete(publishedId)
      
      console.error('Error updating blog:', updateError)
      return NextResponse.json(
        { error: 'Failed to publish blog' },
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

