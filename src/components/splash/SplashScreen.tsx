
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setTenantId } from '@/store/slices/farmerSlice';
import { LocationService } from '@/services/LocationService';
import { TenantDetectionService } from '@/services/TenantDetectionService';
import { ChevronRight, Sparkles, Leaf, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [isLoaded, setIsLoaded] = useState(false);
  const [tenantBranding, setTenantBranding] = useState({
    logo: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
    appName: 'KisanShakti AI',
    tagline: 'AI-Powered Agricultural Intelligence Platform',
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    backgroundColor: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
  });

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Starting app initialization...');
      
      // Initialize location services
      try {
        const locationService = LocationService.getInstance();
        await locationService.getCurrentLocation();
        console.log('Location service initialized');
      } catch (locationError) {
        console.warn('Location service failed, continuing without location:', locationError);
      }

      // Detect tenant with error handling
      let detectedTenant = null;
      try {
        const tenantService = TenantDetectionService.getInstance();
        await tenantService.clearCache();
        detectedTenant = await tenantService.detectTenant();
        console.log('Tenant detected:', detectedTenant);
      } catch (tenantError) {
        console.warn('Tenant detection failed, using default:', tenantError);
      }

      // Set up branding
      if (detectedTenant?.branding) {
        const branding = detectedTenant.branding;
        setTenantBranding({
          logo: branding.logo_url || tenantBranding.logo,
          appName: branding.app_name || detectedTenant.name || tenantBranding.appName,
          tagline: branding.app_tagline || tenantBranding.tagline,
          primaryColor: branding.primary_color || tenantBranding.primaryColor,
          secondaryColor: branding.secondary_color || tenantBranding.secondaryColor,
          backgroundColor: branding.background_color ? `linear-gradient(135deg, ${branding.background_color}, #1e293b)` : tenantBranding.backgroundColor
        });
        console.log('Custom branding applied');
      }

      if (detectedTenant?.id) {
        dispatch(setTenantId(detectedTenant.id));
      }

      // Mark as loaded after initialization
      setTimeout(() => {
        setIsLoaded(true);
      }, 1000);

    } catch (error) {
      console.error('Splash initialization error:', error);
      // Continue anyway and show button
      setIsLoaded(true);
    }
  };

  const handleContinue = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-green-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 border border-green-400/20 rounded-full animate-float" 
             style={{ animationDelay: '0s' }} />
        <div className="absolute top-40 right-16 w-16 h-16 bg-gradient-to-br from-emerald-400/10 to-green-500/10 rounded-lg animate-float" 
             style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 left-20 w-12 h-12 border-2 border-emerald-400/15 rotate-45 animate-float" 
             style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-40 right-8 w-24 h-24 bg-gradient-to-r from-green-400/5 to-emerald-400/5 rounded-full animate-float" 
             style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Glassmorphism Container */}
      <div className="min-h-screen flex flex-col items-center justify-center px-6 relative">
        <div className="backdrop-blur-sm bg-white/5 rounded-3xl border border-white/10 p-8 sm:p-12 shadow-2xl max-w-md w-full mx-auto">
          
          {/* Logo Section */}
          <div className={`mb-8 text-center transition-all duration-1000 transform ${
            isLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
          }`}>
            <div className="relative mb-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto relative">
                <img 
                  src={tenantBranding.logo}
                  alt={tenantBranding.appName}
                  className="w-full h-full object-contain rounded-2xl shadow-2xl animate-breathe"
                  onError={(e) => {
                    e.currentTarget.src = '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png';
                  }}
                />
                {/* Logo glow effect */}
                <div className="absolute -inset-2 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-3xl blur-lg animate-pulse" />
              </div>
            </div>
            
            {/* App Name with staggered animation */}
            <h1 className={`text-3xl sm:text-4xl font-bold text-white mb-3 transition-all duration-1000 delay-300 transform ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {tenantBranding.appName}
            </h1>
            
            {/* Tagline */}
            <p className={`text-sm sm:text-base text-gray-300 font-medium leading-relaxed transition-all duration-1000 delay-500 transform ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {tenantBranding.tagline}
            </p>
          </div>

          {/* 2025 Design Badge */}
          <div className={`mb-8 flex justify-center transition-all duration-1000 delay-700 transform ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 text-green-300 px-4 py-2 rounded-full shadow-lg">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">2025 Modern Design</span>
              <Zap className="w-4 h-4" />
            </div>
          </div>

          {/* Feature Icons */}
          <div className={`mb-8 flex justify-center space-x-6 transition-all duration-1000 delay-900 transform ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full flex items-center justify-center border border-green-400/30">
                <Leaf className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-xs text-gray-400">Smart Farming</span>
            </div>
            
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 rounded-full flex items-center justify-center border border-blue-400/30">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-xs text-gray-400">AI Powered</span>
            </div>
            
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full flex items-center justify-center border border-purple-400/30">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-xs text-gray-400">Premium Tech</span>
            </div>
          </div>

          {/* Continue Button */}
          {isLoaded && (
            <div className="text-center animate-fade-in" style={{ animationDelay: '1.1s' }}>
              <Button
                onClick={handleContinue}
                size="lg"
                className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-8 py-4 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 transition-all duration-300 border-0 w-full sm:w-auto"
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-base">Continue to KisanShakti</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
                
                {/* Animated shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                
                {/* Subtle pulse ring */}
                <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" />
              </Button>
            </div>
          )}
          
          {/* Loading indicator when not ready */}
          {!isLoaded && (
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 text-gray-400">
                <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Initializing your farming companion...</span>
              </div>
            </div>
          )}
        </div>

        {/* Version Info */}
        <div className="absolute bottom-6 text-center w-full">
          <div className="text-xs text-gray-500">
            v1.0.0 • Multi-Tenant SaaS Platform • {t('common.powered_by', { defaultValue: 'Powered by' })} KisanShakti AI
          </div>
        </div>
      </div>
    </div>
  );
};
