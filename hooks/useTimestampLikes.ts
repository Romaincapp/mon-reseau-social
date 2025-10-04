'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface TimestampLike {
  id: string;
  timestamp: number;
  user_id: string;
  count: number;
}

interface GroupedTimestampLikes {
  [key: number]: TimestampLike;
}

export function useTimestampLikes(postId: string, userId?: string) {
  const [timestampLikes, setTimestampLikes] = useState<TimestampLike[]>([]);
  const [loading, setLoading] = useState(true);

  // Fonction pour grouper les likes par timestamp (avec tolérance de ±1 seconde)
  const groupTimestampLikes = (likes: any[]): TimestampLike[] => {
    const grouped: GroupedTimestampLikes = {};

    likes.forEach(like => {
      const timestamp = like.timestamp;
      let found = false;

      // Chercher un timestamp proche (±1 seconde)
      for (let i = -1; i <= 1; i++) {
        const checkTimestamp = timestamp + i;
        if (grouped[checkTimestamp]) {
          grouped[checkTimestamp].count++;
          if (userId && like.user_id === userId) {
            grouped[checkTimestamp].user_id = userId;
          }
          found = true;
          break;
        }
      }

      if (!found) {
        grouped[timestamp] = {
          id: like.id,
          timestamp,
          user_id: like.user_id,
          count: 1
        };
      }
    });

    return Object.values(grouped);
  };

  // Charger les likes temporels
  const fetchTimestampLikes = async () => {
    try {
      const { data, error } = await supabase
        .from('timestamp_likes')
        .select('*')
        .eq('post_id', postId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      const grouped = groupTimestampLikes(data || []);
      setTimestampLikes(grouped);
    } catch (error) {
      console.error('Erreur lors du chargement des likes temporels:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un like temporel
  const addTimestampLike = async (timestamp: number) => {
    if (!userId) return;

    try {
      // Vérifier si l'utilisateur a déjà liké à ce timestamp (±1 seconde)
      const { data: existing } = await supabase
        .from('timestamp_likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .gte('timestamp', timestamp - 1)
        .lte('timestamp', timestamp + 1)
        .single();

      if (existing) {
        // Si déjà liké, supprimer le like
        await supabase
          .from('timestamp_likes')
          .delete()
          .eq('id', existing.id);
      } else {
        // Sinon, ajouter le like temporel
        await supabase
          .from('timestamp_likes')
          .insert({
            post_id: postId,
            user_id: userId,
            timestamp
          });

        // Vérifier si l'utilisateur a déjà liké le post
        const { data: existingPostLike } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .single();

        // Si pas encore liké le post, ajouter un like au post
        if (!existingPostLike) {
          // Ajouter le like
          await supabase
            .from('likes')
            .insert({
              post_id: postId,
              user_id: userId
            });

          // Incrémenter le compteur de likes du post
          const { data: post } = await supabase
            .from('posts')
            .select('likes_count')
            .eq('id', postId)
            .single();

          await supabase
            .from('posts')
            .update({ likes_count: (post?.likes_count || 0) + 1 })
            .eq('id', postId);
        }
      }

      // Recharger les likes
      await fetchTimestampLikes();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du like temporel:', error);
    }
  };

  // Vérifier si l'utilisateur a liké à un timestamp donné
  const isTimestampLiked = (timestamp: number): boolean => {
    if (!userId) return false;

    return timestampLikes.some(
      like => Math.abs(like.timestamp - timestamp) <= 1 && like.user_id === userId
    );
  };

  useEffect(() => {
    fetchTimestampLikes();

    // S'abonner aux changements en temps réel
    const subscription = supabase
      .channel(`timestamp_likes:${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timestamp_likes',
          filter: `post_id=eq.${postId}`
        },
        () => {
          fetchTimestampLikes();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [postId, userId]);

  return {
    timestampLikes,
    loading,
    addTimestampLike,
    isTimestampLiked
  };
}
