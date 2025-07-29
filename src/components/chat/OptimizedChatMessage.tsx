
import React, { memo, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookmarkPlus, Share2, Copy, MapPin, Image } from 'lucide-react';

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

interface OptimizedChatMessageProps {
  message: Message;
  onSave: (messageId: string) => void;
  onShare: (messageId: string) => void;
}

const OptimizedChatMessage = memo(({ message, onSave, onShare }: OptimizedChatMessageProps) => {
  const timeAgo = useMemo(() => 
    formatDistanceToNow(message.timestamp, { addSuffix: true }), 
    [message.timestamp]
  );

  const isUser = message.sender === 'user';
  
  const messageContent = useMemo(() => {
    switch (message.type) {
      case 'image':
        return (
          <div className="space-y-2">
            {message.metadata?.media && (
              <div className="rounded-lg overflow-hidden max-w-xs">
                <img 
                  src={message.metadata.media} 
                  alt="Uploaded content" 
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
            <p className="text-sm">{message.content}</p>
          </div>
        );
      case 'location':
        return (
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span className="text-sm">{message.content}</span>
          </div>
        );
      case 'voice':
        return (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm">{message.content}</span>
          </div>
        );
      default:
        return <p className="text-sm whitespace-pre-wrap">{message.content}</p>;
    }
  }, [message.type, message.content, message.metadata?.media]);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <Card className={`max-w-[70%] p-3 ${
        isUser 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted'
      }`}>
        <div className="space-y-2">
          {messageContent}
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs opacity-70">{timeAgo}</span>
              {message.metadata?.confidence && (
                <Badge variant="secondary" className="text-xs">
                  {Math.round(message.metadata.confidence * 100)}%
                </Badge>
              )}
              {message.isOffline && (
                <Badge variant="outline" className="text-xs">
                  Offline
                </Badge>
              )}
            </div>
            
            {!isUser && (
              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSave(message.id)}
                  className="h-6 w-6 p-0"
                >
                  <BookmarkPlus className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onShare(message.id)}
                  className="h-6 w-6 p-0"
                >
                  <Share2 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
});

OptimizedChatMessage.displayName = 'OptimizedChatMessage';

export default OptimizedChatMessage;
