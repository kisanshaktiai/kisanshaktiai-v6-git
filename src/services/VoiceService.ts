
import { tenantManager } from './TenantManager';

interface VoiceSettings {
  enabled: boolean;
  language: string;
  rate: number;
  pitch: number;
  volume: number;
  voice?: SpeechSynthesisVoice;
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
  private commandRegistry: Map<string, () => void> = new Map();
  private recognition: any = null;
  private isListening: boolean = false;
  private wakeWordActive: boolean = false;

  static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  initialize(): void {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
      
      this.synthesis.onvoiceschanged = () => {
        this.loadVoices();
      };

      console.log('VoiceService: Initialized with Web Speech API');
    } else {
      console.warn('VoiceService: Web Speech API not supported');
    }

    // Initialize speech recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = this.settings.language;
    }
  }

  private loadVoices(): void {
    if (!this.synthesis) return;

    this.voices = this.synthesis.getVoices();
    console.log('VoiceService: Loaded voices:', this.voices.length);
    this.selectBestVoice();
  }

  private selectBestVoice(): void {
    if (this.voices.length === 0) return;

    const currentLangVoices = this.voices.filter(voice => 
      voice.lang.startsWith(this.settings.language.split('-')[0])
    );

    if (currentLangVoices.length > 0) {
      const localVoice = currentLangVoices.find(voice => voice.localService);
      this.settings.voice = localVoice || currentLangVoices[0];
    } else {
      const englishVoice = this.voices.find(voice => voice.lang.startsWith('en'));
      if (englishVoice) {
        this.settings.voice = englishVoice;
      }
    }

    console.log('VoiceService: Selected voice:', this.settings.voice?.name);
  }

  speak(text: string, options: Partial<VoiceSettings> = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis || !this.settings.enabled) {
        resolve();
        return;
      }

      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.lang = options.language || this.settings.language;
      utterance.rate = options.rate || this.settings.rate;
      utterance.pitch = options.pitch || this.settings.pitch;
      utterance.volume = options.volume || this.settings.volume;

      if (this.settings.voice) {
        utterance.voice = this.settings.voice;
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
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
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

  // Speech Recognition methods
  registerCommand(command: string, callback: () => void): void {
    this.commandRegistry.set(command.toLowerCase(), callback);
  }

  startListening(): void {
    if (!this.recognition || this.isListening) return;

    this.isListening = true;
    this.recognition.start();

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log('VoiceService: Recognized:', transcript);
      
      // Check for registered commands
      for (const [command, callback] of this.commandRegistry) {
        if (transcript.includes(command)) {
          callback();
          break;
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('VoiceService: Recognition error:', event.error);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  startWakeWordDetection(): void {
    this.wakeWordActive = true;
    this.registerCommand('hey kisanshakti', () => {
      console.log('Wake word detected');
      this.startListening();
    });
  }

  stopWakeWordDetection(): void {
    this.wakeWordActive = false;
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

  getSettings(): VoiceSettings {
    return { ...this.settings };
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
        const savedSettings = JSON.parse(saved);
        this.settings = { ...this.settings, ...savedSettings };
        // Re-find voice object since it's not serializable
        if (savedSettings.voice?.name) {
          const voice = this.voices.find(v => v.name === savedSettings.voice.name);
          if (voice) {
            this.settings.voice = voice;
          }
        }
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

// Export both the class and instance
export { VoiceService };
export const voiceService = VoiceService.getInstance();
