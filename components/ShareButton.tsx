'use client';

import React, { useState } from 'react';
import { Share2, Send, Repeat2, Link2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface ShareButtonProps {
  type: 'post' | 'story' | 'profile';
  itemId: string;
  itemUrl?: string;
  authorName?: string;
  onShare?: () => void;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  type,
  itemId,
  itemUrl,
  authorName,
  onShare
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showDMModal, setShowDMModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    if (itemUrl) return itemUrl;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

    switch (type) {
      case 'post':
        return `${baseUrl}/post/${itemId}`;
      case 'story':
        return `${baseUrl}/story/${itemId}`;
      case 'profile':
        return `${baseUrl}/profile/${itemId}`;
      default:
        return baseUrl;
    }
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowShareMenu(false);
      }, 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Erreur lors de la copie du lien');
    }
  };

  const handleShareViaDM = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setShowDMModal(true);
    setShowShareMenu(false);
  };

  const handleRepost = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    // Navigate to create repost
    router.push(`/record?repost=${itemId}`);
    setShowShareMenu(false);
    onShare?.();
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowShareMenu(!showShareMenu)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Partager"
        >
          <Share2 size={20} className="text-gray-600" />
        </button>

        {showShareMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowShareMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
              <button
                onClick={handleCopyLink}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
              >
                <Link2 size={18} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {copied ? '✓ Lien copié !' : 'Copier le lien'}
                </span>
              </button>

              {type === 'post' && (
                <button
                  onClick={handleRepost}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
                >
                  <Repeat2 size={18} className="text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Repartager
                  </span>
                </button>
              )}

              <button
                onClick={handleShareViaDM}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
              >
                <Send size={18} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  Envoyer par message
                </span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* DM Modal */}
      {showDMModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">Envoyer par message</h3>
              <button
                onClick={() => setShowDMModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <p className="text-gray-600 text-sm mb-4">
                Partagez {type === 'post' ? 'ce post' : type === 'story' ? 'cette story' : 'ce profil'}
                {authorName && ` de ${authorName}`}
              </p>

              {/* TODO: Add list of recent conversations/contacts */}
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">Fonctionnalité en cours de développement</p>
                <button
                  onClick={() => {
                    handleCopyLink();
                    setShowDMModal(false);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Copier le lien
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShareButton;
