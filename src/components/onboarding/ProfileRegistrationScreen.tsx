
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { setOnboardingCompleted } from '@/store/slices/authSlice';
import { setProfile } from '@/store/slices/farmerSlice';
import { LanguageService } from '@/services/LanguageService';
import { User, Calendar, Briefcase, Loader, Languages } from 'lucide-react';

interface ProfileRegistrationScreenProps {
  onNext: () => void;
  onPrev: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  onComplete?: () => void;
}

export const ProfileRegistrationScreen: React.FC<ProfileRegistrationScreenProps> = ({ 
  onNext, 
  onPrev 
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  
  // Get selected language from localStorage (set during onboarding)
  const savedLanguage = localStorage.getItem('selectedLanguage') || 'hi';
  
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    dateOfBirth: '',
    primaryOccupation: '',
    aadhaarNumber: '',
    preferredLanguage: savedLanguage
  });

  const languageService = LanguageService.getInstance();
  const supportedLanguages = languageService.getSupportedLanguages();

  useEffect(() => {
    // Ensure the language preference matches what was selected during onboarding
    if (savedLanguage && savedLanguage !== formData.preferredLanguage) {
      setFormData(prev => ({
        ...prev,
        preferredLanguage: savedLanguage
      }));
    }
  }, [savedLanguage]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleComplete = async () => {
    if (!formData.fullName || !formData.gender || !formData.primaryOccupation) {
      return;
    }

    setLoading(true);
    try {
      // Create profile object with language preference
      const profile = {
        id: `farmer_${Date.now()}`,
        name: formData.fullName,
        gender: formData.gender,
        date_of_birth: formData.dateOfBirth || null,
        primary_occupation: formData.primaryOccupation,
        aadhaar_number: formData.aadhaarNumber || null,
        phone_number: '', // Will be set from auth state
        tenant_id: null,
        location: null,
        language_preference: formData.preferredLanguage,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      dispatch(setProfile(profile as any));
      dispatch(setOnboardingCompleted());
      
      // Ensure language preference is applied
      if (formData.preferredLanguage !== savedLanguage) {
        await languageService.changeLanguage(formData.preferredLanguage);
        localStorage.setItem('selectedLanguage', formData.preferredLanguage);
        localStorage.setItem('languageSelectedAt', new Date().toISOString());
      }
      
      // Navigate to dashboard
      onNext();
    } catch (error) {
      console.error('Profile setup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.fullName && formData.gender && formData.primaryOccupation;

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
            Help us personalize your experience
          </p>
        </div>

        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <Input
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className="w-full"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender *
            </label>
            <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <Input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className="w-full"
            />
          </div>

          {/* Primary Occupation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Occupation *
            </label>
            <Select value={formData.primaryOccupation} onValueChange={(value) => handleInputChange('primaryOccupation', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select occupation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="farmer">Farmer</SelectItem>
                <SelectItem value="dealer">Dealer</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="extension_officer">Extension Officer</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preferred Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Languages className="w-4 h-4 inline mr-1" />
              Preferred Language
            </label>
            <Select 
              value={formData.preferredLanguage} 
              onValueChange={(value) => handleInputChange('preferredLanguage', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.nativeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              This was selected during registration. You can change it anytime in settings.
            </p>
          </div>

          {/* Aadhaar Number (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aadhaar Number (Optional)
            </label>
            <Input
              type="text"
              placeholder="XXXX XXXX XXXX"
              value={formData.aadhaarNumber}
              onChange={(e) => handleInputChange('aadhaarNumber', e.target.value)}
              className="w-full"
              maxLength={14}
            />
            <p className="text-xs text-gray-500 mt-1">
              For government schemes and insurance
            </p>
          </div>
          
          <Button 
            onClick={handleComplete}
            disabled={!isFormValid || loading}
            className="w-full py-3 text-lg"
            size="lg"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Creating Profile...</span>
              </div>
            ) : (
              'Complete Setup'
            )}
          </Button>
        </div>

        <Button 
          variant="ghost" 
          onClick={onPrev}
          className="w-full"
          disabled={loading}
        >
          Back
        </Button>
      </div>
    </div>
  );
};
