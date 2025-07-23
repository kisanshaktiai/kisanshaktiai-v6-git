
import React from 'react';

interface ProfileCompletionGuardProps {
  children: React.ReactNode;
}

export const ProfileCompletionGuard: React.FC<ProfileCompletionGuardProps> = ({ children }) => {
  // Since we removed authentication, this guard just passes through children
  // In the future, if authentication is re-added, this component can be restored
  return <>{children}</>;
};
