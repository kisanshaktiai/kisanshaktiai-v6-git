
import React, { useState, useEffect } from 'react';
import { TenantDetectionService } from '@/services/TenantDetectionService';

interface SkeletonSplashScreenProps {
  onComplete: () => void;
}

export const SkeletonSplashScreen: React.FC<SkeletonSplashScreenProps> = ({ onComplete }) => {
  const [loadingStage, setLoadingStage] = useState<'initializing' | 'detecting' | 'loading' | 'ready' | 'error'>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoadingStage('detecting');
        setProgress(20);

        // Initialize tenant detection with timeout
        const tenantService = TenantDetectionService.getInstance();
        
        setProgress(40);
        const tenant = await tenantService.detectTenant();
        
        if (!tenant) {
          throw new Error('No tenant configuration found');
        }

        setProgress(70);
        setLoadingStage('loading');

        // Apply tenant branding immediately
        if (tenant.branding) {
          document.documentElement.style.setProperty('--primary', tenant.branding.primary_color || '#8BC34A');
          document.documentElement.style.setProperty('--secondary', tenant.branding.secondary_color || '#4CAF50');
          
          // Update page title
          if (tenant.branding.app_name) {
            document.title = tenant.branding.app_name;
          }
        }

        setProgress(100);
        setLoadingStage('ready');

        // Small delay for smooth transition
        setTimeout(() => {
          onComplete();
        }, 500);

      } catch (error) {
        console.error('Splash screen initialization failed:', error);
        setError(error instanceof Error ? error.message : 'Failed to load application');
        setLoadingStage('error');
        
        // Auto-retry after 3 seconds in case of network issues
        setTimeout(() => {
          setError(null);
          setLoadingStage('initializing');
          setProgress(0);
        }, 3000);
      }
    };

    // Start initialization after a brief moment
    const timer = setTimeout(initializeApp, 200);
    return () => clearTimeout(timer);
  }, [onComplete, loadingStage]); // Include loadingStage for retry logic

  const getLoadingMessage = () => {
    switch (loadingStage) {
      case 'initializing':
        return 'Initializing application...';
      case 'detecting':
        return 'Detecting organization...';
      case 'loading':
        return 'Loading configuration...';
      case 'ready':
        return 'Ready to go!';
      case 'error':
        return error || 'Something went wrong. Retrying...';
      default:
        return 'Loading...';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Logo */}
        <div className="mb-8">
          <img 
            src="/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png"
            alt="KisanShakti AI"
            className="w-24 h-24 mx-auto mb-4 rounded-full shadow-lg"
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            KisanShakti AI
          </h1>
          <p className="text-gray-600 text-sm">
            Your smart farming journey starts here
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                loadingStage === 'error' ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Loading Message */}
          <p className={`text-sm ${
            loadingStage === 'error' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {getLoadingMessage()}
          </p>
        </div>

        {/* Loading Animation */}
        {loadingStage !== 'error' && (
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        )}

        {/* Error State */}
        {loadingStage === 'error' && (
          <div className="mt-4">
            <div className="w-6 h-6 bg-red-500 rounded-full mx-auto animate-pulse"></div>
            <p className="text-xs text-gray-500 mt-2">
              Retrying in a few seconds...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
