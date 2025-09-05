import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Send, 
  Mic, 
  MicOff,
  Camera, 
  MapPin, 
  Paperclip, 
  MoreVertical,
  Volume2,
  VolumeX,
  Share2,
  Save,
  Download,
  Search,
  ChevronDown,
  CheckCircle,
  Clock,
  WifiOff,
  Wifi,
  Bot,
  User,
  Image as ImageIcon,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { VoiceRecorder } from './VoiceRecorder';
import { ImageUploader } from './ImageUploader';
import { QuickActions } from './QuickActions';
import { ContextChips } from './ContextChips';
import { useDebouncedAI } from '@/hooks/useDebouncedAI';
import { useTenant } from '@/context/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { useOffline } from '@/hooks/useOffline';
import { chatOfflineService } from '@/services/ChatOfflineService';
import { VoiceService } from '@/services/VoiceService';
const voiceService = VoiceService.getInstance();
import { agentOrchestrator } from '@/lib/ai/AgentOrchestrator';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  type: 'text' | 'voice' | 'image' | 'location' | 'document' | 'card';
  sender: 'user' | 'ai';
  timestamp: Date;
  metadata?: {
    confidence?: number;
    context?: string[];
    media?: string;
    location?: { lat: number; lng: number };
    audioUrl?: string;
    imageUrl?: string;
    documentUrl?: string;
    card?: {
      title: string;
      description: string;
      actions?: { label: string; action: string }[];
      data?: any;
    };
  };
  isOffline?: boolean;
  isSyncing?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
}

interface ChatContext {
  selectedLand?: string;
  selectedCrop?: string;
  location?: { lat: number; lng: number };
  activeContext: string[];
}

export const EnhancedChatInterface: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isOnline } = useOffline();
  const { debouncedAskAgent, isDebouncing } = useDebouncedAI({ delay: 300 });
  const { currentTenant, profile } = useTenant();
  
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatContext, setChatContext] = useState<ChatContext>({
    activeContext: [],
  });
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<Message[]>([]);
  const [savedMessages, setSavedMessages] = useState<Set<string>>(new Set());
  const [showKnowledgePacks, setShowKnowledgePacks] = useState(false);
  
  // Refs
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      content: profile?.preferred_language === 'hi' 
        ? '🙏 नमस्ते! मैं आपका कृषि मित्र हूं। मैं खेती से जुड़े हर सवाल में आपकी मदद करने के लिए तैयार हूं। आप टेक्स्ट, आवाज़, फोटो या स्थान के जरिए मुझसे बात कर सकते हैं।'
        : '🙏 Hello! I\'m your farming companion. I\'m here to help with all your agricultural queries. You can interact with me through text, voice, photos, or location sharing.',
      type: 'text',
      sender: 'ai',
      timestamp: new Date(),
      status: 'delivered',
      metadata: {
        card: {
          title: profile?.preferred_language === 'hi' ? 'आज के सुझाव' : 'Today\'s Tips',
          description: profile?.preferred_language === 'hi' 
            ? 'मौसम अनुकूल है, खेत की जुताई के लिए अच्छा समय'
            : 'Weather is favorable, good time for field preparation',
          actions: [
            { label: profile?.preferred_language === 'hi' ? 'मौसम देखें' : 'Check Weather', action: 'weather' },
            { label: profile?.preferred_language === 'hi' ? 'फसल सलाह' : 'Crop Advice', action: 'crop_advice' }
          ]
        }
      }
    };
    setMessages([welcomeMessage]);

    // Load offline knowledge packs
    loadKnowledgePacks();
  }, [profile?.preferred_language]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Sync offline messages when online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      syncOfflineMessages();
    }
  }, [isOnline, offlineQueue]);

  const loadKnowledgePacks = async () => {
    const packs = chatOfflineService.getAvailableKnowledgePacks();
    if (packs.length === 0) {
      // Download default pack
      await chatOfflineService.downloadKnowledgePack('default', undefined, profile?.district);
    }
  };

  const syncOfflineMessages = async () => {
    const messagesToSync = [...offlineQueue];
    setOfflineQueue([]);
    
    for (const message of messagesToSync) {
      try {
        const response = await agentOrchestrator.processQuery(
          message.content,
          'crop_advisor',
          {
            tenantId: currentTenant?.id || '',
            userId: profile?.id || '',
            language: 'hi' as any,
            location: chatContext.location ? {
              latitude: chatContext.location.lat,
              longitude: chatContext.location.lng
            } : undefined
          } as any
        );

        if (response) {
          const syncedMessage: Message = {
            ...message,
            isSyncing: false,
            status: 'delivered'
          };
          
          setMessages(prev => prev.map(m => 
            m.id === message.id ? syncedMessage : m
          ));
        }
      } catch (error) {
        console.error('Error syncing message:', error);
      }
    }
    
    toast({
      title: t('Messages synced'),
      description: t('{{count}} offline messages have been processed', { count: messagesToSync.length }),
    });
  };

  const sendMessage = useCallback(async (
    content: string, 
    type: 'text' | 'voice' | 'image' | 'location' | 'document' = 'text', 
    metadata?: any
  ) => {
    if (!content.trim() && type === 'text') return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content,
      type,
      sender: 'user',
      timestamp: new Date(),
      metadata,
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      let response;
      
      if (!isOnline) {
        // Get offline response
        const offlineResponse = await chatOfflineService.getOfflineResponse(
          content,
          profile?.preferred_language || 'hi'
        );
        
        if (offlineResponse) {
          response = {
            message: offlineResponse.response,
            confidence: offlineResponse.confidence,
            isOffline: true
          };
        } else {
          // Queue for later
          setOfflineQueue(prev => [...prev, { ...userMessage, isSyncing: true }]);
          throw new Error('No offline response available');
        }
      } else {
        // Determine agent type
        const agentType = await agentOrchestrator.classifyQuery(content, {
          tenantId: currentTenant?.id || '',
          userId: profile?.id || '',
          language: 'hi' as any,
          location: chatContext.location ? {
            latitude: chatContext.location.lat,
            longitude: chatContext.location.lng
          } : undefined
        } as any);

        response = await agentOrchestrator.processQuery(
          content,
          agentType,
          {
            tenantId: currentTenant?.id || '',
            userId: profile?.id || '',
            language: 'hi' as any,
            location: chatContext.location ? {
              latitude: chatContext.location.lat,
              longitude: chatContext.location.lng
            } : undefined
          } as any
        );

        // Cache the response
        if (response) {
          await chatOfflineService.cacheResponse(
            content,
            response.message,
            profile?.preferred_language || 'hi',
            response.confidence
          );
        }
      }

      if (response) {
        // Update user message status
        setMessages(prev => prev.map(m => 
          m.id === userMessage.id ? { ...m, status: 'delivered' } : m
        ));

        // Create AI response
        const aiMessage: Message = {
          id: `msg-${Date.now()}-ai`,
          content: response.message,
          type: response.card ? 'card' : 'text',
          sender: 'ai',
          timestamp: new Date(),
          status: 'delivered',
          metadata: {
            confidence: response.confidence,
            context: chatContext.activeContext,
            card: response.card
          },
          isOffline: response.isOffline
        };

        setMessages(prev => [...prev, aiMessage]);
        
        // Voice output if enabled
        if (voiceEnabled && !response.isOffline) {
          await speakMessage(response.message);
        }

        if (response.isOffline) {
          toast({
            title: t('Offline Mode'),
            description: t('Response provided from cached data'),
            action: <WifiOff className="w-4 h-4" />
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update message status to error
      setMessages(prev => prev.map(m => 
        m.id === userMessage.id ? { ...m, status: 'error' } : m
      ));
      
      toast({
        title: t('Message queued'),
        description: t('Will be processed when connection is restored'),
        variant: 'destructive',
      });
    } finally {
      setIsTyping(false);
    }
  }, [isOnline, profile, currentTenant, chatContext, voiceEnabled, t, toast]);

  const speakMessage = async (text: string) => {
    try {
      setIsSpeaking(true);
      await voiceService.speak(
        text,
        profile?.preferred_language || 'hi'
      );
    } catch (error) {
      console.error('Error speaking message:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleVoiceMessage = useCallback(async (audioBlob: Blob, transcript?: string) => {
    if (transcript) {
      sendMessage(transcript, 'voice', { audioBlob });
    } else {
      // Try to transcribe
      const transcribedText = await voiceService.transcribeAudio(
        audioBlob,
        profile?.preferred_language || 'hi'
      );
      
      if (transcribedText) {
        sendMessage(transcribedText, 'voice', { audioBlob });
      } else {
        toast({
          title: t('Transcription failed'),
          description: t('Please try again or type your message'),
          variant: 'destructive',
        });
      }
    }
  }, [sendMessage, profile, t, toast]);

  const handleImageUpload = useCallback((file: File, description?: string) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      sendMessage(
        description || t('Analyze this image'), 
        'image', 
        { imageUrl: imageData, fileName: file.name }
      );
    };
    reader.readAsDataURL(file);
    setShowImageUpload(false);
  }, [sendMessage, t]);

  const handleDocumentUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      sendMessage(
        t('Document uploaded: {{name}}', { name: file.name }), 
        'document', 
        { documentUrl: e.target?.result, fileName: file.name }
      );
    };
    reader.readAsDataURL(file);
    setShowDocumentUpload(false);
  }, [sendMessage, t]);

  const handleLocationShare = useCallback(() => {
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
            t('Location: {{lat}}, {{lng}}', { 
              lat: latitude.toFixed(4), 
              lng: longitude.toFixed(4) 
            }),
            'location',
            { location: { lat: latitude, lng: longitude } }
          );
        },
        (error) => {
          toast({
            title: t('Location access denied'),
            description: t('Please enable location access'),
            variant: 'destructive',
          });
        }
      );
    }
  }, [sendMessage, t, toast]);

  const handleSaveMessage = useCallback((messageId: string) => {
    setSavedMessages(prev => new Set(prev).add(messageId));
    toast({
      title: t('Message saved'),
      description: t('Added to your saved messages'),
    });
  }, [t, toast]);

  const handleShareMessage = useCallback(async (message: Message) => {
    const shareText = `${message.content}\n\n- KisanShakti AI`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'KisanShakti AI',
          text: shareText,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareText);
      toast({
        title: t('Copied to clipboard'),
        description: t('Message copied for sharing'),
      });
    }
  }, [t, toast]);

  const exportConversation = useCallback(() => {
    const conversationText = messages.map(m => 
      `[${format(m.timestamp, 'PPpp')}] ${m.sender === 'user' ? 'You' : 'AI'}: ${m.content}`
    ).join('\n\n');
    
    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    a.click();
  }, [messages]);

  const filteredMessages = searchQuery 
    ? messages.filter(m => 
        m.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b p-4 bg-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/ai-avatar.png" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">KisanShakti AI</h3>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Badge variant="outline" className="text-xs text-green-600">
                    <Wifi className="w-3 h-3 mr-1" />
                    Online
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-orange-600">
                    <WifiOff className="w-3 h-3 mr-1" />
                    Offline
                  </Badge>
                )}
                {isTyping && (
                  <span className="text-xs text-muted-foreground">Typing...</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
            >
              {voiceEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={exportConversation}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <Input
            placeholder={t('Search messages...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-2"
          />
        )}

        {/* Context Chips */}
        <ContextChips 
          context={chatContext}
          onContextChange={setChatContext}
        />
      </div>

      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {filteredMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                <div className={`rounded-2xl p-3 ${
                  message.sender === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  {/* Message content based on type */}
                  {message.type === 'text' && (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                  
                  {message.type === 'voice' && (
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Volume2 className="h-4 w-4" />
                      </Button>
                      <p className="text-sm flex-1">{message.content}</p>
                    </div>
                  )}
                  
                  {message.type === 'image' && (
                    <div className="space-y-2">
                      {message.metadata?.imageUrl && (
                        <img 
                          src={message.metadata.imageUrl} 
                          alt="Uploaded" 
                          className="rounded-lg max-w-full"
                        />
                      )}
                      <p className="text-sm">{message.content}</p>
                    </div>
                  )}
                  
                  {message.type === 'location' && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <p className="text-sm">{message.content}</p>
                    </div>
                  )}
                  
                  {message.type === 'document' && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <p className="text-sm">{message.content}</p>
                    </div>
                  )}
                  
                  {message.type === 'card' && message.metadata?.card && (
                    <Card className="bg-background/50">
                      <CardContent className="p-3">
                        <h4 className="font-semibold text-sm mb-1">
                          {message.metadata.card.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {message.metadata.card.description}
                        </p>
                        {message.metadata.card.actions && (
                          <div className="flex gap-2">
                            {message.metadata.card.actions.map((action, idx) => (
                              <Button
                                key={idx}
                                size="sm"
                                variant="outline"
                                onClick={() => sendMessage(action.action)}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Metadata badges */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs opacity-70">
                      {format(message.timestamp, 'p')}
                    </span>
                    
                    {message.status && (
                      <span className="text-xs">
                        {message.status === 'delivered' && <CheckCircle className="h-3 w-3 inline" />}
                        {message.status === 'sending' && <Clock className="h-3 w-3 inline animate-pulse" />}
                        {message.status === 'error' && <AlertCircle className="h-3 w-3 inline text-destructive" />}
                      </span>
                    )}
                    
                    {message.isOffline && (
                      <Badge variant="outline" className="text-xs">
                        <WifiOff className="w-3 h-3 mr-1" />
                        Offline
                      </Badge>
                    )}
                    
                    {message.metadata?.confidence && message.metadata.confidence < 0.7 && (
                      <Badge variant="secondary" className="text-xs">
                        Low confidence
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Message actions */}
                {message.sender === 'ai' && (
                  <div className="flex items-center gap-1 mt-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleSaveMessage(message.id)}
                    >
                      <Save className={`h-3 w-3 ${savedMessages.has(message.id) ? 'fill-current' : ''}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleShareMessage(message)}
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                    {voiceEnabled && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => speakMessage(message.content)}
                        disabled={isSpeaking}
                      >
                        <Volume2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl p-3 max-w-xs">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Offline Queue Indicator */}
      {offlineQueue.length > 0 && (
        <Alert className="mx-4 mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('{{count}} messages waiting to sync', { count: offlineQueue.length })}
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <QuickActions onAction={(action) => sendMessage(action)} />

      {/* Input Area */}
      <div className="border-t p-4 bg-card">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={profile?.preferred_language === 'hi' 
                ? 'अपना सवाल लिखें या माइक दबाएं...' 
                : 'Type your question or press mic...'
              }
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
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isDebouncing}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Input Options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
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
              onClick={() => fileInputRef.current?.click()}
              className="h-9 w-9"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleDocumentUpload(file);
              }}
            />
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowKnowledgePacks(true)}
            className="h-9 w-9"
          >
            <MoreVertical className="h-4 w-4" />
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

      {/* Knowledge Packs Dialog */}
      <Dialog open={showKnowledgePacks} onOpenChange={setShowKnowledgePacks}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Offline Knowledge Packs')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {chatOfflineService.getAvailableKnowledgePacks().map(pack => (
              <Card key={pack.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{pack.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {pack.data.faqs.length} FAQs, {pack.data.guides.length} Guides
                      </p>
                    </div>
                    <Badge variant="outline">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Downloaded
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button 
              className="w-full"
              onClick={() => {
                chatOfflineService.downloadKnowledgePack('wheat', 'wheat', profile?.state);
                toast({
                  title: t('Downloading knowledge pack'),
                  description: t('Wheat farming guide will be available offline'),
                });
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              {t('Download More Packs')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};