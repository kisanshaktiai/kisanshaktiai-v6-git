
import { PerformanceCache } from '@/services/PerformanceCache';

interface WeatherLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  conditions: string;
  description: string;
  location: WeatherLocation;
  timestamp: number;
  source: 'api' | 'cache' | 'nearby';
}

interface WeatherCacheEntry {
  data: WeatherData;
  location: WeatherLocation;
  timestamp: number;
  tenantId: string;
  userId: string;
}

export class GeographicWeatherCache {
  private static instance: GeographicWeatherCache;
  private cache: PerformanceCache;
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  private readonly NEARBY_RADIUS_KM = 5; // 5km radius

  private constructor() {
    this.cache = PerformanceCache.getInstance();
  }

  static getInstance(): GeographicWeatherCache {
    if (!this.instance) {
      this.instance = new GeographicWeatherCache();
    }
    return this.instance;
  }

  async getWeatherData(
    location: WeatherLocation,
    tenantId: string,
    userId: string
  ): Promise<WeatherData | null> {
    try {
      // Check exact location match first
      const exactMatch = await this.getExactLocationCache(location, tenantId);
      if (exactMatch && !this.isExpired(exactMatch)) {
        console.log('🎯 Weather cache hit: exact location');
        return { ...exactMatch.data, source: 'cache' };
      }

      // Check nearby locations
      const nearbyData = await this.getNearbyWeatherData(location, tenantId);
      if (nearbyData && !this.isExpired(nearbyData)) {
        console.log('📍 Weather cache hit: nearby location');
        return { ...nearbyData.data, source: 'nearby' };
      }

      return null;
    } catch (error) {
      console.error('Weather cache retrieval failed:', error);
      return null;
    }
  }

  async cacheWeatherData(
    data: WeatherData,
    tenantId: string,
    userId: string
  ): Promise<void> {
    try {
      const entry: WeatherCacheEntry = {
        data,
        location: data.location,
        timestamp: Date.now(),
        tenantId,
        userId,
      };

      const locationKey = this.generateLocationKey(data.location);
      const userKey = `${userId}-current`;

      await Promise.all([
        this.cache.set('weather', locationKey, entry, tenantId),
        this.cache.set('weather', userKey, entry, tenantId),
        this.indexLocationData(entry),
      ]);

      console.log('💾 Weather data cached with geographic indexing');
    } catch (error) {
      console.error('Weather cache storage failed:', error);
    }
  }

  private async getNearbyWeatherData(
    location: WeatherLocation,
    tenantId: string
  ): Promise<WeatherCacheEntry | null> {
    try {
      const locationIndex = await this.cache.get<WeatherLocation[]>('weather-index', tenantId, tenantId) || [];
      
      const nearbyLocations = locationIndex.filter(cachedLocation =>
        this.calculateDistance(location, cachedLocation) <= this.NEARBY_RADIUS_KM
      );

      if (nearbyLocations.length === 0) return null;

      let closestEntry: WeatherCacheEntry | null = null;
      let closestDistance = Infinity;

      for (const nearbyLocation of nearbyLocations) {
        const locationKey = this.generateLocationKey(nearbyLocation);
        const entry = await this.cache.get<WeatherCacheEntry>('weather', locationKey, tenantId);

        if (entry && !this.isExpired(entry)) {
          const distance = this.calculateDistance(location, nearbyLocation);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestEntry = entry;
          }
        }
      }

      return closestEntry;
    } catch (error) {
      console.error('Nearby weather data retrieval failed:', error);
      return null;
    }
  }

  private async getExactLocationCache(
    location: WeatherLocation,
    tenantId: string
  ): Promise<WeatherCacheEntry | null> {
    const locationKey = this.generateLocationKey(location);
    return await this.cache.get<WeatherCacheEntry>('weather', locationKey, tenantId);
  }

  private async indexLocationData(entry: WeatherCacheEntry): Promise<void> {
    try {
      const locationIndex = await this.cache.get<WeatherLocation[]>('weather-index', entry.tenantId, entry.tenantId) || [];

      // Remove old entries for the same location (within 100m)
      const filteredIndex = locationIndex.filter(loc =>
        this.calculateDistance(entry.location, loc) > 0.1
      );

      filteredIndex.push(entry.location);
      const recentIndex = filteredIndex.slice(-100);

      await this.cache.set('weather-index', entry.tenantId, recentIndex, entry.tenantId);
    } catch (error) {
      console.error('Location indexing failed:', error);
    }
  }

  private calculateDistance(loc1: WeatherLocation, loc2: WeatherLocation): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(loc2.latitude - loc1.latitude);
    const dLon = this.toRadians(loc2.longitude - loc1.longitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(loc1.latitude)) * Math.cos(this.toRadians(loc2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private generateLocationKey(location: WeatherLocation): string {
    const lat = Math.round(location.latitude * 1000) / 1000;
    const lon = Math.round(location.longitude * 1000) / 1000;
    return `${lat},${lon}`;
  }

  private isExpired(entry: WeatherCacheEntry): boolean {
    return Date.now() - entry.timestamp > this.CACHE_TTL;
  }

  async clearTenantWeatherCache(tenantId: string): Promise<void> {
    try {
      await this.cache.clearTenantCache(tenantId);
      console.log(`🧹 Weather cache cleared for tenant: ${tenantId}`);
    } catch (error) {
      console.error('Failed to clear weather cache:', error);
    }
  }
}
