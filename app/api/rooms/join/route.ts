import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidJoinCode } from '@/lib/utils/join-code'
import { z } from 'zod'

const joinRoomSchema = z.object({
  joinCode: z.string().regex(/^[0-9]{4}$/, 'Invalid join code format'),
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
    const result = joinRoomSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      )
    }

    const { joinCode } = result.data

    // Validate join code format
    if (!isValidJoinCode(joinCode)) {
      return NextResponse.json(
        { error: 'Invalid join code format' },
        { status: 400 }
      )
    }

    // Find room by join code
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, name, slug')
      .eq('join_code', joinCode)
      .single()

    if (roomError || !room) {
      return NextResponse.json(
        { error: 'Room not found with this join code' },
        { status: 404 }
      )
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', room.id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: 'Already a member of this room', room },
        { status: 409 }
      )
    }

    // Add user as member
    const { error: memberError } = await supabase
      .from('room_members')
      .insert({
        room_id: room.id,
        user_id: user.id,
        role: 'member',
      })

    if (memberError) {
      console.error('Error adding member:', memberError)
      return NextResponse.json(
        { error: 'Failed to join room' },
        { status: 500 }
      )
    }

    return NextResponse.json({ room }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


