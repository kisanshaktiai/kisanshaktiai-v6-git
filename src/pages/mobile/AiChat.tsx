
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChatInterface } from '@/components/chat/ChatInterface';

export const AiChat: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="h-[calc(100vh-8rem)]">
      <ChatInterface />
    </div>
  );
};
