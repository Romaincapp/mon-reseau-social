'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Heart, MessageCircle, UserPlus, Repeat2, Settings } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'

type Notification = {
  id: string
  type: string
  is_read: boolean
  created_at: string
  actor: {
    id: string
    username: string
    avatar_url: string | null
    full_name: string | null
  }
  post: {
    id: string
    audio_url: string
    duration: number
  } | null
}

export default function NotificationsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        console.log('[Notifications] Auth still loading, waiting...')
        return
      }

      // Only fetch if user is authenticated
      if (!user) {
        console.log('[Notifications] No user after auth loaded, redirecting to login')
        router.push('/auth/login')
        return
      }

      console.log('[Notifications] Fetching notifications for user:', user.id)

      try {
        const response = await fetch('/api/notifications', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        console.log('[Notifications] Response status:', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('[Notifications] Loaded', data.length, 'notifications')
          setNotifications(data)
        } else if (response.status === 401) {
          console.error('[Notifications] 401 Unauthorized, redirecting to login')
          // User not authenticated, redirect to login
          router.push('/auth/login')
        } else {
          console.error('[Notifications] Error:', response.status, await response.text())
        }
      } catch (error) {
        console.error('[Notifications] Fetch error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [user, router, authLoading])

  const markAsRead = async (notificationId: string) => {
    // Marquer comme lu localement immédiatement
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    )

    // Envoyer la requête au serveur
    await fetch('/api/notifications', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationIds: [notificationId] }),
    })
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter(n => !n.is_read)
      .map(n => n.id)

    if (unreadIds.length > 0) {
      // Marquer toutes comme lues localement
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      )

      // Envoyer la requête au serveur
      await fetch('/api/notifications', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: unreadIds }),
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="w-5 h-5 text-blue-500" />
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-green-500" />
      case 'repost':
        return <Repeat2 className="w-5 h-5 text-purple-500" />
      default:
        return null
    }
  }

  const getNotificationText = (notification: Notification) => {
    const name = notification.actor.full_name || notification.actor.username
    switch (notification.type) {
      case 'follow':
        return `${name} a commencé à vous suivre`
      case 'like':
        return `${name} a aimé votre post`
      case 'comment':
        return `${name} a commenté votre post`
      case 'repost':
        return `${name} a repartagé votre post`
      default:
        return 'Nouvelle notification'
    }
  }

  const getNotificationLink = (notification: Notification) => {
    switch (notification.type) {
      case 'follow':
        return `/profile/${notification.actor.username}`
      case 'like':
      case 'comment':
      case 'repost':
        return notification.post ? `/post/${notification.post.id}` : '#'
      default:
        return '#'
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  const formatTime = (date: string) => {
    const now = new Date()
    const notifDate = new Date(date)
    const diff = now.getTime() - notifDate.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `Il y a ${minutes}m`
    if (hours < 24) return `Il y a ${hours}h`
    return `Il y a ${days}j`
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto bg-white min-h-screen">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center gap-4 z-10">
            <button onClick={() => router.back()}>
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Notifications</h1>
          </div>
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
            Chargement...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white min-h-screen">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()}>
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold flex-1">Notifications</h1>
            <Link href="/settings/notifications" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Settings className="w-5 h-5 text-gray-600" />
            </Link>
          </div>
          {unreadCount > 0 && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-gray-600">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</span>
              <button
                onClick={markAllAsRead}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Tout marquer comme lu
              </button>
            </div>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucune notification
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                href={getNotificationLink(notification)}
                onClick={() => handleNotificationClick(notification)}
                className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors relative ${
                  !notification.is_read ? 'bg-blue-50' : ''
                }`}
              >
                {/* Pastille pour les notifications non lues */}
                {!notification.is_read && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full"></div>
                )}

                <div className="flex-shrink-0 ml-3">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  {notification.actor.avatar_url ? (
                    <Image
                      src={notification.actor.avatar_url}
                      alt={notification.actor.username}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                    {getNotificationText(notification)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTime(notification.created_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
