
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Login to KisanShakti AI
        </h1>
        <p className="text-gray-600 mb-8">
          Welcome back! Please sign in to continue.
        </p>
        <div className="space-y-4">
          <Button className="w-full">
            Login with Mobile
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/onboarding">New User? Sign Up</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
