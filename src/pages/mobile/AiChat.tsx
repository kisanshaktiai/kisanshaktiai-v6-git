
import React from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';

export const AiChat: React.FC = () => {
  return (
    <div className="h-[calc(100vh-8rem)]">
      <ChatInterface />
    </div>
  );
};
