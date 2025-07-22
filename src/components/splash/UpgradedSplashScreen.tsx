import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tenantCacheService } from '@/services/TenantCacheService';

interface UpgradedSplashScreenProps {
  onComplete: () => void;
}

interface TenantBranding {
  primary_color: string;
  secondary_color: string;
  app_name: string;
  app_tagline: string;
  logo_url: string;
  splash_screen_url?: string;
  splash_animation?: 'fade' | 'scale' | 'slide';
  splash_duration?: number;
}

const DEFAULT_BRANDING: TenantBranding = {
  primary_color: '#8BC34A',
  secondary_color: '#4CAF50',
  app_name: 'KisanShakti AI',
  app_tagline: 'INTELLIGENT AI GURU FOR FARMERS',
  logo_url: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
  splash_animation: 'scale',
  splash_duration: 3000
};

export const UpgradedSplashScreen: React.FC<UpgradedSplashScreenProps> = ({ onComplete }) => {
  const { t, i18n } = useTranslation();
  const [branding, setBranding] = useState<TenantBranding>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [initComplete, setInitComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation
    setTimeout(() => setIsVisible(true), 50);
    initializeTenantBranding();
    animateProgress();
  }, []);

  useEffect(() => {
    if (initComplete && logoLoaded && progress >= 100) {
      const exitDelay = Math.min(500, branding.splash_duration || 3000);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onComplete, 300); // Wait for fade-out
      }, exitDelay);

      return () => clearTimeout(timer);
    }
  }, [initComplete, logoLoaded, progress, branding.splash_duration, onComplete]);

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
      
      // Race between tenant data load and timeout
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );

      const tenantDataPromise = tenantCacheService.loadTenantData();
      
      const tenantData = await Promise.race([tenantDataPromise, timeoutPromise])
        .catch(err => {
          console.warn('[SplashScreen] Tenant data load failed:', err);
          return null;
        });
      
      if (tenantData?.branding) {
        setBranding({
          ...DEFAULT_BRANDING,
          ...tenantData.branding
        });
        
        // Update app language if tenant has a default
        if (tenantData.default_language && tenantData.default_language !== i18n.language) {
          await i18n.changeLanguage(tenantData.default_language);
        }
        
        console.log('[SplashScreen] Tenant branding loaded successfully');
      } else {
        console.log('[SplashScreen] Using default branding');
      }
    } catch (error) {
      console.error('[SplashScreen] Critical error:', error);
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

  // Ensure logo loading doesn't block splash screen
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
      style={{ backgroundColor: '#FFFFFF' }}
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

      {/* Animated particles for premium feel */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20 animate-float"
            style={{
              backgroundColor: i % 2 === 0 ? branding.primary_color : branding.secondary_color,
              width: `${20 + i * 15}px`,
              height: `${20 + i * 15}px`,
              left: `${10 + i * 20}%`,
              top: `${20 + i * 15}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${5 + i}s`
            }}
          />
        ))}
      </div>

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
          className={`text-gray-600 text-lg font-medium px-4 leading-relaxed transform transition-all duration-700 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
          style={{ transitionDelay: '600ms' }}
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
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 shimmer-animation" />
              </div>
            </div>
            
            {/* Progress percentage */}
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
          
          @keyframes float {
            0%, 100% { transform: translateY(-20px) translateX(-10px); }
            50% { transform: translateY(20px) translateX(10px); }
          }
          
          .shimmer-animation {
            animation: shimmer 1.5s infinite;
          }
          
          .animate-float {
            animation: float ease-in-out infinite;
          }
        `}
      </style>
    </div>
  );
};