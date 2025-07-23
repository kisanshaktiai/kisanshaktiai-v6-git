
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Welcome to KisanShakti AI
        </h1>
        <p className="text-gray-600 mb-8">
          Your AI-powered farming companion
        </p>
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link to="/onboarding">Get Started</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
