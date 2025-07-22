
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tenantCacheService } from '@/services/TenantCacheService';
import type { TenantBrandingData } from '@/types/tenantCache';
import { Button } from '@/components/ui/button';

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
  const [isVisible, setIsVisible] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    initializeTenantBranding();
  }, []);

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
      // Show next button after a short delay for animation
      setTimeout(() => {
        setShowNextButton(true);
      }, 1500);
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

  const handleNext = () => {
    setIsVisible(false);
    setTimeout(onComplete, 300);
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
        {/* Logo with pulse animation */}
        <div 
          className={`w-36 h-36 mx-auto mb-8 relative transform transition-all duration-700 ${
            isVisible ? 'scale-100 opacity-100 animate-pulse' : 'scale-80 opacity-0'
          }`}
          style={{ transitionDelay: '200ms', animationDuration: '2s' }}
        >
          {logoUrl ? (
            <>
              <img
                src={logoUrl}
                alt={branding.app_name}
                className="w-full h-full object-contain rounded-2xl shadow-2xl"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              {!logoLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-2xl">
                  <div className="w-20 h-20 border-4 border-gray-200 border-t-transparent rounded-full animate-spin"
                       style={{ borderTopColor: branding.primary_color }} />
                </div>
              )}
            </>
          ) : (
            <div 
              className="w-full h-full rounded-3xl flex items-center justify-center shadow-xl animate-pulse"
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

        {/* App Name with slide-up animation */}
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
        
        {/* Tagline with slide-up animation */}
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

        {/* Loading indicator */}
        {loading && (
          <div 
            className={`w-full max-w-xs mx-auto mt-12 transform transition-all duration-700 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
            style={{ transitionDelay: '800ms' }}
          >
            <div className="flex items-center justify-center space-x-2">
              <div 
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: branding.primary_color, animationDelay: '0ms' }}
              />
              <div 
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: branding.primary_color, animationDelay: '150ms' }}
              />
              <div 
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: branding.primary_color, animationDelay: '300ms' }}
              />
            </div>
            <p className="text-sm mt-2" style={{ color: branding.primary_color }}>
              {t('splash.loading', { defaultValue: 'Loading...' })}
            </p>
          </div>
        )}

        {/* Next Button */}
        {showNextButton && !loading && (
          <div 
            className={`w-full max-w-xs mx-auto mt-12 transform transition-all duration-500 ${
              showNextButton ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            <Button
              onClick={handleNext}
              className="w-full py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              style={{
                backgroundColor: branding.primary_color,
                color: 'white'
              }}
            >
              {t('splash.next', { defaultValue: 'Get Started' })}
            </Button>
          </div>
        )}
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
    </div>
  );
};
