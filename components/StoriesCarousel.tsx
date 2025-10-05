'use client';

import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getStoriesGroupedByUser, type Story } from '@/lib/stories';
import { Tables } from '@/types/database.types';
import { useRouter } from 'next/navigation';

interface StoryGroup {
  user: Pick<Tables<'profiles'>, 'id' | 'username' | 'avatar_url' | 'full_name'>;
  stories: Story[];
  has_unviewed: boolean;
}

const StoriesCarousel = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStories();
    }
  }, [user]);

  const loadStories = async () => {
    if (!user) return;

    try {
      const groups = await getStoriesGroupedByUser(user.id);
      setStoryGroups(groups);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryClick = (storyGroup: StoryGroup) => {
    // Naviguer vers le viewer de story
    router.push(`/story/${storyGroup.user.id}`);
  };

  const handleCreateStory = () => {
    router.push('/record');
  };

  if (!user || loading) return null;

  return (
    <div className="px-2">
      <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {/* Create Story Button */}
        <button
          onClick={handleCreateStory}
          className="flex-shrink-0 flex flex-col items-center gap-1 group"
        >
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center border-2 border-white/30 group-hover:border-white/50 transition-all">
              <Plus className="w-6 h-6 text-white" />
            </div>
          </div>
          <span className="text-[10px] text-white/90 font-medium max-w-[60px] truncate">
            Créer
          </span>
        </button>

        {/* Story Groups */}
        {storyGroups.map((group) => (
          <button
            key={group.user.id}
            onClick={() => handleStoryClick(group)}
            className="flex-shrink-0 flex flex-col items-center gap-1 group"
          >
            <div className="relative">
              {/* Ring indicator for unviewed stories */}
              <div className={`absolute inset-0 rounded-full ${
                group.has_unviewed
                  ? 'bg-gradient-to-tr from-purple-400 via-pink-400 to-orange-400'
                  : 'bg-white/30'
              } p-[2px]`}>
                <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-700 to-indigo-700 p-[2px]">
                  <img
                    src={group.user.avatar_url || '/default-avatar.png'}
                    alt={group.user.username || 'User'}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <div className="w-14 h-14" /> {/* Spacer for absolute positioning */}
            </div>
            <span className="text-[10px] text-white/90 font-medium max-w-[60px] truncate">
              {group.user.id === user.id ? 'Vous' : group.user.username}
            </span>
          </button>
        ))}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default StoriesCarousel;
