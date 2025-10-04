import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database.types'

type Post = Tables<'posts'> & {
  profiles: Tables<'profiles'>
  post_tags: Array<{
    id: string
    tags: Tables<'tags'>
  }>
}

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (id, username, full_name, avatar_url, bio),
          post_tags (
            id,
            tags (id, name, emoji, color)
          )
        `)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setPosts(data as Post[])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  async function createPost(audioUrl: string, duration: number, tagIds?: number[]) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          audio_url: audioUrl,
          duration,
        })
        .select()
        .single()

      if (postError) throw postError

      // Ajouter les tags si présents
      if (tagIds && tagIds.length > 0) {
        const postTags = tagIds.map(tagId => ({
          post_id: post.id,
          tag_id: tagId,
        }))

        const { error: tagsError } = await supabase
          .from('post_tags')
          .insert(postTags)

        if (tagsError) throw tagsError
      }

      await fetchPosts() // Refresh
      return { data: post, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  }

  async function deletePost(postId: string) {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error
      await fetchPosts() // Refresh
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  return {
    posts,
    loading,
    error,
    createPost,
    deletePost,
    refetch: fetchPosts,
  }
}
