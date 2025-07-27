import React from 'react';

interface ProfileCompletionGuardProps {
  children: React.ReactNode;
}

// This component is no longer needed as we've moved to feature-level locking
// Keeping it as a simple passthrough to avoid breaking existing imports
export const ProfileCompletionGuard: React.FC<ProfileCompletionGuardProps> = ({ children }) => {
  return <>{children}</>;
};
