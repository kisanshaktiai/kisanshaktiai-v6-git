
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { MobileApp } from '@/components/mobile/MobileApp';
import { SplashScreen } from '@/components/splash/SplashScreen';
import { NotFound } from '@/components/ui/NotFound';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { setTenantId } from '@/store/slices/authSlice';
import { TenantService } from '@/services/TenantService';
import { useTenantContext } from '@/hooks/useTenantContext';

function App() {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { farmer, userProfile, loading: loadingAuth, isAuthenticated } = useCustomAuth();
  const { onboardingCompleted } = useSelector((state: any) => state.auth);
  const { tenantData, loading: loadingTenant } = useTenantContext();

  useEffect(() => {
    const storedLanguage = localStorage.getItem('selectedLanguage');
    if (storedLanguage) {
      i18n.changeLanguage(storedLanguage);
    }

    const initializeTenant = async () => {
      try {
        const tenantData = await TenantService.getInstance().getTenantData();
        if (tenantData && tenantData.tenant && tenantData.tenant.id) {
          dispatch(setTenantId(tenantData.tenant.id));
        }
      } catch (error) {
        console.error("Error initializing tenant:", error);
      }
    };

    initializeTenant();
  }, [i18n, dispatch]);

  const handleOnboardingComplete = () => {
    console.log('App: Onboarding completed');
    navigate('/mobile');
  };

  // Check authentication and profile completion status
  const isProfileComplete = farmer && userProfile && userProfile.full_name;

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        
        <Route path="/onboarding" element={
          <OnboardingFlow onComplete={handleOnboardingComplete} />
        } />

        {/* Protected routes */}
        <Route path="/mobile/*" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} onboardingCompleted={isProfileComplete}>
            <MobileApp />
          </ProtectedRoute>
        } />

        {/* Fallback routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
