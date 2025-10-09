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
      *
    `)
    .single()

  if (error) throw error

  // Fetch profile separately
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, full_name')
    .eq('id', story.user_id)
    .single()

  return {
    ...story,
    profiles: profile || { id: story.user_id, username: '', avatar_url: null, full_name: null },
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
      story_views!left (id, viewer_id)
    `)
    .gt('expires_at', new Date().toISOString())
    .in('user_id', followingIds)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Fetch profiles separately
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, full_name')
    .in('id', followingIds)

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

  return data.map(story => ({
    ...story,
    profiles: profileMap.get(story.user_id) || { id: story.user_id, username: '', avatar_url: null, full_name: null },
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
      story_views!left (id, viewer_id)
    `)
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) throw error

  // Fetch profile separately
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, full_name')
    .eq('id', userId)
    .single()

  return data.map(story => ({
    ...story,
    profiles: profile || { id: userId, username: '', avatar_url: null, full_name: null },
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
      story_views (
        viewer_id,
        viewed_at
      )
    `)
    .eq('id', storyId)
    .single()

  if (error) throw error

  // Fetch profile separately
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, full_name')
    .eq('id', data.user_id)
    .single()

  // Fetch viewer profiles if there are views
  let viewsWithProfiles: any[] = []
  if (data.story_views && data.story_views.length > 0) {
    const viewerIds = data.story_views.map((v: any) => v.viewer_id)
    const { data: viewerProfiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', viewerIds)

    const viewerMap = new Map(viewerProfiles?.map(p => [p.id, p]) || [])
    viewsWithProfiles = data.story_views.map((view: any) => ({
      ...view,
      profiles: viewerMap.get(view.viewer_id) || null
    }))
  }

  return {
    ...data,
    profiles: profile || { id: data.user_id, username: '', avatar_url: null, full_name: null },
    story_views: viewsWithProfiles,
    views_count: data.story_views?.length || 0,
    has_viewed: viewerId ? data.story_views?.some((view: any) => view.viewer_id === viewerId) || false : false
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
  const { data: myStories, error: myStoriesError } = await supabase
    .from('stories')
    .select(`
      *,
      story_views!left (id, viewer_id)
    `)
    .eq('user_id', currentUserId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (myStoriesError) {
    console.error('Error fetching my stories:', myStoriesError)
  }

  console.log('My stories raw:', myStories)

  // Fetch current user's profile
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, full_name')
    .eq('id', currentUserId)
    .single()

  // Get followed users' stories
  const { data: followedStories, error: followedError } = await supabase
    .rpc('get_followed_users_stories', { p_user_id: currentUserId })

  if (followedError) {
    console.error('Error fetching followed stories:', followedError)
  }

  console.log('Followed stories raw:', followedStories)

  // Group stories by user
  const grouped: Record<string, Story[]> = {}

  // Add my stories first
  if (myStories && myStories.length > 0) {
    grouped[currentUserId] = myStories.map(story => ({
      ...story,
      profiles: myProfile || { id: currentUserId, username: '', avatar_url: null, full_name: null },
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

  console.log('Grouped stories:', grouped)

  // Convert to array format
  const result = Object.entries(grouped).map(([userId, stories]) => {
    const profile = stories[0].profiles
    console.log('Profile for user', userId, ':', profile)

    return {
      user: profile,
      stories,
      has_unviewed: stories.some(s => !s.has_viewed)
    }
  }).filter(group => group.user) // Filter out groups without profile

  console.log('Final result:', result)

  return result
}
