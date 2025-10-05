'use client'

import { useState } from 'react'
import Link from 'next/link'
import { followUser, unfollowUser } from '@/lib/follows'
import { useRouter } from 'next/navigation'

interface UserSearchResultProps {
  user: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
    bio?: string
    followers_count: number
    following_count: number
    isFollowing?: boolean
  }
  currentUserId?: string
}

export default function UserSearchResult({ user, currentUserId }: UserSearchResultProps) {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleFollowToggle = async () => {
    if (!currentUserId) {
      router.push('/auth/login')
      return
    }

    setIsLoading(true)
    try {
      if (isFollowing) {
        await unfollowUser(currentUserId, user.id)
        setIsFollowing(false)
      } else {
        await followUser(currentUserId, user.id)
        setIsFollowing(true)
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
      <Link href={`/profile/${user.id}`} className="flex items-center gap-3 flex-1">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            user.full_name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white">{user.full_name}</h3>
          <p className="text-sm text-gray-400">@{user.username}</p>
          {user.bio && (
            <p className="text-sm text-gray-300 mt-1 line-clamp-1">{user.bio}</p>
          )}
          <div className="flex gap-4 text-xs text-gray-400 mt-1">
            <span>{user.followers_count} abonnés</span>
            <span>{user.following_count} abonnements</span>
          </div>
        </div>
      </Link>

      {currentUserId && currentUserId !== user.id && (
        <button
          onClick={handleFollowToggle}
          disabled={isLoading}
          className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
            isFollowing
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          } disabled:opacity-50`}
        >
          {isLoading ? '...' : isFollowing ? 'Abonné' : 'Suivre'}
        </button>
      )}
    </div>
  )
}
