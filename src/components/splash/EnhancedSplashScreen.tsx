import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Loader } from 'lucide-react';
import { tenantCacheService } from '@/services/TenantCacheService';
import { setCurrentTenant, setTenantBranding, setTenantFeatures } from '@/store/slices/tenantSlice';

interface EnhancedSplashScreenProps {
  onComplete: () => void;
}

export const EnhancedSplashScreen: React.FC<EnhancedSplashScreenProps> = ({ onComplete }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [branding, setBranding] = useState({
    primaryColor: '#8BC34A',
    logo: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
    appName: 'KisanShakti AI',
    tagline: 'INTELLIGENT AI GURU FOR FARMERS'
  });

  const initSteps = [
    { key: 'initializing', duration: 800 },
    { key: 'loading_tenant_data', duration: 1000 },
    { key: 'loading_branding', duration: 600 },
    { key: 'preparing_services', duration: 400 },
    { key: 'finalizing', duration: 200 }
  ];

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      for (let i = 0; i < initSteps.length; i++) {
        const step = initSteps[i];
        setCurrentStep(i);
        setStatus(t(`splash.${step.key}`));
        
        // Load tenant data during the tenant data step
        if (step.key === 'loading_tenant_data') {
          await loadTenantData();
        }
        
        // Animate progress
        const startProgress = (i / initSteps.length) * 100;
        const endProgress = ((i + 1) / initSteps.length) * 100;
        
        await animateProgress(startProgress, endProgress, step.duration);
        
        // Small delay between steps
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setStatus(t('common.ready'));
      
      // Final delay before completing
      await new Promise(resolve => setTimeout(resolve, 300));
      onComplete();

    } catch (error) {
      console.error('Splash initialization error:', error);
      // Continue anyway after a short delay
      setTimeout(onComplete, 1000);
    }
  };

  const loadTenantData = async () => {
    try {
      console.log('Loading tenant data...');
      const tenantData = await tenantCacheService.loadTenantData();
      
      if (tenantData) {
        // Update Redux store with tenant data
        dispatch(setCurrentTenant({
          id: tenantData.id,
          name: tenantData.name,
          slug: 'default',
          type: 'default' as any,
          status: 'active' as any,
          subscription_plan: 'basic' as any,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        dispatch(setTenantBranding(tenantData.branding));
        dispatch(setTenantFeatures(tenantData.features));
        
        // Update local branding state for the splash screen
        setBranding({
          primaryColor: tenantData.branding.primary_color,
          logo: tenantData.branding.logo_url,
          appName: tenantData.branding.app_name,
          tagline: tenantData.branding.app_tagline
        });
        
        console.log('Tenant data loaded and cached successfully');
      }
    } catch (error) {
      console.error('Error loading tenant data:', error);
      // Continue with default branding
    }
  };

  const animateProgress = (start: number, end: number, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const progressDiff = end - start;
      
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progressRatio = Math.min(elapsed / duration, 1);
        const currentProgress = start + (progressDiff * progressRatio);
        
        setProgress(Math.round(currentProgress));
        
        if (progressRatio < 1) {
          requestAnimationFrame(updateProgress);
        } else {
          resolve();
        }
      };
      
      updateProgress();
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-20 h-20 rounded-full"
             style={{ backgroundColor: branding.primaryColor }}></div>
        <div className="absolute top-40 right-16 w-12 h-12 rounded-full"
             style={{ backgroundColor: branding.primaryColor }}></div>
        <div className="absolute bottom-32 left-20 w-16 h-16 rounded-full"
             style={{ backgroundColor: branding.primaryColor }}></div>
        <div className="absolute bottom-10 right-10 w-8 h-8 rounded-full"
             style={{ backgroundColor: branding.primaryColor }}></div>
      </div>

      {/* Logo and Branding */}
      <div className="text-center mb-12 z-10">
        <div className="relative mb-8">
          {/* Animated rings around logo */}
          <div className="absolute inset-0 w-40 h-40 rounded-full border-4 opacity-20 animate-ping"
               style={{ borderColor: branding.primaryColor }}></div>
          <div className="absolute inset-2 w-36 h-36 rounded-full border-2 opacity-40 animate-pulse"
               style={{ borderColor: branding.primaryColor }}></div>
          
          {/* Logo container */}
          <div className="w-40 h-40 mx-auto rounded-full bg-white shadow-2xl flex items-center justify-center relative z-10 border-4"
               style={{ borderColor: `${branding.primaryColor}20` }}>
            <img 
              src={branding.logo} 
              alt={branding.appName} 
              className="w-28 h-28 object-contain transition-all duration-500"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          </div>
        </div>

        {/* App Name */}
        <h1 className="text-4xl font-bold mb-4 transition-all duration-500"
            style={{ color: branding.primaryColor }}>
          {branding.appName}
        </h1>
        
        {/* Tagline */}
        <p className="text-gray-600 text-xl font-medium transition-all duration-500 px-4 leading-relaxed">
          {branding.tagline}
        </p>
      </div>

      {/* Progress Section */}
      <div className="w-full max-w-sm mb-8 z-10">
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden shadow-inner">
          <div 
            className="h-4 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
            style={{ 
              width: `${progress}%`,
              backgroundColor: branding.primaryColor 
            }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
          </div>
        </div>

        {/* Progress Percentage */}
        <div className="text-center mb-4">
          <span className="text-2xl font-bold" style={{ color: branding.primaryColor }}>
            {progress}%
          </span>
          <span className="text-gray-500 ml-2">{t('splash.complete')}</span>
        </div>
      </div>

      {/* Status Text */}
      <div className="flex items-center space-x-3 text-gray-600 mb-12 z-10">
        <Loader 
          className="w-6 h-6 animate-spin" 
          style={{ color: branding.primaryColor }} 
        />
        <span className="text-lg font-medium">{status}</span>
        <div className="flex space-x-1">
          <div className="w-2 h-2 rounded-full animate-bounce"
               style={{ backgroundColor: branding.primaryColor, animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 rounded-full animate-bounce"
               style={{ backgroundColor: branding.primaryColor, animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 rounded-full animate-bounce"
               style={{ backgroundColor: branding.primaryColor, animationDelay: '300ms' }}></div>
        </div>
      </div>

      {/* Version Info */}
      <div className="absolute bottom-8 text-sm text-gray-400 z-10">
        {t('splash.version')} {t('splash.powered_by_ai')}
      </div>
    </div>
  );
};
