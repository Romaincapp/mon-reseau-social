'use client'

import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Play, Pause, Home, Mic, User } from 'lucide-react';


const VocalFeed = () => {
  const [activeCategory, setActiveCategory] = useState('Tout');
  const [playingPost, setPlayingPost] = useState(null);

  const categories = [
    { name: 'Tout', emoji: '⭐', color: 'bg-purple-500' },
    { name: 'Blague', emoji: '😂', color: 'bg-yellow-500' },
    { name: 'Ludique', emoji: '🎮', color: 'bg-green-500' },
    { name: 'Réflexion', emoji: '💭', color: 'bg-blue-500' },
    { name: 'Musique', emoji: '🎵', color: 'bg-pink-500' }
  ];

  const posts = [
    {
      id: 1,
      username: '@marie_audio',
      timeAgo: 'il y a 2h',
      category: 'Réflexion',
      categoryColor: 'bg-blue-500',
      duration: '0:45',
      likes: 24,
      comments: 12,
      avatar: '👩‍🎤'
    },
    {
      id: 2,
      username: '@paul_stories',
      timeAgo: 'il y a 5h',
      category: 'Blague',
      categoryColor: 'bg-orange-500',
      duration: '0:32',
      likes: 67,
      comments: 12,
      avatar: '👨‍💼'
    },
    {
      id: 3,
      username: '@zen_moments',
      timeAgo: 'il y a 1j',
      category: 'Réflexion',
      categoryColor: 'bg-blue-500',
      duration: '1:15',
      likes: 89,
      comments: 23,
      avatar: '🧘‍♀️'
    }
  ];

  const handlePlay = (postId) => {
    setPlayingPost(playingPost === postId ? null : postId);
  };

  const Waveform = ({ isPlaying, duration }) => {
    const bars = Array.from({ length: 20 }, (_, i) => (
      <div
        key={i}
        className={`w-1 bg-gray-300 rounded-full transition-all duration-300 ${
          isPlaying ? 'animate-pulse' : ''
        }`}
        style={{
          height: `${Math.random() * 20 + 10}px`,
          animationDelay: `${i * 0.1}s`
        }}
      />
    ));

    return (
      <div className="flex items-center space-x-1 flex-1 mx-4">
        {bars}
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-2">
          <div className="w-6 h-6"></div>
          <div className="text-sm opacity-90">9:41</div>
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-1">Vocal</h1>
        <p className="text-purple-200">Écoutez le monde</p>
      </div>

      {/* Categories */}
      <div className="px-4 py-6">
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => setActiveCategory(category.name)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
                activeCategory === category.name
                  ? `${category.color} text-white shadow-lg`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-lg animate-bounce">{category.emoji}</span>
              <span className="font-medium">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="px-4 space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
            {/* User Info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xl">
                  {post.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{post.username}</p>
                  <p className="text-sm text-gray-500">{post.timeAgo}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${post.categoryColor} animate-pulse`}>
                {post.category}
              </span>
            </div>

            {/* Audio Player */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center">
                <button
                  onClick={() => handlePlay(post.id)}
                  className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white hover:bg-purple-600 transition-colors duration-200 shadow-lg"
                >
                  {playingPost === post.id ? (
                    <Pause size={20} />
                  ) : (
                    <Play size={20} className="ml-1" />
                  )}
                </button>
                
                <Waveform isPlaying={playingPost === post.id} duration={undefined} />
                
                <span className="text-sm font-medium text-gray-600 min-w-fit">
                  {post.duration}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between text-gray-600">
              <div className="flex items-center space-x-6">
                <button className="flex items-center space-x-2 hover:text-red-500 transition-colors duration-200">
                  <Heart size={20} />
                  <span className="text-sm font-medium">{post.likes}</span>
                </button>
                
                <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors duration-200">
                  <MessageCircle size={20} />
                  <span className="text-sm font-medium">{post.comments}</span>
                </button>
              </div>
              
              <button className="hover:text-purple-500 transition-colors duration-200">
                <Share2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <button className="p-3 text-purple-500">
            <Home size={24} />
          </button>
          <button className="p-3 text-gray-400 hover:text-purple-500 transition-colors duration-200">
            <Mic size={24} />
          </button>
          <button className="p-3 text-gray-400 hover:text-purple-500 transition-colors duration-200">
            <User size={24} />
          </button>
        </div>
      </div>

      {/* Spacing for bottom nav */}
      <div className="h-20"></div>
    </div>
  );
};

export default VocalFeed;