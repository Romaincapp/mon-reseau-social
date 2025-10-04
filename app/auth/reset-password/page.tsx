'use client'

import { useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import Link from 'next/link'
import { Mail } from 'lucide-react'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    // Validation de base de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Veuillez entrer une adresse email valide')
      setLoading(false)
      return
    }

    const { error } = await resetPassword(email)

    if (error) {
      // Traduire les erreurs courantes en français
      let errorMessage = error.message

      if (error.message.includes('rate limit')) {
        errorMessage = 'Trop de tentatives. Veuillez réessayer dans quelques instants.'
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Format d\'email invalide'
      } else if (error.message.includes('User not found')) {
        errorMessage = 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.'
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Veuillez d\'abord confirmer votre adresse email avant de réinitialiser votre mot de passe.'
      }

      setError(errorMessage)

      // Pour des raisons de sécurité, même si l'utilisateur n'existe pas, on affiche un message de succès
      if (error.message.includes('User not found')) {
        setError('')
        setMessage('Si un compte existe avec cet email, vous recevrez un lien de réinitialisation dans quelques minutes. Vérifiez également votre dossier spam.')
      }
    } else {
      setMessage('Un lien de réinitialisation a été envoyé à votre adresse email. Vérifiez votre boîte de réception et votre dossier spam.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Mot de passe oublié
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Entrez votre adresse email pour recevoir un lien de réinitialisation
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Adresse email
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {message && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">
                <p className="font-medium mb-2">{message}</p>
                <p className="text-xs text-green-600 mt-2">
                  📧 Le lien est valide pendant 1 heure. Si vous ne recevez pas l'email, vérifiez vos spams ou réessayez.
                </p>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <Link
              href="/auth/login"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Retour à la connexion
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}