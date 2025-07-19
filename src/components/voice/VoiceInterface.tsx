import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Volume2, VolumeX, Settings, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { VoiceService } from '@/services/VoiceService';
import { AccessibilityService } from '@/services/AccessibilityService';

interface VoiceInterfaceProps {
  onVoiceCommand?: (command: string) => void;
  onTranscript?: (text: string) => void;
  className?: string;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  onVoiceCommand,
  onTranscript,
  className
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [voiceService] = useState(() => VoiceService.getInstance());
  const [accessibilityService] = useState(() => AccessibilityService.getInstance());
  
  const [isListening, setIsListening] = useState(false);
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState(voiceService.getSettings());
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    // Load available voices
    const loadVoices = () => {
      setAvailableVoices(voiceService.getAvailableVoices());
    };

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Register voice commands
    voiceService.registerCommand('home', () => handleNavigationCommand('home'));
    voiceService.registerCommand('back', () => handleNavigationCommand('back'));
    voiceService.registerCommand('menu', () => handleNavigationCommand('menu'));
    voiceService.registerCommand('help', () => handleNavigationCommand('help'));
    voiceService.registerCommand('weather', () => handleNavigationCommand('weather'));
    voiceService.registerCommand('market', () => handleNavigationCommand('market'));
    voiceService.registerCommand('chat', () => handleNavigationCommand('chat'));
    voiceService.registerCommand('profile', () => handleNavigationCommand('profile'));

    return () => {
      voiceService.stop();
    };
  }, []);

  const handleNavigationCommand = (command: string) => {
    onVoiceCommand?.(command);
    toast({
      title: t('Voice Command'),
      description: t(`Navigating to ${command}`),
    });
  };

  const startListening = async () => {
    try {
      if (!voiceService.isSupported()) {
        throw new Error('Voice recognition not supported');
      }

      setIsListening(true);
      voiceService.startListening();
      
      toast({
        title: t('Listening'),
        description: t('Speak your command'),
      });
    } catch (error) {
      console.error('Failed to start listening:', error);
      toast({
        title: t('Error'),
        description: t('Could not start voice recognition'),
        variant: 'destructive',
      });
      setIsListening(false);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    voiceService.stopListening();
  };

  const toggleWakeWord = () => {
    if (isWakeWordActive) {
      voiceService.stopWakeWordDetection();
      setIsWakeWordActive(false);
      toast({
        title: t('Wake Word Disabled'),
        description: t('Say "Hey KisanShakti" detection stopped'),
      });
    } else {
      voiceService.startWakeWordDetection();
      setIsWakeWordActive(true);
      toast({
        title: t('Wake Word Enabled'),
        description: t('Say "Hey KisanShakti" to activate'),
      });
    }
  };

  const testVoice = async () => {
    setIsSpeaking(true);
    try {
      await voiceService.speak(t('Voice test successful. Voice settings are working correctly.'));
    } catch (error) {
      toast({
        title: t('Voice Test Failed'),
        description: t('Could not generate speech'),
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
          {/* Voice Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isListening ? "destructive" : "default"}
              size="lg"
              onClick={isListening ? stopListening : startListening}
              className="h-12 w-12 rounded-full"
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
              disabled={isListening}
            >
              {isWakeWordActive ? t('Wake Word On') : t('Wake Word Off')}
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
          <div className="flex items-center justify-center gap-2">
            {isListening && (
              <Badge variant="destructive" className="animate-pulse">
                <Mic className="h-3 w-3 mr-1" />
                {t('Listening')}
              </Badge>
            )}
            {isWakeWordActive && (
              <Badge variant="secondary">
                {t('Wake Word Active')}
              </Badge>
            )}
            {isSpeaking && (
              <Badge variant="default" className="animate-pulse">
                <Volume2 className="h-3 w-3 mr-1" />
                {t('Speaking')}
              </Badge>
            )}
          </div>

          {/* Current Transcript */}
          {transcript && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">{t('Last heard:')}</p>
              <p className="text-sm">{transcript}</p>
            </div>
          )}

          {/* Voice Commands Help */}
          <div className="p-3 bg-accent/50 rounded-lg">
            <p className="text-sm font-medium mb-2">{t('Voice Commands:')}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span>• "{t('Home')}" - {t('Go to home')}</span>
              <span>• "{t('Weather')}" - {t('Check weather')}</span>
              <span>• "{t('Market')}" - {t('Open market')}</span>
              <span>• "{t('Chat')}" - {t('Open AI chat')}</span>
              <span>• "{t('Back')}" - {t('Go back')}</span>
              <span>• "{t('Help')}" - {t('Get help')}</span>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
