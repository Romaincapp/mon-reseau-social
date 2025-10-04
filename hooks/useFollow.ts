import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useFollow(userId: string) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user && user.id !== userId) {
      checkIfFollowing()
    }
  }, [userId, user])

  async function checkIfFollowing() {
    if (!user) return

    try {
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single()

      setIsFollowing(!!data)
    } catch (err) {
      setIsFollowing(false)
    }
  }

  async function toggleFollow() {
    if (!user) return { error: new Error('Not authenticated') }
    if (user.id === userId) return { error: new Error('Cannot follow yourself') }

    setLoading(true)
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId)

        if (error) throw error
        setIsFollowing(false)
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId,
          })

        if (error) throw error
        setIsFollowing(true)
      }

      return { error: null }
    } catch (err) {
      return { error: err as Error }
    } finally {
      setLoading(false)
    }
  }

  return {
    isFollowing,
    loading,
    toggleFollow,
  }
}
