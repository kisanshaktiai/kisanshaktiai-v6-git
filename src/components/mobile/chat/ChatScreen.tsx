
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

export const ChatScreen: React.FC = () => {
  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            AI Chat Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Chat with our AI assistant for farming advice and support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
