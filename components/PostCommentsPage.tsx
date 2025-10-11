'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Mic, Square, Play, Pause, Send, Trash2, Heart, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import AvatarWithWaveform from './AvatarWithWaveform';
import InteractiveWaveform from './InteractiveWaveform';

interface Profile {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string | null;
  audio_url: string | null;
  duration: number | null;
  parent_comment_id: string | null;
  likes_count: number | null;
  created_at: string | null;
  updated_at: string | null;
  profiles?: Profile | null;
  replies?: Comment[];
}

interface Post {
  id: string;
  user_id: string | null;
  audio_url: string;
  duration: number;
  caption?: string | null;
  likes_count: number | null;
  comments_count: number | null;
  reposts_count?: number | null;
  views_count?: number | null;
  created_at: string | null;
  updated_at?: string | null;
  profiles?: Profile | null;
  post_tags?: Array<{
    tags: {
      id: number;
      name: string;
      emoji: string;
      color: string;
    } | null;
  }>;
}

interface PostCommentsPageProps {
  postId: string;
}

const PostCommentsPage: React.FC<PostCommentsPageProps> = ({ postId }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { playPost, pausePost, resumePost, isPlaying, isCurrentPost } = useAudioPlayer();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [playingCommentId, setPlayingCommentId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Fetch post and comments
  useEffect(() => {
    fetchPostAndComments();
  }, [postId]);

  // Recording timer
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

  const fetchPostAndComments = async () => {
    try {
      // Fetch post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (id, username, full_name, avatar_url),
          post_tags (
            tags (id, name, emoji, color)
          )
        `)
        .eq('id', postId)
        .single();

      if (postError) throw postError;
      setPost(postData);

      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (id, username, full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: replies } = await supabase
            .from('comments')
            .select(`
              *,
              profiles (id, username, full_name, avatar_url)
            `)
            .eq('parent_comment_id', comment.id)
            .order('created_at', { ascending: true });

          return { ...comment, replies: replies || [] };
        })
      );

      setComments(commentsWithReplies);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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
    setReplyingTo(null);
  };

  const submitComment = async () => {
    if (!audioBlob || !user) return;

    setIsSubmitting(true);

    try {
      // Upload audio
      const fileName = `comment-${Date.now()}.wav`;
      const filePath = `${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(filePath, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('audio-files')
        .getPublicUrl(filePath);

      // Create comment
      const { error: commentError } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          audio_url: publicUrl,
          duration: recordingTime,
          parent_comment_id: replyingTo
        });

      if (commentError) throw commentError;

      // Refresh comments
      await fetchPostAndComments();

      // Reset
      setAudioBlob(null);
      setRecordingTime(0);
      setReplyingTo(null);
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Erreur lors de l\'envoi du commentaire');
    } finally {
      setIsSubmitting(false);
    }
  };

  const playComment = (comment: Comment) => {
    if (!comment.audio_url) return;

    // Stop all other audios
    Object.values(audioRefs.current).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });

    // Create or get audio element
    if (!audioRefs.current[comment.id]) {
      const audio = new Audio(comment.audio_url);
      audio.onended = () => setPlayingCommentId(null);
      audioRefs.current[comment.id] = audio;
    }

    const audio = audioRefs.current[comment.id];
    audio.play();
    setPlayingCommentId(comment.id);
  };

  const pauseComment = (commentId: string) => {
    const audio = audioRefs.current[commentId];
    if (audio) {
      audio.pause();
      setPlayingCommentId(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'à l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInHours < 24) return `${diffInHours}h`;
    return `${diffInDays}j`;
  };

  const handlePlayPost = () => {
    if (!post) return;

    if (isCurrentPost(post.id) && isPlaying) {
      pausePost();
    } else if (isCurrentPost(post.id)) {
      resumePost();
    } else {
      playPost(post as any, [post] as any);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <p className="text-gray-500">Post introuvable</p>
      </div>
    );
  }

  const isPostPlaying = isCurrentPost(post.id) && isPlaying;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="flex items-center gap-4 p-4">
            <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-lg font-bold">Commentaires</h1>
          </div>
        </div>

        {/* Original Post */}
        <div className="bg-white border-b p-4">
          <div className="flex items-start gap-3 mb-3">
            <AvatarWithWaveform
              avatar={post.profiles?.avatar_url || '👤'}
              isPlaying={isPostPlaying}
              size="md"
              avatarUrl={post.profiles?.avatar_url || undefined}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">
                  {post.profiles?.username || post.profiles?.full_name || 'Utilisateur'}
                </p>
                <span className="text-gray-500 text-sm">·</span>
                <span className="text-gray-500 text-sm">{formatTimeAgo(post.created_at)}</span>
              </div>
              {post.caption && (
                <p className="text-gray-800 text-sm mt-2">{post.caption}</p>
              )}
            </div>
          </div>

          {/* Audio Player */}
          <div className="bg-purple-50 rounded-xl p-4 mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayPost}
                className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700"
              >
                {isPostPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
              </button>
              <div className="flex-1">
                <div className="h-8 bg-purple-200 rounded"></div>
              </div>
              <span className="text-sm font-medium text-gray-600">{formatTime(post.duration)}</span>
            </div>
          </div>

          {/* Tags */}
          {post.post_tags && post.post_tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.post_tags.map((pt, idx) => (
                pt.tags && (
                  <span key={idx} className={`${pt.tags.color} text-white text-xs px-2 py-1 rounded-full`}>
                    {pt.tags.emoji} {pt.tags.name}
                  </span>
                )
              ))}
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="bg-white">
          {comments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Aucun commentaire pour le moment</p>
              <p className="text-sm mt-2">Soyez le premier à commenter !</p>
            </div>
          ) : (
            <div className="divide-y">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4">
                  {/* Comment */}
                  <div className="flex items-start gap-3">
                    <AvatarWithWaveform
                      avatar={comment.profiles?.avatar_url || '👤'}
                      isPlaying={playingCommentId === comment.id}
                      size="sm"
                      avatarUrl={comment.profiles?.avatar_url || undefined}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-sm">
                          {comment.profiles?.username || comment.profiles?.full_name || 'Utilisateur'}
                        </p>
                        <span className="text-gray-500 text-xs">{formatTimeAgo(comment.created_at)}</span>
                      </div>

                      {/* Audio Comment */}
                      {comment.audio_url && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => playingCommentId === comment.id ? pauseComment(comment.id) : playComment(comment)}
                              className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center hover:bg-purple-600"
                            >
                              {playingCommentId === comment.id ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                            </button>
                            <div className="flex-1 h-6 bg-purple-200 rounded"></div>
                            <span className="text-xs text-gray-600">{formatTime(comment.duration || 0)}</span>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-4 text-gray-500 text-sm">
                        <button className="hover:text-red-500 flex items-center gap-1">
                          <Heart size={14} />
                          <span>{comment.likes_count || 0}</span>
                        </button>
                        <button
                          onClick={() => setReplyingTo(comment.id)}
                          className="hover:text-purple-600"
                        >
                          Répondre
                        </button>
                      </div>

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-4 mt-3 space-y-3 border-l-2 border-gray-200 pl-3">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-2">
                              <AvatarWithWaveform
                                avatar={reply.profiles?.avatar_url || '👤'}
                                isPlaying={playingCommentId === reply.id}
                                size="sm"
                                avatarUrl={reply.profiles?.avatar_url || undefined}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-xs">
                                    {reply.profiles?.username || 'Utilisateur'}
                                  </p>
                                  <span className="text-gray-500 text-xs">{formatTimeAgo(reply.created_at)}</span>
                                </div>
                                {reply.audio_url && (
                                  <div className="bg-gray-50 rounded-lg p-2">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => playingCommentId === reply.id ? pauseComment(reply.id) : playComment(reply)}
                                        className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center"
                                      >
                                        {playingCommentId === reply.id ? <Pause size={12} /> : <Play size={12} />}
                                      </button>
                                      <div className="flex-1 h-4 bg-purple-200 rounded"></div>
                                      <span className="text-xs text-gray-600">{formatTime(reply.duration || 0)}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recording Interface */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="max-w-2xl mx-auto p-4">
            {replyingTo && (
              <div className="mb-2 flex items-center justify-between bg-purple-50 p-2 rounded-lg">
                <span className="text-sm text-purple-700">Répondre au commentaire</span>
                <button onClick={() => setReplyingTo(null)} className="text-purple-600">
                  ✕
                </button>
              </div>
            )}

            {!audioBlob ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={!user}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full font-medium ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-300'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square size={20} />
                      {formatTime(recordingTime)}
                    </>
                  ) : (
                    <>
                      <Mic size={20} />
                      Enregistrer un commentaire vocal
                    </>
                  )}
                </button>
              </div>
            ) : (
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
                    onClick={submitComment}
                    disabled={isSubmitting}
                    className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-medium disabled:bg-purple-400 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCommentsPage;
