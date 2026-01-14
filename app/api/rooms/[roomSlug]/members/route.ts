import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isRoomMember } from '@/lib/utils/permissions'
import { Tables } from '@/types/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomSlug: string }> }
) {
  try {
    const { roomSlug } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get room by slug
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, name, slug')
      .eq('slug', roomSlug)
      .single<Pick<Tables<'rooms'>, 'id' | 'name' | 'slug'>>()

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Check if user is a member
    const isMember = await isRoomMember(room.id, user.id)
    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all members with profile details
    const { data: members, error: membersError } = await supabase
      .from('room_members_with_profiles')
      .select('*')
      .eq('room_id', room.id)
      .order('joined_at', { ascending: true })
      .returns<Tables<'room_members_with_profiles'>[]>()

    if (membersError) {
      console.error('Error fetching members:', membersError)
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { status: 500 }
      )
    }

    return NextResponse.json({ members }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


