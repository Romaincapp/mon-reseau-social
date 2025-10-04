// lib/audioFilters.ts
export interface AudioFilter {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  playbackRate?: number; // Vitesse de lecture (1.0 = normal)
}

export const availableFilters: AudioFilter[] = [
  {
    id: 'original',
    name: 'Original',
    emoji: '🎤',
    description: 'Sans effet',
    color: 'bg-gray-500'
  },
  {
    id: 'warm',
    name: 'Chaleureux',
    emoji: '☀️',
    description: 'Son chaud et doux',
    color: 'bg-orange-400'
  },
  {
    id: 'bright',
    name: 'Cristallin',
    emoji: '✨',
    description: 'Voix claire et nette',
    color: 'bg-yellow-400'
  },
  {
    id: 'radio',
    name: 'Radio',
    emoji: '📻',
    description: 'Style radio vintage',
    color: 'bg-orange-500'
  },
  {
    id: 'chipmunk',
    name: 'Écureuil',
    emoji: '🐿️',
    description: 'Voix aiguë mignonne',
    color: 'bg-yellow-500',
    playbackRate: 1.35
  },
  {
    id: 'deep',
    name: 'Grave',
    emoji: '🎸',
    description: 'Voix profonde',
    color: 'bg-blue-700',
    playbackRate: 0.75
  },
  {
    id: 'robot',
    name: 'Robot',
    emoji: '🤖',
    description: 'Voix robotique',
    color: 'bg-cyan-500',
    playbackRate: 1.1
  }
  // Filtres désactivés temporairement
  // {
  //   id: 'echo',
  //   name: 'Écho',
  //   emoji: '🏔️',
  //   description: 'Effet montagne',
  //   color: 'bg-purple-500',
  //   playbackRate: 0.95
  // },
  // {
  //   id: 'underwater',
  //   name: 'Sous l\'eau',
  //   emoji: '🌊',
  //   description: 'Ambiance aquatique',
  //   color: 'bg-blue-500',
  //   playbackRate: 0.85
  // },
  // {
  //   id: 'telephone',
  //   name: 'Téléphone',
  //   emoji: '☎️',
  //   description: 'Appel téléphonique',
  //   color: 'bg-green-600'
  // },
  // {
  //   id: 'stadium',
  //   name: 'Stade',
  //   emoji: '🏟️',
  //   description: 'Annonce dans un stade',
  //   color: 'bg-red-500'
  // },
  // {
  //   id: 'space',
  //   name: 'Espace',
  //   emoji: '🚀',
  //   description: 'Communication spatiale',
  //   color: 'bg-indigo-600',
  //   playbackRate: 0.9
  // }
];

export class AudioFilterProcessor {
  private audioContext: AudioContext;
  private sourceNode: AudioBufferSourceNode | null = null;
  private filterNodes: AudioNode[] = [];
  private gainNode: GainNode;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.gainNode = this.audioContext.createGain();
  }

  // Charger un fichier audio
  async loadAudioFromBlob(blob: Blob): Promise<AudioBuffer> {
    const arrayBuffer = await blob.arrayBuffer();
    return await this.audioContext.decodeAudioData(arrayBuffer);
  }

  // Appliquer un filtre spécifique
  private applyFilter(filterId: string): AudioNode[] {
    const nodes: AudioNode[] = [];

    switch (filterId) {
      case 'original':
        // Normalisation de base
        const originalComp = this.audioContext.createDynamicsCompressor();
        originalComp.threshold.value = -24;
        originalComp.knee.value = 30;
        originalComp.ratio.value = 3;
        originalComp.attack.value = 0.003;
        originalComp.release.value = 0.25;
        nodes.push(originalComp);
        break;

      case 'warm':
        // Son chaleureux et doux
        const warmBass = this.audioContext.createBiquadFilter();
        warmBass.type = 'lowshelf';
        warmBass.frequency.value = 200;
        warmBass.gain.value = 4;
        nodes.push(warmBass);

        const warmTreble = this.audioContext.createBiquadFilter();
        warmTreble.type = 'highshelf';
        warmTreble.frequency.value = 8000;
        warmTreble.gain.value = -3;
        nodes.push(warmTreble);

        // Compression douce + normalisation
        const warmComp = this.audioContext.createDynamicsCompressor();
        warmComp.threshold.value = -22;
        warmComp.knee.value = 20;
        warmComp.ratio.value = 4;
        warmComp.attack.value = 0.005;
        warmComp.release.value = 0.2;
        nodes.push(warmComp);

        // Gain final pour normaliser
        const warmGain = this.audioContext.createGain();
        warmGain.gain.value = 1.1;
        nodes.push(warmGain);
        break;

      case 'bright':
        // Voix claire et cristalline
        const brightPresence = this.audioContext.createBiquadFilter();
        brightPresence.type = 'peaking';
        brightPresence.frequency.value = 3000;
        brightPresence.Q.value = 1;
        brightPresence.gain.value = 5;
        nodes.push(brightPresence);

        const brightAir = this.audioContext.createBiquadFilter();
        brightAir.type = 'highshelf';
        brightAir.frequency.value = 10000;
        brightAir.gain.value = 4;
        nodes.push(brightAir);

        const brightComp = this.audioContext.createDynamicsCompressor();
        brightComp.threshold.value = -18;
        brightComp.ratio.value = 4;
        nodes.push(brightComp);
        break;

      case 'radio':
        // Radio vintage mais compréhensible
        const radioHP = this.audioContext.createBiquadFilter();
        radioHP.type = 'highpass';
        radioHP.frequency.value = 300;
        nodes.push(radioHP);

        const radioLP = this.audioContext.createBiquadFilter();
        radioLP.type = 'lowpass';
        radioLP.frequency.value = 5000;
        nodes.push(radioLP);

        const radioMid = this.audioContext.createBiquadFilter();
        radioMid.type = 'peaking';
        radioMid.frequency.value = 1500;
        radioMid.Q.value = 1.5;
        radioMid.gain.value = 6;
        nodes.push(radioMid);

        // Légère distortion pour authenticité
        const radioDist = this.audioContext.createWaveShaper();
        radioDist.curve = this.makeDistortionCurve(30);
        nodes.push(radioDist);

        const radioComp = this.audioContext.createDynamicsCompressor();
        radioComp.threshold.value = -25;
        radioComp.ratio.value = 6;
        nodes.push(radioComp);
        break;

      case 'chipmunk':
        // Voix aiguë mignonne mais compréhensible
        const chipmunkHP = this.audioContext.createBiquadFilter();
        chipmunkHP.type = 'highpass';
        chipmunkHP.frequency.value = 400;
        nodes.push(chipmunkHP);

        // Boost modéré des aigus
        const chipmunkBoost = this.audioContext.createBiquadFilter();
        chipmunkBoost.type = 'highshelf';
        chipmunkBoost.frequency.value = 2000;
        chipmunkBoost.gain.value = 8;
        nodes.push(chipmunkBoost);

        // Suppression des basses
        const chipmunkLP = this.audioContext.createBiquadFilter();
        chipmunkLP.type = 'peaking';
        chipmunkLP.frequency.value = 150;
        chipmunkLP.Q.value = 1;
        chipmunkLP.gain.value = -10;
        nodes.push(chipmunkLP);

        // Compression forte pour stabilité + normalisation
        const chipmunkComp = this.audioContext.createDynamicsCompressor();
        chipmunkComp.threshold.value = -18;
        chipmunkComp.knee.value = 15;
        chipmunkComp.ratio.value = 10;
        chipmunkComp.attack.value = 0.003;
        chipmunkComp.release.value = 0.1;
        nodes.push(chipmunkComp);

        // Gain make-up pour compenser le playback rate
        const chipmunkGain = this.audioContext.createGain();
        chipmunkGain.gain.value = 0.9;
        nodes.push(chipmunkGain);
        break;

      case 'deep':
        // Voix profonde et grave
        const deepLP = this.audioContext.createBiquadFilter();
        deepLP.type = 'lowpass';
        deepLP.frequency.value = 1200;
        nodes.push(deepLP);

        const deepBass = this.audioContext.createBiquadFilter();
        deepBass.type = 'lowshelf';
        deepBass.frequency.value = 200;
        deepBass.gain.value = 10;
        nodes.push(deepBass);

        // Réduction des aigus
        const deepTreble = this.audioContext.createBiquadFilter();
        deepTreble.type = 'highshelf';
        deepTreble.frequency.value = 3000;
        deepTreble.gain.value = -8;
        nodes.push(deepTreble);

        // Compression + normalisation
        const deepComp = this.audioContext.createDynamicsCompressor();
        deepComp.threshold.value = -22;
        deepComp.knee.value = 25;
        deepComp.ratio.value = 6;
        deepComp.attack.value = 0.005;
        deepComp.release.value = 0.2;
        nodes.push(deepComp);

        // Gain make-up pour compenser le ralentissement
        const deepGain = this.audioContext.createGain();
        deepGain.gain.value = 1.3;
        nodes.push(deepGain);
        break;

      case 'robot':
        // Robot subtil mais reconnaissable
        const robotBP = this.audioContext.createBiquadFilter();
        robotBP.type = 'bandpass';
        robotBP.frequency.value = 1200;
        robotBP.Q.value = 5;
        nodes.push(robotBP);

        // Tremolo modéré
        const robotTremolo = this.audioContext.createGain();
        const robotLFO = this.audioContext.createOscillator();
        robotLFO.frequency.value = 7;
        const robotDepth = this.audioContext.createGain();
        robotDepth.gain.value = 0.25;
        robotLFO.connect(robotDepth);
        robotDepth.connect(robotTremolo.gain);
        robotLFO.start();
        nodes.push(robotTremolo);

        // Légère distortion digitale
        const robotDist = this.audioContext.createWaveShaper();
        robotDist.curve = this.makeBitReductionCurve(8);
        nodes.push(robotDist);

        const robotComp = this.audioContext.createDynamicsCompressor();
        robotComp.threshold.value = -18;
        robotComp.ratio.value = 10;
        nodes.push(robotComp);
        break;

      case 'echo':
        // Écho léger et court
        const echoDelay = this.audioContext.createDelay(0.3);
        echoDelay.delayTime.value = 0.15;
        nodes.push(echoDelay);

        const echoFeedback = this.audioContext.createGain();
        echoFeedback.gain.value = 0.25;
        nodes.push(echoFeedback);

        // Connecter le feedback
        echoDelay.connect(echoFeedback);
        echoFeedback.connect(echoDelay);

        // Légère reverb courte
        const echoReverb = this.audioContext.createConvolver();
        echoReverb.buffer = this.createReverbBuffer(0.6, 0.3);
        nodes.push(echoReverb);
        break;

      case 'underwater':
        // Sous l'eau avec lowpass doux
        const waterLP = this.audioContext.createBiquadFilter();
        waterLP.type = 'lowpass';
        waterLP.frequency.value = 2000;
        waterLP.Q.value = 1;
        nodes.push(waterLP);

        // Delay très court pour effet aquatique
        const waterDelay = this.audioContext.createDelay(0.05);
        waterDelay.delayTime.value = 0.015;
        nodes.push(waterDelay);

        const waterFeedback = this.audioContext.createGain();
        waterFeedback.gain.value = 0.15;
        nodes.push(waterFeedback);

        waterDelay.connect(waterFeedback);
        waterFeedback.connect(waterDelay);

        // LFO subtil pour ondulation
        const waterLFO = this.audioContext.createOscillator();
        waterLFO.frequency.value = 1.2;
        const waterDepth = this.audioContext.createGain();
        waterDepth.gain.value = 0.002;
        waterLFO.connect(waterDepth);
        waterDepth.connect(waterDelay.delayTime);
        waterLFO.start();
        break;

      case 'telephone':
        // Téléphone classique
        const phoneHP = this.audioContext.createBiquadFilter();
        phoneHP.type = 'highpass';
        phoneHP.frequency.value = 300;
        nodes.push(phoneHP);

        const phoneLP = this.audioContext.createBiquadFilter();
        phoneLP.type = 'lowpass';
        phoneLP.frequency.value = 3400;
        nodes.push(phoneLP);

        const phoneMid = this.audioContext.createBiquadFilter();
        phoneMid.type = 'peaking';
        phoneMid.frequency.value = 1000;
        phoneMid.Q.value = 2;
        phoneMid.gain.value = 8;
        nodes.push(phoneMid);

        // Légère distortion
        const phoneDist = this.audioContext.createWaveShaper();
        phoneDist.curve = this.makeDistortionCurve(35);
        nodes.push(phoneDist);

        const phoneComp = this.audioContext.createDynamicsCompressor();
        phoneComp.threshold.value = -30;
        phoneComp.ratio.value = 12;
        nodes.push(phoneComp);
        break;

      case 'stadium':
        // Annonce de stade avec delay court
        const stadiumBP = this.audioContext.createBiquadFilter();
        stadiumBP.type = 'bandpass';
        stadiumBP.frequency.value = 1800;
        stadiumBP.Q.value = 1.2;
        nodes.push(stadiumBP);

        const stadiumBoost = this.audioContext.createBiquadFilter();
        stadiumBoost.type = 'peaking';
        stadiumBoost.frequency.value = 2500;
        stadiumBoost.Q.value = 1.5;
        stadiumBoost.gain.value = 6;
        nodes.push(stadiumBoost);

        // Delay court pour espace
        const stadiumDelay = this.audioContext.createDelay(0.25);
        stadiumDelay.delayTime.value = 0.08;
        nodes.push(stadiumDelay);

        const stadiumFeedback = this.audioContext.createGain();
        stadiumFeedback.gain.value = 0.2;
        nodes.push(stadiumFeedback);

        stadiumDelay.connect(stadiumFeedback);
        stadiumFeedback.connect(stadiumDelay);

        // Légère distortion
        const stadiumDist = this.audioContext.createWaveShaper();
        stadiumDist.curve = this.makeDistortionCurve(35);
        nodes.push(stadiumDist);

        const stadiumComp = this.audioContext.createDynamicsCompressor();
        stadiumComp.threshold.value = -20;
        stadiumComp.ratio.value = 8;
        nodes.push(stadiumComp);
        break;

      case 'space':
        // Communication spatiale
        const spaceHP = this.audioContext.createBiquadFilter();
        spaceHP.type = 'highpass';
        spaceHP.frequency.value = 500;
        nodes.push(spaceHP);

        const spaceLP = this.audioContext.createBiquadFilter();
        spaceLP.type = 'lowpass';
        spaceLP.frequency.value = 4000;
        nodes.push(spaceLP);

        // Légère distortion radio
        const spaceDist = this.audioContext.createWaveShaper();
        spaceDist.curve = this.makeDistortionCurve(40);
        nodes.push(spaceDist);

        // Reverb métallique
        const spaceReverb = this.audioContext.createConvolver();
        spaceReverb.buffer = this.createReverbBuffer(1.2, 0.4);
        nodes.push(spaceReverb);

        // Tremolo subtil
        const spaceTremolo = this.audioContext.createGain();
        const spaceLFO = this.audioContext.createOscillator();
        spaceLFO.frequency.value = 3;
        const spaceDepth = this.audioContext.createGain();
        spaceDepth.gain.value = 0.15;
        spaceLFO.connect(spaceDepth);
        spaceDepth.connect(spaceTremolo.gain);
        spaceLFO.start();
        nodes.push(spaceTremolo);

        const spaceComp = this.audioContext.createDynamicsCompressor();
        spaceComp.threshold.value = -22;
        spaceComp.ratio.value = 8;
        nodes.push(spaceComp);
        break;
    }

    return nodes;
  }

  // Jouer l'audio avec un filtre en preview
  playWithFilter(audioBuffer: AudioBuffer, filterId: string, onEnded?: () => void) {
    // Arrêter la lecture précédente
    this.stop();

    // Créer une nouvelle source
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = audioBuffer;

    // Trouver le filtre pour obtenir le playback rate
    const filter = availableFilters.find(f => f.id === filterId);
    if (filter?.playbackRate) {
      this.sourceNode.playbackRate.value = filter.playbackRate;
      console.log(`🎵 Playback rate: ${filter.playbackRate}x`);
    }

    // Appliquer le filtre
    this.filterNodes = this.applyFilter(filterId);

    // Connecter les nœuds
    let currentNode: AudioNode = this.sourceNode;

    for (const filterNode of this.filterNodes) {
      currentNode.connect(filterNode);
      currentNode = filterNode;
    }

    currentNode.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    // Gérer la fin de lecture
    if (onEnded) {
      this.sourceNode.onended = onEnded;
    }

    // Démarrer la lecture
    this.sourceNode.start();
  }

  // Arrêter la lecture
  stop() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (e) {
        // Ignorer l'erreur si déjà arrêté
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    // Déconnecter les filtres
    this.filterNodes.forEach(node => {
      try {
        node.disconnect();
      } catch (e) {
        // Ignorer
      }
    });
    this.filterNodes = [];
  }

  // Appliquer le filtre et exporter
  async applyFilterAndExport(audioBlob: Blob, filterId: string): Promise<Blob> {
    if (filterId === 'original') {
      return audioBlob;
    }

    const audioBuffer = await this.loadAudioFromBlob(audioBlob);

    // Trouver le filtre pour obtenir le playback rate
    const filter = availableFilters.find(f => f.id === filterId);
    const playbackRate = filter?.playbackRate || 1.0;

    // Calculer la nouvelle longueur avec le playback rate
    const newLength = Math.floor(audioBuffer.length / playbackRate);

    // Créer un contexte offline pour le rendu
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      newLength,
      audioBuffer.sampleRate
    );

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    // Appliquer le playback rate
    if (playbackRate !== 1.0) {
      source.playbackRate.value = playbackRate;
      console.log(`🎵 Exporting with playback rate: ${playbackRate}x`);
    }

    // Recréer les filtres dans le contexte offline
    const tempContext = this.audioContext;
    this.audioContext = offlineContext as any;
    const filters = this.applyFilter(filterId);
    this.audioContext = tempContext;

    // Connecter
    let currentNode: AudioNode = source;
    for (const filter of filters) {
      currentNode.connect(filter);
      currentNode = filter;
    }
    currentNode.connect(offlineContext.destination);

    source.start();

    // Rendre l'audio
    const renderedBuffer = await offlineContext.startRendering();

    // Convertir en WAV blob
    return this.audioBufferToWav(renderedBuffer);
  }

  // Utilitaires
  private makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }

    return curve as Float32Array<ArrayBuffer>;
  }

  private makeBitReductionCurve(bits: number): Float32Array<ArrayBuffer> {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const levels = Math.pow(2, bits);

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      const quantized = Math.round(x * levels) / levels;
      curve[i] = quantized;
    }

    return curve as Float32Array<ArrayBuffer>;
  }

  private createReverbBuffer(duration: number, decay: number): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);

      for (let i = 0; i < length; i++) {
        const t = i / length;
        const envelope = Math.pow(1 - t, decay);
        channelData[i] = (Math.random() * 2 - 1) * envelope;
      }
    }

    return buffer;
  }

  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const numberOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);
    const channels: Float32Array[] = [];
    let offset = 0;
    let pos = 0;

    // Write WAV header
    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };
    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    // RIFF chunk descriptor
    setUint32(0x46464952); // "RIFF"
    setUint32(36 + length); // file length - 8
    setUint32(0x45564157); // "WAVE"

    // fmt sub-chunk
    setUint32(0x20746d66); // "fmt "
    setUint32(16); // subchunk1 size, PCM
    setUint16(1); // audio format, PCM
    setUint16(numberOfChannels);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numberOfChannels); // byte rate
    setUint16(numberOfChannels * 2); // block align
    setUint16(16); // bits per sample

    // data sub-chunk
    setUint32(0x61746164); // "data"
    setUint32(length);

    // Write interleaved data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < arrayBuffer.byteLength) {
      for (let i = 0; i < numberOfChannels; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  // Libérer les ressources
  dispose() {
    this.stop();
    this.audioContext.close();
  }
}
