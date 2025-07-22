
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
}

export const UpgradedSplashScreen: React.FC<UpgradedSplashScreenProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    initializeTenantBranding();
  }, []);

  useEffect(() => {
    if (branding && logoLoaded) {
      // Auto-transition after 3 seconds once branding is loaded and logo is displayed
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [branding, logoLoaded, onComplete]);

  const initializeTenantBranding = async () => {
    try {
      console.log('Loading tenant data for splash screen...');
      const tenantData = await tenantCacheService.loadTenantData();
      
      if (tenantData) {
        setBranding(tenantData.branding);
        console.log('Tenant branding loaded:', tenantData.branding);
      } else {
        // Fallback to default branding
        setBranding({
          primary_color: '#8BC34A',
          secondary_color: '#4CAF50',
          app_name: 'KisanShakti AI',
          app_tagline: 'INTELLIGENT AI GURU FOR FARMERS',
          logo_url: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png'
        });
      }
    } catch (error) {
      console.error('Error loading tenant branding:', error);
      // Fallback to default branding
      setBranding({
        primary_color: '#8BC34A',
        secondary_color: '#4CAF50',
        app_name: 'KisanShakti AI',
        app_tagline: 'INTELLIGENT AI GURU FOR FARMERS',
        logo_url: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = () => {
    setLogoLoaded(true);
  };

  const handleImageError = () => {
    console.warn('Failed to load logo, using default');
    setLogoLoaded(true);
  };

  if (loading || !branding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-green-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const logoUrl = branding.splash_screen_url || branding.logo_url;

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      {/* Background gradient */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          background: `radial-gradient(circle at 30% 20%, ${branding.primary_color} 0%, transparent 50%), 
                       radial-gradient(circle at 70% 80%, ${branding.secondary_color} 0%, transparent 50%)`
        }}
      />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-20 left-10 w-16 h-16 rounded-full opacity-10 animate-pulse"
          style={{ backgroundColor: branding.primary_color }}
        />
        <div 
          className="absolute top-40 right-16 w-10 h-10 rounded-full opacity-10 animate-pulse"
          style={{ backgroundColor: branding.secondary_color, animationDelay: '1s' }}
        />
        <div 
          className="absolute bottom-32 left-20 w-12 h-12 rounded-full opacity-10 animate-pulse"
          style={{ backgroundColor: branding.primary_color, animationDelay: '2s' }}
        />
      </div>

      {/* Main content */}
      <div className="text-center z-10 px-6">
        {/* Logo container with animation */}
        <div className="relative mb-8">
          {/* Animated rings */}
          <div 
            className="absolute inset-0 w-32 h-32 mx-auto rounded-full border-4 opacity-20 animate-ping"
            style={{ borderColor: branding.primary_color }}
          />
          <div 
            className="absolute inset-2 w-28 h-28 mx-auto rounded-full border-2 opacity-40 animate-pulse"
            style={{ borderColor: branding.secondary_color, animationDelay: '0.5s' }}
          />
          
          {/* Logo */}
          <div 
            className="w-32 h-32 mx-auto rounded-full shadow-2xl flex items-center justify-center relative z-10 border-4 bg-white"
            style={{ borderColor: `${branding.primary_color}20` }}
          >
            <img 
              src={logoUrl}
              alt={branding.app_name}
              className="w-24 h-24 object-contain transition-all duration-500"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </div>
        </div>

        {/* App name with typing animation */}
        <h1 
          className="text-4xl font-bold mb-4 animate-fade-in"
          style={{ color: branding.primary_color }}
        >
          {branding.app_name}
        </h1>
        
        {/* Tagline */}
        <p 
          className="text-gray-600 text-lg font-medium px-4 leading-relaxed animate-fade-in"
          style={{ animationDelay: '0.5s' }}
        >
          {branding.app_tagline}
        </p>
      </div>

      {/* Loading indicator */}
      <div className="absolute bottom-20 w-full flex justify-center">
        <div className="flex space-x-2">
          <div 
            className="w-3 h-3 rounded-full animate-bounce"
            style={{ backgroundColor: branding.primary_color }}
          />
          <div 
            className="w-3 h-3 rounded-full animate-bounce"
            style={{ backgroundColor: branding.primary_color, animationDelay: '0.1s' }}
          />
          <div 
            className="w-3 h-3 rounded-full animate-bounce"
            style={{ backgroundColor: branding.primary_color, animationDelay: '0.2s' }}
          />
        </div>
      </div>

      {/* Version info */}
      <div className="absolute bottom-8 text-sm text-gray-400">
        {t('splash.version')} • Powered by AI
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};
