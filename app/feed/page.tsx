'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import VocalFeed from '../../components/VocalFeed'

export default function FeedPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Pas d'utilisateur connecté, rediriger vers login
        router.push('/auth/login')
      } else if (user && profile && !profile.is_profile_complete) {
        // Profil incomplet, rediriger vers complétion du profil
        router.push('/auth/complete-profile')
      }
    }
  }, [user, profile, loading, router])

  // Ne rien afficher pendant le chargement ou si non authentifié
  if (loading || !user || !profile || !profile.is_profile_complete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 mb-4 relative">
            <div className="absolute inset-0 rounded-full bg-pink-500 animate-ping opacity-20"></div>
            <svg className="w-10 h-10 text-white relative z-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Chargement...</h1>
        </div>
      </div>
    )
  }

  return <VocalFeed />
}
