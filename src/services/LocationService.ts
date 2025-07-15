
import { Geolocation } from '@capacitor/geolocation';
import { Preferences } from '@capacitor/preferences';

export class LocationService {
  private static instance: LocationService;
  
  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async getCurrentLocation(): Promise<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  }> {
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      });

      const location = {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
        accuracy: coordinates.coords.accuracy,
      };

      // Cache location for offline use
      await Preferences.set({
        key: 'lastKnownLocation',
        value: JSON.stringify(location),
      });

      return location;
    } catch (error) {
      console.log('Error getting location:', error);
      
      // Try to get cached location
      const { value: cachedLocation } = await Preferences.get({
        key: 'lastKnownLocation',
      });
      
      if (cachedLocation) {
        return JSON.parse(cachedLocation);
      }
      
      throw new Error('Unable to get location');
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<{
    address: string;
    district: string;
    state: string;
  }> {
    try {
      // This would integrate with a geocoding service
      // For now, return mock data
      return {
        address: 'Sample Address',
        district: 'Sample District',
        state: 'Sample State',
      };
    } catch (error) {
      console.log('Geocoding error:', error);
      throw new Error('Unable to get address');
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const permissions = await Geolocation.requestPermissions();
      return permissions.location === 'granted';
    } catch (error) {
      console.log('Permission request error:', error);
      return false;
    }
  }
}
