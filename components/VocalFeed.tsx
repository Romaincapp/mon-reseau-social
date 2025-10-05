'use client'

import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Play, Pause, LogOut, MoreVertical, Edit, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLikes } from '@/hooks/useLikes';
import { useTimestampLikes } from '@/hooks/useTimestampLikes';
import AvatarWithWaveform from './AvatarWithWaveform';
import InteractiveWaveform from './InteractiveWaveform';
import StoriesCarousel from './StoriesCarousel';
import SuggestedProfiles from './SuggestedProfiles';
import BottomNavigation from './BottomNavigation';

// Types TypeScript matching database schema
interface Tag {
  id: number;
  name: string;
  emoji: string;
  color: string;
}

interface Profile {
  id: string;
  email: string | null;
  username?: string | null;
  full_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
  is_profile_complete?: boolean | null;
}

interface PostTag {
  id: string;
  post_id: string | null;
  tag_id: number | null;
  tags: Tag | null;
}

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
  profiles?: Profile | null;
  post_tags?: PostTag[];
}


// Composant pour un post individuel avec gestion des likes
interface PostCardProps {
  post: Post;
  onPlay: (post: Post) => void;
  onDelete: (post: Post) => Promise<void>;
  onComment: (postId: string) => void;
  isCurrentlyPlaying: boolean;
  isCurrentlySelected: boolean;
  menuOpen: boolean;
  onMenuToggle: () => void;
  isDeleting: boolean;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onPlay,
  onDelete,
  onComment,
  isCurrentlyPlaying,
  isCurrentlySelected,
  menuOpen,
  onMenuToggle,
  isDeleting
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const { isLiked, likesCount, loading: likesLoading, toggleLike } = useLikes(post.id, post.likes_count ?? 0);
  const { timestampLikes, addTimestampLike } = useTimestampLikes(post.id, user?.id);
  const { currentTime, seekTo } = useAudioPlayer();

  const getRandomAvatar = (): string => {
    const avatars: string[] = ['👩‍🎤', '👨‍💼', '🧘‍♀️', '👩‍💻', '👨‍🎨', '👩‍🔬'];
    return avatars[Math.floor(Math.random() * avatars.length)];
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) return 'à l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    if (diffInHours < 24) return `${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    if (diffInDays < 7) return `${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} semaine${weeks > 1 ? 's' : ''}`;
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleLikeClick = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    await toggleLike();
  };

  const handleSeek = (time: number) => {
    seekTo(time);
    if (!isCurrentlyPlaying) {
      onPlay(post);
    }
  };

  const handleTimestampLike = async (timestamp: number) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    await addTimestampLike(timestamp);
  };

  return (
    <div
      className={`bg-white rounded-2xl p-4 shadow-sm border transition-all duration-300 ${
        isCurrentlySelected
          ? 'border-purple-300 shadow-lg ring-2 ring-purple-100'
          : 'border-gray-100 hover:shadow-md'
      }`}
    >
      {/* User Info */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => router.push(`/profile/${post.user_id}`)}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
        >
          <AvatarWithWaveform
            avatar={getRandomAvatar()}
            isPlaying={isCurrentlyPlaying}
            size="md"
            avatarUrl={post.profiles?.avatar_url || undefined}
          />
          <div className="text-left">
            <p className="font-semibold text-gray-900 hover:text-purple-600 transition-colors">
              {post.profiles?.username || post.profiles?.full_name || 'Utilisateur'}
            </p>
            <p className="text-sm text-gray-500">{formatTimeAgo(post.created_at || new Date().toISOString())}</p>
          </div>
        </button>
        <div className="flex items-center space-x-2">
          {isCurrentlySelected && (
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          )}

          {/* Menu d'options (uniquement pour les posts de l'utilisateur) */}
          {user && post.user_id === user.id && (
            <div className="relative">
              <button
                onClick={onMenuToggle}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Options"
              >
                <MoreVertical size={18} />
              </button>

              {menuOpen && (
                <>
                  {/* Overlay pour fermer le menu en cliquant ailleurs */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={onMenuToggle}
                  />

                  {/* Menu dropdown */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                    <button
                      onClick={() => onDelete(post)}
                      disabled={isDeleting}
                      className="w-full flex items-center gap-2 px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors rounded-t-lg disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      <span className="text-sm font-medium">
                        {isDeleting ? 'Suppression...' : 'Supprimer'}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tags avec couleurs personnalisées */}
      {post.post_tags && post.post_tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {post.post_tags.slice(0, 3).map((postTag) => (
              <span
                key={postTag.id}
                className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-white ${postTag.tags?.color || 'bg-blue-500'}`}
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
      <div className={`rounded-xl p-4 mb-4 transition-colors ${
        isCurrentlySelected ? 'bg-purple-50' : 'bg-gray-50'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onPlay(post)}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-lg flex-shrink-0 ${
              isCurrentlySelected
                ? 'bg-purple-600 hover:bg-purple-700 scale-110'
                : 'bg-purple-500 hover:bg-purple-600'
            }`}
            aria-label={isCurrentlyPlaying ? 'Pause' : 'Play'}
          >
            {isCurrentlyPlaying ? (
              <Pause size={20} />
            ) : (
              <Play size={20} className="ml-1" />
            )}
          </button>

          <div className="flex-1">
            <InteractiveWaveform
              isPlaying={isCurrentlyPlaying}
              currentTime={isCurrentlySelected ? currentTime : 0}
              duration={post.duration}
              onSeek={handleSeek}
              onTimestampLike={handleTimestampLike}
              timestampLikes={timestampLikes}
              postId={post.id}
              userId={user?.id}
              showLikes={true}
            />
          </div>

          <span className="text-sm font-medium text-gray-600 min-w-fit flex-shrink-0">
            {formatDuration(post.duration)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between text-gray-600">
        <div className="flex items-center space-x-6">
          <button
            onClick={handleLikeClick}
            disabled={likesLoading}
            className={`flex items-center space-x-2 transition-colors duration-200 ${
              isLiked
                ? 'text-red-500 hover:text-red-600'
                : 'hover:text-red-500'
            } ${!user ? 'opacity-60' : ''} ${likesLoading ? 'opacity-50' : ''}`}
            aria-label="J'aime"
          >
            <Heart
              size={20}
              fill={isLiked ? 'currentColor' : 'none'}
              className="transition-all duration-200"
            />
            <span className="text-sm font-medium">{likesCount}</span>
          </button>

          <button
            onClick={() => onComment(post.id)}
            className={`flex items-center space-x-2 hover:text-blue-500 transition-colors duration-200 ${
              !user ? 'opacity-60' : ''
            }`}
            aria-label="Commentaires"
          >
            <MessageCircle size={20} />
            <span className="text-sm font-medium">{post.comments_count ?? 0}</span>
          </button>

          <div className="flex items-center space-x-2 text-gray-500">
            <Play size={20} />
            <span className="text-sm font-medium">{post.views_count ?? 0}</span>
          </div>
        </div>

        <button
          className="hover:text-purple-500 transition-colors duration-200"
          aria-label="Partager"
        >
          <Share2 size={20} />
        </button>
      </div>
    </div>
  );
};

const VocalFeed: React.FC = () => {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpenPostId, setMenuOpenPostId] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  // Utiliser le context audio global
  const {
    playPost,
    pausePost,
    resumePost,
    isPlaying,
    isCurrentPost,
    setPlaylist,
    currentPost
  } = useAudioPlayer();

  // Fonction pour commencer à écouter le feed depuis le premier post
  const handleStartListening = (): void => {
    if (posts.length > 0) {
      playPost(posts[0] as any, posts as any);
    }
  };

  // Utiliser le context d'authentification
  const { user, profile, signOut } = useAuth();
  
  // Récupérer les posts avec leurs tags depuis Supabase
  useEffect(() => {
    const fetchPosts = async (): Promise<void> => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            profiles (id, email, username, full_name, bio, avatar_url, created_at, is_profile_complete),
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
          // Mettre à jour la playlist globale
          setPlaylist(data || []);
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

  const handlePlay = (post: Post): void => {
    if (!post.user_id) return;

    const isCurrentlyPlaying = isCurrentPost(post.id) && isPlaying;

    if (isCurrentlyPlaying) {
      pausePost();
    } else if (isCurrentPost(post.id)) {
      resumePost();
    } else {
      playPost(post as any, posts as any);
    }
  };

  // Fonction pour gérer l'authentification obligatoire
  const requireAuth = (action: () => void): void => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    action();
  };

  // Fonction pour naviguer vers la page d'enregistrement
  const handleMicClick = (): void => {
    requireAuth(() => router.push('/record'));
  };

  // Fonction pour naviguer vers le profil
  const handleProfileClick = (): void => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (profile && !profile.is_profile_complete) {
      router.push('/profile');
      return;
    }

    router.push('/profile');
  };

  // Fonction pour gérer la déconnexion
  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Fonction pour gérer les commentaires
  const handleComment = (postId: string): void => {
    requireAuth(() => {
      // TODO: Implémenter la logique de commentaire
      console.log('Comment on post:', postId);
    });
  };

  // Fonction pour supprimer un post
  const handleDeletePost = async (post: Post): Promise<void> => {
    if (!user || post.user_id !== user.id) {
      alert('Vous ne pouvez supprimer que vos propres posts');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce voccal ?')) {
      return;
    }

    setDeletingPostId(post.id);

    try {
      // Extraire le chemin du fichier depuis l'URL
      const audioUrl = post.audio_url;
      const urlParts = audioUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'audio-files');

      if (bucketIndex !== -1) {
        const filePath = urlParts.slice(bucketIndex + 1).join('/');

        // Supprimer le fichier audio du Storage
        const { error: storageError } = await supabase.storage
          .from('audio-files')
          .remove([filePath]);

        if (storageError) {
          console.error('Erreur suppression Storage:', storageError);
        }
      }

      // Supprimer les associations de tags
      const { error: tagError } = await supabase
        .from('post_tags')
        .delete()
        .eq('post_id', post.id);

      if (tagError) {
        console.error('Erreur suppression tags:', tagError);
      }

      // Supprimer le post
      const { error: postError } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (postError) {
        throw postError;
      }

      // Mettre à jour la liste locale
      setPosts(posts.filter(p => p.id !== post.id));
      setMenuOpenPostId(null);

      console.log('✅ Post supprimé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du voccal');
    } finally {
      setDeletingPostId(null);
    }
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
    <div className="max-w-md mx-auto bg-transparent min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 pt-4 pb-6 rounded-b-3xl relative overflow-hidden">
        {/* Top bar: Logo + Déconnexion */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold vocal-pulse">Voccal</h1>
          {user && (
            <button
              onClick={handleSignOut}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
              aria-label="Se déconnecter"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>

        {/* Stories Carousel - intégré dans le header */}
        {user && <StoriesCarousel />}

        {/* Message et bouton play - plus compact */}
        {user && profile && (
          <div className="flex items-center justify-center gap-3 mt-4">
            {/* Texte */}
            <p className="text-white text-sm font-medium">
              Écoutez le monde, {profile.username}
            </p>

            {/* Bouton Play avec ondes */}
            <div className="relative">
              {/* Ondes qui se propagent autour du bouton */}
              <div className="absolute inset-0 rounded-full pointer-events-none">
                {/* Onde 1 - la plus proche */}
                <div
                  className="absolute inset-0 rounded-full border-2 border-white opacity-0"
                  style={{
                    animation: 'waveform-pulse 2s ease-out infinite',
                    animationDelay: '0s'
                  }}
                />
                {/* Onde 2 - moyenne distance */}
                <div
                  className="absolute inset-0 rounded-full border-2 border-white opacity-0"
                  style={{
                    animation: 'waveform-pulse 2s ease-out infinite',
                    animationDelay: '0.7s'
                  }}
                />
                {/* Onde 3 - la plus éloignée */}
                <div
                  className="absolute inset-0 rounded-full border-2 border-white opacity-0"
                  style={{
                    animation: 'waveform-pulse 2s ease-out infinite',
                    animationDelay: '1.4s'
                  }}
                />
              </div>

              <button
                onClick={handleStartListening}
                disabled={posts.length === 0}
                className="relative w-10 h-10 bg-white text-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed z-10"
                aria-label="Commencer l'écoute"
              >
                <Play size={18} fill="currentColor" />
              </button>
            </div>

            {/* Styles pour l'animation des ondes */}
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
        )}

        {/* Profil incomplet */}
        {user && !profile && (
          <div className="text-center py-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <p className="text-white font-medium mb-3">Complétez votre profil pour commencer</p>
              <button
                onClick={() => router.push('/profile')}
                className="bg-white text-purple-600 font-semibold px-6 py-3 rounded-full hover:bg-purple-50 transition-colors shadow-lg"
              >
                Créer mon profil
              </button>
            </div>
          </div>
        )}

        {/* Non connecté */}
        {!user && (
          <div className="text-center py-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <p className="text-white font-medium mb-3">Connectez-vous pour écouter le monde</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => router.push('/auth/login')}
                  className="bg-white text-purple-600 font-semibold px-6 py-3 rounded-full hover:bg-purple-50 transition-colors shadow-lg"
                >
                  Se connecter
                </button>
                <button
                  onClick={() => router.push('/auth/register')}
                  className="bg-purple-800 text-white font-semibold px-6 py-3 rounded-full hover:bg-purple-900 transition-colors border border-white/30"
                >
                  S'inscrire
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Posts */}
      <div className="px-4 py-6 space-y-4 pb-32">
        {/* Suggested Profiles - only show if user is logged in */}
        {user && <SuggestedProfiles />}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">Chargement des voccals...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucun voccal trouvé</p>
          </div>
        ) : (
          posts.map((post) => {
            const isCurrentlyPlaying = isCurrentPost(post.id) && isPlaying;
            const isCurrentlySelected = isCurrentPost(post.id);

            return (
              <PostCard
                key={post.id}
                post={post}
                onPlay={handlePlay}
                onDelete={handleDeletePost}
                onComment={handleComment}
                isCurrentlyPlaying={isCurrentlyPlaying}
                isCurrentlySelected={isCurrentlySelected}
                menuOpen={menuOpenPostId === post.id}
                onMenuToggle={() => setMenuOpenPostId(menuOpenPostId === post.id ? null : post.id)}
                isDeleting={deletingPostId === post.id}
              />
            );
          })
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default VocalFeed;