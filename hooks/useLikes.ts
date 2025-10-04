import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useLikes(postId: string, initialLikesCount: number = 0) {
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  // Mettre à jour le compteur quand initialLikesCount change
  useEffect(() => {
    setLikesCount(initialLikesCount)
  }, [initialLikesCount])

  useEffect(() => {
    async function checkIfLiked() {
      if (!user) {
        setIsLiked(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) {
          console.error('Erreur vérification like:', error)
          setIsLiked(false)
          return
        }

        setIsLiked(!!data)
      } catch (err) {
        console.error('Erreur inattendue:', err)
        setIsLiked(false)
      }
    }

    checkIfLiked()
  }, [postId, user])

  async function toggleLike() {
    if (!user) return { error: new Error('Not authenticated') }

    setLoading(true)
    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

        if (error) throw error

        // Décrémenter le compteur likes_count
        const newCount = Math.max(0, likesCount - 1)
        const { error: updateError } = await supabase
          .from('posts')
          .update({ likes_count: newCount })
          .eq('id', postId)

        if (updateError) {
          console.error('Erreur mise à jour compteur:', updateError)
        }

        setIsLiked(false)
        setLikesCount(newCount)
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          })

        if (error) throw error

        // Incrémenter le compteur likes_count
        const newCount = likesCount + 1
        const { error: updateError } = await supabase
          .from('posts')
          .update({ likes_count: newCount })
          .eq('id', postId)

        if (updateError) {
          console.error('Erreur mise à jour compteur:', updateError)
        }

        setIsLiked(true)
        setLikesCount(newCount)
      }

      return { error: null }
    } catch (err) {
      return { error: err as Error }
    } finally {
      setLoading(false)
    }
  }

  return {
    isLiked,
    likesCount,
    loading,
    toggleLike,
  }
}
