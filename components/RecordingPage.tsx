// components/RecordingPage.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Send, X, Check, ArrowLeft, Upload, Music, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { availableFilters, AudioFilterProcessor, type AudioFilter } from '@/lib/audioFilters';

interface Tag {
  id: number;
  name: string;
  emoji: string;
  color: string;
}

const RecordingPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [mode, setMode] = useState<'record' | 'import'>('record');
  const [publishType, setPublishType] = useState<'post' | 'story'>('post');
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
  const [selectedFilter, setSelectedFilter] = useState<AudioFilter>(availableFilters[0]);
  const [showFilterSelector, setShowFilterSelector] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [caption, setCaption] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const filterProcessorRef = useRef<AudioFilterProcessor | null>(null);

  // Tags Netflix-style disponibles
  // Dans components/RecordingPage.tsx - Remplace la section availableTags par :

const availableTags: Tag[] = [
  // TES TAGS EXISTANTS - Émotionnels/Intentionnels ✨
  { id: 1, name: 'Drôle', emoji: '😁', color: 'bg-yellow-500' },
  { id: 2, name: 'Spontané', emoji: '⚡', color: 'bg-orange-500' },
  { id: 3, name: 'Absurde', emoji: '🤪', color: 'bg-pink-500' },
  { id: 4, name: 'Réflexion', emoji: '💭', color: 'bg-blue-500' },
  { id: 5, name: 'Inspirant', emoji: '🌟', color: 'bg-purple-500' },
  { id: 6, name: 'Profond', emoji: '🎯', color: 'bg-indigo-500' },
  { id: 7, name: 'Personnel', emoji: '👤', color: 'bg-green-500' },
  { id: 8, name: 'Travail', emoji: '💼', color: 'bg-gray-600' },
  { id: 9, name: 'Voyage', emoji: '✈️', color: 'bg-sky-500' },
  { id: 10, name: 'Émouvant', emoji: '❤️', color: 'bg-red-500' },
  { id: 11, name: 'Relaxant', emoji: '🧘', color: 'bg-teal-500' },
  { id: 12, name: 'Énergique', emoji: '🔥', color: 'bg-red-600' },
  { id: 13, name: 'Histoire', emoji: '📚', color: 'bg-amber-600' },
  { id: 14, name: 'Conseil', emoji: '💡', color: 'bg-yellow-600' },
  { id: 15, name: 'Question', emoji: '❓', color: 'bg-slate-500' },

  // AJOUTS COMPLÉMENTAIRES 🚀
  { id: 16, name: 'Musique', emoji: '🎵', color: 'bg-emerald-500' },
  { id: 17, name: 'Nostalgique', emoji: '🌅', color: 'bg-rose-400' },
  { id: 18, name: 'Mystérieux', emoji: '🔮', color: 'bg-violet-500' },
  { id: 19, name: 'Débat', emoji: '🤔', color: 'bg-stone-500' },
  { id: 20, name: 'Actualités', emoji: '📰', color: 'bg-slate-600' },
  { id: 21, name: 'Fitness', emoji: '💪', color: 'bg-lime-500' },
  { id: 22, name: 'Sport', emoji: '⚽', color: 'bg-emerald-600' }
];

  // Initialiser le microphone et le processeur de filtres
  useEffect(() => {
    checkMicrophonePermission();
    filterProcessorRef.current = new AudioFilterProcessor();

    return () => {
      if (filterProcessorRef.current) {
        filterProcessorRef.current.dispose();
      }
    };
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

    // Créer un blob à partir du fichier pour la compatibilité
    setAudioBlob(file);

    // Obtenir la durée du fichier audio et charger pour les filtres
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.onloadedmetadata = async () => {
      setAudioDuration(Math.floor(audio.duration));

      // Charger l'audio pour les filtres
      if (filterProcessorRef.current) {
        try {
          const buffer = await filterProcessorRef.current.loadAudioFromBlob(file);
          setAudioBuffer(buffer);
        } catch (error) {
          console.error('Error loading audio buffer:', error);
        }
      }
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

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        console.log('🎤 Audio blob créé:', blob);
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());

        // Charger l'audio pour les filtres
        if (filterProcessorRef.current) {
          try {
            const buffer = await filterProcessorRef.current.loadAudioFromBlob(blob);
            console.log('🎵 Audio buffer chargé pour filtres:', buffer);
            setAudioBuffer(buffer);
          } catch (error) {
            console.error('❌ Error loading audio buffer:', error);
          }
        }
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
    // Utiliser le filtre si disponible
    if (audioBuffer && filterProcessorRef.current) {
      filterProcessorRef.current.playWithFilter(
        audioBuffer,
        selectedFilter.id,
        () => setIsPlaying(false)
      );
      setIsPlaying(true);
    } else if (audioBlob && audioRef.current) {
      // Fallback sur le lecteur HTML5 classique
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
    // Arrêter le filtre processor ou le lecteur HTML5
    if (filterProcessorRef.current) {
      filterProcessorRef.current.stop();
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
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
    setCaption('');
    if (audioRef.current) {
      audioRef.current.src = '';
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePublish = async () => {
    if (!audioBlob || (publishType === 'post' && selectedTags.length === 0)) {
      alert(publishType === 'post'
        ? 'Veuillez enregistrer un audio et sélectionner au moins un tag'
        : 'Veuillez enregistrer un audio');
      return;
    }

    if (!user) {
      alert('Vous devez être connecté pour publier un vocal');
      router.push('/auth/login');
      return;
    }

    setIsUploading(true);

    try {
      // Appliquer le filtre si sélectionné
      let finalAudioBlob = audioBlob;
      if (selectedFilter.id !== 'original' && filterProcessorRef.current) {
        console.log('🎨 Application du filtre:', selectedFilter.name);
        finalAudioBlob = await filterProcessorRef.current.applyFilterAndExport(audioBlob, selectedFilter.id);
      }

      // Déterminer le nom et l'extension du fichier
      const fileExtension = importedFile ?
        importedFile.name.split('.').pop() || 'mp3' :
        'wav';
      const fileName = `${publishType}-${Date.now()}.${fileExtension}`;
      const filePath = `${user.id}/${fileName}`;

      console.log(`🎙️ Upload du ${publishType}:`, filePath);

      // Upload audio vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(filePath, finalAudioBlob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw uploadError;
      }

      console.log(`✅ ${publishType} uploadé:`, uploadData);

      // Obtenir l'URL publique du fichier
      const { data: { publicUrl } } = supabase.storage
        .from('audio-files')
        .getPublicUrl(filePath);

      console.log('📎 URL publique:', publicUrl);

      // Utiliser la bonne durée selon le mode
      const duration = mode === 'import' ? audioDuration : recordingTime;

      if (publishType === 'story') {
        // Créer une story
        const { error: storyError } = await supabase
          .from('stories')
          .insert([
            {
              user_id: user.id,
              audio_url: publicUrl,
              duration: duration
            }
          ]);

        if (storyError) {
          console.error('❌ Story creation error:', storyError);
          throw storyError;
        }

        console.log('✅ Story créée');
        alert('Story publiée avec succès ! 🎉');
        router.push('/');
      } else {
        // Créer un post dans la base de données
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .insert([
            {
              user_id: user.id,
              audio_url: publicUrl,
              duration: duration,
              caption: caption.trim() || null,
              likes_count: 0,
              comments_count: 0
            }
          ])
          .select()
          .single();

        if (postError) {
          console.error('❌ Post creation error:', postError);
          throw postError;
        }

        console.log('✅ Post créé:', postData);

        // Associer les tags au post
        const tagAssociations = selectedTags.map(tag => ({
          post_id: postData.id,
          tag_id: tag.id
        }));

        const { error: tagError } = await supabase
          .from('post_tags')
          .insert(tagAssociations);

        if (tagError) {
          console.error('❌ Tag association error:', tagError);
          throw tagError;
        }

        console.log('✅ Tags associés');
        alert('Voccal publié avec succès ! 🎉');
        router.push('/'); // Retour au fil d'actualité
      }

    } catch (error) {
      console.error(`❌ Error publishing ${publishType}:`, error);
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
          <h1 className="text-xl font-bold text-white">Nouveau Voccal</h1>
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

        {/* Filter Selection */}
        {(audioBlob || importedFile) && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Filtre vocal
              </h3>
              <button
                onClick={() => setShowFilterSelector(!showFilterSelector)}
                className="text-purple-300 hover:text-purple-200"
              >
                {showFilterSelector ? 'Fermer' : 'Choisir'}
              </button>
            </div>

            {/* Selected Filter */}
            <div className="mb-4">
              <div className={`${selectedFilter.color} text-white px-4 py-3 rounded-lg flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedFilter.emoji}</span>
                  <div>
                    <p className="font-semibold">{selectedFilter.name}</p>
                    <p className="text-sm text-white/80">{selectedFilter.description}</p>
                  </div>
                </div>
                {audioBuffer && (
                  <button
                    onClick={() => {
                      if (isPlaying) {
                        pauseAudio();
                      } else {
                        playAudio();
                      }
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                  </button>
                )}
              </div>
            </div>

            {/* Filter Selector Grid */}
            {showFilterSelector && (
              <div className="grid grid-cols-2 gap-2">
                {availableFilters.map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => {
                      setSelectedFilter(filter);
                      // Rejouer avec le nouveau filtre si en cours de lecture
                      if (isPlaying && audioBuffer) {
                        pauseAudio();
                        setTimeout(() => {
                          setSelectedFilter(filter);
                        }, 100);
                      }
                    }}
                    className={`${
                      selectedFilter.id === filter.id
                        ? `${filter.color} text-white`
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    } px-3 py-3 rounded-lg flex items-center gap-2 transition-all text-left`}
                  >
                    <span className="text-xl">{filter.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{filter.name}</p>
                      <p className="text-xs opacity-80 truncate">{filter.description}</p>
                    </div>
                    {selectedFilter.id === filter.id && (
                      <Check className="w-4 h-4 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Publish Type Selection */}
        {(audioBlob || importedFile) && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-4">Type de publication</h3>
            <div className="flex gap-4">
              <button
                onClick={() => setPublishType('post')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                  publishType === 'post'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                📝 Post sur le mur
              </button>
              <button
                onClick={() => setPublishType('story')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                  publishType === 'story'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                ⭐ Story (24h)
              </button>
            </div>
          </div>
        )}

        {/* Tag Selection (only for posts) */}
        {(audioBlob || importedFile) && publishType === 'post' && (
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
              <div className="grid grid-cols-3 gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag)}
                    disabled={selectedTags.length >= 3 && !selectedTags.find(t => t.id === tag.id)}
                    className={`${
                      selectedTags.find(t => t.id === tag.id) 
                        ? `${tag.color} text-white` 
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    } text-xs px-2 py-2 rounded-lg flex items-center justify-center gap-1 transition-all disabled:opacity-50`}
                  >
                    <span>{tag.emoji}</span>
                    <span>{tag.name}</span>
                    {selectedTags.find(t => t.id === tag.id) && (
                      <Check className="w-3 h-3" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Caption Input (optional) */}
        {(audioBlob || importedFile) && publishType === 'post' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-3">Description (optionnelle)</h3>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={500}
              placeholder="Ajoutez une description à votre vocal... (max 500 caractères)"
              className="w-full bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={4}
            />
            <div className="text-right mt-2">
              <span className={`text-sm ${caption.length > 450 ? 'text-red-300' : 'text-white/60'}`}>
                {caption.length}/500
              </span>
            </div>
          </div>
        )}

        {/* Publish Button */}
        {audioBlob && (publishType === 'story' || selectedTags.length > 0) && (
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
            {isUploading ? 'Publication...' : (publishType === 'story' ? 'Publier la story' : 'Publier le vocal')}
          </button>
        )}

        {/* Audio Element */}
        <audio ref={audioRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default RecordingPage;