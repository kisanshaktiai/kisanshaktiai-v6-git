
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { setLocation } from '@/store/slices/farmerSlice';
import { LocationService } from '@/services/LocationService';
import { MapPin, Loader } from 'lucide-react';

interface LocationScreenProps {
  onNext: () => void;
  onPrev: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export const LocationScreen: React.FC<LocationScreenProps> = ({ onNext, onPrev }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [location, setLocationState] = useState<string | null>(null);

  const handleLocationAccess = async () => {
    setLoading(true);
    try {
      const hasPermission = await LocationService.getInstance().requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const coords = await LocationService.getInstance().getCurrentLocation();
      const address = await LocationService.getInstance().reverseGeocode(
        coords.latitude,
        coords.longitude
      );

      dispatch(setLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        address: address.address,
        district: address.district,
        state: address.state,
      }));

      setLocationState(`${address.district}, ${address.state}`);
      onNext();
    } catch (error) {
      console.error('Location error:', error);
      setLocationState('Location access failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('onboarding.location_title')}
          </h1>
          <p className="text-gray-600">
            {t('onboarding.location_subtitle')}
          </p>
        </div>

        {location && (
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-green-800 font-medium">{location}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button 
            onClick={handleLocationAccess}
            disabled={loading}
            className="w-full py-3 text-lg"
            size="lg"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span>{t('common.loading')}</span>
              </div>
            ) : (
              'Allow Location Access'
            )}
          </Button>

          <Button 
            variant="ghost" 
            onClick={onPrev}
            className="w-full"
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
};
