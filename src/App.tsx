
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { MobileApp } from '@/components/mobile/MobileApp';
import { NotFound } from '@/components/ui/NotFound';
import { useAuth } from '@/contexts/AuthContext';
import { setTenantId } from '@/store/slices/authSlice';
import { TenantService } from '@/services/TenantService';
import { useTenantContext } from '@/hooks/useTenantContext';

function App() {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading: loadingAuth } = useAuth();
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
        // Fix: access id via tenant property if it exists
        if (tenantData && tenantData.tenant && tenantData.tenant.id) {
          dispatch(setTenantId(tenantData.tenant.id));
        }
      } catch (error) {
        console.error("Error initializing tenant:", error);
      }
    };

    initializeTenant();
  }, [i18n, dispatch]);

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="loading loading-dots loading-lg"></span>
      </div>
    );
  }
  
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={
          isAuthenticated && onboardingCompleted ? (
            <Navigate to="/mobile" replace />
          ) : (
            <Navigate to="/onboarding" replace />
          )
        } />
        
        <Route path="/onboarding" element={
          isAuthenticated && onboardingCompleted ? (
            <Navigate to="/mobile" replace />
          ) : (
            <OnboardingFlow />
          )
        } />

        {/* Protected routes */}
        <Route path="/mobile/*" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} onboardingCompleted={onboardingCompleted}>
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
