'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import UserSearchResult from '@/components/UserSearchResult'
import { Search } from 'lucide-react'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getCurrentUser()
  }, [])

  useEffect(() => {
    const searchUsers = async () => {
      if (query.trim().length < 2) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await response.json()

        if (response.ok) {
          setResults(data.users || [])
        } else {
          console.error('Search error:', data.error)
          setResults([])
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(searchUsers, 300)
    return () => clearTimeout(timeoutId)
  }, [query])

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 z-10">
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Rechercher des utilisateurs</h1>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher par nom ou pseudo..."
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                autoFocus
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mt-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : query.trim().length < 2 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Entrez au moins 2 caractères pour rechercher</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              {results.map((user) => (
                <UserSearchResult
                  key={user.id}
                  user={user}
                  currentUserId={currentUserId || undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
