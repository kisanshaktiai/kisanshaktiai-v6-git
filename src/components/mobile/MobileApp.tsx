
import React, { useEffect, lazy, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RootState } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/context/TenantContext';
import { setAuthenticated, setOnboardingCompleted } from '@/store/slices/authSlice';
import { useLocationDetection } from '@/hooks/useLocationDetection';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

// Lazy load route components for better performance
const MobileHome = lazy(() => import('@/pages/mobile/MobileHome'));
const MyLands = lazy(() => import('@/pages/mobile/MyLands').then(m => ({ default: m.MyLands })));
const AiChat = lazy(() => import('@/pages/mobile/AiChat').then(m => ({ default: m.AiChat })));
const CropSchedule = lazy(() => import('@/pages/mobile/CropSchedule').then(m => ({ default: m.CropSchedule })));
const Market = lazy(() => import('@/pages/mobile/Market').then(m => ({ default: m.Market })));
const Weather = lazy(() => import('@/pages/mobile/Weather'));
const Analytics = lazy(() => import('@/pages/mobile/Analytics').then(m => ({ default: m.Analytics })));
const Profile = lazy(() => import('@/pages/mobile/Profile').then(m => ({ default: m.Profile })));
const Community = lazy(() => import('@/pages/mobile/Community').then(m => ({ default: m.Community })));
const InstaScan = lazy(() => import('@/pages/mobile/InstaScan').then(m => ({ default: m.InstaScan })));
const SatelliteMonitoring = lazy(() => import('@/pages/mobile/SatelliteMonitoring'));

export const MobileApp: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated: reduxIsAuthenticated, onboardingCompleted } = useSelector((state: RootState) => state.auth);
  const { isAuthenticated: contextIsAuthenticated, user, profile } = useAuth();
  const { user: tenantUser } = useTenant();
  
  // Use the most reliable source of authentication
  const isAuthenticated = contextIsAuthenticated || reduxIsAuthenticated || !!user || !!tenantUser;
  
  // Initialize location detection
  const { location, loading: locationLoading, error: locationError } = useLocationDetection();

  // Sync auth state between contexts
  useEffect(() => {
    if (user && !reduxIsAuthenticated) {
      dispatch(setAuthenticated({ userId: user.id, phoneNumber: user.phone }));
    }
    
    // Mark onboarding as completed when user is authenticated (no profile requirement)
    if (user && !onboardingCompleted) {
      dispatch(setOnboardingCompleted());
    }
  }, [user, reduxIsAuthenticated, onboardingCompleted, dispatch]);

  useEffect(() => {
    console.log('MobileApp: Location state updated:', { location, locationLoading, locationError });
  }, [location, locationLoading, locationError]);

  useEffect(() => {
    console.log('Auth state:', { 
      isAuthenticated, 
      onboardingCompleted, 
      contextAuth: contextIsAuthenticated,
      reduxAuth: reduxIsAuthenticated,
      hasUser: !!user,
      hasTenantUser: !!tenantUser,
      hasProfile: !!profile 
    });
  }, [isAuthenticated, onboardingCompleted, contextIsAuthenticated, reduxIsAuthenticated, user, tenantUser, profile]);

  // Show onboarding if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="*" element={<OnboardingFlow />} />
        </Routes>
      </div>
    );
  }

  // Show main app immediately after authentication (no profile gate)
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<MobileHome />} />
          <Route path="/my-lands" element={<MyLands />} />
          <Route path="/ai-chat" element={<AiChat />} />
          <Route path="/crop-schedule" element={<CropSchedule />} />
          <Route path="/market" element={<Market />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/community" element={<Community />} />
          <Route path="/instascan" element={<InstaScan />} />
          <Route path="/satellite-monitoring" element={<SatelliteMonitoring />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
};
