'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { User } from 'lucide-react'

export default function CompleteProfile() {
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user, profile, updateProfile, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Si le profil est déjà complet, rediriger vers le feed
      if (profile?.is_profile_complete) {
        router.push('/feed')
        return
      }

      // Pré-remplir les champs si déjà présents
      if (profile) {
        setUsername(profile.username || '')
        setFullName(profile.full_name || '')
        setBio(profile.bio || '')
      }
    }
  }, [user, profile, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!username.trim()) {
      setError('Le nom d\'utilisateur est requis')
      setLoading(false)
      return
    }

    if (!fullName.trim()) {
      setError('Le nom complet est requis')
      setLoading(false)
      return
    }

    // Validation du nom d'utilisateur
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(username)) {
      setError('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores')
      setLoading(false)
      return
    }

    const { error } = await updateProfile({
      username: `@${username.trim()}`,
      full_name: fullName.trim(),
      bio: bio.trim(),
      is_profile_complete: true,
    })

    if (error) {
      setError(error.message || 'Erreur lors de la mise à jour du profil')
    } else {
      router.push('/feed')
    }

    setLoading(false)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Complétez votre profil
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Pour commencer à utiliser Voccal, nous avons besoin de quelques informations
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Nom d'utilisateur *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">@</span>
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="pl-8 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="votre_nom_utilisateur"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  maxLength={30}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Uniquement lettres, chiffres et underscores. Max 30 caractères.
              </p>
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Nom complet *
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Votre nom complet"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={100}
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio (optionnel)
              </label>
              <div className="mt-1">
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Parlez-nous de vous..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={160}
                />
                <div className="mt-1 flex justify-between">
                  <p className="text-xs text-gray-500">
                    Une petite description de vous
                  </p>
                  <p className="text-xs text-gray-500">
                    {bio.length}/160
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement...' : 'Continuer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
