import { supabase } from '@/integrations/supabase/client';

export interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
  voice?: SpeechSynthesisVoice;
  language: string;
}

export interface VoiceCommand {
  phrase: string;
  action: string;
  parameters?: Record<string, any>;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class VoiceService {
  private static instance: VoiceService;
  private synthesis: SpeechSynthesis;
  private recognition: any = null;
  private isListening = false;
  private isWakeWordMode = false;
  private settings: VoiceSettings;
  private commandHandlers: Map<string, (params?: any) => void> = new Map();
  private voices: SpeechSynthesisVoice[] = [];
  private wakeWord = 'hey kisanshakti';

  static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.settings = {
      rate: 1,
      pitch: 1,
      volume: 1,
      language: 'hi-IN'
    };
    this.loadVoices();
    this.initializeRecognition();
  }

  private loadVoices() {
    const updateVoices = () => {
      this.voices = this.synthesis.getVoices();
    };

    updateVoices();
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = updateVoices;
    }
  }

  private initializeRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      
      this.recognition.onresult = this.handleSpeechResult.bind(this);
      this.recognition.onerror = this.handleSpeechError.bind(this);
      this.recognition.onend = this.handleSpeechEnd.bind(this);
    }
  }

  private handleSpeechResult(event: any) {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript) {
      if (this.isWakeWordMode) {
        this.checkWakeWord(finalTranscript);
      } else {
        this.processVoiceCommand(finalTranscript);
      }
    }
  }

  private handleSpeechError(event: any) {
    console.error('Speech recognition error:', event.error);
    if (event.error === 'no-speech' && this.isWakeWordMode) {
      // Restart listening for wake word
      setTimeout(() => this.startWakeWordDetection(), 1000);
    }
  }

  private handleSpeechEnd() {
    if (this.isListening || this.isWakeWordMode) {
      // Auto-restart recognition
      setTimeout(() => {
        if (this.recognition && (this.isListening || this.isWakeWordMode)) {
          this.recognition.start();
        }
      }, 500);
    }
  }

  private checkWakeWord(transcript: string) {
    const normalized = transcript.toLowerCase().trim();
    if (normalized.includes(this.wakeWord)) {
      this.onWakeWordDetected();
    }
  }

  private onWakeWordDetected() {
    this.stopWakeWordDetection();
    this.playConfirmationSound();
    this.speak('Yes, how can I help you?');
    this.startListening();
  }

  private playConfirmationSound() {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }

  async speak(text: string, language?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!text) {
        resolve();
        return;
      }

      // Use edge function for better voice quality if available
      this.speakWithEdgeFunction(text, language).catch(() => {
        // Fallback to browser TTS
        this.speakWithBrowser(text, language).then(resolve).catch(reject);
      });
    });
  }

  private async speakWithEdgeFunction(text: string, language?: string) {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text,
          language: language || this.settings.language,
          voice: 'alloy',
          format: 'mp3'
        }
      });

      if (error) throw error;

      if (data?.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audio.volume = this.settings.volume;
        await audio.play();
      }
    } catch (error) {
      throw error;
    }
  }

  private async speakWithBrowser(text: string, language?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.rate = this.settings.rate;
      utterance.pitch = this.settings.pitch;
      utterance.volume = this.settings.volume;
      utterance.lang = language || this.settings.language;

      // Find appropriate voice
      const voice = this.findVoiceForLanguage(utterance.lang);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event.error);

      this.synthesis.speak(utterance);
    });
  }

  private findVoiceForLanguage(language: string): SpeechSynthesisVoice | null {
    const langCode = language.split('-')[0];
    
    // Exact match first
    let voice = this.voices.find(v => v.lang === language);
    if (voice) return voice;

    // Language code match
    voice = this.voices.find(v => v.lang.startsWith(langCode));
    if (voice) return voice;

    // Default fallback
    return this.voices.find(v => v.default) || this.voices[0] || null;
  }

  async transcribeAudio(audioBlob: Blob, language?: string): Promise<string> {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: {
          audio: base64Audio,
          language: language || this.settings.language
        }
      });

      if (error) throw error;
      return data?.text || '';
    } catch (error) {
      console.error('Transcription failed:', error);
      throw error;
    }
  }

  startListening(): void {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported');
    }

    this.isListening = true;
    this.recognition.lang = this.settings.language;
    this.recognition.start();
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
    }
  }

  startWakeWordDetection(): void {
    if (!this.recognition) return;

    this.isWakeWordMode = true;
    this.recognition.lang = this.settings.language;
    this.recognition.start();
  }

  stopWakeWordDetection(): void {
    if (this.recognition && this.isWakeWordMode) {
      this.isWakeWordMode = false;
      this.recognition.stop();
    }
  }

  registerCommand(phrase: string, handler: (params?: any) => void): void {
    this.commandHandlers.set(phrase.toLowerCase(), handler);
  }

  private processVoiceCommand(transcript: string): void {
    const normalized = transcript.toLowerCase().trim();
    
    // Check exact matches first
    for (const [phrase, handler] of this.commandHandlers) {
      if (normalized.includes(phrase)) {
        handler();
        return;
      }
    }

    // If no command found, treat as general input
    this.onUnrecognizedCommand(transcript);
  }

  private onUnrecognizedCommand(transcript: string): void {
    // Default action - could be handled by parent component
    console.log('Unrecognized command:', transcript);
  }

  updateSettings(settings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window && 
           ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  stop(): void {
    this.synthesis.cancel();
    this.stopListening();
    this.stopWakeWordDetection();
  }
}