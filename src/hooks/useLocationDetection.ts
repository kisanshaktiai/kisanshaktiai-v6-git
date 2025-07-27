
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { LocationService } from '@/services/LocationService';
import { setLocation } from '@/store/slices/farmerSlice';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  district?: string;
  state?: string;
}

export const useLocationDetection = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocationData] = useState<LocationData | null>(null);
  const dispatch = useDispatch();

  const detectLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      const locationService = LocationService.getInstance();
      
      // Check permissions first
      const hasPermission = await locationService.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      // Get current location
      const coords = await locationService.getCurrentLocation();
      console.log('Location detected:', coords);

      // Reverse geocode to get address
      const addressInfo = await locationService.reverseGeocode(
        coords.latitude, 
        coords.longitude
      );

      const locationData: LocationData = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        address: addressInfo.address,
        district: addressInfo.district,
        state: addressInfo.state,
      };

      setLocationData(locationData);
      dispatch(setLocation(locationData));
      
      console.log('Location stored in Redux:', locationData);
      
    } catch (err) {
      console.error('Location detection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get location');
      
      // Set fallback location for testing (New Delhi coordinates)
      const fallbackLocation: LocationData = {
        latitude: 28.6139,
        longitude: 77.2090,
        address: 'New Delhi',
        district: 'New Delhi',
        state: 'Delhi',
      };
      
      setLocationData(fallbackLocation);
      dispatch(setLocation(fallbackLocation));
      console.log('Using fallback location:', fallbackLocation);
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    detectLocation();
  }, []);

  return {
    location,
    loading,
    error,
    refetch: detectLocation,
  };
};
