
import React from 'react';
import { CustomMobileAuthScreen } from '@/components/auth/CustomMobileAuthScreen';

interface AuthScreenProps {
  onComplete: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onComplete }) => {
  return <CustomMobileAuthScreen onComplete={onComplete} />;
};
