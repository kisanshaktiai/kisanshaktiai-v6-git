
import React, { useState, useEffect } from 'react';
import { TenantDetectionService } from '@/services/TenantDetectionService';
import { applyTenantTheme } from '@/utils/tenantTheme';
import { Button } from '@/components/ui/button';
import { ChevronRight, Sparkles, Leaf, Zap } from 'lucide-react';

interface SkeletonSplashScreenProps {
  onComplete: () => void;
}

export const SkeletonSplashScreen: React.FC<SkeletonSplashScreenProps> = ({ onComplete }) => {
  const [loadingStage, setLoadingStage] = useState<'initializing' | 'detecting' | 'loading' | 'ready' | 'error'>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [tenantBranding, setTenantBranding] = useState({
    logo: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
    appName: 'KisanShakti AI',
    tagline: 'Your smart farming journey starts here',
    primaryColor: '#10b981',
    secondaryColor: '#059669'
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoadingStage('detecting');
        setProgress(20);

        // Initialize tenant detection with timeout
        const tenantService = TenantDetectionService.getInstance();
        
        setProgress(40);
        const tenant = await tenantService.detectTenant();
        
        if (!tenant) {
          throw new Error('No tenant configuration found');
        }

        setProgress(70);
        setLoadingStage('loading');

        // Apply tenant branding and theming
        if (tenant.branding) {
          const branding = {
            logo: tenant.branding.logo_url || tenantBranding.logo,
            appName: tenant.branding.app_name || tenant.name || tenantBranding.appName,
            tagline: tenant.branding.app_tagline || tenantBranding.tagline,
            primaryColor: tenant.branding.primary_color || tenantBranding.primaryColor,
            secondaryColor: tenant.branding.secondary_color || tenantBranding.secondaryColor
          };
          setTenantBranding(branding);

          // Apply tenant theme using the utility
          applyTenantTheme(tenant.branding);
          
          // Update page title
          if (tenant.branding.app_name) {
            document.title = tenant.branding.app_name;
          }
        }

        setProgress(100);
        setLoadingStage('ready');

      } catch (error) {
        console.error('Splash screen initialization failed:', error);
        setError(error instanceof Error ? error.message : 'Failed to load application');
        setLoadingStage('error');
        
        // Auto-retry after 3 seconds in case of network issues
        setTimeout(() => {
          setError(null);
          setLoadingStage('initializing');
          setProgress(0);
        }, 3000);
      }
    };

    // Start initialization after a brief moment
    const timer = setTimeout(initializeApp, 200);
    return () => clearTimeout(timer);
  }, [onComplete, loadingStage]);

  const getLoadingMessage = () => {
    switch (loadingStage) {
      case 'initializing':
        return 'Initializing application...';
      case 'detecting':
        return 'Detecting organization...';
      case 'loading':
        return 'Loading configuration...';
      case 'ready':
        return 'Ready to go!';
      case 'error':
        return error || 'Something went wrong. Retrying...';
      default:
        return 'Loading...';
    }
  };

  const handleContinue = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-green-400/20 rounded-full animate-pulse"
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
        <div className="absolute top-20 left-10 w-20 h-20 border border-green-400/15 rounded-full animate-float" 
             style={{ animationDelay: '0s' }} />
        <div className="absolute top-40 right-16 w-16 h-16 bg-gradient-to-br from-emerald-400/8 to-green-500/8 rounded-lg animate-float" 
             style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 left-20 w-12 h-12 border-2 border-emerald-400/10 rotate-45 animate-float" 
             style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-40 right-8 w-24 h-24 bg-gradient-to-r from-green-400/5 to-emerald-400/5 rounded-full animate-float" 
             style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Main Content Container with Glassmorphism */}
      <div className="min-h-screen flex flex-col items-center justify-center px-6 relative">
        <div className="backdrop-blur-lg bg-white/10 rounded-3xl border border-white/20 p-8 sm:p-12 shadow-2xl max-w-md w-full mx-auto">
          
          {/* Logo Section with Enhanced Animation */}
          <div className={`mb-8 text-center transition-all duration-1000 transform ${
            loadingStage !== 'initializing' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
          }`}>
            <div className="relative mb-6">
              <div className="w-28 h-28 sm:w-36 sm:h-36 mx-auto relative">
                <img 
                  src={tenantBranding.logo}
                  alt={tenantBranding.appName}
                  className="w-full h-full object-contain rounded-2xl shadow-2xl animate-breathe"
                  onError={(e) => {
                    e.currentTarget.src = '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png';
                  }}
                />
                {/* Dynamic glow effect using tenant colors */}
                <div 
                  className="absolute -inset-3 rounded-3xl blur-xl animate-pulse opacity-30"
                  style={{ backgroundColor: tenantBranding.primaryColor }}
                />
              </div>
            </div>
            
            {/* App Name with Staggered Animation */}
            <h1 className={`text-3xl sm:text-4xl font-bold text-white mb-3 transition-all duration-1000 delay-300 transform ${
              loadingStage !== 'initializing' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {tenantBranding.appName}
            </h1>
            
            {/* Tagline */}
            <p className={`text-sm sm:text-base text-gray-300 font-medium leading-relaxed transition-all duration-1000 delay-500 transform ${
              loadingStage !== 'initializing' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {tenantBranding.tagline}
            </p>
          </div>

          {/* 2025 Design Badge */}
          <div className={`mb-8 flex justify-center transition-all duration-1000 delay-700 transform ${
            loadingStage !== 'initializing' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div 
              className="inline-flex items-center space-x-2 backdrop-blur-sm border rounded-full px-4 py-2 shadow-lg"
              style={{ 
                backgroundColor: `${tenantBranding.primaryColor}20`,
                borderColor: `${tenantBranding.primaryColor}30`,
                color: tenantBranding.primaryColor
              }}
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">2025 Modern Design</span>
              <Zap className="w-4 h-4" />
            </div>
          </div>

          {/* Feature Icons with Tenant Colors */}
          <div className={`mb-8 flex justify-center space-x-6 transition-all duration-1000 delay-900 transform ${
            loadingStage !== 'initializing' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="flex flex-col items-center space-y-2">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center border backdrop-blur-sm"
                style={{ 
                  backgroundColor: `${tenantBranding.primaryColor}20`,
                  borderColor: `${tenantBranding.primaryColor}30`
                }}
              >
                <Leaf className="w-6 h-6" style={{ color: tenantBranding.primaryColor }} />
              </div>
              <span className="text-xs text-gray-400">Smart Farming</span>
            </div>
            
            <div className="flex flex-col items-center space-y-2">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center border backdrop-blur-sm"
                style={{ 
                  backgroundColor: `${tenantBranding.secondaryColor}20`,
                  borderColor: `${tenantBranding.secondaryColor}30`
                }}
              >
                <Zap className="w-6 h-6" style={{ color: tenantBranding.secondaryColor }} />
              </div>
              <span className="text-xs text-gray-400">AI Powered</span>
            </div>
            
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full flex items-center justify-center border border-purple-400/30 backdrop-blur-sm">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-xs text-gray-400">Premium Tech</span>
            </div>
          </div>

          {/* Enhanced Progress Section */}
          {loadingStage !== 'ready' && (
            <div className="mb-6">
              <div className="w-full bg-gray-700/50 rounded-full h-3 mb-4 overflow-hidden backdrop-blur-sm">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    loadingStage === 'error' ? 'bg-red-500' : 'bg-gradient-to-r'
                  }`}
                  style={{ 
                    width: `${progress}%`,
                    backgroundImage: loadingStage !== 'error' ? 
                      `linear-gradient(to right, ${tenantBranding.primaryColor}, ${tenantBranding.secondaryColor})` : 
                      undefined
                  }}
                />
              </div>
              
              {/* Loading Message with Better Typography */}
              <p className={`text-sm text-center font-medium ${
                loadingStage === 'error' ? 'text-red-400' : 'text-gray-300'
              }`}>
                {getLoadingMessage()}
              </p>
            </div>
          )}

          {/* Continue Button - Only Show When Ready */}
          {loadingStage === 'ready' && (
            <div className="text-center animate-fade-in" style={{ animationDelay: '1.1s' }}>
              <Button
                onClick={handleContinue}
                size="lg"
                className="group relative overflow-hidden text-white font-semibold px-8 py-4 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 transition-all duration-300 border-0 w-full sm:w-auto"
                style={{
                  background: `linear-gradient(to right, ${tenantBranding.primaryColor}, ${tenantBranding.secondaryColor})`,
                }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-base">Continue to {tenantBranding.appName.split(' ')[0]}</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
                
                {/* Animated shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              </Button>
            </div>
          )}
          
          {/* Enhanced Loading Animation */}
          {loadingStage !== 'error' && loadingStage !== 'ready' && (
            <div className="flex justify-center space-x-2">
              <div 
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: tenantBranding.primaryColor }}
              ></div>
              <div 
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ 
                  backgroundColor: tenantBranding.primaryColor,
                  animationDelay: '0.1s' 
                }}
              ></div>
              <div 
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ 
                  backgroundColor: tenantBranding.primaryColor,
                  animationDelay: '0.2s' 
                }}
              ></div>
            </div>
          )}

          {/* Enhanced Error State */}
          {loadingStage === 'error' && (
            <div className="mt-4 text-center">
              <div className="w-8 h-8 bg-red-500/20 border border-red-500/30 rounded-full mx-auto animate-pulse flex items-center justify-center mb-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
              <p className="text-xs text-gray-400 mb-2">
                Network issue detected. Retrying automatically...
              </p>
              <div className="w-16 h-1 bg-red-500/30 rounded-full mx-auto overflow-hidden">
                <div className="w-full h-full bg-red-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}
        </div>

        {/* Modern Footer */}
        <div className="absolute bottom-6 text-center w-full">
          <div className="text-xs text-gray-400 backdrop-blur-sm bg-white/5 rounded-full px-4 py-2 inline-block">
            v1.0.0 • Multi-Tenant Platform • Powered by {tenantBranding.appName}
          </div>
        </div>
      </div>
    </div>
  );
};
