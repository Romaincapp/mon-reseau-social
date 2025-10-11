'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle, Search, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AvatarWithWaveform from './AvatarWithWaveform';
import BottomNavigation from './BottomNavigation';

interface Profile {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
}

interface Message {
  id: string;
  content: string | null;
  audio_url: string | null;
  created_at: string;
  sender_id: string;
}

interface Conversation {
  id: string;
  is_group: boolean;
  name: string | null;
  updated_at: string;
  otherParticipant?: Profile;
  lastMessage?: Message;
  unreadCount: number;
}

const ConversationsListPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Get all conversations for the current user
      const { data: myParticipations, error: myError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id);

      if (myError) throw myError;

      const conversationIds = myParticipations?.map(p => p.conversation_id) || [];
      if (conversationIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get all conversations with their data
      const { data: conversationsData, error: convError } = await supabase
        .from('conversations')
        .select('id, is_group, name, updated_at')
        .in('id', conversationIds);

      if (convError) throw convError;

      // Get ALL participants for these conversations (including profiles)
      const { data: allParticipants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          user_id,
          profiles (id, username, full_name, avatar_url)
        `)
        .in('conversation_id', conversationIds);

      if (participantsError) throw participantsError;

      // Get all messages (last message for each conversation)
      const { data: allMessages, error: messagesError } = await supabase
        .from('messages')
        .select('id, conversation_id, content, audio_url, created_at, sender_id')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Process the data
      const processedConversations = conversationsData?.map(conv => {
        // Find other participant (for 1-to-1 conversations)
        const otherParticipant = allParticipants
          ?.filter(p => p.conversation_id === conv.id && p.user_id !== user.id)
          .map(p => p.profiles)?.[0] || null;

        // Find last message for this conversation
        const lastMessage = allMessages?.find(m => m.conversation_id === conv.id) || null;

        // Find last_read_at for this user
        const myParticipation = myParticipations?.find(p => p.conversation_id === conv.id);
        const lastReadAt = myParticipation?.last_read_at || '1970-01-01';

        // Count unread messages
        const unreadCount = allMessages?.filter(m =>
          m.conversation_id === conv.id &&
          new Date(m.created_at) > new Date(lastReadAt)
        ).length || 0;

        return {
          ...conv,
          otherParticipant,
          lastMessage,
          unreadCount
        };
      }) || [];

      setConversations(processedConversations.sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      ));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'maintenant';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.is_group) return conv.name || 'Groupe';
    return conv.otherParticipant?.username || conv.otherParticipant?.full_name || 'Utilisateur';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Connectez-vous pour accéder à vos messages</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-full"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-xl font-bold">Messages</h1>
            </div>
            <button className="p-2 hover:bg-purple-50 rounded-full transition-colors">
              <Plus size={24} className="text-purple-600" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-4 pb-4">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une conversation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Conversations List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Aucune conversation</p>
            <p className="text-sm text-gray-400 mt-2">Commencez une conversation depuis un profil</p>
          </div>
        ) : (
          <div className="bg-white divide-y">
            {conversations
              .filter(conv => {
                const name = getConversationName(conv).toLowerCase();
                return name.includes(searchQuery.toLowerCase());
              })
              .map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => router.push(`/messages/${conv.id}`)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-purple-50 transition-colors text-left"
                >
                  <div className="relative">
                    <AvatarWithWaveform
                      avatar={conv.otherParticipant?.avatar_url || '👤'}
                      isPlaying={false}
                      size="md"
                      avatarUrl={conv.otherParticipant?.avatar_url || undefined}
                    />
                    {conv.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`font-semibold truncate ${conv.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                        {getConversationName(conv)}
                      </p>
                      <span className="text-xs text-gray-500 ml-2">
                        {conv.lastMessage && formatTime(conv.lastMessage.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {conv.lastMessage?.audio_url ? (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <MessageCircle size={14} />
                          Message vocal
                        </span>
                      ) : conv.lastMessage?.content ? (
                        <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                          {conv.lastMessage.content}
                        </p>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Aucun message</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ConversationsListPage;
