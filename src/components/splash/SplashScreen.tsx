
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
  const [currentLogo, setCurrentLogo] = useState('kisanshakti'); // 'kisanshakti' or 'tenant'
  const [tenantBranding, setTenantBranding] = useState({
    logo: '/lovable-uploads/180cdfdf-9869-4c78-ace0-fdb76e9273b4.png',
    appName: 'KisanShaktiAI',
    tagline: 'Intelligent Guru for Farmers',
    primaryColor: '#4D7C0F',
    backgroundColor: '#FFFFFF'
  });

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Step 1: Show KisanShaktiAI logo first
      setStatus('Loading KisanShaktiAI...');
      setProgress(10);
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Show for 1.5 seconds

      // Step 2: Initialize services
      setStatus('Loading services...');
      setProgress(25);
      
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 3: Detect tenant
      setStatus('Detecting organization...');
      setProgress(40);
      
      const detectedTenant = await TenantDetectionService.getInstance().detectTenant();
      if (detectedTenant) {
        dispatch(setTenantId(detectedTenant.id));
        
        // Update branding with tenant-specific data
        setTenantBranding({
          logo: detectedTenant.branding?.logo_url || '/lovable-uploads/180cdfdf-9869-4c78-ace0-fdb76e9273b4.png',
          appName: detectedTenant.branding?.app_name || 'KisanShaktiAI',
          tagline: detectedTenant.branding?.app_tagline || 'Intelligent Guru for Farmers',
          primaryColor: detectedTenant.branding?.primary_color || '#4D7C0F',
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

  const getCurrentLogo = () => {
    if (currentLogo === 'kisanshakti') {
      return '/lovable-uploads/180cdfdf-9869-4c78-ace0-fdb76e9273b4.png';
    }
    return tenantBranding.logo;
  };

  const getCurrentAppName = () => {
    if (currentLogo === 'kisanshakti') {
      return 'KisanShaktiAI';
    }
    return tenantBranding.appName;
  };

  const getCurrentTagline = () => {
    if (currentLogo === 'kisanshakti') {
      return 'Intelligent Guru for Farmers';
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
        <p className="text-gray-600 text-base transition-all duration-500">
          {getCurrentTagline()}
        </p>
      </div>

      {/* Progress Indicator */}
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

      {/* Version Info */}
      <div className="absolute bottom-6 text-sm text-gray-400">
        v6.0.0 • Tenant Ready • Offline Capable
      </div>
    </div>
  );
};
