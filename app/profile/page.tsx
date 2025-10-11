'use client'

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Edit3, Calendar, Mail, User, Lock, Eye, EyeOff, Heart, MessageCircle, Play, Pause } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';
import { supabase } from '../../lib/supabase';
import ProtectedRoute from '../../components/ProtectedRoute';
import AvatarWithWaveform from '../../components/AvatarWithWaveform';
import BottomNavigation from '../../components/BottomNavigation';

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

interface ProfileStats {
  postsCount: number;
  totalLikes: number;
  totalComments: number;
  totalDuration: number;
  totalViews: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, updateProfile } = useAuth();
  const { playPost, pausePost, isPlaying, isCurrentPost } = useAudioPlayer();

  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<ProfileStats>({
    postsCount: 0,
    totalLikes: 0,
    totalComments: 0,
    totalDuration: 0,
    totalViews: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    setEditBio(profile?.bio || '');
    // Remove @ prefix if present for editing
    setEditUsername(profile?.username?.replace('@', '') || '');
    setEditFullName(profile?.full_name || '');
    fetchUserPosts();
  }, [profile]);

  const fetchUserPosts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user posts:', error);
        setLoading(false);
        return;
      }

      setUserPosts(posts || []);

      // Calculate stats
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
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBioSave = async () => {
    const { error } = await updateProfile({
      bio: editBio.trim()
    });

    if (!error) {
      setIsEditing(false);
    }
  };

  const handleProfileSave = async () => {
    // Validation
    if (!editUsername.trim()) {
      alert('Le nom d\'utilisateur ne peut pas être vide');
      return;
    }

    if (!editFullName.trim()) {
      alert('Le nom complet ne peut pas être vide');
      return;
    }

    setSaving(true);

    const updates: any = {};

    // Add @ prefix to username if not present
    const formattedUsername = editUsername.trim().startsWith('@')
      ? editUsername.trim()
      : `@${editUsername.trim()}`;

    if (formattedUsername !== profile?.username) {
      updates.username = formattedUsername;
    }

    if (editFullName.trim() !== profile?.full_name) {
      updates.full_name = editFullName.trim();
    }

    if (Object.keys(updates).length === 0) {
      setIsEditingProfile(false);
      setSaving(false);
      return;
    }

    try {
      const { error } = await updateProfile(updates);

      if (error) {
        console.error('Error updating profile:', error);

        // Check for unique constraint violation
        if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
          alert('Ce nom d\'utilisateur est déjà pris. Veuillez en choisir un autre.');
        } else {
          alert(`Erreur lors de la mise à jour : ${error.message || 'Erreur inconnue'}`);
        }
      } else {
        setIsEditingProfile(false);
        console.log('Profile updated successfully!');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Erreur inattendue lors de la mise à jour');
    } finally {
      setSaving(false);
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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setAvatarMessage({ type: 'error', text: 'Veuillez sélectionner une image' });
      setTimeout(() => setAvatarMessage(null), 4000);
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarMessage({ type: 'error', text: 'L\'image ne doit pas dépasser 5MB' });
      setTimeout(() => setAvatarMessage(null), 4000);
      return;
    }

    setUploadingAvatar(true);

    try {
      // Supprimer l'ancien avatar s'il existe
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload le nouveau fichier
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setAvatarMessage({ type: 'error', text: 'Erreur lors de l\'upload de l\'image' });
        setTimeout(() => setAvatarMessage(null), 4000);
        return;
      }

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('📸 Public URL générée:', publicUrl);

      // Mettre à jour le profil avec la nouvelle URL
      const { error: updateError } = await updateProfile({
        avatar_url: publicUrl
      });

      if (updateError) {
        console.error('❌ Update error:', updateError);
        setAvatarMessage({ type: 'error', text: 'Erreur lors de la mise à jour du profil' });
        setTimeout(() => setAvatarMessage(null), 4000);
      } else {
        console.log('✅ Avatar mis à jour avec succès!');
        console.log('📸 Nouvelle URL dans le profil:', publicUrl);
        setAvatarMessage({ type: 'success', text: 'Photo de profil mise à jour avec succès !' });
        setTimeout(() => setAvatarMessage(null), 4000);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAvatarMessage({ type: 'error', text: 'Erreur inattendue lors de l\'upload' });
      setTimeout(() => setAvatarMessage(null), 4000);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePlay = (post: Post): void => {
    const isCurrentlyPlaying = isCurrentPost(post.id) && isPlaying;

    if (isCurrentlyPlaying) {
      pausePost();
    } else {
      playPost(post, userPosts);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
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
            <h1 className="text-xl font-bold">Mon Profil</h1>
            <button
              onClick={() => router.push('/profile/settings')}
              className="text-white/80 hover:text-white"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>

          {/* Profile Header */}
          <div className="text-center">
            <div className="mb-4 mx-auto inline-block relative">
              <AvatarWithWaveform
                avatar={getRandomAvatar()}
                isPlaying={false}
                size="xl"
                alwaysAnimate={true}
                avatarUrl={profile?.avatar_url}
              />

              {/* Overlay d'upload avec indicateur de progression */}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent mb-2 mx-auto"></div>
                    <p className="text-white text-xs font-medium">Upload...</p>
                  </div>
                </div>
              )}

              {/* Bouton pour changer la photo */}
              <label
                htmlFor="avatar-upload"
                className={`absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg transition-colors ${
                  uploadingAvatar ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-50'
                }`}
              >
                {uploadingAvatar ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
                ) : (
                  <Edit3 className="w-5 h-5 text-purple-600" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploadingAvatar}
              />
            </div>

            {/* Message de succès/erreur pour l'avatar */}
            {avatarMessage && (
              <div className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium ${
                avatarMessage.type === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {avatarMessage.text}
              </div>
            )}
            <h2 className="text-2xl font-bold mb-1">{profile?.full_name || 'Nom non défini'}</h2>
            <p className="text-purple-200 mb-4">{profile?.username || 'username'}</p>

            {/* Bio Section */}
            <div className="bg-white/10 rounded-2xl p-4 mb-4">
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full bg-white/20 text-white placeholder-white/60 rounded-lg p-3 resize-none"
                    placeholder="Parlez-nous de vous..."
                    rows={3}
                    maxLength={160}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleBioSave}
                      className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded-lg text-sm"
                    >
                      Sauvegarder
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditBio(profile?.bio || '');
                      }}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg text-sm"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <p className="text-white/90 text-sm flex-1 text-left">
                    {profile?.bio || "Aucune bio pour le moment..."}
                  </p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="ml-2 text-white/60 hover:text-white"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

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

        {/* Tab Navigation */}
        <div className="px-6 py-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('public')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === 'public'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Eye className="w-4 h-4" />
              Infos publiques
            </button>
            <button
              onClick={() => setActiveTab('private')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === 'private'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Lock className="w-4 h-4" />
              Infos privées
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-6 pb-32">
          {activeTab === 'public' ? (
            <div className="space-y-6">
              {/* Public Information */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Informations publiques</h3>
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      Modifier
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom d'utilisateur
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">@</span>
                        <input
                          type="text"
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="username"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom complet
                      </label>
                      <input
                        type="text"
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Votre nom complet"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleProfileSave}
                        disabled={saving}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white py-2 px-4 rounded-lg font-medium"
                      >
                        {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingProfile(false);
                          setEditUsername(profile?.username?.replace('@', '') || '');
                          setEditFullName(profile?.full_name || '');
                        }}
                        disabled={saving}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg font-medium"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Nom d'utilisateur</p>
                        <p className="font-medium">{profile?.username || 'username'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Nom complet</p>
                        <p className="font-medium">{profile?.full_name || 'Nom non défini'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Membre depuis</p>
                        <p className="font-medium">{profile?.created_at ? formatDate(profile.created_at) : 'Date inconnue'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Posts */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mes vocaux ({stats.postsCount})</h3>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                  </div>
                ) : userPosts.length === 0 ? (
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
                                <span>{post.views_count || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Private Information */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations privées</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{profile?.email || 'Email non défini'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Nom complet</p>
                      <p className="font-medium">{profile?.full_name || 'Nom non défini'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Compte créé le</p>
                      <p className="font-medium">{profile?.created_at ? formatDate(profile.created_at) : 'Date inconnue'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Statistics */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques du compte</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{stats.postsCount}</div>
                    <div className="text-sm text-purple-500">Vocaux publiés</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{stats.totalLikes}</div>
                    <div className="text-sm text-red-500">J'aime reçus</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{stats.totalViews}</div>
                    <div className="text-sm text-orange-500">Écoutes totales</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalComments}</div>
                    <div className="text-sm text-blue-500">Commentaires</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg col-span-2">
                    <div className="text-2xl font-bold text-green-600">{formatDuration(stats.totalDuration)}</div>
                    <div className="text-sm text-green-500">Temps total enregistré</div>
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidentialité</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Profil public</p>
                      <p className="text-sm text-gray-500">Votre profil est visible par tous</p>
                    </div>
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Email privé</p>
                      <p className="text-sm text-gray-500">Votre email n'est pas visible</p>
                    </div>
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Spacer */}
        <div className="h-20"></div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </ProtectedRoute>
  );
}