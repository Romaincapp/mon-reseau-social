'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { followUser, unfollowUser, isFollowing } from '@/lib/follows';

interface FollowButtonProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  showIcon?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  size = 'md',
  variant = 'primary',
  showIcon = true,
  onFollowChange
}) => {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    if (user && userId && user.id !== userId) {
      checkFollowStatus();
    } else {
      setCheckingStatus(false);
    }
  }, [user, userId]);

  const checkFollowStatus = async () => {
    if (!user) return;

    try {
      const status = await isFollowing(user.id, userId);
      setFollowing(status);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || loading) return;

    setLoading(true);
    try {
      if (following) {
        await unfollowUser(user.id, userId);
        setFollowing(false);
        onFollowChange?.(false);
      } else {
        await followUser(user.id, userId);
        setFollowing(true);
        onFollowChange?.(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('Erreur lors de l\'action. Veuillez réessayer.');
      // Refresh status in case of error
      await checkFollowStatus();
    } finally {
      setLoading(false);
    }
  };

  // Don't show button if user is viewing their own profile
  if (!user || user.id === userId) return null;

  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-white/60" />
      </div>
    );
  }

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    primary: following
      ? 'bg-white/10 hover:bg-white/20 text-white border border-white/30'
      : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white',
    secondary: following
      ? 'bg-gray-700 hover:bg-gray-600 text-white'
      : 'bg-white hover:bg-gray-100 text-gray-900'
  };

  return (
    <button
      onClick={handleFollowToggle}
      disabled={loading}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-full font-medium transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center gap-2
      `}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {showIcon && (
            following ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />
          )}
          {following ? 'Abonné' : 'S\'abonner'}
        </>
      )}
    </button>
  );
};

export default FollowButton;
