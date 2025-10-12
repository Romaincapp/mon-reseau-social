'use client'

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, MessageCircle, Play, Pause, Calendar, Mail, Mic, Eye, ThumbsUp, Clock } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useAudioPlayer } from '../../../contexts/AudioPlayerContext';
import { supabase } from '../../../lib/supabase';
import AvatarWithWaveform from '../../../components/AvatarWithWaveform';
import BottomNavigation from '../../../components/BottomNavigation';
import FollowButton from '../../../components/FollowButton';
import ScrollStack from '../../../components/ScrollStack';

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

  const handleSendMessage = async () => {
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    try {
      // Check if a 1-to-1 conversation already exists between these two users
      const { data: myParticipations, error: myParticipationsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, conversations!inner(is_group)')
        .eq('user_id', currentUser.id);

      if (myParticipationsError) {
        console.error('Error fetching my participations:', myParticipationsError);
        throw new Error('Erreur lors de la vérification des conversations existantes');
      }

      if (myParticipations && myParticipations.length > 0) {
        // Filter only 1-to-1 conversations (not groups)
        const oneToOneConversationIds = myParticipations
          .filter((p: any) => p.conversations && !p.conversations.is_group)
          .map((p: any) => p.conversation_id);

        if (oneToOneConversationIds.length > 0) {
          // Check if the other user is in any of these 1-to-1 conversations
          const { data: otherUserParticipations, error: otherUserError } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', userId)
            .in('conversation_id', oneToOneConversationIds);

          if (otherUserError) {
            console.error('Error checking other user participations:', otherUserError);
            throw new Error('Erreur lors de la vérification des conversations');
          }

          // If we found a common 1-to-1 conversation, verify it only has 2 participants
          if (otherUserParticipations && otherUserParticipations.length > 0) {
            const commonConvId = otherUserParticipations[0].conversation_id;

            // Verify this conversation has exactly 2 participants
            const { count, error: countError } = await supabase
              .from('conversation_participants')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', commonConvId);

            if (countError) {
              console.error('Error counting participants:', countError);
            } else if (count === 2) {
              // Perfect! This is a 1-to-1 conversation between these exact 2 users
              router.push(`/messages/${commonConvId}`);
              return;
            }
          }
        }
      }

      // No existing conversation found - create new one using RPC function
      const { data: conversationId, error: convError } = await supabase
        .rpc('create_conversation_with_participants' as any, {
          other_user_id: userId
        });

      if (convError) {
        console.error('Error creating conversation:', convError);
        throw new Error('Erreur lors de la création de la conversation');
      }

      // Redirect to the new conversation
      router.push(`/messages/${conversationId}`);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'envoi du message';
      alert(errorMessage);
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
            onClick={() => router.push('/feed')}
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
            onClick={() => router.push('/feed')}
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

          {/* Action Buttons */}
          <div className="mb-4 flex gap-3 justify-center">
            <FollowButton
              userId={userId}
              size="md"
              variant="primary"
              onFollowChange={(isFollowing) => {
                // Optionally refresh profile to update follower count
                fetchUserProfile();
              }}
            />
            {currentUser && (
              <button
                onClick={handleSendMessage}
                className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full font-semibold flex items-center gap-2 transition-all"
              >
                <Mail size={18} />
                Message
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-2">
            <div className="text-center">
              <div className="text-xl font-bold">{stats.postsCount}</div>
              <div className="text-purple-200 text-xs">Vocaux</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{profile.followers_count || 0}</div>
              <div className="text-purple-200 text-xs">Abonnés</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{profile.following_count || 0}</div>
              <div className="text-purple-200 text-xs">Abonnements</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{stats.totalLikes}</div>
              <div className="text-purple-200 text-xs">J'aime</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{stats.totalViews}</div>
              <div className="text-purple-200 text-xs">Écoutes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics with Scroll Stack */}
      <div className="px-6 py-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Statistiques</h3>
        <ScrollStack
          items={[
            {
              icon: Mic,
              title: 'Vocaux publiés',
              value: stats.postsCount,
              description: `${profile.username || profile.full_name} a partagé ${stats.postsCount} message${stats.postsCount > 1 ? 's' : ''} vocal${stats.postsCount > 1 ? 'aux' : ''}`,
              color: 'purple',
              bgGradient: 'bg-gradient-to-br from-purple-500 to-purple-700'
            },
            {
              icon: Eye,
              title: 'Écoutes totales',
              value: stats.totalViews,
              description: `${stats.totalViews} écoute${stats.totalViews > 1 ? 's' : ''} cumulée${stats.totalViews > 1 ? 's' : ''} sur l'ensemble des vocaux`,
              color: 'blue',
              bgGradient: 'bg-gradient-to-br from-blue-500 to-blue-700'
            },
            {
              icon: ThumbsUp,
              title: 'J\'aime reçus',
              value: stats.totalLikes,
              description: `${stats.totalLikes} personne${stats.totalLikes > 1 ? 's ont' : ' a'} aimé les vocaux`,
              color: 'pink',
              bgGradient: 'bg-gradient-to-br from-pink-500 to-pink-700'
            },
            {
              icon: Clock,
              title: 'Durée totale',
              value: formatDuration(stats.totalDuration),
              description: `Temps total d'enregistrement partagé`,
              color: 'indigo',
              bgGradient: 'bg-gradient-to-br from-indigo-500 to-indigo-700'
            }
          ]}
        />
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
