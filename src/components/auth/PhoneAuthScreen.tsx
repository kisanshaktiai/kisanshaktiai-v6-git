
import React from 'react';
import { EnhancedPhoneAuthScreen } from './EnhancedPhoneAuthScreen';

interface PhoneAuthScreenProps {
  onComplete: () => void;
}

export const PhoneAuthScreen: React.FC<PhoneAuthScreenProps> = ({ onComplete }) => {
  return <EnhancedPhoneAuthScreen onComplete={onComplete} />;
};
