
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Manage your profile and account settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
