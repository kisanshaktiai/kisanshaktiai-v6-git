
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreVertical, Bookmark, Share2, Volume2, Copy, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

interface MessageMetadata {
  confidence?: number;
  context?: string[];
  media?: string;
  location?: { lat: number; lng: number };
  audioBlob?: Blob;
  imageData?: string;
  fileName?: string;
}

interface Message {
  id: string;
  content: string;
  type: 'text' | 'voice' | 'image' | 'location' | 'document';
  sender: 'user' | 'ai';
  timestamp: Date;
  metadata?: MessageMetadata;
  isOffline?: boolean;
  isSyncing?: boolean;
}

interface ChatMessageProps {
  message: Message;
  onSave: (messageId: string) => void;
  onShare: (messageId: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSave, onShare }) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);

  const isUser = message.sender === 'user';
  const hasConfidence = message.metadata?.confidence !== undefined;

  const handlePlayAudio = () => {
    if (message.metadata?.audioBlob) {
      const audio = new Audio(URL.createObjectURL(message.metadata.audioBlob));
      setIsPlaying(true);
      audio.play();
      audio.onended = () => setIsPlaying(false);
    }
  };

  const handleTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message.content);
      utterance.lang = 'hi-IN'; // Can be dynamic based on user preference
      speechSynthesis.speak(utterance);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="space-y-2">
            {message.metadata?.imageData && (
              <img 
                src={message.metadata.imageData} 
                alt="Uploaded image"
                className="max-w-xs rounded-lg"
              />
            )}
            <p className="text-sm">{message.content}</p>
          </div>
        );
      
      case 'location':
        return (
          <div className="space-y-2">
            <div className="bg-muted rounded-lg p-3 text-sm">
              📍 {message.content}
              {message.metadata?.location && (
                <div className="text-xs text-muted-foreground mt-1">
                  Lat: {message.metadata.location.lat.toFixed(4)}, 
                  Lng: {message.metadata.location.lng.toFixed(4)}
                </div>
              )}
            </div>
          </div>
        );
      
      case 'voice':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePlayAudio}
                disabled={!message.metadata?.audioBlob}
              >
                <Volume2 className="h-3 w-3 mr-1" />
                {isPlaying ? t('Playing...') : t('Play')}
              </Button>
              <span className="text-xs text-muted-foreground">
                {t('Voice message')}
              </span>
            </div>
            <p className="text-sm">{message.content}</p>
          </div>
        );
      
      default:
        return <p className="whitespace-pre-wrap">{message.content}</p>;
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        <Card className={`p-3 ${
          isUser 
            ? 'bg-primary text-primary-foreground ml-auto' 
            : 'bg-muted'
        }`}>
          <div className="space-y-2">
            {renderMessageContent()}
            
            <div className="flex items-center justify-between text-xs opacity-70">
              <div className="flex items-center space-x-2">
                <span>{format(message.timestamp, 'HH:mm')}</span>
                
                {message.isOffline && (
                  <div title={t('Offline message')}>
                    <WifiOff className="h-3 w-3" />
                  </div>
                )}
                
                {message.isSyncing && (
                  <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
                )}
                
                {hasConfidence && !isUser && (
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getConfidenceColor(message.metadata!.confidence!)}`}
                  >
                    {Math.round(message.metadata!.confidence! * 100)}%
                  </Badge>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-5 w-5 opacity-50 hover:opacity-100"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isUser ? 'end' : 'start'}>
                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(message.content)}>
                    <Copy className="h-3 w-3 mr-2" />
                    {t('Copy')}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => onSave(message.id)}>
                    <Bookmark className="h-3 w-3 mr-2" />
                    {t('Save')}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => onShare(message.id)}>
                    <Share2 className="h-3 w-3 mr-2" />
                    {t('Share')}
                  </DropdownMenuItem>
                  
                  {!isUser && (
                    <DropdownMenuItem onClick={handleTextToSpeech}>
                      <Volume2 className="h-3 w-3 mr-2" />
                      {t('Read aloud')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {message.metadata?.context && message.metadata.context.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {message.metadata.context.map((ctx, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {ctx}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
