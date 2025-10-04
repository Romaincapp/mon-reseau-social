'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Heart } from 'lucide-react';

interface TimestampLike {
  id: string;
  timestamp: number;
  user_id: string;
  count: number;
}

interface InteractiveWaveformProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onTimestampLike?: (timestamp: number) => void;
  timestampLikes?: TimestampLike[];
  postId?: string;
  userId?: string;
  showLikes?: boolean;
}

const InteractiveWaveform: React.FC<InteractiveWaveformProps> = ({
  isPlaying,
  currentTime,
  duration,
  onSeek,
  onTimestampLike,
  timestampLikes = [],
  postId,
  userId,
  showLikes = true
}) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [bars] = useState(() =>
    Array.from({ length: 40 }, () => Math.random() * 20 + 10)
  );

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current || duration === 0) return;

    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    onSeek(newTime);
  };

  const handleWaveformDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current || duration === 0 || !onTimestampLike || !showLikes) return;

    e.preventDefault();
    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const timestamp = percentage * duration;

    onTimestampLike(Math.floor(timestamp));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current || duration === 0) return;

    const rect = waveformRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const percentage = mouseX / rect.width;
    const time = percentage * duration;

    setHoveredTime(time);
  };

  const handleMouseLeave = () => {
    setHoveredTime(null);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBarHeight = (index: number, baseHeight: number): number => {
    const progress = duration > 0 ? currentTime / duration : 0;
    const barPosition = index / bars.length;

    if (barPosition <= progress) {
      return baseHeight;
    }
    return baseHeight * 0.6;
  };

  const getBarColor = (index: number): string => {
    const progress = duration > 0 ? currentTime / duration : 0;
    const barPosition = index / bars.length;

    if (barPosition <= progress) {
      return 'bg-purple-500';
    }
    return 'bg-gray-300';
  };

  return (
    <div className="relative w-full">
      {/* Tooltip de temps au survol */}
      {hoveredTime !== null && (
        <div
          className="absolute -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none z-10"
          style={{
            left: `${(hoveredTime / duration) * 100}%`,
            transform: 'translateX(-50%)'
          }}
        >
          {formatTime(hoveredTime)}
        </div>
      )}

      {/* Waveform interactif */}
      <div
        ref={waveformRef}
        className="flex items-center space-x-1 cursor-pointer relative h-10"
        onClick={handleWaveformClick}
        onDoubleClick={handleWaveformDoubleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {bars.map((baseHeight, i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-150 ${getBarColor(i)} ${
              isPlaying ? 'animate-pulse' : ''
            }`}
            style={{
              height: `${getBarHeight(i, baseHeight)}px`,
              animationDelay: `${i * 0.05}s`,
              animationDuration: '1s'
            }}
          />
        ))}

        {/* Indicateur de position actuelle */}
        {duration > 0 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-purple-600 pointer-events-none"
            style={{
              left: `${(currentTime / duration) * 100}%`
            }}
          />
        )}

        {/* Likes temporels */}
        {showLikes && timestampLikes.map((like) => {
          const position = (like.timestamp / duration) * 100;
          return (
            <div
              key={like.id}
              className="absolute -top-6 transform -translate-x-1/2 pointer-events-none z-10"
              style={{ left: `${position}%` }}
            >
              <div className="flex flex-col items-center">
                <Heart
                  size={16}
                  className="text-red-500 fill-red-500 animate-bounce"
                />
                {like.count > 1 && (
                  <span className="text-xs text-red-500 font-bold mt-0.5">
                    {like.count}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      {showLikes && (
        <div className="text-xs text-gray-400 mt-1 text-center">
          Double-cliquez pour liker à cet instant
        </div>
      )}
    </div>
  );
};

export default InteractiveWaveform;
