// contexts/AudioPlayerContext.tsx
'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Post {
  id: string;
  user_id: string | null;
  audio_url: string;
  duration: number;
  likes_count: number | null;
  comments_count: number | null;
  reposts_count?: number | null;
  views_count?: number | null;
  created_at: string | null;
  users?: {
    id: string;
    username: string | null;
    email: string | null;
    avatar_url?: string;
    bio?: string;
    created_at: string;
  };
  profiles?: {
    id: string;
    email: string | null;
    username?: string | null;
    full_name?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    created_at?: string | null;
    is_profile_complete?: boolean | null;
  } | null;
  post_tags?: Array<{
    id: string;
    post_id: string | null;
    tag_id: number | null;
    tags: {
      id: number;
      name: string;
      emoji: string;
      color: string;
    } | null;
  }>;
}

interface AudioPlayerContextType {
  // État de lecture
  currentPost: Post | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  
  // Playlist
  playlist: Post[];
  currentIndex: number;
  
  // Contrôles
  playPost: (post: Post, playlist?: Post[]) => void;
  pausePost: () => void;
  resumePost: () => void;
  nextPost: () => void;
  previousPost: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  closePlayer: () => void;

  // Utilitaires
  isCurrentPost: (postId: string) => boolean;
  setPlaylist: (posts: Post[]) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  }
  return context;
};

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [playlist, setPlaylist] = useState<Post[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [volume, setVolumeState] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialiser l'audio element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      setIsPlaying(false);
      nextPost(); // Auto-play suivant
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setIsLoading(false);
      console.error('Erreur de lecture audio');
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, []);

  const playPost = (post: Post, newPlaylist?: Post[]) => {
    if (!audioRef.current) return;

    // Mettre à jour la playlist si fournie
    if (newPlaylist) {
      setPlaylist(newPlaylist);
      const index = newPlaylist.findIndex(p => p.id === post.id);
      setCurrentIndex(index);
    } else {
      // Chercher dans la playlist existante
      const index = playlist.findIndex(p => p.id === post.id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }

    setCurrentPost(post);
    setIsLoading(true);

    // Charger le nouveau fichier audio
    audioRef.current.src = post.audio_url;
    audioRef.current.volume = volume;

    // Jouer dès que possible
    audioRef.current.play().then(async () => {
      setIsPlaying(true);
      setIsLoading(false);

      // Incrémenter le compteur de vues
      try {
        const { error } = await supabase.rpc('increment_views_count', {
          post_id: post.id
        });

        if (error) {
          console.error('Erreur incrémentation views:', error);
        }
      } catch (err) {
        console.error('Erreur inattendue incrémentation views:', err);
      }
    }).catch((error) => {
      console.error('Erreur de lecture:', error);
      setIsLoading(false);
    });
  };

  const pausePost = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resumePost = () => {
    if (audioRef.current && currentPost) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.error('Erreur de reprise:', error);
      });
    }
  };

  const nextPost = () => {
    if (playlist.length === 0) return;
    
    const nextIndex = (currentIndex + 1) % playlist.length;
    const nextPost = playlist[nextIndex];
    
    if (nextPost) {
      setCurrentIndex(nextIndex);
      playPost(nextPost);
    }
  };

  const previousPost = () => {
    if (playlist.length === 0) return;
    
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    const prevPost = playlist[prevIndex];
    
    if (prevPost) {
      setCurrentIndex(prevIndex);
      playPost(prevPost);
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const isCurrentPost = (postId: string) => {
    return currentPost?.id === postId;
  };

  const closePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setCurrentPost(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const value: AudioPlayerContextType = {
    currentPost,
    isPlaying,
    currentTime,
    duration,
    isLoading,
    playlist,
    currentIndex,
    playPost,
    pausePost,
    resumePost,
    nextPost,
    previousPost,
    seekTo,
    setVolume,
    closePlayer,
    isCurrentPost,
    setPlaylist,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
};