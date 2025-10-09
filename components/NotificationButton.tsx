'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function NotificationButton() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasNewNotification, setHasNewNotification] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      setUnreadCount(count || 0)
    }

    fetchUnreadCount()

    // Subscribe to new notifications and updates
    const channel = supabase
      .channel('notifications_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          // Vérifier que la notification est pour l'utilisateur actuel
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user && payload.new && (payload.new as { user_id: string }).user_id === user.id) {
              setUnreadCount(prev => prev + 1)
              setHasNewNotification(true)
              // Animation de la pastille pendant 3 secondes
              setTimeout(() => setHasNewNotification(false), 3000)
            }
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <Link href="/notifications" className="relative group">
      <Bell className={`w-6 h-6 text-gray-600 group-hover:text-blue-500 transition-all ${
        hasNewNotification ? 'animate-bounce' : ''
      }`} />
      {unreadCount > 0 && (
        <>
          {/* Badge avec le nombre de notifications */}
          <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center transition-transform ${
            hasNewNotification ? 'scale-125' : 'scale-100'
          }`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>

          {/* Animation de pulsation pour nouvelle notification */}
          {hasNewNotification && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-ping"></span>
          )}
        </>
      )}
    </Link>
  )
}
