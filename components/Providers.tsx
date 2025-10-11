'use client';

import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';
import { AuthProvider } from '@/contexts/AuthContext';
import GlobalAudioPlayer from '@/components/GlobalAudioPlayer';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AudioPlayerProvider>
        {children}
        <GlobalAudioPlayer />
      </AudioPlayerProvider>
    </AuthProvider>
  );
}
