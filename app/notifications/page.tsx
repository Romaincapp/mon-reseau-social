'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Heart, MessageCircle, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

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
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)

        // Mark all as read
        const unreadIds = data
          .filter((n: Notification) => !n.is_read)
          .map((n: Notification) => n.id)

        if (unreadIds.length > 0) {
          await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationIds: unreadIds }),
          })
        }
      }
      setLoading(false)
    }

    fetchNotifications()
  }, [])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="w-5 h-5 text-blue-500" />
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-green-500" />
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
        return notification.post ? `/post/${notification.post.id}` : '#'
      default:
        return '#'
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto bg-white min-h-screen">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center gap-4 z-10">
            <button onClick={() => router.back()}>
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Notifications</h1>
          </div>
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white min-h-screen">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center gap-4 z-10">
          <button onClick={() => router.back()}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Notifications</h1>
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
                className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors ${
                  !notification.is_read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex-shrink-0">
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
                  <p className="text-sm text-gray-900">
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
