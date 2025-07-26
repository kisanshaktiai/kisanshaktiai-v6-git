
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setTenantId } from '@/store/slices/farmerSlice';
import { LocationService } from '@/services/LocationService';
import { TenantDetectionService } from '@/services/TenantDetectionService';
import { Loader, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [currentLogo, setCurrentLogo] = useState('kisanshakti'); // 'kisanshakti' or 'tenant'
  const [isInitialized, setIsInitialized] = useState(false);
  const [tenantBranding, setTenantBranding] = useState({
    logo: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
    appName: 'KisanShakti AI',
    tagline: 'INTELLIGENT AI GURU FOR FARMERS',
    primaryColor: '#8BC34A',
    backgroundColor: '#FFFFFF'
  });

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Step 1: Show KisanShakti AI logo first
      setStatus(t('common.initializing'));
      setProgress(10);
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Show for 1.5 seconds

      // Step 2: Initialize services
      setStatus(t('splash.loadingServices'));
      setProgress(25);
      
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 3: Detect tenant
      setStatus(t('splash.detectingOrganization'));
      setProgress(40);
      
      const detectedTenant = await TenantDetectionService.getInstance().detectTenant();
      if (detectedTenant) {
        dispatch(setTenantId(detectedTenant.id));
        
        // Update branding with tenant-specific data
        setTenantBranding({
          logo: detectedTenant.branding?.logo_url || '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
          appName: detectedTenant.branding?.app_name || 'KisanShakti AI',
          tagline: detectedTenant.branding?.app_tagline || 'INTELLIGENT AI GURU FOR FARMERS',
          primaryColor: detectedTenant.branding?.primary_color || '#8BC34A',
          backgroundColor: detectedTenant.branding?.background_color || '#FFFFFF'
        });

        // Switch to tenant logo if different from default
        if (detectedTenant.id !== 'default' && detectedTenant.branding?.logo_url) {
          setCurrentLogo('tenant');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Show tenant logo for 1 second
        }
      }

      setProgress(60);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 4: Prepare location services
      setStatus(t('splash.preparingLocationServices'));
      setProgress(80);
      
      try {
        await LocationService.getInstance().requestPermissions();
      } catch (error) {
        console.log('Location permission not granted, will prompt later');
      }

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
    if (currentLogo === 'kisanshakti') {
      return '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png';
    }
    return tenantBranding.logo;
  };

  const getCurrentAppName = () => {
    if (currentLogo === 'kisanshakti') {
      return 'KisanShakti AI';
    }
    return tenantBranding.appName;
  };

  const getCurrentTagline = () => {
    if (currentLogo === 'kisanshakti') {
      return 'INTELLIGENT AI GURU FOR FARMERS';
    }
    return tenantBranding.tagline;
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500"
      style={{ backgroundColor: tenantBranding.backgroundColor }}
    >
      {/* Logo and Branding */}
      <div className="text-center mb-8">
        <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-500">
          <img 
            src={getCurrentLogo()} 
            alt="Logo" 
            className="w-24 h-24 object-contain transition-all duration-500"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        </div>
        <h1 
          className="text-3xl font-bold mb-3 transition-all duration-500"
          style={{ color: tenantBranding.primaryColor }}
        >
          {getCurrentAppName()}
        </h1>
        <p className="text-gray-600 text-base transition-all duration-500 font-medium">
          {getCurrentTagline()}
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
        {t('splash.version')}
      </div>
    </div>
  );
};
