'use client'

import React from 'react';
import { Home, Mic, User, LogIn, Search, MessageCircle } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import NotificationButton from './NotificationButton';

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile } = useAuth();

  const handleMicClick = (): void => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    router.push('/record');
  };

  const handleProfileClick = (): void => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    router.push('/profile');
  };

  const handleHomeClick = (): void => {
    router.push('/feed');
  };

  const handleSearchClick = (): void => {
    router.push('/search');
  };

  const handleMessagesClick = (): void => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    router.push('/messages');
  };

  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-6 py-4 z-50">
      <div className="flex items-center justify-around">
        <button
          onClick={handleHomeClick}
          className={`p-3 transition-colors duration-200 ${
            isActive('/feed') ? 'text-purple-500' : 'text-gray-400 hover:text-purple-500'
          }`}
          aria-label="Accueil"
        >
          <Home size={24} />
        </button>
        <button
          onClick={handleSearchClick}
          className={`p-3 transition-colors duration-200 ${
            isActive('/search') ? 'text-purple-500' : 'text-gray-400 hover:text-purple-500'
          }`}
          aria-label="Rechercher"
        >
          <Search size={24} />
        </button>
        {user && (
          <button
            onClick={handleMessagesClick}
            className={`p-3 transition-colors duration-200 ${
              pathname.startsWith('/messages') ? 'text-purple-500' : 'text-gray-400 hover:text-purple-500'
            }`}
            aria-label="Messages"
          >
            <MessageCircle size={24} />
          </button>
        )}
        <button
          onClick={handleMicClick}
          className={`p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg transform hover:scale-105 transition-all duration-200 ${
            !user ? 'opacity-75' : ''
          }`}
          aria-label="Enregistrer"
        >
          <Mic size={24} />
        </button>
        {user && (
          <div className="p-3">
            <NotificationButton />
          </div>
        )}
        {user ? (
          <button
            onClick={handleProfileClick}
            className={`p-3 transition-colors duration-200 ${
              isActive('/profile') || pathname.startsWith('/profile/')
                ? 'text-purple-500'
                : 'text-gray-400 hover:text-purple-500'
            }`}
            aria-label="Profil"
          >
            <User size={24} />
          </button>
        ) : (
          <button
            onClick={() => router.push('/auth/login')}
            className="p-3 text-gray-400 hover:text-purple-500 transition-colors duration-200"
            aria-label="Se connecter"
          >
            <LogIn size={24} />
          </button>
        )}
      </div>
    </div>
  );
}
