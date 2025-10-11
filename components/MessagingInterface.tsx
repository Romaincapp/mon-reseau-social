'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Mic, Square, Send, Play, Pause, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AvatarWithWaveform from './AvatarWithWaveform';

interface Profile {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  audio_url: string | null;
  duration: number | null;
  created_at: string | null;
  is_read?: boolean | null;
  updated_at?: string | null;
  profiles?: Profile;
}

interface MessagingInterfaceProps {
  conversationId: string;
}

const MessagingInterface: React.FC<MessagingInterfaceProps> = ({ conversationId }) => {
  const router = useRouter();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [textMessage, setTextMessage] = useState('');

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchConversationData();
      subscribeToMessages();
    }
  }, [conversationId, user]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversationData = async () => {
    if (!user) return;

    try {
      // Get other participant
      const { data: participants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select(`
          user_id,
          profiles (id, username, full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .neq('user_id', user.id);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        throw participantsError;
      }

      // Get the first participant (should be the only one in a 1-to-1 conversation)
      if (participants && participants.length > 0) {
        setOtherUser(participants[0].profiles as Profile);
      }

      // Get messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          profiles (id, username, full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

      // Mark as read
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

    } catch (error) {
      console.error('Error fetching conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch full message with profile
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              profiles (id, username, full_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages(prev => [...prev, data]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Erreur lors de l\'accès au microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const sendTextMessage = async () => {
    if (!textMessage.trim() || !user || isSending) return;

    setIsSending(true);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: textMessage.trim()
        });

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      setTextMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setIsSending(false);
    }
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob || !user || isSending) return;

    setIsSending(true);

    try {
      // Upload audio
      const fileName = `voice-${Date.now()}.wav`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(filePath, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('audio-files')
        .getPublicUrl(filePath);

      // Send message
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          audio_url: publicUrl,
          duration: recordingTime
        });

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      setAudioBlob(null);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error sending voice message:', error);
      alert('Erreur lors de l\'envoi du message vocal');
    } finally {
      setIsSending(false);
    }
  };

  const playMessage = (message: Message) => {
    if (!message.audio_url) return;

    // Stop all other audios
    Object.values(audioRefs.current).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });

    // Create or get audio element
    if (!audioRefs.current[message.id]) {
      const audio = new Audio(message.audio_url);
      audio.onended = () => setPlayingMessageId(null);
      audioRefs.current[message.id] = audio;
    }

    const audio = audioRefs.current[message.id];
    audio.play();
    setPlayingMessageId(message.id);
  };

  const pauseMessage = (messageId: string) => {
    const audio = audioRefs.current[messageId];
    if (audio) {
      audio.pause();
      setPlayingMessageId(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMessageTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={24} />
          </button>
          <AvatarWithWaveform
            avatar={otherUser?.avatar_url || '👤'}
            isPlaying={false}
            size="sm"
            avatarUrl={otherUser?.avatar_url || undefined}
          />
          <div className="flex-1">
            <h1 className="font-bold">{otherUser?.username || otherUser?.full_name || 'Utilisateur'}</h1>
            <p className="text-sm text-gray-500">En ligne</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.sender_id === user?.id;

          return (
            <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs ${isOwnMessage ? 'bg-purple-600 text-white' : 'bg-white text-gray-900'} rounded-2xl p-3 shadow-sm`}>
                {message.audio_url ? (
                  // Voice message
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => playingMessageId === message.id ? pauseMessage(message.id) : playMessage(message)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isOwnMessage ? 'bg-white/20' : 'bg-purple-100'
                      }`}
                    >
                      {playingMessageId === message.id ? (
                        <Pause size={14} className={isOwnMessage ? 'text-white' : 'text-purple-600'} />
                      ) : (
                        <Play size={14} className={isOwnMessage ? 'text-white ml-0.5' : 'text-purple-600 ml-0.5'} />
                      )}
                    </button>
                    <div className={`flex-1 h-6 rounded ${isOwnMessage ? 'bg-white/20' : 'bg-purple-100'}`}></div>
                    <span className="text-xs">{formatTime(message.duration || 0)}</span>
                  </div>
                ) : (
                  // Text message
                  <p className="text-sm">{message.content}</p>
                )}
                <p className={`text-xs mt-1 ${isOwnMessage ? 'text-white/70' : 'text-gray-500'}`}>
                  {formatMessageTime(message.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t p-4">
        {audioBlob ? (
          // Voice message preview
          <div className="space-y-3">
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center">
                  <Mic size={16} />
                </div>
                <div className="flex-1 h-6 bg-purple-200 rounded"></div>
                <span className="text-sm text-gray-600">{formatTime(recordingTime)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={cancelRecording}
                className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-full font-medium"
              >
                Annuler
              </button>
              <button
                onClick={sendVoiceMessage}
                disabled={isSending}
                className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-medium disabled:bg-purple-400 flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Send size={16} />
                    Envoyer
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          // Regular input
          <div className="flex items-center gap-2">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-3 rounded-full ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-purple-100 hover:bg-purple-200 text-purple-600'
              }`}
            >
              {isRecording ? <Square size={20} /> : <Mic size={20} />}
            </button>

            {isRecording ? (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-red-500 font-medium">{formatTime(recordingTime)}</span>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={textMessage}
                  onChange={(e) => setTextMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
                  placeholder="Écrivez un message..."
                  className="flex-1 py-2 px-4 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={sendTextMessage}
                  disabled={!textMessage.trim() || isSending}
                  className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full disabled:bg-gray-300"
                >
                  <Send size={20} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingInterface;
