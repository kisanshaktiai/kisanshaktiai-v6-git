
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tenantCacheService } from '@/services/TenantCacheService';
import type { TenantBrandingData } from '@/types/tenantCache';

interface UpgradedSplashScreenProps {
  onComplete: () => void;
}

const DEFAULT_BRANDING: TenantBrandingData = {
  primary_color: '#8BC34A',
  secondary_color: '#4CAF50',
  accent_color: '#689F38',
  background_color: '#FFFFFF',
  text_color: '#1F2937',
  app_name: 'KisanShakti AI',
  app_tagline: 'INTELLIGENT AI GURU FOR FARMERS',
  logo_url: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
  splash_screen_url: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png'
};

export const UpgradedSplashScreen: React.FC<UpgradedSplashScreenProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [branding, setBranding] = useState<TenantBrandingData>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [initComplete, setInitComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    initializeTenantBranding();
    animateProgress();
  }, []);

  useEffect(() => {
    if (initComplete && logoLoaded && progress >= 100) {
      const exitDelay = 1000;
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onComplete, 300);
      }, exitDelay);

      return () => clearTimeout(timer);
    }
  }, [initComplete, logoLoaded, progress, onComplete]);

  const animateProgress = () => {
    const duration = 2000;
    const startTime = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progressValue = Math.min((elapsed / duration) * 100, 100);
      
      setProgress(progressValue);
      
      if (progressValue < 100) {
        requestAnimationFrame(updateProgress);
      }
    };

    requestAnimationFrame(updateProgress);
  };

  const initializeTenantBranding = async () => {
    try {
      console.log('[SplashScreen] Loading tenant branding...');
      
      const tenantData = await tenantCacheService.loadTenantData();
      
      if (tenantData?.branding) {
        setBranding(tenantData.branding);
        console.log('[SplashScreen] Tenant branding loaded successfully');
      } else {
        console.log('[SplashScreen] Using default branding');
      }
      
    } catch (error) {
      console.error('[SplashScreen] Error loading branding:', error);
    } finally {
      setLoading(false);
      setInitComplete(true);
    }
  };

  const handleImageLoad = () => {
    console.log('[SplashScreen] Logo loaded');
    setLogoLoaded(true);
  };

  const handleImageError = () => {
    console.warn('[SplashScreen] Logo load failed, using fallback');
    setLogoLoaded(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!logoLoaded) {
        console.log('[SplashScreen] Logo timeout, proceeding');
        setLogoLoaded(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [logoLoaded]);

  const logoUrl = branding.splash_screen_url || branding.logo_url;

  return (
    <div 
      className={`fixed inset-0 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backgroundColor: branding.background_color }}
    >
      {/* Premium gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, ${branding.primary_color}08 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, ${branding.secondary_color}08 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, ${branding.primary_color}03 0%, transparent 70%)
          `
        }}
      />

      {/* Main Content */}
      <div className="z-10 text-center space-y-6 px-6 max-w-md w-full">
        {/* Logo */}
        <div 
          className={`w-36 h-36 mx-auto mb-8 relative transform transition-all duration-700 ${
            isVisible ? 'scale-100 opacity-100' : 'scale-80 opacity-0'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
          {logoUrl ? (
            <>
              <img
                src={logoUrl}
                alt={branding.app_name}
                className="w-full h-full object-contain"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              {!logoLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 border-4 border-gray-200 border-t-transparent rounded-full animate-spin"
                       style={{ borderTopColor: branding.primary_color }} />
                </div>
              )}
            </>
          ) : (
            <div 
              className="w-full h-full rounded-3xl flex items-center justify-center shadow-xl"
              style={{ 
                background: `linear-gradient(135deg, ${branding.primary_color}, ${branding.secondary_color})` 
              }}
            >
              <span className="text-white text-5xl font-bold">
                {branding.app_name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* App Name */}
        <h1 
          className={`text-4xl font-bold tracking-tight transform transition-all duration-700 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
          style={{ 
            color: branding.primary_color,
            transitionDelay: '400ms'
          }}
        >
          {branding.app_name}
        </h1>
        
        {/* Tagline */}
        <p 
          className={`text-lg font-medium px-4 leading-relaxed transform transition-all duration-700 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
          style={{ 
            color: branding.text_color,
            transitionDelay: '600ms' 
          }}
        >
          {branding.app_tagline}
        </p>

        {/* Progress Bar */}
        <div 
          className={`w-full max-w-xs mx-auto mt-12 transform transition-all duration-700 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
          style={{ transitionDelay: '800ms' }}
        >
          <div className="relative">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full relative overflow-hidden transition-all duration-300 ease-out"
                style={{ 
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${branding.primary_color}, ${branding.secondary_color})`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 shimmer-animation" />
              </div>
            </div>
            
            <div className="mt-3 text-center">
              <span className="text-sm font-medium" style={{ color: branding.primary_color }}>
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div 
        className={`absolute bottom-8 text-center w-full transform transition-all duration-700 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
        style={{ transitionDelay: '1000ms' }}
      >
        <p className="text-xs text-gray-400">
          {t('splash.version', { defaultValue: 'v1.0.0' })} • {t('splash.powered_by', { defaultValue: 'Powered by AI' })}
        </p>
      </div>

      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          .shimmer-animation {
            animation: shimmer 1.5s infinite;
          }
        `}
      </style>
    </div>
  );
};
