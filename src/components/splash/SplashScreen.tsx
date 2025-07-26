
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setTenantId } from '@/store/slices/farmerSlice';
import { LocationService } from '@/services/LocationService';
import { TenantDetectionService } from '@/services/TenantDetectionService';
import { Loader, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [currentLogo, setCurrentLogo] = useState('kisanshakti');
  const [isInitialized, setIsInitialized] = useState(false);
  const [tenantBranding, setTenantBranding] = useState({
    logo: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
    appName: 'KisanShakti AI',
    tagline: 'Your Smart Farming Companion',
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    backgroundColor: '#f0fdf4'
  });

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Starting app initialization...');
      
      // Step 1: Initialize location services
      setStatus(t('common.detecting_location', { defaultValue: 'Detecting location...' }));
      setProgress(20);
      
      try {
        const locationService = LocationService.getInstance();
        await locationService.getCurrentLocation();
        console.log('Location service initialized');
      } catch (locationError) {
        console.warn('Location service failed, continuing without location:', locationError);
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 2: Detect tenant with better error handling
      setStatus(t('common.configuring_app', { defaultValue: 'Configuring app...' }));
      setProgress(40);
      
      let detectedTenant = null;
      try {
        const tenantService = TenantDetectionService.getInstance();
        await tenantService.clearCache();
        detectedTenant = await tenantService.detectTenant();
        console.log('Tenant detected:', detectedTenant);
      } catch (tenantError) {
        console.warn('Tenant detection failed, using default:', tenantError);
        // Continue with default tenant
      }

      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 3: Set up branding
      setStatus(t('common.loading_interface', { defaultValue: 'Loading interface...' }));
      setProgress(60);
      
      if (detectedTenant?.branding) {
        const branding = detectedTenant.branding;
        setTenantBranding({
          logo: branding.logo_url || tenantBranding.logo,
          appName: branding.app_name || detectedTenant.name || tenantBranding.appName,
          tagline: branding.app_tagline || tenantBranding.tagline,
          primaryColor: branding.primary_color || tenantBranding.primaryColor,
          secondaryColor: branding.secondary_color || tenantBranding.secondaryColor,
          backgroundColor: branding.background_color || tenantBranding.backgroundColor
        });
        setCurrentLogo('tenant');
        console.log('Custom branding applied');
      }

      if (detectedTenant?.id) {
        dispatch(setTenantId(detectedTenant.id));
      }

      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 4: Finalize
      setStatus(t('common.finalizing', { defaultValue: 'Finalizing...' }));
      setProgress(80);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress(100);
      setStatus(t('common.ready'));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mark as initialized and show the continue button
      setIsInitialized(true);

    } catch (error) {
      console.error('Splash initialization error:', error);
      // Continue anyway and show button
      setIsInitialized(true);
    }
  };

  const handleContinue = () => {
    onComplete();
  };

  const getCurrentLogo = () => {
    if (currentLogo === 'tenant' && tenantBranding.logo) {
      return tenantBranding.logo;
    }
    return '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png';
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden"
      style={{ backgroundColor: tenantBranding.backgroundColor }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      {/* Logo Section */}
      <div className="mb-8 relative">
        <div className="relative w-32 h-32 mx-auto mb-6">
          <img 
            src={getCurrentLogo()}
            alt={tenantBranding.appName}
            className="w-full h-full object-contain rounded-2xl shadow-2xl"
            onError={(e) => {
              console.warn('Logo failed to load, using fallback');
              e.currentTarget.src = '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png';
            }}
          />
          <div 
            className="absolute -inset-2 rounded-3xl opacity-20 blur-xl"
            style={{ backgroundColor: tenantBranding.primaryColor }}
          />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {tenantBranding.appName}
        </h1>
        <p className="text-lg text-gray-600 font-medium">
          {tenantBranding.tagline}
        </p>
      </div>

      {/* 2025 Badge */}
      <div className="mb-6">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full shadow-lg animate-pulse">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-semibold">2025 Design Ready</span>
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

      {/* Progress Indicator - Only show while loading */}
      {!isInitialized && (
        <>
          <div className="w-full max-w-sm mb-6">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="h-3 rounded-full transition-all duration-300 ease-out"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: tenantBranding.primaryColor 
                }}
              />
            </div>
          </div>

          {/* Status Text */}
          <div className="flex items-center space-x-2 text-gray-600 mb-8">
            <Loader className="w-5 h-5 animate-spin" />
            <span className="text-base">{status}</span>
          </div>
        </>
      )}

      {/* Continue Button - Only show after initialization */}
      {isInitialized && (
        <div className="mb-8">
          <Button
            onClick={handleContinue}
            size="lg"
            className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-8 py-4 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 animate-bounce"
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">Get Started</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
            
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
          </Button>
        </div>
      )}

      {/* Version Info */}
      <div className="absolute bottom-6 text-sm text-gray-400">
        v1.0.0 • {t('common.powered_by', { defaultValue: 'Powered by' })} KisanShakti AI
      </div>
    </div>
  );
};
