'use client'

import React from 'react';

interface AvatarWithWaveformProps {
  avatar: string;
  isPlaying: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  alwaysAnimate?: boolean; // Pour la page de profil
  avatarUrl?: string | null; // URL de la vraie photo de profil
}

const AvatarWithWaveform: React.FC<AvatarWithWaveformProps> = ({
  avatar,
  isPlaying,
  size = 'md',
  alwaysAnimate = false,
  avatarUrl = null
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-12 h-12 text-xl',
    lg: 'w-20 h-20 text-3xl',
    xl: 'w-24 h-24 text-4xl'
  };

  const shouldAnimate = alwaysAnimate || isPlaying;

  // Debug log
  console.log('🖼️ AvatarWithWaveform render - avatarUrl:', avatarUrl);

  return (
    <div className="relative inline-block">
      {/* Container de l'avatar avec les cercles d'ondes */}
      <div className="relative">
        {/* Cercles d'ondes sonores - 3 couches pour effet de vague */}
        {shouldAnimate && (
          <>
            {/* Onde 1 - la plus proche */}
            <div
              className="absolute inset-0 rounded-full border-2 border-purple-400 opacity-0"
              style={{
                animation: 'waveform-pulse 2s ease-out infinite',
                animationDelay: '0s'
              }}
            />
            {/* Onde 2 - moyenne distance */}
            <div
              className="absolute inset-0 rounded-full border-2 border-purple-400 opacity-0"
              style={{
                animation: 'waveform-pulse 2s ease-out infinite',
                animationDelay: '0.7s'
              }}
            />
            {/* Onde 3 - la plus éloignée */}
            <div
              className="absolute inset-0 rounded-full border-2 border-purple-400 opacity-0"
              style={{
                animation: 'waveform-pulse 2s ease-out infinite',
                animationDelay: '1.4s'
              }}
            />
          </>
        )}

        {/* Avatar principal avec bordure animée */}
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center relative z-10 transition-all duration-300 overflow-hidden ${
            shouldAnimate ? 'ring-4 ring-purple-300 ring-opacity-50 shadow-lg shadow-purple-300/50' : ''
          } ${!avatarUrl ? 'bg-gradient-to-br from-purple-400 to-purple-600 text-white' : ''}`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            avatar
          )}
        </div>
      </div>

      {/* Styles CSS pour l'animation */}
      <style jsx>{`
        @keyframes waveform-pulse {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default AvatarWithWaveform;
