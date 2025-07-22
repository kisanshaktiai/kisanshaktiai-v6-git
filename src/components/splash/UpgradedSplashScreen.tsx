
import React, { useEffect, useState } from 'react';
import { Loader, CheckCircle, XCircle, Wifi, WifiOff } from 'lucide-react';
import { useBranding } from '@/contexts/BrandingContext';
import { useCustomAuth } from '@/hooks/useCustomAuth';

interface UpgradedSplashScreenProps {
  onComplete: () => void;
  onError?: (error: string) => void;
}

export const UpgradedSplashScreen: React.FC<UpgradedSplashScreenProps> = ({ 
  onComplete, 
  onError 
}) => {
  const { branding, loading: brandingLoading, error: brandingError } = useBranding();
  const { isOnline } = useCustomAuth();
  const [loadingSteps, setLoadingSteps] = useState({
    branding: false,
    connectivity: false,
    auth: false,
    complete: false
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { key: 'branding', label: 'Loading branding...', duration: 1000 },
    { key: 'connectivity', label: 'Checking connectivity...', duration: 500 },
    { key: 'auth', label: 'Initializing authentication...', duration: 800 },
    { key: 'complete', label: 'Finalizing setup...', duration: 500 }
  ];

  useEffect(() => {
    let timeouts: NodeJS.Timeout[] = [];
    
    const runLoadingSequence = async () => {
      try {
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          setCurrentStep(i);
          
          // Set loading state for current step
          setLoadingSteps(prev => ({ ...prev, [step.key]: true }));
          
          // Wait for step duration
          await new Promise(resolve => {
            const timeout = setTimeout(resolve, step.duration);
            timeouts.push(timeout);
          });
          
          // Complete current step
          setLoadingSteps(prev => ({ ...prev, [step.key]: false }));
          
          // Check for errors after branding step
          if (step.key === 'branding' && brandingError) {
            throw new Error(brandingError);
          }
        }
        
        // Final delay before completion
        await new Promise(resolve => {
          const timeout = setTimeout(resolve, 500);
          timeouts.push(timeout);
        });
        
        onComplete();
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Loading failed';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    };

    // Start loading sequence after a brief delay
    const initialTimeout = setTimeout(runLoadingSequence, 300);
    timeouts.push(initialTimeout);

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [onComplete, onError, brandingError]);

  const getStepStatus = (stepIndex: number) => {
    if (error) return 'error';
    if (stepIndex < currentStep) return 'complete';
    if (stepIndex === currentStep) return 'loading';
    return 'pending';
  };

  const renderStepIcon = (stepIndex: number) => {
    const status = getStepStatus(stepIndex);
    
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'loading':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          .float-animation {
            animation: float 3s ease-in-out infinite;
          }
          @keyframes shimmer {
            0% { background-position: -200px 0; }
            100% { background-position: calc(200px + 100%) 0; }
          }
          .shimmer {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200px 100%;
            animation: shimmer 1.5s infinite;
          }
        `}
      </style>
      
      <div className="max-w-sm w-full space-y-8">
        {/* Logo and Branding */}
        <div className="text-center space-y-4">
          <div className="float-animation">
            <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-lg flex items-center justify-center">
              {!brandingLoading && branding?.logo ? (
                <img 
                  src={branding.logo} 
                  alt={branding.appName || 'App Logo'}
                  className="w-16 h-16 object-contain"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-xl shimmer" />
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            {!brandingLoading && branding ? (
              <>
                <h1 className="text-2xl font-bold text-gray-900">
                  {branding.appName}
                </h1>
                <p className="text-gray-600 text-sm">
                  {branding.tagline}
                </p>
              </>
            ) : (
              <>
                <div className="h-8 bg-gray-200 rounded mx-auto w-48 shimmer" />
                <div className="h-4 bg-gray-200 rounded mx-auto w-64 shimmer" />
              </>
            )}
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-center space-x-2">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-700">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-orange-700">Offline Mode</span>
            </>
          )}
        </div>

        {/* Loading Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const isActive = index === currentStep;
            
            return (
              <div 
                key={step.key}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                  isActive 
                    ? 'bg-white shadow-md' 
                    : status === 'complete' 
                    ? 'bg-green-50' 
                    : 'bg-gray-50'
                }`}
              >
                {renderStepIcon(index)}
                <span className={`text-sm flex-1 ${
                  status === 'complete' 
                    ? 'text-green-700' 
                    : status === 'error'
                    ? 'text-red-700'
                    : isActive 
                    ? 'text-gray-900 font-medium' 
                    : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
                
                {isActive && (
                  <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ 
                        width: '100%',
                        animation: 'pulse 2s infinite'
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 font-medium">Loading Failed</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Progress Bar */}
        {!error && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Loading...</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${((currentStep + 1) / steps.length) * 100}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
