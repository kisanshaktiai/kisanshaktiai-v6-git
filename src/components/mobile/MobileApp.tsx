
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RootState } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/context/TenantContext';
import { setAuthenticated, setOnboardingCompleted } from '@/store/slices/authSlice';
import { useLocationDetection } from '@/hooks/useLocationDetection';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import MobileHome from '@/pages/mobile/MobileHome';
import { MyLands } from '@/pages/mobile/MyLands';
import { AiChat } from '@/pages/mobile/AiChat';
import { CropSchedule } from '@/pages/mobile/CropSchedule';
import { Market } from '@/pages/mobile/Market';
import Weather from '@/pages/mobile/Weather';
import { Analytics } from '@/pages/mobile/Analytics';
import { Profile } from '@/pages/mobile/Profile';
import { Community } from '@/pages/mobile/Community';
import { InstaScan } from '@/pages/mobile/InstaScan';
import SatelliteMonitoring from '@/pages/mobile/SatelliteMonitoring';
import { ProfessionalFarmerProfileForm } from '@/components/mobile/profile/ProfessionalFarmerProfileForm';

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
    
    // If user has a profile, mark onboarding as completed
    if (user && profile && !onboardingCompleted) {
      dispatch(setOnboardingCompleted());
    }
  }, [user, profile, reduxIsAuthenticated, onboardingCompleted, dispatch]);

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

  // Show profile setup if authenticated but no profile
  if (isAuthenticated && !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Routes>
          <Route 
            path="*" 
            element={
              <ProfessionalFarmerProfileForm 
                onComplete={() => {
                  dispatch(setOnboardingCompleted());
                  window.location.reload();
                }} 
                onBack={() => {}} 
              />
            } 
          />
        </Routes>
      </div>
    );
  }

  // Show main app
  return (
    <div className="min-h-screen bg-background">
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
    </div>
  );
};
