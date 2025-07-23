
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
      // Use OpenStreetMap Nominatim API for reverse geocoding (free and reliable)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`,
        {
          headers: {
            'User-Agent': 'KisanShakti-App/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }

      const data = await response.json();
      
      if (!data || !data.address) {
        throw new Error('No address data found');
      }

      const address = data.address;
      
      // Extract location details with fallbacks
      const tahsil = address.county || address.state_district || address.suburb || address.neighbourhood || '';
      const district = address.state_district || address.county || address.city_district || address.city || '';
      const state = address.state || address.region || '';

      return {
        address: tahsil, // Use tahsil-level data for address
        district: district,
        state: state,
      };
    } catch (error) {
      console.log('Geocoding error:', error);
      
      // Fallback to approximate location based on coordinates
      const indiaStates = [
        { lat: 28.6, lng: 77.2, district: "New Delhi", state: "Delhi", tahsil: "New Delhi" },
        { lat: 19.0, lng: 72.8, district: "Mumbai", state: "Maharashtra", tahsil: "Mumbai City" },
        { lat: 13.0, lng: 80.2, district: "Chennai", state: "Tamil Nadu", tahsil: "Chennai" },
        { lat: 22.5, lng: 88.3, district: "Kolkata", state: "West Bengal", tahsil: "Kolkata" },
        { lat: 17.3, lng: 78.4, district: "Hyderabad", state: "Telangana", tahsil: "Hyderabad" },
        { lat: 12.9, lng: 77.6, district: "Bangalore Urban", state: "Karnataka", tahsil: "Bangalore North" },
        { lat: 21.1, lng: 79.0, district: "Nagpur", state: "Maharashtra", tahsil: "Nagpur Rural" },
        { lat: 26.9, lng: 75.8, district: "Jaipur", state: "Rajasthan", tahsil: "Jaipur" },
        { lat: 23.0, lng: 72.5, district: "Ahmedabad", state: "Gujarat", tahsil: "Ahmedabad City" },
        { lat: 18.5, lng: 73.8, district: "Pune", state: "Maharashtra", tahsil: "Pune City" },
      ];

      // Find closest location
      let closest = indiaStates[0];
      let minDistance = Math.sqrt(Math.pow(lat - closest.lat, 2) + Math.pow(lng - closest.lng, 2));

      for (const location of indiaStates) {
        const distance = Math.sqrt(Math.pow(lat - location.lat, 2) + Math.pow(lng - location.lng, 2));
        if (distance < minDistance) {
          closest = location;
          minDistance = distance;
        }
      }

      return {
        address: closest.tahsil,
        district: closest.district,
        state: closest.state,
      };
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
