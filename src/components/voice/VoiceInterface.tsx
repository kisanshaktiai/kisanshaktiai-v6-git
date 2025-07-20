
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, VolumeX, Settings, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { VoiceService } from '@/services/VoiceService';

interface VoiceInterfaceProps {
  onVoiceCommand?: (command: string) => void;
  onTranscript?: (text: string) => void;
  className?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  onVoiceCommand,
  onTranscript,
  className
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [voiceService] = useState(() => VoiceService.getInstance());
  
  const [isListening, setIsListening] = useState(false);
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState(voiceService.getSettings());
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [transcript, setTranscript] = useState('');
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Voice commands in different languages
  const voiceCommands = {
    en: {
      home: ['home', 'dashboard', 'main'],
      weather: ['weather', 'climate', 'forecast'],
      market: ['market', 'prices', 'marketplace'],
      chat: ['chat', 'ai', 'assistant'],
      lands: ['lands', 'farm', 'fields'],
      profile: ['profile', 'account', 'settings'],
      back: ['back', 'previous', 'return'],
      help: ['help', 'assistance', 'support']
    },
    hi: {
      home: ['घर', 'होम', 'मुख्य', 'डैशबोर्ड'],
      weather: ['मौसम', 'वातावरण', 'जलवायु'],
      market: ['बाजार', 'मंडी', 'दाम'],
      chat: ['चैट', 'बात', 'सहायक'],
      lands: ['जमीन', 'खेत', 'भूमि'],
      profile: ['प्रोफाइल', 'खाता', 'सेटिंग'],
      back: ['वापस', 'पीछे', 'पहले'],
      help: ['मदद', 'सहायता', 'सपोर्ट']
    },
    mr: {
      home: ['घर', 'होम', 'मुख्य'],
      weather: ['हवामान', 'वातावरण'],
      market: ['बाजार', 'मंडी'],
      chat: ['चॅट', 'बोलणे'],
      lands: ['जमीन', 'शेत'],
      profile: ['प्रोफाइल', 'खाते'],
      back: ['मागे', 'परत'],
      help: ['मदत', 'साहाय्य']
    }
  };

  useEffect(() => {
    initializeVoiceService();
    checkSpeechRecognitionSupport();
    loadVoices();
    
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    // Update language when i18n language changes
    if (recognitionRef.current) {
      const langCode = getSpeechRecognitionLanguage(i18n.language);
      recognitionRef.current.lang = langCode;
    }
  }, [i18n.language]);

  const initializeVoiceService = () => {
    try {
      voiceService.initialize();
      setVoiceSettings(voiceService.getSettings());
    } catch (error) {
      console.error('VoiceInterface: Failed to initialize voice service:', error);
      toast({
        title: t('Voice Service Error'),
        description: t('Failed to initialize voice service'),
        variant: 'destructive',
      });
    }
  };

  const checkSpeechRecognitionSupport = () => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsRecognitionSupported(true);
      try {
        const recognition = new SpeechRecognition() as SpeechRecognition;
        recognitionRef.current = recognition;
        setupRecognition(recognition);
      } catch (error) {
        console.error('VoiceInterface: Failed to create speech recognition:', error);
        setRecognitionError(t('Speech recognition initialization failed'));
      }
    } else {
      setIsRecognitionSupported(false);
      setRecognitionError(t('Speech recognition not supported in this browser'));
    }
  };

  const setupRecognition = (recognition: SpeechRecognition) => {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = getSpeechRecognitionLanguage(i18n.language);

    recognition.onstart = () => {
      console.log('VoiceInterface: Speech recognition started');
      setIsListening(true);
      setRecognitionError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      console.log('VoiceInterface: Recognized:', transcript);
      
      setTranscript(transcript);
      onTranscript?.(transcript);
      
      handleVoiceCommand(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('VoiceInterface: Recognition error:', event.error);
      setIsListening(false);
      
      const errorMessage = getRecognitionErrorMessage(event.error);
      setRecognitionError(errorMessage);
      
      if (event.error !== 'no-speech' && event.error !== 'audio-capture') {
        toast({
          title: t('Voice Recognition Error'),
          description: errorMessage,
          variant: 'destructive',
        });
      }
    };

    recognition.onend = () => {
      console.log('VoiceInterface: Speech recognition ended');
      setIsListening(false);
      
      // Auto-restart if wake word is active and no error occurred
      if (isWakeWordActive && !recognitionError) {
        restartTimeoutRef.current = setTimeout(() => {
          if (isWakeWordActive && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.error('VoiceInterface: Failed to restart recognition:', error);
            }
          }
        }, 1000);
      }
    };
  };

  const getSpeechRecognitionLanguage = (lang: string): string => {
    const langMap: Record<string, string> = {
      'hi': 'hi-IN',
      'en': 'en-US',
      'mr': 'mr-IN',
      'pa': 'pa-IN',
      'te': 'te-IN',
      'ta': 'ta-IN',
      'gu': 'gu-IN',
      'kn': 'kn-IN',
      'bn': 'bn-IN',
      'ml': 'ml-IN',
      'or': 'or-IN',
      'ur': 'ur-PK'
    };
    
    return langMap[lang] || 'en-US';
  };

  const getRecognitionErrorMessage = (error: string): string => {
    const errorMessages: Record<string, string> = {
      'no-speech': t('No speech detected. Please try again.'),
      'audio-capture': t('Microphone access denied or unavailable.'),
      'not-allowed': t('Microphone permission denied.'),
      'network': t('Network error occurred during recognition.'),
      'aborted': t('Speech recognition was aborted.'),
      'bad-grammar': t('Grammar error in speech recognition.'),
      'language-not-supported': t('Language not supported for speech recognition.')
    };
    
    return errorMessages[error] || t('Speech recognition error occurred.');
  };

  const handleVoiceCommand = (transcript: string) => {
    const currentLang = i18n.language as keyof typeof voiceCommands;
    const commands = voiceCommands[currentLang] || voiceCommands.en;
    
    let commandFound = false;
    
    // Check each command category
    Object.entries(commands).forEach(([action, keywords]) => {
      if (commandFound) return;
      
      const isMatch = keywords.some(keyword => 
        transcript.includes(keyword.toLowerCase())
      );
      
      if (isMatch) {
        commandFound = true;
        executeVoiceCommand(action, transcript);
      }
    });
    
    if (!commandFound) {
      // If no specific command found, pass to parent or show generic response
      onVoiceCommand?.(transcript);
      
      toast({
        title: t('Voice Command'),
        description: t('Command not recognized: {{transcript}}', { transcript }),
        variant: 'default',
      });
    }
  };

  const executeVoiceCommand = (action: string, transcript: string) => {
    console.log('VoiceInterface: Executing command:', action, transcript);
    
    const navigationMap: Record<string, string> = {
      home: '/',
      weather: '/weather',
      market: '/market',
      chat: '/ai-chat',
      lands: '/my-lands',
      profile: '/profile',
      back: -1 as any // Special case for going back
    };
    
    if (navigationMap[action]) {
      if (action === 'back') {
        navigate(-1);
      } else {
        navigate(navigationMap[action]);
      }
      
      // Announce navigation
      const message = t('Navigating to {{destination}}', { 
        destination: t(`navigation.${action}`) 
      });
      
      voiceService.speak(message).catch(console.error);
      
      toast({
        title: t('Voice Navigation'),
        description: message,
      });
    } else {
      // Handle other commands
      switch (action) {
        case 'help':
          showVoiceHelp();
          break;
        default:
          onVoiceCommand?.(action);
      }
    }
  };

  const showVoiceHelp = () => {
    const helpMessage = t('Available voice commands: Home, Weather, Market, Chat, My Lands, Profile, Back, and Help.');
    voiceService.speak(helpMessage).catch(console.error);
    
    toast({
      title: t('Voice Commands Help'),
      description: helpMessage,
    });
  };

  const loadVoices = () => {
    const loadVoicesHandler = () => {
      setAvailableVoices(voiceService.getAvailableVoices());
    };

    loadVoicesHandler();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoicesHandler;
    }
  };

  const startListening = async () => {
    if (!isRecognitionSupported || !recognitionRef.current) {
      toast({
        title: t('Not Available'),
        description: recognitionError || t('Speech recognition not available'),
        variant: 'destructive',
      });
      return;
    }

    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (recognitionRef.current && !isListening) {
        recognitionRef.current.start();
        
        toast({
          title: t('Listening'),
          description: t('Speak your command now'),
        });
      }
    } catch (error) {
      console.error('VoiceInterface: Failed to start listening:', error);
      toast({
        title: t('Microphone Error'),
        description: t('Could not access microphone. Please check permissions.'),
        variant: 'destructive',
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  };

  const toggleWakeWord = () => {
    if (isWakeWordActive) {
      setIsWakeWordActive(false);
      stopListening();
      
      toast({
        title: t('Wake Word Disabled'),
        description: t('Voice activation stopped'),
      });
    } else {
      if (!isRecognitionSupported) {
        toast({
          title: t('Not Available'),
          description: recognitionError || t('Speech recognition not available'),
          variant: 'destructive',
        });
        return;
      }
      
      setIsWakeWordActive(true);
      startListening();
      
      toast({
        title: t('Wake Word Enabled'),
        description: t('Continuously listening for voice commands'),
      });
    }
  };

  const testVoice = async () => {
    setIsSpeaking(true);
    try {
      const testMessage = t('Voice test successful. All voice features are working correctly.');
      await voiceService.speak(testMessage);
      
      toast({
        title: t('Voice Test'),
        description: t('Voice test completed successfully'),
      });
    } catch (error) {
      console.error('VoiceInterface: Voice test failed:', error);
      toast({
        title: t('Voice Test Failed'),
        description: t('Could not generate speech. Please check your settings.'),
        variant: 'destructive',
      });
    }
    setIsSpeaking(false);
  };

  const updateVoiceSettings = (key: string, value: any) => {
    const newSettings = { ...voiceSettings, [key]: value };
    setVoiceSettings(newSettings);
    voiceService.updateSettings(newSettings);
  };

  const getVoicesByLanguage = (language: string) => {
    return availableVoices.filter(voice => 
      voice.lang.startsWith(language.split('-')[0])
    );
  };

  const cleanup = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    voiceService.stop();
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              {t('Voice Interface')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Recognition Support Status */}
          {!isRecognitionSupported && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                {t('Speech Recognition Not Available')}
              </p>
              <p className="text-xs text-destructive/80 mt-1">
                {recognitionError || t('Your browser does not support speech recognition')}
              </p>
            </div>
          )}

          {/* Voice Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isListening ? "destructive" : "default"}
              size="lg"
              onClick={isListening ? stopListening : startListening}
              className="h-12 w-12 rounded-full"
              disabled={!isRecognitionSupported}
            >
              {isListening ? (
                <MicOff className="h-6 w-6 animate-pulse" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>

            <Button
              variant={isWakeWordActive ? "secondary" : "outline"}
              onClick={toggleWakeWord}
              disabled={!isRecognitionSupported || isListening}
            >
              {isWakeWordActive ? t('Always Listening') : t('Click to Listen')}
            </Button>

            <Button
              variant="outline"
              onClick={testVoice}
              disabled={isSpeaking}
            >
              {isSpeaking ? (
                <VolumeX className="h-4 w-4 animate-pulse" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
              {t('Test Voice')}
            </Button>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {isListening && (
              <Badge variant="destructive" className="animate-pulse">
                <Mic className="h-3 w-3 mr-1" />
                {t('Listening')}
              </Badge>
            )}
            {isWakeWordActive && (
              <Badge variant="secondary">
                {t('Always Listening Mode')}
              </Badge>
            )}
            {isSpeaking && (
              <Badge variant="default" className="animate-pulse">
                <Volume2 className="h-3 w-3 mr-1" />
                {t('Speaking')}
              </Badge>
            )}
            {recognitionError && (
              <Badge variant="destructive">
                {t('Recognition Error')}
              </Badge>
            )}
          </div>

          {/* Current Transcript */}
          {transcript && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">{t('Last heard:')}</p>
              <p className="text-sm font-medium">{transcript}</p>
            </div>
          )}

          {/* Voice Commands Help */}
          <div className="p-3 bg-accent/50 rounded-lg">
            <p className="text-sm font-medium mb-2">{t('Voice Commands:')}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span>• "{t('Home')}" - {t('Go to home page')}</span>
              <span>• "{t('Weather')}" - {t('Check weather')}</span>
              <span>• "{t('Market')}" - {t('Open marketplace')}</span>
              <span>• "{t('Chat')}" - {t('Open AI chat')}</span>
              <span>• "{t('My Lands')}" - {t('View your lands')}</span>
              <span>• "{t('Profile')}" - {t('Open profile')}</span>
              <span>• "{t('Back')}" - {t('Go back')}</span>
              <span>• "{t('Help')}" - {t('Get voice help')}</span>
            </div>
          </div>

          {/* Voice Settings */}
          {showSettings && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">{t('Voice Settings')}</h4>
              
              {/* Voice Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('Voice')}</label>
                <Select
                  value={voiceSettings.voice?.name || ''}
                  onValueChange={(value) => {
                    const voice = availableVoices.find(v => v.name === value);
                    if (voice) updateVoiceSettings('voice', voice);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select voice')} />
                  </SelectTrigger>
                  <SelectContent>
                    {getVoicesByLanguage(voiceSettings.language).map((voice) => (
                      <SelectItem key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Speech Rate */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('Speech Rate')}: {voiceSettings.rate.toFixed(1)}x
                </label>
                <Slider
                  value={[voiceSettings.rate]}
                  onValueChange={([value]) => updateVoiceSettings('rate', value)}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                />
              </div>

              {/* Pitch */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('Pitch')}: {voiceSettings.pitch.toFixed(1)}
                </label>
                <Slider
                  value={[voiceSettings.pitch]}
                  onValueChange={([value]) => updateVoiceSettings('pitch', value)}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                />
              </div>

              {/* Volume */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('Volume')}: {Math.round(voiceSettings.volume * 100)}%
                </label>
                <Slider
                  value={[voiceSettings.volume]}
                  onValueChange={([value]) => updateVoiceSettings('volume', value)}
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>

              {/* Voice Enabled Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{t('Voice Enabled')}</label>
                <Switch
                  checked={voiceSettings.enabled}
                  onCheckedChange={(checked) => updateVoiceSettings('enabled', checked)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
