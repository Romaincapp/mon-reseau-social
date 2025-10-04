'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { Lock, AlertCircle } from 'lucide-react'

export default function UpdatePassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [hasValidSession, setHasValidSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Vérifier d'abord si on a des paramètres dans le hash fragment
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        if (accessToken && refreshToken && type === 'recovery') {
          // Définir la session avec les tokens du hash
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            console.error('Error setting session:', error)
            setError('Lien de réinitialisation invalide ou expiré')
            setHasValidSession(false)
          } else {
            setHasValidSession(true)
          }
        } else {
          // Vérifier si l'utilisateur a déjà une session valide
          const { data: { session } } = await supabase.auth.getSession()

          if (session) {
            setHasValidSession(true)
          } else {
            setError('Lien de réinitialisation invalide ou expiré. Veuillez demander un nouveau lien.')
            setHasValidSession(false)
          }
        }
      } catch (err) {
        console.error('Error checking session:', err)
        setError('Une erreur est survenue. Veuillez réessayer.')
        setHasValidSession(false)
      } finally {
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      // Traduire les erreurs
      let errorMessage = error.message

      if (error.message.includes('New password should be different')) {
        errorMessage = 'Le nouveau mot de passe doit être différent de l\'ancien'
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = 'Le mot de passe doit contenir au moins 6 caractères'
      } else if (error.message.includes('Unable to validate email address')) {
        errorMessage = 'Session expirée. Veuillez demander un nouveau lien de réinitialisation.'
      }

      setError(errorMessage)
    } else {
      setMessage('Mot de passe mis à jour avec succès ! Redirection...')

      // Déconnecter l'utilisateur et rediriger vers la page de connexion
      await supabase.auth.signOut()

      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    }

    setLoading(false)
  }

  // Afficher un loader pendant la vérification
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Vérification du lien...</p>
        </div>
      </div>
    )
  }

  // Si pas de session valide, afficher un message d'erreur
  if (!hasValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Lien invalide ou expiré
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {error || 'Ce lien de réinitialisation n\'est plus valide.'}
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => router.push('/auth/reset-password')}
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Demander un nouveau lien
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Retour à la connexion
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <Lock className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Nouveau mot de passe
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Choisissez un nouveau mot de passe sécurisé
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Nouveau mot de passe
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Minimum 6 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmer le nouveau mot de passe
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Retapez votre nouveau mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {message && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">{message}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}