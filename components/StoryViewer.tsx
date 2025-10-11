'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X, Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight, Share2, Copy, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserStories, markStoryAsViewed, type Story } from '@/lib/stories';
import { useRouter } from 'next/navigation';
import { useShare } from '@/hooks/useShare';

interface StoryViewerProps {
  userId: string;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ userId }) => {
  const { user } = useAuth();
  const router = useRouter();
  const { share, copyToClipboard, canShare } = useShare();
  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [showCopied, setShowCopied] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadStories();

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [userId]);

  const loadStories = async () => {
    try {
      const data = await getUserStories(userId, user?.id);
      setStories(data);
      setLoading(false);

      if (data.length > 0) {
        playStory(0);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
      setLoading(false);
    }
  };

  const playStory = async (index: number) => {
    if (!stories[index] || !audioRef.current) return;

    setCurrentIndex(index);
    setProgress(0);
    setAudioError(null);

    // Mark as viewed
    if (user && !stories[index].has_viewed) {
      try {
        await markStoryAsViewed(stories[index].id, user.id);
        stories[index].has_viewed = true;
      } catch (error) {
        console.error('Error marking story as viewed:', error);
      }
    }

    try {
      audioRef.current.src = stories[index].audio_url;
      await audioRef.current.play();
      setIsPlaying(true);

      // Update progress
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      progressIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          const percent = (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setProgress(percent);
        }
      }, 100);
    } catch (error) {
      console.error('Error playing audio:', error);
      setAudioError('Impossible de lire cette story');
      setIsPlaying(false);
    }
  };

  const handleAudioEnd = () => {
    if (currentIndex < stories.length - 1) {
      playStory(currentIndex + 1);
    } else {
      handleClose();
    }
  };

  const handlePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
        setAudioError(null);

        progressIntervalRef.current = setInterval(() => {
          if (audioRef.current) {
            const percent = (audioRef.current.currentTime / audioRef.current.duration) * 100;
            setProgress(percent);
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
      setAudioError('Erreur de lecture audio');
      setIsPlaying(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      playStory(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      playStory(currentIndex + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    router.back();
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleShare = async () => {
    const currentStory = stories[currentIndex];
    if (!currentStory) return;

    const shareUrl = `${window.location.origin}/story/${userId}`;
    const success = await share({
      title: `Story de ${currentStory.profiles.username || currentStory.profiles.full_name}`,
      text: 'Regarde cette story !',
      url: shareUrl
    });

    if (success && !canShare) {
      // If fallback to clipboard was used
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  const handleAudioError = () => {
    console.error('Audio failed to load');
    setAudioError('Impossible de charger cette story');
    setIsPlaying(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">Aucune story disponible</p>
          <button
            onClick={handleClose}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  const currentStory = stories[currentIndex];

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-4 z-10">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-6 left-0 right-0 flex items-center justify-between px-4 pt-4 z-10">
        <div className="flex items-center gap-3">
          <img
            src={currentStory.profiles.avatar_url || '/default-avatar.png'}
            alt={currentStory.profiles.username || 'User'}
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <div>
            <p className="text-white font-semibold">
              {currentStory.profiles.username || 'Unknown'}
            </p>
            <p className="text-white/70 text-sm">
              {new Date(currentStory.created_at).toLocaleDateString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main content area - click handlers for navigation */}
      <div className="w-full h-full flex">
        {/* Left area - previous */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="flex-1 flex items-center justify-start pl-8 hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="w-12 h-12 text-white/50" />
          </button>
        )}

        {/* Center area - play/pause */}
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          {audioError && (
            <div className="bg-red-500/90 backdrop-blur-sm px-4 py-2 rounded-full">
              <p className="text-white text-sm font-medium">{audioError}</p>
            </div>
          )}

          <button
            onClick={handlePlayPause}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-6 rounded-full transition-all transform hover:scale-110"
            disabled={!!audioError}
          >
            {isPlaying ? (
              <Pause className="w-12 h-12 text-white" />
            ) : (
              <Play className="w-12 h-12 text-white ml-1" />
            )}
          </button>
        </div>

        {/* Right area - next */}
        <button
          onClick={handleNext}
          className="flex-1 flex items-center justify-end pr-8 hover:bg-white/5 transition-colors"
        >
          <ChevronRight className="w-12 h-12 text-white/50" />
        </button>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <p className="text-lg font-semibold mb-1">
              Story {currentIndex + 1}/{stories.length}
            </p>
            <p className="text-white/70 text-sm">
              {currentStory.views_count} vue{currentStory.views_count > 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-full transition-colors relative"
              title="Partager"
            >
              {showCopied ? (
                <Check className="w-6 h-6 text-green-400" />
              ) : canShare ? (
                <Share2 className="w-6 h-6 text-white" />
              ) : (
                <Copy className="w-6 h-6 text-white" />
              )}
            </button>

            <button
              onClick={toggleMute}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-full transition-colors"
              title={isMuted ? "Activer le son" : "Couper le son"}
            >
              {isMuted ? (
                <VolumeX className="w-6 h-6 text-white" />
              ) : (
                <Volume2 className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Audio element */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnd}
        onError={handleAudioError}
        className="hidden"
        preload="auto"
      />
    </div>
  );
};

export default StoryViewer;
