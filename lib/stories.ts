import { supabase } from '@/lib/supabase'
import { Tables, TablesInsert } from '@/types/database.types'

export type Story = Tables<'stories'> & {
  profiles: Pick<Tables<'profiles'>, 'id' | 'username' | 'avatar_url' | 'full_name'>
  views_count: number
  has_viewed: boolean
}

export type StoryWithViews = Story & {
  story_views: Array<{
    viewer_id: string
    viewed_at: string
    profiles: Pick<Tables<'profiles'>, 'username' | 'avatar_url'>
  }>
}

/**
 * Upload audio file to storage for story
 */
export async function uploadStoryAudio(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}.${fileExt}`
  const filePath = `stories/${fileName}`

  const { error: uploadError, data } = await supabase.storage
    .from('audio')
    .upload(filePath, file)

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  const { data: { publicUrl } } = supabase.storage
    .from('audio')
    .getPublicUrl(filePath)

  return publicUrl
}

/**
 * Create a new story
 */
export async function createStory(data: TablesInsert<'stories'>): Promise<Story> {
  const { data: story, error } = await supabase
    .from('stories')
    .insert(data)
    .select(`
      *,
      profiles:user_id (id, username, avatar_url, full_name)
    `)
    .single()

  if (error) throw error

  return {
    ...story,
    views_count: 0,
    has_viewed: false
  }
}

/**
 * Get all active stories from followed users
 */
export async function getFollowedUsersStories(userId: string): Promise<Story[]> {
  // First get followed user IDs
  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  if (!follows || follows.length === 0) return []

  const followingIds = follows.map(f => f.following_id)

  const { data, error } = await supabase
    .from('stories')
    .select(`
      *,
      profiles:user_id (id, username, avatar_url, full_name),
      story_views!left (id, viewer_id)
    `)
    .gt('expires_at', new Date().toISOString())
    .in('user_id', followingIds)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data.map(story => ({
    ...story,
    views_count: story.story_views?.length || 0,
    has_viewed: story.story_views?.some(view => view.viewer_id === userId) || false
  }))
}

/**
 * Get user's own stories
 */
export async function getUserStories(userId: string, viewerId?: string): Promise<Story[]> {
  const { data, error } = await supabase
    .from('stories')
    .select(`
      *,
      profiles:user_id (id, username, avatar_url, full_name),
      story_views!left (id, viewer_id)
    `)
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) throw error

  return data.map(story => ({
    ...story,
    views_count: story.story_views?.length || 0,
    has_viewed: viewerId ? story.story_views?.some(view => view.viewer_id === viewerId) || false : false
  }))
}

/**
 * Get a specific story with details
 */
export async function getStoryById(storyId: string, viewerId?: string): Promise<StoryWithViews> {
  const { data, error } = await supabase
    .from('stories')
    .select(`
      *,
      profiles:user_id (id, username, avatar_url, full_name),
      story_views (
        viewer_id,
        viewed_at,
        profiles:viewer_id (username, avatar_url)
      )
    `)
    .eq('id', storyId)
    .single()

  if (error) throw error

  return {
    ...data,
    views_count: data.story_views?.length || 0,
    has_viewed: viewerId ? data.story_views?.some(view => view.viewer_id === viewerId) || false : false
  }
}

/**
 * Mark story as viewed
 */
export async function markStoryAsViewed(storyId: string, viewerId: string): Promise<void> {
  const { error } = await supabase
    .from('story_views')
    .upsert({
      story_id: storyId,
      viewer_id: viewerId
    }, {
      onConflict: 'story_id,viewer_id'
    })

  if (error) throw error
}

/**
 * Delete a story
 */
export async function deleteStory(storyId: string): Promise<void> {
  // Get the story to delete the audio file
  const { data: story } = await supabase
    .from('stories')
    .select('audio_url')
    .eq('id', storyId)
    .single()

  if (story?.audio_url) {
    // Extract file path from URL
    const urlParts = story.audio_url.split('/stories/')
    if (urlParts.length > 1) {
      const filePath = `stories/${urlParts[1]}`
      await supabase.storage.from('audio').remove([filePath])
    }
  }

  const { error } = await supabase
    .from('stories')
    .delete()
    .eq('id', storyId)

  if (error) throw error
}

/**
 * Get grouped stories by user (for stories carousel)
 */
export async function getStoriesGroupedByUser(currentUserId: string): Promise<Array<{
  user: Pick<Tables<'profiles'>, 'id' | 'username' | 'avatar_url' | 'full_name'>
  stories: Story[]
  has_unviewed: boolean
}>> {
  // Get current user's stories
  const { data: myStories } = await supabase
    .from('stories')
    .select(`
      *,
      profiles:user_id (id, username, avatar_url, full_name),
      story_views!left (id, viewer_id)
    `)
    .eq('user_id', currentUserId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  // Get followed users' stories
  const { data: followedStories } = await supabase
    .rpc('get_followed_users_stories', { p_user_id: currentUserId })

  // Group stories by user
  const grouped: Record<string, Story[]> = {}

  // Add my stories first
  if (myStories && myStories.length > 0) {
    grouped[currentUserId] = myStories.map(story => ({
      ...story,
      views_count: story.story_views?.length || 0,
      has_viewed: true // User has always "viewed" their own stories
    }))
  }

  // Add followed users stories
  if (followedStories) {
    followedStories.forEach((story: any) => {
      if (!grouped[story.user_id]) {
        grouped[story.user_id] = []
      }
      grouped[story.user_id].push({
        ...story,
        views_count: story.views_count || 0,
        has_viewed: story.has_viewed || false
      })
    })
  }

  // Convert to array format
  return Object.entries(grouped).map(([userId, stories]) => ({
    user: stories[0].profiles,
    stories,
    has_unviewed: stories.some(s => !s.has_viewed)
  }))
}
