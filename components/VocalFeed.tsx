'use client'

import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Play, Pause, Home, Mic, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
  const [activeTag, setActiveTag] = useState<string>('Tout');
  const [playingPost, setPlayingPost] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer tous les tags depuis Supabase
  useEffect(() => {
    const fetchTags = async (): Promise<void> => {
      try {
        const { data, error } = await supabase
          .from('tags')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('Erreur tags:', error);
          setError('Erreur lors du chargement des tags');
        } else {
          const allTagsWithAll: Tag[] = [
            { id: 0, name: 'Tout', emoji: '⭐', color: 'bg-purple-500' },
            ...(data || [])
          ];
          setAllTags(allTagsWithAll);
        }
      } catch (err) {
        console.error('Erreur inattendue:', err);
        setError('Erreur inattendue');
      }
    };

    fetchTags();
  }, []);

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

  const handleTagChange = (tagName: string): void => {
    setActiveTag(tagName);
  };

  // Compter les posts par tag
  const getPostCountForTag = (tagName: string): number => {
    if (tagName === 'Tout') return posts.length;
    return posts.filter(post => 
      post.post_tags?.some(postTag => postTag.tags.name === tagName)
    ).length;
  };

  // Filtrer les posts selon le tag actif
  const filteredPosts = posts.filter(post => {
    if (activeTag === 'Tout') return true;
    return post.post_tags?.some(postTag => postTag.tags.name === activeTag);
  });

  // Obtenir les tags populaires (les plus utilisés)
  const getPopularTags = (): Tag[] => {
    const tagCounts = new Map<string, { tag: Tag; count: number }>();
    
    posts.forEach(post => {
      post.post_tags?.forEach(postTag => {
        const tagName = postTag.tags.name;
        if (tagCounts.has(tagName)) {
          tagCounts.get(tagName)!.count++;
        } else {
          tagCounts.set(tagName, { tag: postTag.tags, count: 1 });
        }
      });
    });

    return Array.from(tagCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6) // Top 6 tags
      .map(item => item.tag);
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

      {/* Tags populaires */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Tags populaires</h2>
        <div className="flex space-x-3 overflow-x-auto pb-2">
          <button
            onClick={() => handleTagChange('Tout')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
              activeTag === 'Tout'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="text-lg animate-bounce">⭐</span>
            <span className="font-medium">Tout</span>
            <span className={`text-xs px-2 py-1 rounded-full ml-1 ${
              activeTag === 'Tout' 
                ? 'bg-white/20 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {posts.length}
            </span>
          </button>
          {getPopularTags().map((tag) => (
            <button
              key={tag.id}
              onClick={() => handleTagChange(tag.name)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
                activeTag === tag.name
                  ? `${tag.color} text-white shadow-lg`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-lg animate-bounce">{tag.emoji}</span>
              <span className="font-medium">{tag.name}</span>
              <span className={`text-xs px-2 py-1 rounded-full ml-1 ${
                activeTag === tag.name 
                  ? 'bg-white/20 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {getPostCountForTag(tag.name)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading ou Posts */}
      <div className="px-4 space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">Chargement des vocaux...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {activeTag === 'Tout' 
                ? 'Aucun vocal trouvé' 
                : `Aucun vocal avec le tag "${activeTag}"`
              }
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
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

              {/* Tags Netflix-style */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-1.5">
                  {post.post_tags?.slice(0, 3).map((postTag, index) => (
                    <button
                      key={postTag.id}
                      onClick={() => handleTagChange(postTag.tags.name)}
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 hover:scale-105 ${postTag.tags.color} text-white min-w-fit`}
                    >
                      <span className="text-xs">{postTag.tags.emoji}</span>
                      <span className="whitespace-nowrap">{postTag.tags.name}</span>
                    </button>
                  ))}
                  {(post.post_tags?.length || 0) > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-600">
                      +{(post.post_tags?.length || 0) - 3}
                    </span>
                  )}
                </div>
              </div>

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

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <button className="p-3 text-purple-500" aria-label="Accueil">
            <Home size={24} />
          </button>
          <button className="p-3 text-gray-400 hover:text-purple-500 transition-colors duration-200" aria-label="Enregistrer">
            <Mic size={24} />
          </button>
          <button className="p-3 text-gray-400 hover:text-purple-500 transition-colors duration-200" aria-label="Profil">
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