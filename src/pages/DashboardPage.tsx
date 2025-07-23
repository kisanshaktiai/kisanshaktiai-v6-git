
import React from 'react';
import { Button } from '@/components/ui/button';

const DashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Dashboard
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Welcome to KisanShakti AI</h2>
            <p className="text-gray-600">Your farming dashboard is ready!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
