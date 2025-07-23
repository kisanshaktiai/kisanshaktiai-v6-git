
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { setOnboardingCompleted } from '@/store/slices/authSlice';
import { MobileNumberService } from '@/services/MobileNumberService';
import { useBranding } from '@/contexts/BrandingContext';
import { RootState } from '@/store';
import { 
  User, 
  Loader, 
  AlertCircle, 
  CheckCircle, 
  MapPin 
} from 'lucide-react';

interface ProfileRegistrationScreenProps {
  onNext: () => void;
  onPrev: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  onComplete?: () => void;
}

export const ProfileRegistrationScreen: React.FC<ProfileRegistrationScreenProps> = ({ 
  onNext, 
  onPrev,
  onComplete
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { branding } = useBranding();
  const { phoneNumber } = useSelector((state: RootState) => state.auth);
  
  const [formData, setFormData] = useState({
    fullName: '',
    pin: '',
    confirmPin: '',
    village: '',
    district: '',
    state: '',
    farmingExperience: '',
    landAcres: '',
    primaryCrops: [] as string[],
    hasIrrigation: false,
    hasTractor: false,
    hasStorage: false,
    annualIncome: '',
    preferredLanguage: 'hi'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleCropToggle = (crop: string) => {
    setFormData(prev => ({
      ...prev,
      primaryCrops: prev.primaryCrops.includes(crop)
        ? prev.primaryCrops.filter(c => c !== crop)
        : [...prev.primaryCrops, crop]
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError(t('profile.full_name_required'));
      return false;
    }
    if (!formData.pin || formData.pin.length !== 4) {
      setError(t('profile.pin_required'));
      return false;
    }
    if (formData.pin !== formData.confirmPin) {
      setError(t('profile.pin_mismatch'));
      return false;
    }
    if (!formData.village.trim()) {
      setError(t('profile.village_required'));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const userData = {
        full_name: formData.fullName,
        village: formData.village,
        district: formData.district,
        state: formData.state,
        farming_experience_years: formData.farmingExperience ? parseInt(formData.farmingExperience) : null,
        total_land_acres: formData.landAcres ? parseFloat(formData.landAcres) : null,
        primary_crops: formData.primaryCrops,
        has_irrigation: formData.hasIrrigation,
        has_tractor: formData.hasTractor,
        has_storage: formData.hasStorage,
        annual_income_range: formData.annualIncome,
        preferred_language: formData.preferredLanguage
      };

      console.log('Submitting registration with data:', userData);

      const result = await MobileNumberService.getInstance().registerUser(
        phoneNumber || '',
        formData.pin,
        userData
      );

      console.log('Registration result:', result);

      if (result.success) {
        setSuccess(true);
        dispatch(setOnboardingCompleted());
        
        // Wait a bit to show success message
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 1500);
      } else {
        setError(result.error || t('profile.registration_failed'));
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(t('profile.registration_failed'));
    } finally {
      setLoading(false);
    }
  };

  const crops = [
    'wheat', 'rice', 'sugarcane', 'cotton', 'soybean', 'maize', 
    'bajra', 'jowar', 'groundnut', 'mustard', 'onion', 'potato'
  ];

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-sm bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
          <CardContent className="p-6 text-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto bg-green-100"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {t('profile.registration_successful')}
            </h1>
            <p className="text-sm text-gray-600">
              {t('profile.welcome_to_platform')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
        <CardHeader className="pb-0 px-4 pt-4">
          <div className="text-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto"
              style={{ backgroundColor: `${branding?.primaryColor || '#8BC34A'}20` }}
            >
              <User 
                className="w-8 h-8" 
                style={{ color: branding?.primaryColor || '#8BC34A' }}
              />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {t('profile.complete_profile')}
            </h1>
            <p className="text-sm text-gray-600">
              {t('profile.help_us_know_you')}
            </p>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <Label htmlFor="fullName">{t('profile.full_name')}</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder={t('profile.enter_full_name')}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="pin">{t('profile.create_pin')}</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={formData.pin}
                onChange={(e) => handleInputChange('pin', e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirmPin">{t('profile.confirm_pin')}</Label>
              <Input
                id="confirmPin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={formData.confirmPin}
                onChange={(e) => handleInputChange('confirmPin', e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="village">{t('profile.village')}</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="village"
                value={formData.village}
                onChange={(e) => handleInputChange('village', e.target.value)}
                placeholder={t('profile.enter_village')}
                className="mt-1 pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="district">{t('profile.district')}</Label>
              <Input
                id="district"
                value={formData.district}
                onChange={(e) => handleInputChange('district', e.target.value)}
                placeholder={t('profile.enter_district')}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="state">{t('profile.state')}</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder={t('profile.enter_state')}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="experience">{t('profile.farming_experience')}</Label>
              <Select value={formData.farmingExperience} onValueChange={(value) => handleInputChange('farmingExperience', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t('profile.select_experience')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-5">1-5 {t('profile.years')}</SelectItem>
                  <SelectItem value="6-10">6-10 {t('profile.years')}</SelectItem>
                  <SelectItem value="11-20">11-20 {t('profile.years')}</SelectItem>
                  <SelectItem value="20+">20+ {t('profile.years')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="landAcres">{t('profile.land_acres')}</Label>
              <Input
                id="landAcres"
                type="number"
                value={formData.landAcres}
                onChange={(e) => handleInputChange('landAcres', e.target.value)}
                placeholder="0.5"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>{t('profile.primary_crops')}</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {crops.map((crop) => (
                <div key={crop} className="flex items-center space-x-2">
                  <Checkbox
                    id={crop}
                    checked={formData.primaryCrops.includes(crop)}
                    onCheckedChange={() => handleCropToggle(crop)}
                  />
                  <Label htmlFor={crop} className="text-sm">{t(`crops.${crop}`)}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="irrigation"
                checked={formData.hasIrrigation}
                onCheckedChange={(checked) => handleInputChange('hasIrrigation', checked)}
              />
              <Label htmlFor="irrigation">{t('profile.has_irrigation')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="tractor"
                checked={formData.hasTractor}
                onCheckedChange={(checked) => handleInputChange('hasTractor', checked)}
              />
              <Label htmlFor="tractor">{t('profile.has_tractor')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="storage"
                checked={formData.hasStorage}
                onCheckedChange={(checked) => handleInputChange('hasStorage', checked)}
              />
              <Label htmlFor="storage">{t('profile.has_storage')}</Label>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 text-center p-3 bg-red-50 rounded-lg border border-red-200 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <Button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-12 text-base font-semibold rounded-xl"
            style={{ backgroundColor: branding?.primaryColor || '#8BC34A', color: 'white' }}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span>{t('profile.creating_profile')}</span>
              </div>
            ) : (
              t('profile.complete_registration')
            )}
          </Button>

          <Button 
            variant="outline" 
            onClick={onPrev}
            className="w-full h-10 border-2 rounded-xl"
            disabled={loading}
          >
            {t('common.back')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
