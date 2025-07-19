
import { tenantManager } from './TenantManager';

interface VoiceSettings {
  enabled: boolean;
  language: string;
  rate: number;
  pitch: number;
  volume: number;
  voice?: string;
}

class VoiceService {
  private static instance: VoiceService;
  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private settings: VoiceSettings = {
    enabled: true,
    language: 'hi-IN',
    rate: 0.8,
    pitch: 1.0,
    volume: 0.8
  };

  static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  initialize(): void {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      
      // Load voices when they become available
      this.loadVoices();
      
      // Some browsers require user interaction first
      this.synthesis.onvoiceschanged = () => {
        this.loadVoices();
      };

      console.log('VoiceService: Initialized with Web Speech API');
    } else {
      console.warn('VoiceService: Web Speech API not supported');
    }
  }

  private loadVoices(): void {
    if (!this.synthesis) return;

    this.voices = this.synthesis.getVoices();
    console.log('VoiceService: Loaded voices:', this.voices.length);

    // Try to find the best voice for current language
    this.selectBestVoice();
  }

  private selectBestVoice(): void {
    if (this.voices.length === 0) return;

    // Find voices for current language
    const currentLangVoices = this.voices.filter(voice => 
      voice.lang.startsWith(this.settings.language.split('-')[0])
    );

    if (currentLangVoices.length > 0) {
      // Prefer local voices
      const localVoice = currentLangVoices.find(voice => voice.localService);
      this.settings.voice = (localVoice || currentLangVoices[0]).name;
    } else {
      // Fallback to English
      const englishVoice = this.voices.find(voice => voice.lang.startsWith('en'));
      if (englishVoice) {
        this.settings.voice = englishVoice.name;
      }
    }

    console.log('VoiceService: Selected voice:', this.settings.voice);
  }

  speak(text: string, options: Partial<VoiceSettings> = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis || !this.settings.enabled) {
        resolve();
        return;
      }

      // Stop any current speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply settings
      utterance.lang = options.language || this.settings.language;
      utterance.rate = options.rate || this.settings.rate;
      utterance.pitch = options.pitch || this.settings.pitch;
      utterance.volume = options.volume || this.settings.volume;

      // Set voice if available
      if (this.settings.voice) {
        const voice = this.voices.find(v => v.name === this.settings.voice);
        if (voice) {
          utterance.voice = voice;
        }
      }

      utterance.onend = () => resolve();
      utterance.onerror = (error) => {
        console.error('VoiceService: Speech error:', error);
        reject(error);
      };

      this.synthesis.speak(utterance);
    });
  }

  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  pause(): void {
    if (this.synthesis) {
      this.synthesis.pause();
    }
  }

  resume(): void {
    if (this.synthesis) {
      this.synthesis.resume();
    }
  }

  // Language-specific speak methods
  async speakInHindi(text: string): Promise<void> {
    return this.speak(text, { language: 'hi-IN' });
  }

  async speakInEnglish(text: string): Promise<void> {
    return this.speak(text, { language: 'en-IN' });
  }

  async speakInMarathi(text: string): Promise<void> {
    return this.speak(text, { language: 'mr-IN' });
  }

  // Utility methods
  isSupported(): boolean {
    return !!this.synthesis;
  }

  isSpeaking(): boolean {
    return this.synthesis ? this.synthesis.speaking : false;
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    // Save to localStorage
    localStorage.setItem('voice_settings', JSON.stringify(this.settings));
  }

  loadSettings(): void {
    const saved = localStorage.getItem('voice_settings');
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      } catch (error) {
        console.error('VoiceService: Error loading settings:', error);
      }
    }
  }

  // Smart reading methods for different content types
  async readCard(title: string, content: string): Promise<void> {
    const text = `${title}. ${content}`;
    return this.speak(text);
  }

  async readNotification(message: string): Promise<void> {
    const prefix = 'सूचना'; // "Notification" in Hindi
    return this.speak(`${prefix}. ${message}`);
  }

  async readWeatherAlert(alert: string): Promise<void> {
    const prefix = 'मौसम चेतावनी'; // "Weather Alert" in Hindi
    return this.speak(`${prefix}. ${alert}`);
  }

  async readFormField(label: string, value?: string): Promise<void> {
    const text = value ? `${label}: ${value}` : label;
    return this.speak(text);
  }
}

export const voiceService = VoiceService.getInstance();
