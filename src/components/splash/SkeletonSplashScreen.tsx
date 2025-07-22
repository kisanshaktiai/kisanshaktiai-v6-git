
import React, { useEffect } from 'react';

interface SkeletonSplashScreenProps {
  onComplete: () => void;
}

export const SkeletonSplashScreen: React.FC<SkeletonSplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    // Simple timeout to simulate loading
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white">
      {/* Logo skeleton */}
      <div className="w-24 h-24 bg-gray-200 rounded-2xl animate-pulse mb-6"></div>
      
      {/* Title skeleton */}
      <div className="w-48 h-8 bg-gray-200 rounded animate-pulse mb-4"></div>
      
      {/* Subtitle skeleton */}
      <div className="w-64 h-4 bg-gray-200 rounded animate-pulse mb-8"></div>
      
      {/* Loading spinner */}
      <div className="w-8 h-8 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
    </div>
  );
};
