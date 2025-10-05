import { supabase } from '@/lib/supabase'

/**
 * Follow a user
 */
export async function followUser(followerId: string, followingId: string): Promise<void> {
  // Insert follow relationship
  const { error: followError } = await supabase
    .from('follows')
    .insert({
      follower_id: followerId,
      following_id: followingId
    })

  if (followError) throw followError

  // Update follower count for the user being followed
  const { error: updateFollowingError } = await supabase.rpc('increment_followers_count', {
    user_id: followingId
  })

  if (updateFollowingError) console.error('Error updating followers count:', updateFollowingError)

  // Update following count for the follower
  const { error: updateFollowerError } = await supabase.rpc('increment_following_count', {
    user_id: followerId
  })

  if (updateFollowerError) console.error('Error updating following count:', updateFollowerError)

  // Create notification
  await supabase
    .from('notifications')
    .insert({
      user_id: followingId,
      actor_id: followerId,
      type: 'follow'
    })
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  // Delete follow relationship
  const { error: unfollowError } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)

  if (unfollowError) throw unfollowError

  // Update follower count for the user being unfollowed
  const { error: updateFollowingError } = await supabase.rpc('decrement_followers_count', {
    user_id: followingId
  })

  if (updateFollowingError) console.error('Error updating followers count:', updateFollowingError)

  // Update following count for the follower
  const { error: updateFollowerError } = await supabase.rpc('decrement_following_count', {
    user_id: followerId
  })

  if (updateFollowerError) console.error('Error updating following count:', updateFollowerError)

  // Delete notification
  await supabase
    .from('notifications')
    .delete()
    .eq('user_id', followingId)
    .eq('actor_id', followerId)
    .eq('type', 'follow')
}

/**
 * Check if user is following another user
 */
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle()

  if (error) {
    console.error('Error checking follow status:', error)
    return false
  }

  return !!data
}

/**
 * Get followers for a user
 */
export async function getFollowers(userId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      follower:follower_id (
        id,
        username,
        full_name,
        avatar_url
      ),
      created_at
    `)
    .eq('following_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get following for a user
 */
export async function getFollowing(userId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      following:following_id (
        id,
        username,
        full_name,
        avatar_url
      ),
      created_at
    `)
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get follow stats for a user
 */
export async function getFollowStats(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('followers_count, following_count')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}
