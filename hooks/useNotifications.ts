import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Tables } from '../types/database.types'

type Notification = Tables<'notifications'> & {
  actor: Tables<'profiles'>
  post?: Tables<'posts'> | null
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchNotifications()
      subscribeToNotifications()
    }
  }, [user])

  async function fetchNotifications() {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:profiles!notifications_actor_id_fkey (id, username, full_name, avatar_url),
          post:posts (id, audio_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setNotifications(data as Notification[])

      // Compter non lues
      const unread = data.filter(n => !n.is_read).length
      setUnreadCount(unread)
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  function subscribeToNotifications() {
    if (!user) return

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications() // Refresh on new notification
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error
      await fetchNotifications() // Refresh
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  async function markAllAsRead() {
    if (!user) return { error: new Error('Not authenticated') }

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error
      await fetchNotifications() // Refresh
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  }
}
