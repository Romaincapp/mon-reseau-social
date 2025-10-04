'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireProfileComplete?: boolean
}

export default function ProtectedRoute({
  children,
  requireProfileComplete = false
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login')
        return
      }

      if (requireProfileComplete && profile && !profile.is_profile_complete) {
        router.push('/auth/register')
        return
      }
    }
  }, [user, profile, loading, router, requireProfileComplete])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requireProfileComplete && profile && !profile.is_profile_complete) {
    return null
  }

  return <>{children}</>
}