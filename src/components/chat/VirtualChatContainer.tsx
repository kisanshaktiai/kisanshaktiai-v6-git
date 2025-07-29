
import React, { memo, useCallback, useMemo, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import OptimizedChatMessage from './OptimizedChatMessage';

interface Message {
  id: string;
  content: string;
  type: 'text' | 'voice' | 'image' | 'location' | 'document';
  sender: 'user' | 'ai';
  timestamp: Date;
  metadata?: any;
  isOffline?: boolean;
  isSyncing?: boolean;
}

interface VirtualChatContainerProps {
  messages: Message[];
  onSave: (messageId: string) => void;
  onShare: (messageId: string) => void;
  height: number;
}

const MessageItem = memo(({ index, style, data }: any) => {
  const { messages, onSave, onShare } = data;
  const message = messages[index];
  
  return (
    <div style={style}>
      <OptimizedChatMessage
        message={message}
        onSave={onSave}
        onShare={onShare}
      />
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

const VirtualChatContainer = memo(({ messages, onSave, onShare, height }: VirtualChatContainerProps) => {
  const listRef = useRef<List>(null);

  const itemData = useMemo(() => ({
    messages,
    onSave,
    onShare,
  }), [messages, onSave, onShare]);

  const scrollToBottom = useCallback(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No messages yet. Start a conversation!</p>
      </div>
    );
  }

  return (
    <List
      ref={listRef}
      height={height}
      itemCount={messages.length}
      itemSize={120}
      itemData={itemData}
      overscanCount={5}
    >
      {MessageItem}
    </List>
  );
});

VirtualChatContainer.displayName = 'VirtualChatContainer';

export default VirtualChatContainer;
