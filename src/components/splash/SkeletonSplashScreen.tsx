
import React, { useEffect } from 'react';

interface SkeletonSplashScreenProps {
  onComplete: () => void;
}

export const SkeletonSplashScreen: React.FC<SkeletonSplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="text-center">
        <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-white shadow-lg flex items-center justify-center">
          <img 
            src="/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png" 
            alt="KisanShakti AI" 
            className="w-24 h-24 object-contain"
          />
        </div>
        <h1 className="text-3xl font-bold text-green-600 mb-3">
          KisanShakti AI
        </h1>
        <p className="text-gray-600 text-base font-medium">
          Your smart farming journey starts here
        </p>
        <div className="mt-8">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    </div>
  );
};
