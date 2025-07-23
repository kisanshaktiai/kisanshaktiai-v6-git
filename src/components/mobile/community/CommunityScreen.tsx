
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export const CommunityScreen: React.FC = () => {
  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Farmer Community
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Connect and share knowledge with fellow farmers in your area.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
