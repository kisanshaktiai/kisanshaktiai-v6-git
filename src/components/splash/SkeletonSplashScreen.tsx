
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setTenantId } from '@/store/slices/farmerSlice';
import { LocationService } from '@/services/LocationService';
import { TenantDetectionService } from '@/services/TenantDetectionService';
import { applyTenantTheme } from '@/utils/tenantTheme';

interface SkeletonSplashScreenProps {
  onComplete: () => void;
}

export const SkeletonSplashScreen: React.FC<SkeletonSplashScreenProps> = ({ onComplete }) => {
  const dispatch = useDispatch();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing...');
  const [tenantBranding, setTenantBranding] = useState({
    logo: null as string | null,
    appName: null as string | null,
    tagline: null as string | null,
    primaryColor: '#4D7C0F',
    backgroundColor: '#FFFFFF'
  });
  const [showBranding, setShowBranding] = useState(false);

  useEffect(() => {
    // Apply initial skeleton theme
    const root = document.documentElement;
    root.style.setProperty('--splash-primary', '#6B7280');
    root.style.setProperty('--splash-background', '#FFFFFF');
    root.style.setProperty('--splash-text', '#374151');

    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Start with skeleton UI
      setStatus('Loading...');
      setProgress(10);
      
      // Parallel loading of critical resources
      const [tenantResult] = await Promise.allSettled([
        loadTenantData(),
        preloadCriticalAssets(),
        initializeServices()
      ]);

      setProgress(60);
      
      // Apply tenant branding if available
      if (tenantResult.status === 'fulfilled' && tenantResult.value) {
        const tenant = tenantResult.value;
        
        // Update CSS custom properties instantly
        const root = document.documentElement;
        root.style.setProperty('--splash-primary', tenant.branding?.primary_color || '#4D7C0F');
        root.style.setProperty('--splash-background', tenant.branding?.background_color || '#FFFFFF');
        
        // Apply tenant theme globally
        applyTenantTheme(tenant.branding);
        
        setTenantBranding({
          logo: tenant.branding?.logo_url || null,
          appName: tenant.branding?.app_name || 'KisanShaktiAI',
          tagline: tenant.branding?.app_tagline || 'Intelligent Guru for Farmers',
          primaryColor: tenant.branding?.primary_color || '#4D7C0F',
          backgroundColor: tenant.branding?.background_color || '#FFFFFF'
        });
        
        // Smooth transition to branded UI
        setTimeout(() => setShowBranding(true), 100);
      }

      setProgress(80);
      
      // Initialize location services
      try {
        await LocationService.getInstance().requestPermissions();
      } catch (error) {
        console.log('Location permission not granted, will prompt later');
      }

      setProgress(100);
      setStatus('Ready!');
      
      await new Promise(resolve => setTimeout(resolve, 300));
      onComplete();

    } catch (error) {
      console.error('Splash initialization error:', error);
      // Continue anyway
      setTimeout(onComplete, 1000);
    }
  };

  const loadTenantData = async () => {
    const detectedTenant = await TenantDetectionService.getInstance().detectTenant();
    if (detectedTenant) {
      dispatch(setTenantId(detectedTenant.id));
      return detectedTenant;
    }
    return null;
  };

  const preloadCriticalAssets = async () => {
    // Preload critical assets with priority hints
    const criticalAssets = [
      '/lovable-uploads/180cdfdf-9869-4c78-ace0-fdb76e9273b4.png'
    ];
    
    return Promise.allSettled(
      criticalAssets.map(asset => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = asset;
        document.head.appendChild(link);
        
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve;
          img.src = asset;
        });
      })
    );
  };

  const initializeServices = async () => {
    // Lightweight service initialization
    await new Promise(resolve => setTimeout(resolve, 200));
  };

  return (
    <>
      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%) skewX(-12deg); }
            100% { transform: translateX(200%) skewX(-12deg); }
          }
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
          }
        `}
      </style>
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-6 transition-all duration-500 ease-out"
        style={{ 
          backgroundColor: 'var(--splash-background)',
          color: 'var(--splash-text)'
        }}
      >
        {/* Logo Container with Skeleton */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden transition-all duration-700 ease-out">
            {showBranding && tenantBranding.logo ? (
              <img 
                src={tenantBranding.logo} 
                alt="Logo" 
                className="w-24 h-24 object-contain transition-all duration-500 ease-out"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-[shimmer_2s_infinite] transform -skew-x-12"></div>
              </div>
            )}
          </div>
          
          {/* App Name with Skeleton */}
          {showBranding && tenantBranding.appName ? (
            <h1 
              className="text-3xl font-bold mb-3 transition-all duration-700 ease-out animate-fade-in"
              style={{ color: 'var(--splash-primary)' }}
            >
              {tenantBranding.appName}
            </h1>
          ) : (
            <div className="h-9 w-64 mx-auto mb-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-[shimmer_2s_infinite] transform -skew-x-12"></div>
            </div>
          )}
          
          {/* Tagline with Skeleton */}
          {showBranding && tenantBranding.tagline ? (
            <p className="text-gray-600 text-base transition-all duration-700 ease-out delay-200 animate-fade-in">
              {tenantBranding.tagline}
            </p>
          ) : (
            <div className="h-6 w-48 mx-auto bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-[shimmer_2s_infinite] transform -skew-x-12"></div>
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="w-full max-w-sm mb-6">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="h-3 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
              style={{ 
                width: `${progress}%`,
                backgroundColor: 'var(--splash-primary)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-[shimmer_2s_infinite] transform -skew-x-12"></div>
            </div>
          </div>
        </div>

        {/* Status Text with Skeleton */}
        <div className="flex items-center space-x-2 text-gray-600 mb-8">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-base">{status}</span>
        </div>

        {/* Version Info */}
        <div className="absolute bottom-6 text-sm text-gray-400">
          v6.0.0 • Multi-Tenant • Performance Optimized
        </div>
      </div>
    </>
  );
};
