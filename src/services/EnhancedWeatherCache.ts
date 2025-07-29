import { PerformanceCache } from './PerformanceCache';

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
  windSpeed?: number;
  pressure?: number;
  visibility?: number;
  uvIndex?: number;
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

export class EnhancedWeatherCache {
  private static instance: EnhancedWeatherCache;
  private cache: PerformanceCache;
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  private readonly NEARBY_RADIUS_KM = 5; // 5km radius for location sharing
  private readonly PREDICTIVE_CACHE_RADIUS_KM = 25; // 25km for predictive caching
  
  private constructor() {
    this.cache = PerformanceCache.getInstance();
  }

  static getInstance(): EnhancedWeatherCache {
    if (!this.instance) {
      this.instance = new EnhancedWeatherCache();
    }
    return this.instance;
  }

  /**
   * Get weather data with geographic-based caching
   */
  async getWeatherData(
    location: WeatherLocation,
    tenantId: string,
    userId: string
  ): Promise<WeatherData | null> {
    try {
      // First, check for exact location match
      const exactMatch = await this.getExactLocationCache(location, tenantId);
      if (exactMatch && !this.isExpired(exactMatch)) {
        console.log('🎯 Weather cache hit: exact location');
        return { ...exactMatch.data, source: 'cache' };
      }

      // Check for nearby weather data from other farmers
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

  /**
   * Cache weather data with location indexing
   */
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
        userId
      };

      // Cache with multiple keys for efficient retrieval
      const locationKey = this.generateLocationKey(data.location);
      const userKey = `${userId}-current`;
      
      await Promise.all([
        this.cache.set('weather', locationKey, entry, tenantId),
        this.cache.set('weather', userKey, entry, tenantId),
        this.indexLocationData(entry)
      ]);

      // Trigger predictive caching for nearby areas
      this.triggerPredictiveCaching(data.location, tenantId);
      
      console.log('💾 Weather data cached with geographic indexing');
    } catch (error) {
      console.error('Weather cache storage failed:', error);
    }
  }

  /**
   * Get weather data for nearby locations (within 5km)
   */
  private async getNearbyWeatherData(
    location: WeatherLocation,
    tenantId: string
  ): Promise<WeatherCacheEntry | null> {
    try {
      // Get all cached locations for this tenant
      const locationIndex = await this.cache.get<WeatherLocation[]>('weather-index', tenantId, tenantId) || [];
      
      // Find nearby locations
      const nearbyLocations = locationIndex.filter(cachedLocation => 
        this.calculateDistance(location, cachedLocation) <= this.NEARBY_RADIUS_KM
      );

      if (nearbyLocations.length === 0) return null;

      // Get the closest location with valid data
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

  /**
   * Get exact location cache
   */
  private async getExactLocationCache(
    location: WeatherLocation,
    tenantId: string
  ): Promise<WeatherCacheEntry | null> {
    const locationKey = this.generateLocationKey(location);
    return await this.cache.get<WeatherCacheEntry>('weather', locationKey, tenantId);
  }

  /**
   * Index location data for spatial queries
   */
  private async indexLocationData(entry: WeatherCacheEntry): Promise<void> {
    try {
      const locationIndex = await this.cache.get<WeatherLocation[]>('weather-index', entry.tenantId, entry.tenantId) || [];
      
      // Remove old entries for the same location (within 100m)
      const filteredIndex = locationIndex.filter(loc => 
        this.calculateDistance(entry.location, loc) > 0.1
      );
      
      // Add new location
      filteredIndex.push(entry.location);
      
      // Keep only recent locations (last 100)
      const recentIndex = filteredIndex.slice(-100);
      
      await this.cache.set('weather-index', entry.tenantId, recentIndex, entry.tenantId);
    } catch (error) {
      console.error('Location indexing failed:', error);
    }
  }

  /**
   * Trigger predictive caching for areas the farmer might visit
   */
  private async triggerPredictiveCaching(
    location: WeatherLocation,
    tenantId: string
  ): Promise<void> {
    // Get user's movement patterns (simplified - in reality would use ML)
    const recentLocations = await this.getUserRecentLocations(tenantId);
    
    if (recentLocations.length >= 3) {
      // Predict next likely locations based on patterns
      const predictedLocations = this.predictNextLocations(recentLocations);
      
      // Background cache these locations
      this.backgroundCachePredictedLocations(predictedLocations, tenantId);
    }
  }

  /**
   * Background sync with exponential backoff
   */
  async backgroundSync(tenantId: string, retryCount = 0): Promise<void> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    
    try {
      // Get all stale weather data
      const staleEntries = await this.getStaleWeatherEntries(tenantId);
      
      for (const entry of staleEntries) {
        // Refresh weather data via API
        await this.refreshWeatherEntry(entry, tenantId);
      }
      
      console.log(`🔄 Background sync completed for ${staleEntries.length} entries`);
    } catch (error) {
      console.error('Background sync failed:', error);
      
      if (retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount);
        setTimeout(() => {
          this.backgroundSync(tenantId, retryCount + 1);
        }, delay);
      }
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
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
    // Round to 3 decimal places (~111m precision)
    const lat = Math.round(location.latitude * 1000) / 1000;
    const lon = Math.round(location.longitude * 1000) / 1000;
    return `${lat},${lon}`;
  }

  private isExpired(entry: WeatherCacheEntry): boolean {
    return Date.now() - entry.timestamp > this.CACHE_TTL;
  }

  private async getUserRecentLocations(tenantId: string): Promise<WeatherLocation[]> {
    // Get recent weather cache entries for movement pattern analysis
    const userWeatherHistory = await this.cache.get<WeatherCacheEntry[]>('weather-history', tenantId, tenantId) || [];
    return userWeatherHistory.slice(-10).map(entry => entry.location);
  }

  private predictNextLocations(recentLocations: WeatherLocation[]): WeatherLocation[] {
    // Simplified prediction - in reality would use ML/pattern recognition
    const avgLat = recentLocations.reduce((sum, loc) => sum + loc.latitude, 0) / recentLocations.length;
    const avgLon = recentLocations.reduce((sum, loc) => sum + loc.longitude, 0) / recentLocations.length;
    
    // Generate predictions around the average location
    return [
      { latitude: avgLat + 0.01, longitude: avgLon },
      { latitude: avgLat - 0.01, longitude: avgLon },
      { latitude: avgLat, longitude: avgLon + 0.01 },
      { latitude: avgLat, longitude: avgLon - 0.01 },
    ];
  }

  private async backgroundCachePredictedLocations(
    locations: WeatherLocation[],
    tenantId: string
  ): Promise<void> {
    // Use background task to cache predicted locations
    setTimeout(async () => {
      for (const location of locations) {
        try {
          // Check if we already have data for this location
          const existing = await this.getExactLocationCache(location, tenantId);
          if (!existing || this.isExpired(existing)) {
            // Trigger API call for this location (would integrate with weather service)
            console.log(`🔮 Predictive caching for location: ${this.generateLocationKey(location)}`);
          }
        } catch (error) {
          console.warn('Predictive caching failed for location:', location, error);
        }
      }
    }, 1000); // Delay to avoid overwhelming the API
  }

  private async getStaleWeatherEntries(tenantId: string): Promise<WeatherCacheEntry[]> {
    const locationIndex = await this.cache.get<WeatherLocation[]>('weather-index', tenantId, tenantId) || [];
    const staleEntries: WeatherCacheEntry[] = [];
    
    for (const location of locationIndex) {
      const entry = await this.getExactLocationCache(location, tenantId);
      if (entry && this.isExpired(entry)) {
        staleEntries.push(entry);
      }
    }
    
    return staleEntries;
  }

  private async refreshWeatherEntry(entry: WeatherCacheEntry, tenantId: string): Promise<void> {
    // This would integrate with the actual weather API
    // For now, just update the timestamp to simulate refresh
    const refreshedEntry: WeatherCacheEntry = {
      ...entry,
      timestamp: Date.now()
    };
    
    const locationKey = this.generateLocationKey(entry.location);
    await this.cache.set('weather', locationKey, refreshedEntry, tenantId);
  }

  /**
   * Clear weather cache for a tenant
   */
  async clearTenantWeatherCache(tenantId: string): Promise<void> {
    try {
      await this.cache.clearTenantCache(tenantId);
      console.log(`🧹 Weather cache cleared for tenant: ${tenantId}`);
    } catch (error) {
      console.error('Failed to clear weather cache:', error);
    }
  }
}
