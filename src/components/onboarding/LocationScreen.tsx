
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { setLocation } from '@/store/slices/farmerSlice';
import { LocationService } from '@/services/LocationService';
import { MapPin, Loader, AlertCircle } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [autoFetching, setAutoFetching] = useState(false);

  // Automatically try to fetch location when component mounts
  useEffect(() => {
    const autoFetchLocation = async () => {
      setAutoFetching(true);
      setError(null);
      
      try {
        // First check if geolocation is available
        if (!navigator.geolocation) {
          throw new Error('Geolocation is not supported by this browser');
        }

        const hasPermission = await LocationService.getInstance().requestPermissions();
        if (hasPermission) {
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
          console.log('Location automatically fetched:', address);
          
          // Auto-proceed to next step after successful location fetch
          setTimeout(() => {
            onNext();
          }, 1500);
        }
      } catch (error) {
        console.error('Auto location fetch failed:', error);
        setError('Could not automatically detect your location. Please allow location access or skip this step.');
      } finally {
        setAutoFetching(false);
      }
    };

    autoFetchLocation();
  }, [dispatch, onNext]);

  const handleLocationAccess = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const hasPermission = await LocationService.getInstance().requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied. Please enable location access in your browser settings.');
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Allow user to skip location and continue
    onNext();
  };

  if (autoFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div>
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Loader className="w-8 h-8 text-white animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Detecting Location
            </h1>
            <p className="text-gray-600">
              We're automatically finding your location for better farming advice...
            </p>
          </div>
        </div>
      </div>
    );
  }

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

        {error && (
          <div className="p-4 bg-red-50 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-800 text-sm">{error}</p>
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
            variant="outline" 
            onClick={handleSkip}
            className="w-full"
            disabled={loading}
          >
            Skip for Now
          </Button>

          <Button 
            variant="ghost" 
            onClick={onPrev}
            className="w-full"
            disabled={loading}
          >
            Back
          </Button>
        </div>

        {error && (
          <div className="text-sm text-gray-500 mt-4">
            <p>If location access fails, you can:</p>
            <ul className="mt-2 space-y-1 text-left">
              <li>• Check your browser's location permissions</li>
              <li>• Enable location services on your device</li>
              <li>• Skip this step and set location later</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
