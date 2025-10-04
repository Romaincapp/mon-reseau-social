'use client'

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, MessageCircle, Play, Pause, Calendar } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useAudioPlayer } from '../../../contexts/AudioPlayerContext';
import { supabase } from '../../../lib/supabase';
import AvatarWithWaveform from '../../../components/AvatarWithWaveform';
import BottomNavigation from '../../../components/BottomNavigation';

interface Post {
  id: string;
  user_id: string | null;
  audio_url: string;
  duration: number;
  likes_count: number | null;
  comments_count: number | null;
  views_count: number | null;
  reposts_count: number | null;
  created_at: string | null;
}

interface Profile {
  id: string;
  email: string | null;
  username?: string | null;
  full_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
  followers_count?: number | null;
  following_count?: number | null;
  is_profile_complete?: boolean | null;
}

interface ProfileStats {
  postsCount: number;
  totalLikes: number;
  totalComments: number;
  totalDuration: number;
  totalViews: number;
}

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.user_id as string;
  const { user: currentUser } = useAuth();
  const { playPost, pausePost, isPlaying, isCurrentPost } = useAudioPlayer();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<ProfileStats>({
    postsCount: 0,
    totalLikes: 0,
    totalComments: 0,
    totalDuration: 0,
    totalViews: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Si c'est le profil de l'utilisateur connecté, rediriger vers /profile
    if (currentUser && userId === currentUser.id) {
      router.push('/profile');
      return;
    }

    fetchUserProfile();
  }, [userId, currentUser]);

  const fetchUserProfile = async () => {
    try {
      // Récupérer le profil de l'utilisateur
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError('Profil introuvable');
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Récupérer les posts de l'utilisateur
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching user posts:', postsError);
        setError('Erreur lors du chargement des posts');
        setLoading(false);
        return;
      }

      setUserPosts(posts || []);

      // Calculer les statistiques
      const totalLikes = posts?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0;
      const totalComments = posts?.reduce((sum, post) => sum + (post.comments_count || 0), 0) || 0;
      const totalDuration = posts?.reduce((sum, post) => sum + post.duration, 0) || 0;
      const totalViews = posts?.reduce((sum, post) => sum + (post.views_count || 0), 0) || 0;

      setStats({
        postsCount: posts?.length || 0,
        totalLikes,
        totalComments,
        totalDuration,
        totalViews
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Erreur inattendue');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRandomAvatar = (): string => {
    const avatars: string[] = ['👩‍🎤', '👨‍💼', '🧘‍♀️', '👩‍💻', '👨‍🎨', '👩‍🔬'];
    return avatars[Math.floor(Math.random() * avatars.length)];
  };

  const handlePlay = (post: Post): void => {
    const isCurrentlyPlaying = isCurrentPost(post.id) && isPlaying;

    if (isCurrentlyPlaying) {
      pausePost();
    } else {
      playPost(post, userPosts);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto bg-transparent min-h-screen">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-8 rounded-b-3xl">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="text-white/80 hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Profil</h1>
            <div className="w-6"></div>
          </div>
        </div>
        <div className="text-center py-12 px-6">
          <p className="text-gray-500 text-lg">{error || 'Profil introuvable'}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Retour au feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-transparent min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/')}
            className="text-white/80 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Profil</h1>
          <div className="w-6"></div>
        </div>

        {/* Profile Header */}
        <div className="text-center">
          <div className="mb-4 mx-auto inline-block">
            <AvatarWithWaveform
              avatar={getRandomAvatar()}
              isPlaying={false}
              size="xl"
              alwaysAnimate={true}
              avatarUrl={profile.avatar_url || undefined}
            />
          </div>
          <h2 className="text-2xl font-bold mb-1">{profile.full_name || 'Nom non défini'}</h2>
          <p className="text-purple-200 mb-4">{profile.username || '@username'}</p>

          {/* Bio Section */}
          {profile.bio && (
            <div className="bg-white/10 rounded-2xl p-4 mb-4">
              <p className="text-white/90 text-sm">{profile.bio}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-xl font-bold">{stats.postsCount}</div>
              <div className="text-purple-200 text-xs">Vocaux</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{stats.totalLikes}</div>
              <div className="text-purple-200 text-xs">J'aime</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{stats.totalViews}</div>
              <div className="text-purple-200 text-xs">Écoutes</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{formatDuration(stats.totalDuration)}</div>
              <div className="text-purple-200 text-xs">Durée</div>
            </div>
          </div>
        </div>
      </div>

      {/* User Posts */}
      <div className="px-6 py-6 pb-32">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Vocaux de {profile.username || profile.full_name} ({stats.postsCount})
          </h3>
          {userPosts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucun vocal publié pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userPosts.map((post) => {
                const isCurrentlyPlaying = isCurrentPost(post.id) && isPlaying;

                return (
                  <div key={post.id} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">
                        {formatDate(post.created_at)}
                      </span>
                      <span className="text-sm font-medium text-gray-600">
                        {formatDuration(post.duration)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handlePlay(post)}
                        className="w-10 h-10 bg-purple-500 hover:bg-purple-600 text-white rounded-full flex items-center justify-center"
                      >
                        {isCurrentlyPlaying ? (
                          <Pause size={16} />
                        ) : (
                          <Play size={16} className="ml-0.5" />
                        )}
                      </button>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Heart size={16} />
                          <span>{post.likes_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle size={16} />
                          <span>{post.comments_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Play size={16} />
                          <span>{post.views_count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Member Since */}
        {profile.created_at && (
          <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="w-5 h-5" />
              <div>
                <p className="text-sm text-gray-500">Membre depuis</p>
                <p className="font-medium">{formatDate(profile.created_at)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
