
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireOnboarding = true 
}) => {
  const { isAuthenticated, loading } = useCustomAuth();
  const { onboardingCompleted } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  // Show loading spinner while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If not authenticated, redirect to auth
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If authentication is required but onboarding is not completed
  if (requireOnboarding && !onboardingCompleted) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
