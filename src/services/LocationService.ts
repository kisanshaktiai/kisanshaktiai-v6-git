
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
      // Check if geolocation is available
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 30000, // Increased timeout
        maximumAge: 300000, // Allow cached location up to 5 minutes
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

      console.log('Location fetched successfully:', location);
      return location;
    } catch (error) {
      console.log('Error getting location:', error);
      
      // Try to get cached location
      const { value: cachedLocation } = await Preferences.get({
        key: 'lastKnownLocation',
      });
      
      if (cachedLocation) {
        console.log('Using cached location');
        return JSON.parse(cachedLocation);
      }
      
      throw new Error(`Unable to get location: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<{
    address: string;
    district: string;
    state: string;
  }> {
    try {
      // This would integrate with a geocoding service
      // For now, return mock data based on coordinates
      const mockLocations = [
        { lat: 28.6, lng: 77.2, district: "New Delhi", state: "Delhi", address: "Central Delhi" },
        { lat: 19.0, lng: 72.8, district: "Mumbai", state: "Maharashtra", address: "Mumbai Central" },
        { lat: 13.0, lng: 80.2, district: "Chennai", state: "Tamil Nadu", address: "Chennai Central" },
        { lat: 22.5, lng: 88.3, district: "Kolkata", state: "West Bengal", address: "Kolkata Central" },
        { lat: 17.3, lng: 78.4, district: "Hyderabad", state: "Telangana", address: "Hyderabad Central" },
        { lat: 12.9, lng: 77.6, district: "Bangalore", state: "Karnataka", address: "Bangalore Central" },
      ];

      // Find closest mock location
      let closest = mockLocations[0];
      let minDistance = Math.abs(lat - closest.lat) + Math.abs(lng - closest.lng);

      for (const location of mockLocations) {
        const distance = Math.abs(lat - location.lat) + Math.abs(lng - location.lng);
        if (distance < minDistance) {
          closest = location;
          minDistance = distance;
        }
      }

      return {
        address: closest.address,
        district: closest.district,
        state: closest.state,
      };
    } catch (error) {
      console.log('Geocoding error:', error);
      throw new Error('Unable to get address from coordinates');
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      // For web, we need to check if permissions API is available
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        
        if (permission.state === 'granted') {
          return true;
        } else if (permission.state === 'prompt') {
          // Will be requested when getCurrentPosition is called
          return true;
        } else {
          return false;
        }
      }

      // For Capacitor apps
      const permissions = await Geolocation.requestPermissions();
      return permissions.location === 'granted';
    } catch (error) {
      console.log('Permission request error:', error);
      
      // If permission API is not available, assume we can try to get location
      // The actual permission will be requested when getCurrentPosition is called
      return true;
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const permissions = await Geolocation.checkPermissions();
      return permissions.location === 'granted';
    } catch (error) {
      console.log('Permission check error:', error);
      return false;
    }
  }
}
