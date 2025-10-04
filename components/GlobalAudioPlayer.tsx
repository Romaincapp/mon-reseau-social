// components/GlobalAudioPlayer.tsx
'use client';

import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, X } from 'lucide-react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';

const GlobalAudioPlayer: React.FC = () => {
  const {
    currentPost,
    isPlaying,
    currentTime,
    duration,
    isLoading,
    playPost,
    pausePost,
    resumePost,
    nextPost,
    previousPost,
    seekTo,
    setVolume,
    closePlayer,
  } = useAudioPlayer();

  // Ne pas afficher le player si aucun post en cours
  if (!currentPost) return null;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    seekTo(newTime);
  };

  const getRandomAvatar = (): string => {
    const avatars: string[] = ['👩‍🎤', '👨‍💼', '🧘‍♀️', '👩‍💻', '👨‍🎨', '👩‍🔬'];
    return avatars[Math.floor(Math.random() * avatars.length)];
  };

  return (
    <div className="fixed bottom-20 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-lg z-40">
      <div className="max-w-md mx-auto px-4 py-3">
        {/* Info du post en cours */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {currentPost.profiles?.avatar_url || currentPost.users?.avatar_url ? (
              <img
                src={currentPost.profiles?.avatar_url || currentPost.users?.avatar_url}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
                {getRandomAvatar()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {currentPost.profiles?.username || currentPost.users?.username || 'Utilisateur'}
              </p>
              <div className="flex items-center space-x-2">
                {currentPost.post_tags?.slice(0, 2).map((posttag) => (
                  <span
                    key={posttag.id}
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white ${posttag.tags?.color || 'bg-purple-500'}`}
                  >
                    {posttag.tags?.emoji}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-xs text-gray-500 flex-shrink-0">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            <button
              onClick={closePlayer}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer le lecteur"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Barre de progression */}
        <div 
          className="w-full h-2 bg-gray-200 rounded-full cursor-pointer mb-3"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-purple-500 rounded-full transition-all duration-300"
            style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
        </div>

        {/* Contrôles de lecture */}
        <div className="flex items-center justify-center space-x-6">
          <button
            onClick={previousPost}
            className="text-gray-600 hover:text-purple-500 transition-colors"
            disabled={isLoading}
          >
            <SkipBack size={20} />
          </button>

          <button
            onClick={isPlaying ? pausePost : resumePost}
            disabled={isLoading}
            className="w-12 h-12 bg-purple-500 hover:bg-purple-600 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : isPlaying ? (
              <Pause size={20} />
            ) : (
              <Play size={20} className="ml-0.5" />
            )}
          </button>

          <button
            onClick={nextPost}
            className="text-gray-600 hover:text-purple-500 transition-colors"
            disabled={isLoading}
          >
            <SkipForward size={20} />
          </button>
        </div>

        {/* Waveform animée pendant la lecture */}
        {isPlaying && (
          <div className="flex items-center justify-center space-x-1 mt-3">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="w-0.5 bg-purple-400 rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 12 + 4}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalAudioPlayer;