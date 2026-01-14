import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/types/supabase'

/**
 * Check if user is a member of a room
 */
export async function isRoomMember(
  roomId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('room_members')
    .select('id')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .single<Pick<Tables<'room_members'>, 'id'>>()

/**
 * Check if user is an admin of a room
 */
export async function isRoomAdmin(
  roomId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('room_members')
    .select('role')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .eq('role', 'admin')
    .single<Pick<Tables<'room_members'>, 'role'>>()

/**
 * Check if user is the creator of a room
 */
export async function isRoomCreator(
  roomId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rooms')
    .select('created_by')
    .eq('id', roomId)
    .eq('created_by', userId)
    .single<Pick<Tables<'rooms'>, 'created_by'>>()

/**
 * Check if user can write in a room
 */
export async function canWriteInRoom(
  roomId: string,
  userId: string
): Promise<boolean> {
  return await isRoomMember(roomId, userId)
}

/**
 * Check if user is the author of a blog
 */
export async function isBlogAuthor(
  blogId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('blogs')
    .select('author_id')
    .eq('id', blogId)
    .eq('author_id', userId)
    .single<Pick<Tables<'blogs'>, 'author_id'>>()

/**
 * Check if user can edit a blog
 */
export async function canEditBlog(
  blogId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('blogs')
    .select('author_id, published')
    .eq('id', blogId)
    .single<Pick<Tables<'blogs'>, 'author_id' | 'published'>>()

  if (error || !data) return false

  // Can only edit if author and not yet published
  return data.author_id === userId && !data.published
}

/**
 * Get user's role in a room
 */
export async function getUserRoomRole(
  roomId: string,
  userId: string
): Promise<'admin' | 'member' | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('room_members')
    .select('role')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .single<Pick<Tables<'room_members'>, 'role'>>()

  if (error || !data) return null
  return data.role as 'admin' | 'member'
}


