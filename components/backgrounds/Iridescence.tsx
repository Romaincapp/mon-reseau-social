'use client'

import React, { useState, useEffect } from 'react'

interface IridescenceProps {
  className?: string
  children?: React.ReactNode
}

// Fonction déterministe pour générer des "nombres aléatoires" basés sur l'index
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export default function Iridescence({ className = '', children }: IridescenceProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Rendre le body transparent pour voir l'Iridescence
    const originalBodyBg = document.body.style.background
    document.body.style.background = 'transparent'

    return () => {
      // Restaurer le background original au démontage
      document.body.style.background = originalBodyBg
    }
  }, [])

  // Générer des orbes avec des valeurs déterministes
  const orbs = Array.from({ length: 12 }, (_, i) => ({
    width: seededRandom(i * 7) * 300 + 150,
    height: seededRandom(i * 11) * 300 + 150,
    left: seededRandom(i * 13) * 100,
    top: seededRandom(i * 17) * 100,
    color: ['rgba(236, 72, 153, 0.2)', 'rgba(139, 92, 246, 0.2)', 'rgba(59, 130, 246, 0.2)', 'rgba(168, 85, 247, 0.15)'][
      Math.floor(seededRandom(i * 19) * 4)
    ],
    duration: seededRandom(i * 23) * 10 + 15,
    delay: seededRandom(i * 29) * 5,
  }))

  return (
    <div className={`iridescence-background relative min-h-screen overflow-hidden ${className}`}>
      {/* Iridescent background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        {/* Animated gradient overlay */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: `
              radial-gradient(circle at 20% 50%, rgba(236, 72, 153, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 40% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 90% 30%, rgba(168, 85, 247, 0.2) 0%, transparent 50%)
            `,
            animation: 'iridescence 15s ease-in-out infinite',
          }}
        />

        {/* Shimmer effect */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              linear-gradient(
                45deg,
                transparent 30%,
                rgba(255, 255, 255, 0.1) 50%,
                transparent 70%
              )
            `,
            backgroundSize: '200% 200%',
            animation: 'shimmer 8s ease-in-out infinite',
          }}
        />

        {/* Floating orbs - only render after mount to avoid hydration issues */}
        {mounted && (
          <div className="absolute inset-0 overflow-hidden">
            {orbs.map((orb, i) => (
              <div
                key={i}
                className="absolute rounded-full blur-3xl"
                style={{
                  width: `${orb.width}px`,
                  height: `${orb.height}px`,
                  left: `${orb.left}%`,
                  top: `${orb.top}%`,
                  background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
                  animation: `float ${orb.duration}s ease-in-out infinite`,
                  animationDelay: `${orb.delay}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Grain texture overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      <style jsx>{`
        @keyframes iridescence {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 0.5;
          }
          33% {
            transform: scale(1.1) rotate(5deg);
            opacity: 0.6;
          }
          66% {
            transform: scale(0.95) rotate(-5deg);
            opacity: 0.4;
          }
        }

        @keyframes shimmer {
          0%, 100% {
            background-position: 0% 0%;
          }
          50% {
            background-position: 100% 100%;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(10px, -20px) scale(1.05);
          }
          50% {
            transform: translate(-15px, -10px) scale(0.95);
          }
          75% {
            transform: translate(5px, -25px) scale(1.02);
          }
        }
      `}</style>
    </div>
  )
}
