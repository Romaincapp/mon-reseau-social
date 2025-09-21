'use client'

import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Play, Pause, Home, Mic, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

// Types TypeScript
interface Tag {
  id: number;
  name: string;
  emoji: string;
  color: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

interface PostTag {
  id: string;
  post_id: string;
  tag_id: number;
  tags: Tag;
}

interface Post {
  id: string;
  user_id: string;
  audio_url: string;
  duration: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  users?: User;
  post_tags?: PostTag[];
}

interface WaveformProps {
  isPlaying: boolean;
}



const VocalFeed: React.FC = () => {
  const router = useRouter(); // Hook pour la navigation
  const [playingPost, setPlayingPost] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Récupérer les posts avec leurs tags depuis Supabase
  useEffect(() => {
    const fetchPosts = async (): Promise<void> => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            users (id, username, email, avatar_url, bio, created_at),
            post_tags (
              id,
              post_id,
              tag_id,
              tags (id, name, emoji, color)
            )
          `)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Erreur posts:', error);
          setError('Erreur lors du chargement des posts');
        } else {
          setPosts(data || []);
        }
      } catch (err) {
        console.error('Erreur inattendue:', err);
        setError('Erreur inattendue');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const getRandomAvatar = (): string => {
    const avatars: string[] = ['👩‍🎤', '👨‍💼', '🧘‍♀️', '👩‍💻', '👨‍🎨', '👩‍🔬'];
    return avatars[Math.floor(Math.random() * avatars.length)];
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'il y a quelques minutes';
    if (diffInHours < 24) return `il y a ${diffInHours}h`;
    return `il y a ${Math.floor(diffInHours / 24)}j`;
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlay = (postId: string): void => {
    setPlayingPost(playingPost === postId ? null : postId);
  };

  // Fonction pour naviguer vers la page d'enregistrement
  const handleMicClick = (): void => {
    router.push('/record');
  };

  // Fonction pour naviguer vers le profil (optionnel)
  const handleProfileClick = (): void => {
    router.push('/profile');
  };

  const Waveform: React.FC<WaveformProps> = ({ isPlaying }) => {
    const bars = Array.from({ length: 20 }, (_, i) => (
      <div
        key={i}
        className={`w-1 bg-gray-300 rounded-full transition-all duration-300 ${
          isPlaying ? 'animate-pulse' : ''
        }`}
        style={{
          height: `${Math.random() * 20 + 10}px`,
          animationDelay: `${i * 0.1}s`
        }}
      />
    ));

    return (
      <div className="flex items-center space-x-1 flex-1 mx-4">
        {bars}
      </div>
    );
  };

  if (error) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">❌ {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-purple-500 text-white rounded-lg"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-2">
          <div className="w-6 h-6"></div>
          <div className="text-sm opacity-90">9:41</div>
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-1">Vocal</h1>
        <p className="text-purple-200">Écoutez le monde</p>
      </div>

      {/* Posts */}
      <div className="px-4 py-6 space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">Chargement des vocaux...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucun vocal trouvé</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              {/* User Info */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xl">
                    {getRandomAvatar()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{post.users?.username || 'Utilisateur'}</p>
                    <p className="text-sm text-gray-500">{formatTimeAgo(post.created_at)}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {formatDuration(post.duration)}
                </span>
              </div>

              {/* Tags avec couleurs personnalisées */}
              {post.post_tags && post.post_tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {post.post_tags.slice(0, 3).map((postTag) => (
                      <span
                        key={postTag.id}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-500 text-white"
                      >
                        {postTag.tags?.emoji} {postTag.tags?.name}
                      </span>
                    ))}
                    {(post.post_tags?.length || 0) > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-600">
                        +{(post.post_tags?.length || 0) - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Audio Player */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center">
                  <button
                    onClick={() => handlePlay(post.id)}
                    className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white hover:bg-purple-600 transition-colors duration-200 shadow-lg"
                    aria-label={playingPost === post.id ? 'Pause' : 'Play'}
                  >
                    {playingPost === post.id ? (
                      <Pause size={20} />
                    ) : (
                      <Play size={20} className="ml-1" />
                    )}
                  </button>
                  
                  <Waveform isPlaying={playingPost === post.id} />
                  
                  <span className="text-sm font-medium text-gray-600 min-w-fit">
                    {formatDuration(post.duration)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between text-gray-600">
                <div className="flex items-center space-x-6">
                  <button 
                    className="flex items-center space-x-2 hover:text-red-500 transition-colors duration-200"
                    aria-label="J'aime"
                  >
                    <Heart size={20} />
                    <span className="text-sm font-medium">{post.likes_count}</span>
                  </button>
                  
                  <button 
                    className="flex items-center space-x-2 hover:text-blue-500 transition-colors duration-200"
                    aria-label="Commentaires"
                  >
                    <MessageCircle size={20} />
                    <span className="text-sm font-medium">{post.comments_count}</span>
                  </button>
                </div>
                
                <button 
                  className="hover:text-purple-500 transition-colors duration-200"
                  aria-label="Partager"
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Navigation avec bouton micro fonctionnel */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <button className="p-3 text-purple-500" aria-label="Accueil">
            <Home size={24} />
          </button>
          <button 
            onClick={handleMicClick}
            className="p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg transform hover:scale-105 transition-all duration-200" 
            aria-label="Enregistrer"
          >
            <Mic size={24} />
          </button>
          <button 
            onClick={handleProfileClick}
            className="p-3 text-gray-400 hover:text-purple-500 transition-colors duration-200" 
            aria-label="Profil"
          >
            <User size={24} />
          </button>
        </div>
      </div>

      {/* Spacing for bottom nav */}
      <div className="h-20"></div>
    </div>
  );
};

export default VocalFeed;