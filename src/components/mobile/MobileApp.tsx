
import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { RootState } from '@/store';
import { LanguageService } from '@/services/LanguageService';
import { setOnboardingCompleted } from '@/store/slices/authSlice';
import { PhoneAuthScreen } from '@/components/auth/PhoneAuthScreen';
import { tenantManager } from '@/services/TenantManager';
import { offlineManager } from '@/services/OfflineManager';
import { voiceService } from '@/services/VoiceService';
import { DEFAULT_TENANT_ID } from '@/config/constants';

import { MobileLayout } from './MobileLayout';
import { DashboardHome } from './DashboardHome';
import { MyLands } from '@/pages/mobile/MyLands';
import { AiChat } from '@/pages/mobile/AiChat';
import { CropSchedule } from '@/pages/mobile/CropSchedule';
import { Market } from '@/pages/mobile/Market';
import { Analytics } from '@/pages/mobile/Analytics';
import { Community } from '@/pages/mobile/Community';
import { Profile } from '@/pages/mobile/Profile';

export const MobileApp: React.FC = () => {
  const dispatch = useDispatch();
  const { loading: authLoading, isAuthenticated } = useCustomAuth();
  const { onboardingCompleted } = useSelector((state: RootState) => state.auth);
  const [appInitialized, setAppInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState({ pending: 0, errors: 0 });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('MobileApp: Starting comprehensive initialization...');
        
        // Initialize all services in parallel for better performance
        const initPromises = [
          tenantManager.initializeTenant(DEFAULT_TENANT_ID),
          offlineManager.initialize(),
          LanguageService.getInstance().initialize(),
          voiceService.initialize()
        ];

        const results = await Promise.allSettled(initPromises);
        
        // Log any initialization failures (non-critical)
        results.forEach((result, index) => {
          const services = ['TenantManager', 'OfflineManager', 'LanguageService', 'VoiceService'];
          if (result.status === 'rejected') {
            console.warn(`MobileApp: ${services[index]} initialization failed:`, result.reason);
          } else {
            console.log(`MobileApp: ${services[index]} initialized successfully`);
          }
        });

        // Apply saved language if available
        const savedLanguage = localStorage.getItem('selectedLanguage');
        if (savedLanguage) {
          try {
            await LanguageService.getInstance().changeLanguage(savedLanguage);
            console.log('MobileApp: Applied saved language:', savedLanguage);
          } catch (error) {
            console.error('MobileApp: Error applying saved language:', error);
          }
        }

        // Load voice settings
        voiceService.loadSettings();

        // Set up network status monitoring
        window.addEventListener('network-status-change', (event: any) => {
          setIsOnline(event.detail.isOnline);
        });

        // Set up sync status monitoring
        const updateSyncStatus = async () => {
          const status = await offlineManager.getSyncStatus();
          setSyncStatus(status);
        };

        // Update sync status every 10 seconds
        const syncStatusInterval = setInterval(updateSyncStatus, 10000);
        updateSyncStatus(); // Initial update

        // Clean up interval on unmount
        return () => {
          clearInterval(syncStatusInterval);
          tenantManager.cleanup();
          offlineManager.cleanup();
        };

        console.log('MobileApp: All services initialized successfully');
        setAppInitialized(true);
        setInitError(null);

      } catch (error) {
        console.error('MobileApp: Critical initialization error:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize app');
        
        // Still allow app to continue with basic functionality
        setAppInitialized(true);
      }
    };

    initializeApp();
  }, []);

  // Set up realtime listeners for UI updates
  useEffect(() => {
    const handleCropHealthUpdate = (event: any) => {
      console.log('MobileApp: Crop health update received:', event.detail);
      // You can dispatch to Redux or update local state here
    };

    const handleWeatherAlert = (event: any) => {
      console.log('MobileApp: Weather alert received:', event.detail);
      // Show notification or update UI
      if (voiceService.isSupported()) {
        voiceService.readWeatherAlert(event.detail.new?.title || 'New weather alert');
      }
    };

    window.addEventListener('tenant-realtime-crop_health', handleCropHealthUpdate);
    window.addEventListener('tenant-realtime-weather_alerts', handleWeatherAlert);

    return () => {
      window.removeEventListener('tenant-realtime-crop_health', handleCropHealthUpdate);
      window.removeEventListener('tenant-realtime-weather_alerts', handleWeatherAlert);
    };
  }, []);

  const handleAuthComplete = () => {
    dispatch(setOnboardingCompleted());
  };

  // Show loading while auth is being determined or app is initializing
  if (authLoading || !appInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authLoading ? 'Loading...' : 'Initializing KisanShakti AI...'}
          </p>
          {initError && (
            <p className="text-red-600 text-sm mt-2">
              Warning: {initError}
            </p>
          )}
          
          {/* Show sync status */}
          {(syncStatus.pending > 0 || syncStatus.errors > 0) && (
            <div className="mt-4 text-sm">
              <p className="text-blue-600">
                {syncStatus.pending > 0 && `${syncStatus.pending} items syncing...`}
              </p>
              <p className="text-red-600">
                {syncStatus.errors > 0 && `${syncStatus.errors} sync errors`}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show auth screen if user is not authenticated or hasn't completed onboarding
  if (!isAuthenticated || !onboardingCompleted) {
    return <PhoneAuthScreen onComplete={handleAuthComplete} />;
  }

  // User is authenticated and onboarded, show main app with routing
  return (
    <>
      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-orange-500 text-white text-center py-2 text-sm">
          You're offline. Changes will sync when connection is restored.
        </div>
      )}
      
      {/* Sync status indicator */}
      {(syncStatus.pending > 0 || syncStatus.errors > 0) && (
        <div className="bg-blue-500 text-white text-center py-1 text-xs">
          {syncStatus.pending > 0 && `Syncing ${syncStatus.pending} items... `}
          {syncStatus.errors > 0 && `${syncStatus.errors} sync errors`}
        </div>
      )}

      <MobileLayout>
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/my-lands" element={<MyLands />} />
          <Route path="/ai-chat" element={<AiChat />} />
          <Route path="/crop-schedule" element={<CropSchedule />} />
          <Route path="/market" element={<Market />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/community" element={<Community />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </MobileLayout>
    </>
  );
};
