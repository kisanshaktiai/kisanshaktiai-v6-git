import React, { useEffect, useState } from 'react';
import { MultiTenantInitializer } from '@/services/MultiTenantInitializer';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface EnhancedSplashScreenProps {
  onInitialized: (result: any) => void;
}

export const EnhancedSplashScreen: React.FC<EnhancedSplashScreenProps> = ({ onInitialized }) => {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Initializing...');
  const [brandingLoaded, setBrandingLoaded] = useState(false);
  const [branding, setBranding] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializer = MultiTenantInitializer.getInstance();
    
    // Subscribe to progress updates
    initializer.onProgress((progressData) => {
      setProgress(progressData.progress);
      setMessage(progressData.message);
      
      // Apply branding as soon as it's loaded
      if (progressData.stage === 'branding_apply' && progressData.progress >= 30) {
        setBrandingLoaded(true);
      }
    });

    // Perform initialization
    const initialize = async () => {
      try {
        const result = await initializer.initialize();
        
        if (result.success) {
          setBranding(result.branding);
          // Add a small delay to show 100% completion
          setProgress(100);
          setMessage('Welcome!');
          
          setTimeout(() => {
            onInitialized(result);
          }, 500);
        } else {
          setError(result.error || 'Initialization failed');
          
          // Still proceed but with limited functionality
          setTimeout(() => {
            onInitialized(result);
          }, 2000);
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to initialize application');
        
        // Proceed with emergency fallback
        setTimeout(() => {
          onInitialized({
            success: false,
            tenant: null,
            branding: null,
            features: [],
            error: err instanceof Error ? err.message : 'Unknown error',
            stage: 'error'
          });
        }, 2000);
      }
    };

    initialize();
  }, [onInitialized]);

  // Dynamic background based on branding
  const getBackgroundStyle = () => {
    if (branding?.background_color) {
      return { backgroundColor: branding.background_color };
    }
    return {};
  };

  // Dynamic logo
  const getLogo = () => {
    if (branding?.logo_url) {
      return branding.logo_url;
    }
    return '/lovable-uploads/b75563a8-f082-47af-90f0-95838d69b700.png';
  };

  // Dynamic app name
  const getAppName = () => {
    if (branding?.app_name) {
      return branding.app_name;
    }
    return 'KisanShakti AI';
  };

  // Dynamic tagline
  const getTagline = () => {
    if (branding?.app_tagline) {
      return branding.app_tagline;
    }
    return 'कृषि का डिजिटल साथी | Your Digital Farming Companion';
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 transition-all duration-500"
      style={getBackgroundStyle()}
    >
      <div className="flex flex-col items-center space-y-8 px-6 text-center">
        {/* Logo with fade-in animation */}
        <div 
          className={`transition-all duration-700 ${
            brandingLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <img
            src={getLogo()}
            alt={getAppName()}
            className="h-24 w-24 object-contain animate-pulse"
          />
        </div>

        {/* App Name */}
        <div 
          className={`space-y-2 transition-all duration-700 delay-100 ${
            brandingLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h1 className="text-3xl font-bold text-foreground">
            {getAppName()}
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs">
            {getTagline()}
          </p>
        </div>

        {/* Progress Section */}
        <div className="w-full max-w-xs space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-center space-x-2">
              {progress < 100 && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
              <p className="text-xs text-muted-foreground">
                {message}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* Progress Percentage */}
          <p className="text-center text-xs font-medium text-muted-foreground">
            {progress}%
          </p>
        </div>

        {/* Features Preview (shown after features are loaded) */}
        {progress >= 40 && (
          <div 
            className={`grid grid-cols-3 gap-2 text-xs text-muted-foreground transition-all duration-700 ${
              progress >= 40 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-center space-x-1">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span>AI Assistant</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span>Weather</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              <span>Analytics</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Branding */}
      <div className="absolute bottom-6 text-center">
        <p className="text-xs text-muted-foreground/60">
          Powered by Advanced AI
        </p>
      </div>
    </div>
  );
};