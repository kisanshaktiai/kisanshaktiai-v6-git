
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { setOnboardingCompleted } from '@/store/slices/authSlice';
import { setProfile } from '@/store/slices/farmerSlice';
import { User } from 'lucide-react';

interface ProfileScreenProps {
  onNext: () => void;
  onPrev: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNext, onPrev }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!name.trim()) return;

    setLoading(true);
    try {
      // Create basic profile
      const profile = {
        id: `farmer_${Date.now()}`,
        name: name.trim(),
        phone_number: '', // Will be set from auth state
        tenant_id: null,
        location: null,
        language_preference: 'hi',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      dispatch(setProfile(profile as any));
      dispatch(setOnboardingCompleted());
      
      // Navigate to main app
      onNext();
    } catch (error) {
      console.error('Profile setup error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            Tell us your name to get started
          </p>
        </div>

        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-center text-lg py-3"
          />
          
          <Button 
            onClick={handleComplete}
            disabled={!name.trim() || loading}
            className="w-full py-3 text-lg"
            size="lg"
          >
            {loading ? t('common.loading') : 'Complete Setup'}
          </Button>
        </div>

        <Button 
          variant="ghost" 
          onClick={onPrev}
          className="w-full"
        >
          Back
        </Button>
      </div>
    </div>
  );
};
