import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useTenantContext } from '@/hooks/useTenantContext';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const { farmer, userProfile, loading: authLoading, isAuthenticated } = useCustomAuth();
  const { tenantData, loading: tenantLoading } = useTenantContext();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash for at least 2 seconds
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    // Don't redirect while still loading or showing splash
    if (authLoading || tenantLoading || showSplash) {
      return;
    }

    // If user is authenticated and has complete profile, go to mobile app
    if (isAuthenticated && farmer && userProfile?.full_name) {
      navigate('/mobile', { replace: true });
    } else {
      // Otherwise, start onboarding flow
      navigate('/onboarding', { replace: true });
    }
  }, [authLoading, tenantLoading, showSplash, isAuthenticated, farmer, userProfile, navigate]);

  const appName = tenantData?.branding?.app_name || 'KisanShakti AI';
  const appTagline = tenantData?.branding?.app_tagline || 'Empowering Farmers with AI Technology';
  const logoUrl = tenantData?.branding?.logo_url || '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center">
          <img 
            src={logoUrl} 
            alt={appName}
            className="h-24 w-24 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png';
            }}
          />
        </div>

        {/* App Name */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight">
            {appName}
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            {appTagline}
          </p>
        </div>

        {/* Loading Animation */}
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>

        {/* Version or Copyright */}
        <div className="absolute bottom-8 text-center">
          <p className="text-sm text-gray-500">
            © 2024 {appName}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
