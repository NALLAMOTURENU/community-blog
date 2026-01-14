import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/types/supabase'

// Type alias for Room table
type Room = Tables<'rooms'>

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomSlug: string }> }
) {
  try {
    const { roomSlug } = await params
    const supabase = await createClient()

    const { data: room, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('slug', roomSlug)
      .single<Room>()

    if (error || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
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


