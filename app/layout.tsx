// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AudioPlayerProvider } from '../contexts/AudioPlayerContext';
import { AuthProvider } from '../contexts/AuthContext';
import GlobalAudioPlayer from '../components/GlobalAudioPlayer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vocal - Écoutez le monde",
  description: "Réseau social audio pour partager et découvrir des vocaux",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <AudioPlayerProvider>
            {children}
            <GlobalAudioPlayer />
          </AudioPlayerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}