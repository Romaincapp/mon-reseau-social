'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, user, profile, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && user && profile) {
      // Rediriger selon l'état du profil
      if (!profile.is_profile_complete) {
        router.push('/auth/complete-profile')
      } else {
        router.push('/')
      }
    }
  }, [user, profile, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)

    if (error) {
      // Traduire les erreurs courantes en français
      let errorMessage = error.message

      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Email ou mot de passe incorrect'
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception.'
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Trop de tentatives. Veuillez réessayer dans quelques instants.'
      } else if (error.message.includes('User not found')) {
        errorMessage = 'Aucun compte associé à cet email'
      }

      setError(errorMessage)
      setLoading(false)
    }
    // Le redirect est géré par le useEffect ci-dessus
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
      {/* Ondes animées en arrière-plan */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
          <path
            d="M0,400 Q300,300 600,400 T1200,400 L1200,800 L0,800 Z"
            fill="url(#wave1)"
            className="animate-wave"
          >
            <animate
              attributeName="d"
              dur="10s"
              repeatCount="indefinite"
              values="
                M0,400 Q300,300 600,400 T1200,400 L1200,800 L0,800 Z;
                M0,400 Q300,500 600,400 T1200,400 L1200,800 L0,800 Z;
                M0,400 Q300,300 600,400 T1200,400 L1200,800 L0,800 Z
              "
            />
          </path>
          <path
            d="M0,450 Q300,350 600,450 T1200,450 L1200,800 L0,800 Z"
            fill="url(#wave2)"
            className="animate-wave-slow"
          >
            <animate
              attributeName="d"
              dur="15s"
              repeatCount="indefinite"
              values="
                M0,450 Q300,350 600,450 T1200,450 L1200,800 L0,800 Z;
                M0,450 Q300,550 600,450 T1200,450 L1200,800 L0,800 Z;
                M0,450 Q300,350 600,450 T1200,450 L1200,800 L0,800 Z
              "
            />
          </path>
          <defs>
            <linearGradient id="wave1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="wave2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EC4899" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Particules sonores flottantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-10 animate-float"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 10 + 10}s`,
            }}
          />
        ))}
      </div>

      {/* Formulaire */}
      <div className="relative z-10 max-w-md w-full mx-4">
        {/* Logo et titre avec effet sonore */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 mb-4 relative">
            <div className="absolute inset-0 rounded-full bg-pink-500 animate-ping opacity-20"></div>
            <svg className="w-10 h-10 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Voccal
          </h1>
          <p className="text-purple-200 text-lg">
            Entrez dans l'univers vocal
          </p>
        </div>

        {/* Carte du formulaire avec effet glassmorphism */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl border border-white/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-purple-100 mb-2">
                Adresse email
              </label>
              <div className="relative group">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all backdrop-blur-sm"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-focus-within:opacity-20 transition-opacity pointer-events-none blur"></div>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-purple-100 mb-2">
                Mot de passe
              </label>
              <div className="relative group">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all backdrop-blur-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-focus-within:opacity-20 transition-opacity pointer-events-none blur"></div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg text-sm backdrop-blur-sm">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <Link
                href="/auth/reset-password"
                className="text-purple-200 hover:text-white transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium py-3 px-4 rounded-lg hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-pink-500/50"
            >
              <span className="relative z-10">
                {loading ? 'Connexion...' : 'Se connecter'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-purple-200 text-sm">
              Pas encore de compte ?{' '}
              <Link
                href="/auth/register"
                className="text-pink-300 hover:text-white font-medium transition-colors"
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-10px) translateX(-10px);
          }
          75% {
            transform: translateY(-25px) translateX(5px);
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  )
}
