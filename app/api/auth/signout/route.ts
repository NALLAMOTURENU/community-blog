import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Get Supabase client and sign out user
  // This clears the Supabase session and cookies
  const supabase = await createClient()
  await supabase.auth.signOut()

  // Redirect to home page after sign out
  // Home page will show sign-in buttons for non-authenticated users
  return NextResponse.redirect(new URL('/', request.url))
}


