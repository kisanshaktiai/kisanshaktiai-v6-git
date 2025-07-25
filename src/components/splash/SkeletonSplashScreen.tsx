
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setTenantId } from '@/store/slices/farmerSlice';
import { LocationService } from '@/services/LocationService';
import { TenantDetectionService } from '@/services/TenantDetectionService';
import { applyTenantTheme } from '@/utils/tenantTheme';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';

interface SkeletonSplashScreenProps {
  onComplete: () => void;
}

interface TenantBranding {
  logo_url?: string;
  app_name?: string;
  app_tagline?: string;
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
}

interface LoadingState {
  phase: 'initializing' | 'loading_tenant' | 'ready' | 'error';
  message: string;
}

export const SkeletonSplashScreen: React.FC<SkeletonSplashScreenProps> = ({ onComplete }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  
  const [loadingState, setLoadingState] = useState<LoadingState>({
    phase: 'initializing',
    message: 'Initializing...'
  });
  
  const [tenantBranding, setTenantBranding] = useState<TenantBranding>({
    logo_url: '/lovable-uploads/180cdfdf-9869-4c78-ace0-fdb76e9273b4.png',
    app_name: 'KisanShaktiAI',
    app_tagline: 'Intelligent Guru for Farmers',
    primary_color: '#4D7C0F',
    secondary_color: '#65A30D',
    background_color: '#FFFFFF'
  });
  
  const [showBranding, setShowBranding] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Phase 1: Initialize app
      setLoadingState({
        phase: 'initializing',
        message: t('common.initializing', 'Initializing...')
      });

      // Apply initial theme
      const root = document.documentElement;
      root.style.setProperty('--splash-primary', tenantBranding.primary_color || '#4D7C0F');
      root.style.setProperty('--splash-background', tenantBranding.background_color || '#FFFFFF');

      // Phase 2: Load tenant data
      setLoadingState({
        phase: 'loading_tenant',
        message: 'Loading organization data...'
      });

      // Load tenant in parallel with asset preloading
      const [tenantResult] = await Promise.allSettled([
        loadTenantBranding(),
        preloadCriticalAssets(),
        initializeLocationServices()
      ]);

      // Phase 3: Apply branding if successful
      if (tenantResult.status === 'fulfilled' && tenantResult.value) {
        const brandingData = tenantResult.value;
        
        // Update CSS variables immediately
        root.style.setProperty('--splash-primary', brandingData.primary_color || '#4D7C0F');
        root.style.setProperty('--splash-background', brandingData.background_color || '#FFFFFF');
        
        // Apply global theme
        applyTenantTheme({
          primary_color: brandingData.primary_color,
          secondary_color: brandingData.secondary_color,
          background_color: brandingData.background_color
        });

        // Update branding state
        setTenantBranding(prev => ({
          ...prev,
          ...brandingData
        }));

        // Smooth transition to branded UI
        setTimeout(() => setShowBranding(true), 200);
      }

      // Phase 4: Mark as ready
      setLoadingState({
        phase: 'ready',
        message: 'Ready to continue'
      });

    } catch (error) {
      console.error('Splash initialization error:', error);
      setLoadingState({
        phase: 'error',
        message: 'Failed to load. Tap Next to continue anyway.'
      });
    }
  };

  const loadTenantBranding = async () => {
    try {
      const detectedTenant = await TenantDetectionService.getInstance().detectTenant();
      
      if (detectedTenant) {
        dispatch(setTenantId(detectedTenant.id));
        
        // Store default tenant ID for new users
        const tenantService = TenantDetectionService.getInstance();
        const defaultTenantId = tenantService.getDefaultTenantId();
        if (defaultTenantId) {
          localStorage.setItem('defaultTenantForNewUsers', defaultTenantId);
        }
        
        return detectedTenant.branding || {};
      }
      
      return null;
    } catch (error) {
      console.error('Error loading tenant branding:', error);
      return null;
    }
  };

  const preloadCriticalAssets = async () => {
    const criticalAssets = [
      '/lovable-uploads/180cdfdf-9869-4c78-ace0-fdb76e9273b4.png',
      tenantBranding.logo_url
    ].filter(Boolean);
    
    const promises = criticalAssets.map(asset => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(asset);
        img.onerror = () => resolve(null);
        img.src = asset as string;
      });
    });
    
    await Promise.allSettled(promises);
    setAssetsReady(true);
  };

  const initializeLocationServices = async () => {
    try {
      await LocationService.getInstance().requestPermissions();
    } catch (error) {
      // Silent fail - location is optional
      console.log('Location permission not granted');
    }
  };

  const handleNext = () => {
    if (loadingState.phase === 'ready' || loadingState.phase === 'error') {
      onComplete();
    }
  };

  const isNextEnabled = loadingState.phase === 'ready' || loadingState.phase === 'error';

  return (
    <>
      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%) skewX(-12deg); }
            100% { transform: translateX(200%) skewX(-12deg); }
          }
          @keyframes fadeInUp {
            from { 
              opacity: 0; 
              transform: translateY(20px); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.6s ease-out forwards;
          }
          .shimmer-bg {
            background: linear-gradient(90deg, 
              transparent 0%, 
              rgba(255, 255, 255, 0.4) 50%, 
              transparent 100%
            );
          }
        `}
      </style>
      
      <div 
        className="min-h-screen flex flex-col items-center justify-between p-6 transition-colors duration-700 ease-out"
        style={{ 
          backgroundColor: 'var(--splash-background, #FFFFFF)',
          color: 'var(--splash-text, #374151)'
        }}
      >
        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
          {/* Logo Container */}
          <div className="text-center mb-12">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden transition-all duration-700 ease-out">
              {showBranding && tenantBranding.logo_url ? (
                <img 
                  src={tenantBranding.logo_url} 
                  alt="App Logo" 
                  className="w-24 h-24 object-contain transition-opacity duration-500 ease-out animate-fade-in-up"
                  onError={(e) => {
                    e.currentTarget.src = '/lovable-uploads/180cdfdf-9869-4c78-ace0-fdb76e9273b4.png';
                  }}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 animate-pulse relative overflow-hidden">
                  <div className="absolute inset-0 shimmer-bg animate-[shimmer_2s_infinite]"></div>
                </div>
              )}
            </div>
            
            {/* App Name */}
            {showBranding && tenantBranding.app_name ? (
              <h1 
                className="text-3xl font-bold mb-3 transition-all duration-700 ease-out animate-fade-in-up"
                style={{ color: 'var(--splash-primary, #4D7C0F)' }}
              >
                {tenantBranding.app_name}
              </h1>
            ) : (
              <div className="h-9 w-64 mx-auto mb-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 shimmer-bg animate-[shimmer_2s_infinite]"></div>
              </div>
            )}
            
            {/* Tagline */}
            {showBranding && tenantBranding.app_tagline ? (
              <p className="text-gray-600 text-base transition-all duration-700 ease-out delay-200 animate-fade-in-up">
                {tenantBranding.app_tagline}
              </p>
            ) : (
              <div className="h-6 w-48 mx-auto bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 shimmer-bg animate-[shimmer_2s_infinite]"></div>
              </div>
            )}
          </div>

          {/* Loading State */}
          <div className="text-center mb-8 min-h-[60px] flex flex-col items-center justify-center">
            {loadingState.phase !== 'ready' && loadingState.phase !== 'error' ? (
              <div className="flex items-center space-x-3 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-base">{loadingState.message}</span>
              </div>
            ) : (
              <div className={`text-center transition-opacity duration-500 ${isNextEnabled ? 'opacity-100' : 'opacity-60'}`}>
                <p className={`text-lg font-medium mb-2 ${loadingState.phase === 'error' ? 'text-orange-600' : 'text-green-600'}`}>
                  {loadingState.phase === 'error' ? '⚠️ Ready (with errors)' : '✅ Ready to Continue'}
                </p>
                <p className="text-sm text-gray-500">
                  {loadingState.message}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Next Button */}
        <div className="w-full max-w-sm">
          <Button 
            onClick={handleNext}
            disabled={!isNextEnabled}
            size="lg"
            className="w-full h-14 text-lg font-semibold transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: isNextEnabled ? 'var(--splash-primary, #4D7C0F)' : undefined,
              borderColor: 'var(--splash-primary, #4D7C0F)'
            }}
          >
            {loadingState.phase === 'ready' || loadingState.phase === 'error' ? (
              <>
                Next
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            ) : (
              <>
                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                Loading...
              </>
            )}
          </Button>
        </div>

        {/* Version Info */}
        <div className="absolute bottom-4 text-xs text-gray-400 text-center">
          <p>v6.0.0 • Multi-Tenant • Performance Optimized</p>
        </div>
      </div>
    </>
  );
};
