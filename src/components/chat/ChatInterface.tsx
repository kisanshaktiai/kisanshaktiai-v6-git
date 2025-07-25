
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Mic, Camera, MapPin, Paperclip, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ChatMessage } from './ChatMessage';
import { VoiceRecorder } from './VoiceRecorder';
import { ImageUploader } from './ImageUploader';
import { QuickActions } from './QuickActions';
import { ContextChips } from './ContextChips';
import { useAI } from '@/hooks/useAI';
import { useTenant } from '@/context/TenantContext';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  type: 'text' | 'voice' | 'image' | 'location' | 'document';
  sender: 'user' | 'ai';
  timestamp: Date;
  metadata?: {
    confidence?: number;
    context?: string[];
    media?: string;
    location?: { lat: number; lng: number };
  };
  isOffline?: boolean;
  isSyncing?: boolean;
}

interface ChatContext {
  selectedLand?: string;
  selectedCrop?: string;
  location?: { lat: number; lng: number };
  activeContext: string[];
}

export const ChatInterface: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { askAgent, loading } = useAI();
  const { currentTenant, profile } = useTenant();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [chatContext, setChatContext] = useState<ChatContext>({
    activeContext: [],
  });
  const [isTyping, setIsTyping] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<Message[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      content: profile?.preferred_language === 'hi' 
        ? 'नमस्ते! मैं आपका कृषि सहायक हूं। मैं फसल, मौसम, बाजार और खेती से जुड़े सभी सवालों में आपकी मदद कर सकता हूं।'
        : 'Hello! I\'m your farming assistant. I can help you with crops, weather, market information, and all farming-related questions.',
      type: 'text',
      sender: 'ai',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [profile?.preferred_language]);

  const sendMessage = async (content: string, type: 'text' | 'voice' | 'image' | 'location' | 'document' = 'text', metadata?: any) => {
    if (!content.trim() && type === 'text') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      type,
      sender: 'user',
      timestamp: new Date(),
      metadata,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Determine agent type based on content and context
      let agentType = undefined;
      if (type === 'image') agentType = 'image_scan';
      else if (content.toLowerCase().includes('weather') || content.toLowerCase().includes('मौसम')) agentType = 'weather';
      else if (content.toLowerCase().includes('market') || content.toLowerCase().includes('बाजार')) agentType = 'market_advisor';

      const response = await askAgent(
        content, 
        agentType, 
        profile?.preferred_language as any || 'hi'
      );

      if (response) {
        const aiMessage: Message = {
          id: Date.now().toString() + '-ai',
          content: response.message,
          type: 'text',
          sender: 'ai',
          timestamp: new Date(),
          metadata: {
            confidence: response.confidence,
            context: chatContext.activeContext,
          },
          isOffline: response.isOffline,
        };

        setMessages(prev => [...prev, aiMessage]);
        
        if (response.isOffline) {
          toast({
            title: t('Working Offline'),
            description: t('Response provided from cached data. Will sync when online.'),
          });
        }
      }
    } catch (error) {
      // Add to offline queue
      const offlineMessage: Message = {
        ...userMessage,
        isOffline: true,
        isSyncing: true,
      };
      
      setOfflineQueue(prev => [...prev, offlineMessage]);
      
      toast({
        title: t('Message Queued'),
        description: t('Will send when connection is restored.'),
        variant: 'destructive',
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceMessage = (audioBlob: Blob, transcript?: string) => {
    if (transcript) {
      sendMessage(transcript, 'voice', { audioBlob });
    } else {
      toast({
        title: t('Voice processing failed'),
        description: t('Please try again or type your message.'),
        variant: 'destructive',
      });
    }
  };

  const handleImageUpload = (file: File, description?: string) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      sendMessage(description || t('Image uploaded for analysis'), 'image', { 
        imageData,
        fileName: file.name 
      });
    };
    reader.readAsDataURL(file);
  };

  const handleLocationShare = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setChatContext(prev => ({ 
            ...prev, 
            location: { lat: latitude, lng: longitude },
            activeContext: [...prev.activeContext, 'location']
          }));
          sendMessage(
            t('Location shared: {{lat}}, {{lng}}', { lat: latitude.toFixed(4), lng: longitude.toFixed(4) }),
            'location',
            { location: { lat: latitude, lng: longitude } }
          );
        },
        (error) => {
          toast({
            title: t('Location access denied'),
            description: t('Please enable location access to share your location.'),
            variant: 'destructive',
          });
        }
      );
    }
  };

  const handleQuickAction = (action: string) => {
    const quickActions: Record<string, string> = {
      weather: profile?.preferred_language === 'hi' ? 'आज का मौसम कैसा है?' : 'What\'s the weather today?',
      crop_advice: profile?.preferred_language === 'hi' ? 'मेरी फसल के लिए सलाह दें' : 'Give advice for my crops',
      market_price: profile?.preferred_language === 'hi' ? 'आज के बाजार भाव बताएं' : 'Show today\'s market prices',
      disease_help: profile?.preferred_language === 'hi' ? 'फसल में रोग की पहचान करें' : 'Help identify crop disease',
    };

    const message = quickActions[action];
    if (message) {
      sendMessage(message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Context Bar */}
      <div className="border-b p-4">
        <ContextChips 
          context={chatContext}
          onContextChange={setChatContext}
        />
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage 
              key={message.id}
              message={message}
              onSave={(messageId) => {
                toast({ title: t('Message saved'), description: t('Added to your saved messages') });
              }}
              onShare={(messageId) => {
                toast({ title: t('Sharing options'), description: t('Choose how to share this message') });
              }}
            />
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3 max-w-xs">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          {offlineQueue.length > 0 && (
            <div className="text-center py-2">
              <Badge variant="outline" className="bg-orange-50 text-orange-700">
                {t('{{count}} messages queued for sync', { count: offlineQueue.length })}
              </Badge>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Quick Actions */}
      <QuickActions onAction={handleQuickAction} />

      {/* Input Area */}
      <div className="border-t p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={profile?.preferred_language === 'hi' ? 'अपना सवाल लिखें...' : 'Type your question...'}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(inputText);
                }
              }}
              className="pr-12"
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
              onClick={() => sendMessage(inputText)}
              disabled={!inputText.trim() || loading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Input Options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <VoiceRecorder
              onRecording={setIsRecording}
              onTranscript={handleVoiceMessage}
              language={profile?.preferred_language || 'hi'}
            />
            
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowImageUpload(true)}
              className="h-9 w-9"
            >
              <Camera className="h-4 w-4" />
            </Button>
            
            <Button
              size="icon"
              variant="ghost"
              onClick={handleLocationShare}
              className="h-9 w-9"
            >
              <MapPin className="h-4 w-4" />
            </Button>
            
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>

          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <ImageUploader
          onUpload={handleImageUpload}
          onClose={() => setShowImageUpload(false)}
        />
      )}
    </div>
  );
};
