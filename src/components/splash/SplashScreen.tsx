
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setTenantId } from '@/store/slices/farmerSlice';
import { LocationService } from '@/services/LocationService';
import { TenantDetectionService } from '@/services/TenantDetectionService';
import { Loader } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const dispatch = useDispatch();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing...');
  const [tenantBranding, setTenantBranding] = useState({
    logo: '/placeholder.svg',
    appName: 'KisanShaktiAI V6',
    tagline: 'Empowering Farmers with AI',
    primaryColor: '#10B981',
    backgroundColor: '#FFFFFF'
  });

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Step 1: Initialize services
      setStatus('Loading services...');
      setProgress(20);
      
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 2: Detect tenant
      setStatus('Detecting organization...');
      setProgress(40);
      
      const detectedTenant = await TenantDetectionService.getInstance().detectTenant();
      if (detectedTenant) {
        dispatch(setTenantId(detectedTenant.id));
        setTenantBranding({
          logo: detectedTenant.branding?.logo_url || '/placeholder.svg',
          appName: detectedTenant.branding?.app_name || 'KisanShaktiAI V6',
          tagline: detectedTenant.branding?.app_tagline || 'Empowering Farmers with AI',
          primaryColor: detectedTenant.branding?.primary_color || '#10B981',
          backgroundColor: detectedTenant.branding?.background_color || '#FFFFFF'
        });
      }

      setProgress(60);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 3: Prepare location services
      setStatus('Preparing location services...');
      setProgress(80);
      
      try {
        await LocationService.getInstance().requestPermissions();
      } catch (error) {
        console.log('Location permission not granted, will prompt later');
      }

      setProgress(100);
      setStatus('Ready!');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      onComplete();

    } catch (error) {
      console.error('Splash initialization error:', error);
      // Continue anyway
      setTimeout(onComplete, 1000);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: tenantBranding.backgroundColor }}
    >
      {/* Logo and Branding */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white shadow-lg flex items-center justify-center">
          <img 
            src={tenantBranding.logo} 
            alt="Logo" 
            className="w-16 h-16 object-contain"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        </div>
        <h1 
          className="text-2xl font-bold mb-2"
          style={{ color: tenantBranding.primaryColor }}
        >
          {tenantBranding.appName}
        </h1>
        <p className="text-gray-600 text-sm">
          {tenantBranding.tagline}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="w-full max-w-xs mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-300 ease-out"
            style={{ 
              width: `${progress}%`,
              backgroundColor: tenantBranding.primaryColor 
            }}
          />
        </div>
      </div>

      {/* Status Text */}
      <div className="flex items-center space-x-2 text-gray-600">
        <Loader className="w-4 h-4 animate-spin" />
        <span className="text-sm">{status}</span>
      </div>

      {/* Version Info */}
      <div className="absolute bottom-4 text-xs text-gray-400">
        v6.0.0 • Offline Ready
      </div>
    </div>
  );
};
