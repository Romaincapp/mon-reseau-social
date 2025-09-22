// app/record/page.tsx - Version complète
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Send, X, Check, ArrowLeft, Upload, Music } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

interface Tag {
  id: number;
  name: string;
  emoji: string;
  color: string;
}

export default function RecordPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'record' | 'import'>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Tags Netflix-style disponibles
  const availableTags: Tag[] = [
    { id: 1, name: 'Comedy', emoji: '😂', color: 'bg-yellow-500' },
    { id: 2, name: 'Drama', emoji: '🎭', color: 'bg-red-500' },
    { id: 3, name: 'Chill', emoji: '🌙', color: 'bg-blue-500' },
    { id: 4, name: 'Music', emoji: '🎵', color: 'bg-green-500' },
    { id: 5, name: 'News', emoji: '📰', color: 'bg-gray-500' },
    { id: 6, name: 'Story', emoji: '📖', color: 'bg-orange-500' },
    { id: 7, name: 'Tech', emoji: '💻', color: 'bg-indigo-500' },
    { id: 8, name: 'Travel', emoji: '✈️', color: 'bg-cyan-500' },
    { id: 9, name: 'Food', emoji: '🍕', color: 'bg-pink-500' },
    { id: 10, name: 'Sports', emoji: '⚽', color: 'bg-emerald-500' },
    { id: 11, name: 'Love', emoji: '💕', color: 'bg-rose-500' },
    { id: 12, name: 'Mystery', emoji: '🔮', color: 'bg-purple-500' },
    { id: 13, name: 'Horror', emoji: '👻', color: 'bg-slate-500' },
    { id: 14, name: 'Fitness', emoji: '💪', color: 'bg-lime-500' },
    { id: 15, name: 'Education', emoji: '🎓', color: 'bg-amber-500' }
  ];

  // Initialiser le microphone
  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionGranted(true);
    } catch (error) {
      console.error('Microphone access denied:', error);
      setPermissionGranted(false);
    }
  };

  // Timer d'enregistrement
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Gérer l'importation de fichier
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le format
    if (!file.type.startsWith('audio/')) {
      alert('Veuillez sélectionner un fichier audio valide');
      return;
    }

    // Vérifier la taille (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('Le fichier est trop volumineux (max 50MB)');
      return;
    }

    setImportedFile(file);
    setAudioBlob(file);

    // Obtenir la durée du fichier audio
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.onloadedmetadata = () => {
      setAudioDuration(Math.floor(audio.duration));
    };
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
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
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const playAudio = () => {
    if (audioBlob && audioRef.current) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setIsPlaying(true);

      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleTag = (tag: Tag) => {
    if (selectedTags.find(t => t.id === tag.id)) {
      setSelectedTags(selectedTags.filter(t => t.id !== tag.id));
    } else if (selectedTags.length < 3) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setImportedFile(null);
    setRecordingTime(0);
    setAudioDuration(0);
    setIsPlaying(false);
    setSelectedTags([]);
    if (audioRef.current) {
      audioRef.current.src = '';
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePublish = async () => {
    if (!audioBlob || selectedTags.length === 0) {
      alert('Veuillez enregistrer un audio et sélectionner au moins un tag');
      return;
    }

    setIsUploading(true);

    try {
      // Déterminer le nom et l'extension du fichier
      const fileExtension = importedFile ? 
        importedFile.name.split('.').pop() || 'mp3' : 
        'wav';
      const fileName = `vocal-${Date.now()}.${fileExtension}`;
      
      // Upload audio vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(fileName, audioBlob);

      if (uploadError) {
        throw uploadError;
      }

      // Obtenir l'URL publique du fichier
      const { data: urlData } = supabase.storage
        .from('audio-files')
        .getPublicUrl(fileName);

      // Utiliser la bonne durée selon le mode
      const duration = mode === 'import' ? audioDuration : recordingTime;

      // Créer le post dans la base de données
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert([
          {
            user_id: 1, // Tu remplaceras par l'ID de l'utilisateur connecté
            audio_url: urlData.publicUrl,
            duration: duration,
            likes_count: 0,
            comments_count: 0
          }
        ])
        .select()
        .single();

      if (postError) {
        throw postError;
      }

      // Associer les tags au post
      const tagAssociations = selectedTags.map(tag => ({
        post_id: postData.id,
        tag_id: tag.id
      }));

      const { error: tagError } = await supabase
        .from('post_tags')
        .insert(tagAssociations);

      if (tagError) {
        throw tagError;
      }

      alert('Vocal publié avec succès !');
      router.push('/'); // Retour au fil d'actualité
      
    } catch (error) {
      console.error('Error publishing vocal:', error);
      alert('Erreur lors de la publication. Veuillez réessayer.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!permissionGranted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center">
          <Mic className="w-16 h-16 text-white mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Accès au microphone requis</h2>
          <p className="text-white/80 mb-6">Autorisez l'accès au microphone pour enregistrer vos vocaux</p>
          <button 
            onClick={checkMicrophonePermission}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full"
          >
            Autoriser le microphone
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-4">
          <button 
            onClick={() => router.back()}
            className="text-white/80 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">Nouveau Vocal</h1>
          <div className="w-6 h-6"></div>
        </div>

        {/* Mode Selection */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setMode('record')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                mode === 'record' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <Mic className="w-5 h-5" />
              Enregistrer
            </button>
            <button
              onClick={() => setMode('import')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                mode === 'import' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <Upload className="w-5 h-5" />
              Importer
            </button>
          </div>
        </div>

        {/* Recording/Import Interface */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-6">
          {mode === 'record' ? (
            // Interface d'enregistrement
            <>
              {/* Timer */}
              <div className="text-center mb-8">
                <div className="text-4xl font-mono font-bold text-white mb-2">
                  {formatTime(recordingTime)}
                </div>
                <div className="text-white/60">
                  {isRecording ? (isPaused ? 'En pause' : 'Enregistrement...') : 'Prêt à enregistrer'}
                </div>
              </div>

              {/* Waveform Animation */}
              {isRecording && !isPaused && (
                <div className="flex items-center justify-center space-x-1 mb-8">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-purple-400 rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 40 + 10}px`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Recording Control Buttons */}
              <div className="flex items-center justify-center space-x-4">
                {!isRecording && !audioBlob && (
                  <button
                    onClick={startRecording}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full p-6 shadow-lg transform hover:scale-105 transition-all"
                  >
                    <Mic className="w-8 h-8" />
                  </button>
                )}

                {isRecording && (
                  <>
                    <button
                      onClick={isPaused ? resumeRecording : pauseRecording}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full p-4"
                    >
                      {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                    </button>
                    <button
                      onClick={stopRecording}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4"
                    >
                      <Square className="w-6 h-6" />
                    </button>
                  </>
                )}

                {audioBlob && mode === 'record' && (
                  <>
                    <button
                      onClick={isPlaying ? pauseAudio : playAudio}
                      className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </button>
                    <button
                      onClick={resetRecording}
                      className="bg-gray-500 hover:bg-gray-600 text-white rounded-full p-4"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            // Interface d'importation
            <>
              {!importedFile ? (
                <div className="text-center">
                  <div className="mb-6">
                    <Music className="w-16 h-16 text-white/60 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Importer un fichier audio</h3>
                    <p className="text-white/60 mb-6">
                      Formats supportés : MP3, WAV, M4A<br />
                      Taille maximum : 50MB
                    </p>
                  </div>
                  
                  <button
                    onClick={triggerFileSelect}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-full flex items-center gap-2 mx-auto shadow-lg transform hover:scale-105 transition-all"
                  >
                    <Upload className="w-5 h-5" />
                    Choisir un fichier
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="text-center">
                  <Music className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">{importedFile.name}</h3>
                  <p className="text-white/60 mb-6">
                    Durée : {formatTime(audioDuration)} • {(importedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                  
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={isPlaying ? pauseAudio : playAudio}
                      className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </button>
                    <button
                      onClick={resetRecording}
                      className="bg-gray-500 hover:bg-gray-600 text-white rounded-full p-4"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Tag Selection */}
        {(audioBlob || importedFile) && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Tags ({selectedTags.length}/3)</h3>
              <button
                onClick={() => setShowTagSelector(!showTagSelector)}
                className="text-purple-300 hover:text-purple-200"
              >
                {showTagSelector ? 'Fermer' : 'Sélectionner'}
              </button>
            </div>

            {/* Selected Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedTags.map(tag => (
                <span
                  key={tag.id}
                  className={`${tag.color} text-white text-sm px-3 py-1 rounded-full flex items-center gap-2`}
                >
                  <span>{tag.emoji}</span>
                  <span>{tag.name}</span>
                  <button
                    onClick={() => toggleTag(tag)}
                    className="text-white/80 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Tag Selector */}
            {showTagSelector && (
  <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto">
    {availableTags.map(tag => (
      <button
        key={tag.id}
        onClick={() => toggleTag(tag)}
        disabled={selectedTags.length >= 3 && !selectedTags.find(t => t.id === tag.id)}
        className={`${
          selectedTags.find(t => t.id === tag.id) 
            ? `${tag.color} text-white` 
            : 'bg-white/10 text-white/80 hover:bg-white/20'
        } text-xs px-2 py-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50 h-16 relative`}
      >
        <span className="text-lg">{tag.emoji}</span>
        <span className="text-[10px] leading-tight text-center">{tag.name}</span>
        {selectedTags.find(t => t.id === tag.id) && (
          <Check className="w-2 h-2 absolute top-1 right-1" />
        )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Publish Button */}
        {(audioBlob || importedFile) && selectedTags.length > 0 && (
          <button
            onClick={handlePublish}
            disabled={isUploading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold py-4 px-6 rounded-full flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 transition-all disabled:transform-none"
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            {isUploading ? 'Publication...' : 'Publier le vocal'}
          </button>
        )}

        {/* Audio Element */}
        <audio ref={audioRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}