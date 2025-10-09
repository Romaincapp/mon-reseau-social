'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/types/database.types';
import FollowButton from './FollowButton';

interface SuggestedProfile extends Pick<Tables<'profiles'>, 'id' | 'username' | 'full_name' | 'avatar_url' | 'followers_count'> {
  posts_count?: number;
}

const SuggestedProfiles = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<SuggestedProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSuggestedProfiles();
    }
  }, [user]);

  const loadSuggestedProfiles = async () => {
    if (!user) return;

    try {
      // Get profiles that the user is NOT following, excluding self
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = followingData?.map(f => f.following_id) || [];
      const excludeIds = [...followingIds, user.id];

      // Get suggested profiles (users with posts, ordered by followers)
      const { data: suggestedData, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, followers_count')
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .order('followers_count', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Get posts count for each profile
      if (suggestedData) {
        const profilesWithCounts = await Promise.all(
          suggestedData.map(async (profile) => {
            const { count } = await supabase
              .from('posts')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', profile.id);

            return {
              ...profile,
              posts_count: count || 0
            };
          })
        );

        // Filter out profiles with no posts
        setProfiles(profilesWithCounts.filter(p => (p.posts_count || 0) > 0));
      }
    } catch (error) {
      console.error('Error loading suggested profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = (profileId: string) => {
    router.push(`/profile/${profileId}`);
  };

  const handleFollowChange = () => {
    // Reload suggestions when user follows someone
    loadSuggestedProfiles();
  };

  if (!user || loading) return null;
  if (profiles.length === 0) return null;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Profils suggérés
      </h3>
      <div className="space-y-3">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl hover:bg-gray-100/50 transition-colors"
          >
            <div
              className="flex items-center gap-3 flex-1 cursor-pointer"
              onClick={() => handleProfileClick(profile.id)}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xl">
                    {profile.full_name?.charAt(0) || profile.username?.charAt(0) || '?'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {profile.full_name || profile.username}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  @{profile.username}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500">
                    {profile.followers_count || 0} abonnés
                  </span>
                  <span className="text-xs text-gray-500">
                    {profile.posts_count || 0} vocaux
                  </span>
                </div>
              </div>
            </div>
            <div className="ml-2">
              <FollowButton
                userId={profile.id}
                size="sm"
                variant="primary"
                showIcon={false}
                onFollowChange={handleFollowChange}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedProfiles;
