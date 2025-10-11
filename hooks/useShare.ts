import { useState } from 'react';

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
}

export const useShare = () => {
  const [isSharing, setIsSharing] = useState(false);

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const share = async (options: ShareOptions): Promise<boolean> => {
    setIsSharing(true);

    try {
      if (canShare && navigator.share) {
        await navigator.share({
          title: options.title,
          text: options.text,
          url: options.url || window.location.href
        });
        return true;
      } else {
        // Fallback: Copy to clipboard
        const shareText = `${options.title || ''}\n${options.text || ''}\n${options.url || window.location.href}`;
        await navigator.clipboard.writeText(shareText);
        return true;
      }
    } catch (error) {
      // User cancelled or error occurred
      console.error('Share failed:', error);
      return false;
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Copy failed:', error);
      return false;
    }
  };

  return {
    share,
    copyToClipboard,
    canShare,
    isSharing
  };
};
