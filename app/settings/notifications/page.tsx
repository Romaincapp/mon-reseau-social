'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Bell, Heart, MessageCircle, Repeat2, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'

type NotificationPreferences = {
  notify_on_follow: boolean
  notify_on_like: boolean
  notify_on_comment: boolean
  notify_on_repost: boolean
  notify_on_mention: boolean
}

export default function NotificationSettingsPage() {
  const router = useRouter()
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notify_on_follow: true,
    notify_on_like: true,
    notify_on_comment: true,
    notify_on_repost: true,
    notify_on_mention: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data)
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    // Mettre à jour localement immédiatement
    setPreferences(prev => ({ ...prev, [key]: value }))
    setSaving(true)

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })

      if (!response.ok) {
        // Revenir en arrière si erreur
        setPreferences(prev => ({ ...prev, [key]: !value }))
      }
    } catch (error) {
      console.error('Error updating preference:', error)
      setPreferences(prev => ({ ...prev, [key]: !value }))
    } finally {
      setSaving(false)
    }
  }

  const notificationTypes = [
    {
      key: 'notify_on_follow' as keyof NotificationPreferences,
      icon: <UserPlus className="w-5 h-5 text-blue-500" />,
      title: 'Nouveaux abonnés',
      description: 'Recevoir une notification quand quelqu\'un vous suit',
    },
    {
      key: 'notify_on_like' as keyof NotificationPreferences,
      icon: <Heart className="w-5 h-5 text-red-500" />,
      title: 'J\'aime',
      description: 'Recevoir une notification quand quelqu\'un aime vos posts',
    },
    {
      key: 'notify_on_comment' as keyof NotificationPreferences,
      icon: <MessageCircle className="w-5 h-5 text-green-500" />,
      title: 'Commentaires',
      description: 'Recevoir une notification quand quelqu\'un commente vos posts',
    },
    {
      key: 'notify_on_repost' as keyof NotificationPreferences,
      icon: <Repeat2 className="w-5 h-5 text-purple-500" />,
      title: 'Repartages',
      description: 'Recevoir une notification quand quelqu\'un repartage vos posts',
    },
    {
      key: 'notify_on_mention' as keyof NotificationPreferences,
      icon: <Bell className="w-5 h-5 text-orange-500" />,
      title: 'Mentions',
      description: 'Recevoir une notification quand quelqu\'un vous mentionne',
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto bg-white min-h-screen">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center gap-4 z-10">
            <button onClick={() => router.back()}>
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Paramètres des notifications</h1>
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
          <h1 className="text-xl font-bold">Paramètres des notifications</h1>
          {saving && (
            <span className="ml-auto text-sm text-gray-500">Enregistrement...</span>
          )}
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-600 mb-6">
            Choisissez les types de notifications que vous souhaitez recevoir
          </p>

          <div className="space-y-4">
            {notificationTypes.map((type) => (
              <div
                key={type.key}
                className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  {type.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {type.title}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {type.description}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={preferences[type.key]}
                    onChange={(e) => updatePreference(type.key, e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-3">
              <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900">
                  À propos des notifications
                </h3>
                <p className="text-xs text-blue-800 mt-1">
                  Vos préférences sont enregistrées automatiquement. Vous pouvez les modifier à tout moment.
                  Les notifications sont envoyées en temps réel et apparaîtront dans votre fil de notifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
