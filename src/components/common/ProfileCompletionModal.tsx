
import React from 'react';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({ isOpen, onClose }) => {
  // Since we removed authentication, this modal is no longer needed
  // Return null as this component is not used in the simplified app
  return null;
};
