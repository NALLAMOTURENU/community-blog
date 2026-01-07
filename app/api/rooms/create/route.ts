import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils/slug'
import { z } from 'zod'

const createRoomSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
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
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', { userId: user.id, email: user.email })

    // Parse and validate request body
    const body = await request.json()
    const result = createRoomSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      )
    }

    const { name, description } = result.data

    // Generate slug
    const baseSlug = generateSlug(name)

    // Check for existing slugs
    const { data: existingRooms } = await supabase
      .from('rooms')
      .select('slug')
      .like('slug', `${baseSlug}%`)

    const existingSlugs = existingRooms?.map((r) => r.slug) || []

    // Ensure unique slug
    let slug = baseSlug
    let counter = 1
    while (existingSlugs.includes(slug)) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Generate join code - try database function first, fallback to JS
    let joinCode: string | null = null
    
    // Try RPC function first (works if migration not run yet)
    const { data: rpcCode } = await supabase.rpc('generate_unique_join_code')
    
    if (rpcCode) {
      joinCode = rpcCode
    } else {
      // Fallback: Generate in JavaScript (retry logic for uniqueness)
      const maxAttempts = 10
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const code = Math.floor(1000 + Math.random() * 9000).toString()
        
        // Check if this code already exists
        const { data: existing } = await supabase
          .from('rooms')
          .select('id')
          .eq('join_code', code)
          .single()
        
        if (!existing) {
          joinCode = code
          break
        }
      }
      
      if (!joinCode) {
        return NextResponse.json(
          { error: 'Failed to generate unique join code. Please try again.' },
          { status: 500 }
        )
      }
    }

    // Create room with join code
    console.log('Attempting to create room with:', { 
      name, 
      slug, 
      join_code: joinCode,
      created_by: user.id 
    })

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        name,
        slug,
        join_code: joinCode,
        description: description || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (roomError) {
      console.error('Error creating room:', roomError)
      console.error('Room error details:', JSON.stringify(roomError, null, 2))
      
      // Provide more specific error messages
      if (roomError.code === '23505') {
        if (roomError.message?.includes('slug')) {
          return NextResponse.json(
            { error: 'A room with this name already exists. Please try a different name.' },
            { status: 409 }
          )
        }
        if (roomError.message?.includes('join_code')) {
          return NextResponse.json(
            { error: 'Join code conflict. Please try again.' },
            { status: 409 }
          )
        }
      }
      
      if (roomError.code === '42501') {
        return NextResponse.json(
          { error: 'Permission denied. Please make sure you are logged in.' },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { error: `Failed to create room: ${roomError.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ room }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


