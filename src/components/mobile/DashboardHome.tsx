
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, TrendingUp, Calendar, MessageCircle } from 'lucide-react';

export const DashboardHome: React.FC = () => {
  return (
    <div className="p-4 space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to KisanShakti AI
        </h1>
        <p className="text-gray-600">
          Your smart farming companion
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Leaf className="w-4 h-4 mr-2 text-green-600" />
              My Lands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">0</p>
            <p className="text-xs text-gray-500">Total acres</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
              Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">--</p>
            <p className="text-xs text-gray-500">Insights</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-purple-600" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">0</p>
            <p className="text-xs text-gray-500">Activities</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <MessageCircle className="w-4 h-4 mr-2 text-orange-600" />
              AI Chat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">Ready</p>
            <p className="text-xs text-gray-500">Ask anything</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-4 text-white">
        <h3 className="font-semibold mb-2">Start Your Smart Farming Journey</h3>
        <p className="text-sm opacity-90">
          Add your first land to begin tracking your crops and getting AI-powered insights.
        </p>
      </div>
    </div>
  );
};
