
import React from 'react';
import { PhoneAuthScreen } from '@/components/auth/PhoneAuthScreen';

interface AuthScreenProps {
  onComplete: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onComplete }) => {
  return <PhoneAuthScreen onComplete={onComplete} />;
};
