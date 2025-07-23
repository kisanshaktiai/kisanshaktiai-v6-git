
export class LocationService {
  private static instance: LocationService;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported');
      }

      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => {
            console.warn('Location access denied:', error);
            // Return default location (Delhi, India) if location access is denied
            resolve({ latitude: 28.6139, longitude: 77.2090 });
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          }
        );
      });
    } catch (error) {
      console.warn('Location service error:', error);
      // Return default location
      return { latitude: 28.6139, longitude: 77.2090 };
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<{ state: string; district: string }> {
    try {
      // This is a simplified implementation
      // In a real app, you'd use a proper geocoding service
      return { state: 'Delhi', district: 'New Delhi' };
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return { state: 'Unknown', district: 'Unknown' };
    }
  }
}
