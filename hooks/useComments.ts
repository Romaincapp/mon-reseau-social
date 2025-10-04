import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Tables } from '../types/database.types'

type Comment = Tables<'comments'> & {
  profiles: Tables<'profiles'>
  replies?: Comment[]
}

export function useComments(postId: string) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchComments()
  }, [postId])

  async function fetchComments() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (id, username, full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .is('parent_comment_id', null) // Only top-level comments
        .order('created_at', { ascending: true })

      if (error) throw error

      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: replies } = await supabase
            .from('comments')
            .select(`
              *,
              profiles (id, username, full_name, avatar_url)
            `)
            .eq('parent_comment_id', comment.id)
            .order('created_at', { ascending: true })

          return {
            ...comment,
            replies: replies || [],
          }
        })
      )

      setComments(commentsWithReplies as Comment[])
    } catch (err) {
      console.error('Error fetching comments:', err)
    } finally {
      setLoading(false)
    }
  }

  async function addComment(content: string, parentCommentId?: string) {
    if (!user) return { error: new Error('Not authenticated') }

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
          parent_comment_id: parentCommentId || null,
        })
        .select()
        .single()

      if (error) throw error
      await fetchComments() // Refresh
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  }

  async function deleteComment(commentId: string) {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error
      await fetchComments() // Refresh
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  return {
    comments,
    loading,
    addComment,
    deleteComment,
    refetch: fetchComments,
  }
}
