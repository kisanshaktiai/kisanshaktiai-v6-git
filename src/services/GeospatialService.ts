import { Geolocation } from '@capacitor/geolocation';
import { Preferences } from '@capacitor/preferences';
import { supabase } from '@/integrations/supabase/client';

interface GeoPoint {
  latitude: number;
  longitude: number;
}

interface PolygonBounds {
  points: GeoPoint[];
  area: number;
  perimeter: number;
  center: GeoPoint;
}

interface ElevationData {
  elevation: number;
  resolution: number;
}

export class GeospatialService {
  private static instance: GeospatialService;
  private offlineMapTiles: Map<string, any> = new Map();

  static getInstance(): GeospatialService {
    if (!GeospatialService.instance) {
      GeospatialService.instance = new GeospatialService();
    }
    return GeospatialService.instance;
  }

  // Calculate geodesic area using Shoelace formula (more accurate for smaller areas)
  calculatePolygonArea(points: GeoPoint[]): number {
    if (points.length < 3) return 0;

    const earthRadius = 6371000; // meters
    let area = 0;

    // Convert to radians
    const rad = (deg: number) => (deg * Math.PI) / 180;

    // Project to plane using equirectangular projection
    const centerLat = points.reduce((sum, p) => sum + p.latitude, 0) / points.length;
    const centerLng = points.reduce((sum, p) => sum + p.longitude, 0) / points.length;
    
    const projectedPoints = points.map(p => ({
      x: earthRadius * rad(p.longitude - centerLng) * Math.cos(rad(centerLat)),
      y: earthRadius * rad(p.latitude - centerLat)
    }));

    // Calculate area using shoelace formula
    for (let i = 0; i < projectedPoints.length; i++) {
      const j = (i + 1) % projectedPoints.length;
      area += projectedPoints[i].x * projectedPoints[j].y;
      area -= projectedPoints[j].x * projectedPoints[i].y;
    }

    area = Math.abs(area) / 2;
    
    // Convert to acres
    return area * 0.000247105;
  }

  // Calculate perimeter
  calculatePerimeter(points: GeoPoint[]): number {
    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      perimeter += this.calculateDistance(points[i], points[j]);
    }
    return perimeter;
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
    const R = 6371000; // Earth's radius in meters
    const rad = (deg: number) => (deg * Math.PI) / 180;
    
    const dLat = rad(point2.latitude - point1.latitude);
    const dLon = rad(point2.longitude - point1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(rad(point1.latitude)) * Math.cos(rad(point2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Get center point of polygon
  getCenterPoint(points: GeoPoint[]): GeoPoint {
    const sumLat = points.reduce((sum, p) => sum + p.latitude, 0);
    const sumLng = points.reduce((sum, p) => sum + p.longitude, 0);
    
    return {
      latitude: sumLat / points.length,
      longitude: sumLng / points.length
    };
  }

  // Simplify polygon using Douglas-Peucker algorithm
  simplifyPolygon(points: GeoPoint[], tolerance: number = 0.00001): GeoPoint[] {
    if (points.length <= 2) return points;

    // Find point with maximum distance
    let maxDistance = 0;
    let maxIndex = 0;
    
    const start = points[0];
    const end = points[points.length - 1];
    
    for (let i = 1; i < points.length - 1; i++) {
      const distance = this.perpendicularDistance(points[i], start, end);
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }

    // If max distance is greater than tolerance, recursively simplify
    if (maxDistance > tolerance) {
      const leftPart = this.simplifyPolygon(points.slice(0, maxIndex + 1), tolerance);
      const rightPart = this.simplifyPolygon(points.slice(maxIndex), tolerance);
      
      return [...leftPart.slice(0, -1), ...rightPart];
    } else {
      return [start, end];
    }
  }

  // Calculate perpendicular distance from point to line
  private perpendicularDistance(point: GeoPoint, lineStart: GeoPoint, lineEnd: GeoPoint): number {
    const A = point.latitude - lineStart.latitude;
    const B = point.longitude - lineStart.longitude;
    const C = lineEnd.latitude - lineStart.latitude;
    const D = lineEnd.longitude - lineStart.longitude;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = lineStart.latitude;
      yy = lineStart.longitude;
    } else if (param > 1) {
      xx = lineEnd.latitude;
      yy = lineEnd.longitude;
    } else {
      xx = lineStart.latitude + param * C;
      yy = lineStart.longitude + param * D;
    }

    const dx = point.latitude - xx;
    const dy = point.longitude - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Track GPS walk for boundary marking
  async startGPSWalkTracking(
    onLocationUpdate: (point: GeoPoint) => void,
    options?: {
      minDistance?: number; // Minimum distance between points in meters
      maxAccuracy?: number; // Maximum acceptable accuracy in meters
    }
  ): Promise<() => void> {
    const minDistance = options?.minDistance || 5; // 5 meters default
    const maxAccuracy = options?.maxAccuracy || 20; // 20 meters default
    
    let lastPoint: GeoPoint | null = null;
    let watchId: string | null = null;

    try {
      watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        },
        (position) => {
          if (position && position.coords.accuracy <= maxAccuracy) {
            const currentPoint: GeoPoint = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };

            // Only add point if minimum distance is met
            if (!lastPoint || this.calculateDistance(lastPoint, currentPoint) >= minDistance) {
              onLocationUpdate(currentPoint);
              lastPoint = currentPoint;
            }
          }
        }
      );
    } catch (error) {
      console.error('GPS tracking error:', error);
      throw error;
    }

    // Return cleanup function
    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }

  // Get current GPS location
  async getCurrentLocation(): Promise<GeoPoint> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
    } catch (error) {
      console.error('Error getting location:', error);
      throw new Error('Unable to get current location');
    }
  }

  // Check if point is inside polygon (ray casting algorithm)
  isPointInPolygon(point: GeoPoint, polygon: GeoPoint[]): boolean {
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].longitude, yi = polygon[i].latitude;
      const xj = polygon[j].longitude, yj = polygon[j].latitude;
      
      const intersect = ((yi > point.latitude) !== (yj > point.latitude))
        && (point.longitude < (xj - xi) * (point.latitude - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  }

  // Calculate elevation profile along path
  async getElevationProfile(points: GeoPoint[]): Promise<ElevationData[]> {
    // Mock implementation - in production, this would call an elevation API
    return points.map(point => ({
      elevation: 100 + Math.random() * 50, // Mock elevation in meters
      resolution: 30 // 30m resolution
    }));
  }

  // Cluster nearby lands for visualization
  clusterLands(
    lands: { id: string; center: GeoPoint; area: number }[],
    zoomLevel: number
  ): { center: GeoPoint; count: number; landIds: string[] }[] {
    const clusters: { center: GeoPoint; count: number; landIds: string[] }[] = [];
    const clusterRadius = this.getClusterRadius(zoomLevel);
    const processed = new Set<string>();

    for (const land of lands) {
      if (processed.has(land.id)) continue;

      const cluster = {
        center: land.center,
        count: 1,
        landIds: [land.id]
      };

      // Find nearby lands to cluster
      for (const otherLand of lands) {
        if (otherLand.id !== land.id && !processed.has(otherLand.id)) {
          const distance = this.calculateDistance(land.center, otherLand.center);
          if (distance <= clusterRadius) {
            cluster.landIds.push(otherLand.id);
            cluster.count++;
            processed.add(otherLand.id);
          }
        }
      }

      processed.add(land.id);
      
      // Update cluster center to be the average
      if (cluster.count > 1) {
        const clusterLands = lands.filter(l => cluster.landIds.includes(l.id));
        cluster.center = this.getCenterPoint(clusterLands.map(l => l.center));
      }
      
      clusters.push(cluster);
    }

    return clusters;
  }

  // Get cluster radius based on zoom level
  private getClusterRadius(zoomLevel: number): number {
    // Returns radius in meters
    const baseRadius = 500; // 500 meters at zoom level 15
    return baseRadius * Math.pow(2, 15 - zoomLevel);
  }

  // Save offline map tiles
  async saveOfflineMapTiles(bounds: { north: number; south: number; east: number; west: number }, zoomLevels: number[]): Promise<void> {
    // Mock implementation - in production, this would download and cache map tiles
    const tileKey = `${bounds.north}_${bounds.south}_${bounds.east}_${bounds.west}`;
    this.offlineMapTiles.set(tileKey, { bounds, zoomLevels, timestamp: Date.now() });
    
    // Save to preferences for persistence
    await Preferences.set({
      key: `offline_tiles_${tileKey}`,
      value: JSON.stringify({ bounds, zoomLevels, timestamp: Date.now() })
    });
  }

  // Load offline map tiles
  async loadOfflineMapTiles(): Promise<void> {
    // Mock implementation - load saved tiles from preferences
    const { keys } = await Preferences.keys();
    
    for (const key of keys) {
      if (key.startsWith('offline_tiles_')) {
        const { value } = await Preferences.get({ key });
        if (value) {
          const tileData = JSON.parse(value);
          const tileKey = key.replace('offline_tiles_', '');
          this.offlineMapTiles.set(tileKey, tileData);
        }
      }
    }
  }

  // Check if area has offline tiles
  hasOfflineTiles(bounds: { north: number; south: number; east: number; west: number }): boolean {
    for (const [key, data] of this.offlineMapTiles) {
      const tileBounds = data.bounds;
      if (
        bounds.north <= tileBounds.north &&
        bounds.south >= tileBounds.south &&
        bounds.east <= tileBounds.east &&
        bounds.west >= tileBounds.west
      ) {
        return true;
      }
    }
    return false;
  }

  // Convert polygon to GeoJSON format
  toGeoJSON(points: GeoPoint[]): any {
    return {
      type: 'Polygon',
      coordinates: [
        points.map(p => [p.longitude, p.latitude])
      ]
    };
  }

  // Parse GeoJSON to points
  fromGeoJSON(geoJSON: any): GeoPoint[] {
    if (geoJSON.type === 'Polygon' && geoJSON.coordinates && geoJSON.coordinates[0]) {
      return geoJSON.coordinates[0].map((coord: number[]) => ({
        latitude: coord[1],
        longitude: coord[0]
      }));
    }
    return [];
  }

  // Validate polygon (check for self-intersection, minimum area, etc.)
  validatePolygon(points: GeoPoint[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check minimum points
    if (points.length < 3) {
      errors.push('Polygon must have at least 3 points');
    }

    // Check minimum area (0.1 acres)
    const area = this.calculatePolygonArea(points);
    if (area < 0.1) {
      errors.push('Land area must be at least 0.1 acres');
    }

    // Check maximum area (10000 acres - reasonable limit)
    if (area > 10000) {
      errors.push('Land area exceeds maximum limit of 10000 acres');
    }

    // Check for self-intersection (simplified check)
    if (this.hasSelfIntersection(points)) {
      errors.push('Polygon boundaries cannot cross each other');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Check for self-intersection in polygon
  private hasSelfIntersection(points: GeoPoint[]): boolean {
    // Simplified check - in production, use a more robust algorithm
    for (let i = 0; i < points.length - 2; i++) {
      for (let j = i + 2; j < points.length - 1; j++) {
        if (this.doSegmentsIntersect(
          points[i], points[i + 1],
          points[j], points[j + 1]
        )) {
          return true;
        }
      }
    }
    return false;
  }

  // Check if two line segments intersect
  private doSegmentsIntersect(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint, p4: GeoPoint): boolean {
    const ccw = (A: GeoPoint, B: GeoPoint, C: GeoPoint): boolean => {
      return (C.longitude - A.longitude) * (B.latitude - A.latitude) > 
             (B.longitude - A.longitude) * (C.latitude - A.latitude);
    };

    return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
  }
}

export const geospatialService = GeospatialService.getInstance();