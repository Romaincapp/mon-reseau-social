import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useRepost = (postId: string, initialRepostsCount: number, userId?: string) => {
  const [isReposted, setIsReposted] = useState(false);
  const [repostsCount, setRepostsCount] = useState(initialRepostsCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      checkRepostStatus();
    }
  }, [postId, userId]);

  const checkRepostStatus = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('reposts')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setIsReposted(!!data);
    } catch (error) {
      console.error('Error checking repost status:', error);
    }
  };

  const toggleRepost = async (comment?: string) => {
    if (!userId || loading) return;

    setLoading(true);

    try {
      if (isReposted) {
        // Remove repost
        const { error } = await supabase
          .from('reposts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);

        if (error) throw error;

        // Decrement count
        await supabase.rpc('decrement_reposts_count', { post_id: postId });

        setIsReposted(false);
        setRepostsCount(prev => Math.max(0, prev - 1));
      } else {
        // Add repost
        const { error } = await supabase
          .from('reposts')
          .insert({
            post_id: postId,
            user_id: userId,
            comment: comment || null
          });

        if (error) throw error;

        // Increment count
        await supabase.rpc('increment_reposts_count', { post_id: postId });

        setIsReposted(true);
        setRepostsCount(prev => prev + 1);

        // Create notification for post owner
        const { data: postData } = await supabase
          .from('posts')
          .select('user_id')
          .eq('id', postId)
          .single();

        if (postData && postData.user_id !== userId) {
          await supabase
            .from('notifications')
            .insert({
              user_id: postData.user_id,
              actor_id: userId,
              type: 'repost',
              post_id: postId
            });
        }
      }
    } catch (error) {
      console.error('Error toggling repost:', error);
    } finally {
      setLoading(false);
    }
  };

  return { isReposted, repostsCount, loading, toggleRepost };
};
