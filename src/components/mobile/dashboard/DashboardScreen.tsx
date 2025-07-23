
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, MessageCircle, Users, User } from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to KisanShakti AI
        </h1>
        <p className="text-gray-600">
          Your complete agricultural companion
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="text-center">
            <Home className="w-8 h-8 mx-auto text-green-600" />
            <CardTitle className="text-sm">Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600 text-center">
              Overview of your farm
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <MessageCircle className="w-8 h-8 mx-auto text-blue-600" />
            <CardTitle className="text-sm">AI Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600 text-center">
              Get farming advice
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Users className="w-8 h-8 mx-auto text-purple-600" />
            <CardTitle className="text-sm">Community</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600 text-center">
              Connect with farmers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <User className="w-8 h-8 mx-auto text-orange-600" />
            <CardTitle className="text-sm">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600 text-center">
              Manage your account
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
