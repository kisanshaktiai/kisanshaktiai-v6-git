import { supabase } from '@/integrations/supabase/client';
import { db } from '@/services/offline/db';

export interface NDVITimeSeries {
  date: string;
  value: number;
  cloudCover: number;
  interpretation: string;
  imageUrl?: string;
}

export interface CropHealthAlert {
  type: 'stress' | 'disease' | 'pest' | 'water' | 'nutrient';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedArea: number; // percentage
  recommendations: string[];
  detectedDate: string;
}

export interface NDVIComparison {
  landId: string;
  landName: string;
  currentNDVI: number;
  averageNDVI: number;
  trend: 'better' | 'similar' | 'worse';
  difference: number;
}

export class NDVIService {
  private static instance: NDVIService;
  private planetaryComputerKey: string = 'demo'; // In production, use actual API key

  static getInstance(): NDVIService {
    if (!NDVIService.instance) {
      NDVIService.instance = new NDVIService();
    }
    return NDVIService.instance;
  }

  // Fetch Sentinel-2 imagery from Microsoft Planetary Computer
  async fetchSentinel2NDVI(
    polygon: { type: string; coordinates: number[][][] },
    startDate: Date,
    endDate: Date
  ): Promise<NDVITimeSeries[]> {
    try {
      // Check cache first
      const cacheKey = `ndvi_${JSON.stringify(polygon.coordinates[0][0])}_${startDate.toISOString()}_${endDate.toISOString()}`;
      const cached = await db.getCachedData(cacheKey);
      if (cached) return cached;

      // Mock data for demo - in production, call actual Planetary Computer API
      const timeSeries: NDVITimeSeries[] = [];
      const daysBetween = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const interval = Math.max(5, Math.floor(daysBetween / 10)); // Get ~10 data points

      for (let i = 0; i <= daysBetween; i += interval) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const baseNDVI = 0.3 + Math.random() * 0.5; // 0.3 to 0.8
        const seasonalFactor = Math.sin((date.getMonth() / 12) * Math.PI * 2) * 0.1;
        const ndviValue = Math.max(0, Math.min(1, baseNDVI + seasonalFactor));
        
        timeSeries.push({
          date: date.toISOString(),
          value: ndviValue,
          cloudCover: Math.random() * 30, // 0-30% cloud cover
          interpretation: this.interpretNDVI(ndviValue),
          imageUrl: `https://api.placeholder.com/ndvi/${date.toISOString()}.png`
        });
      }

      // Cache the data
      await db.setCachedData(cacheKey, timeSeries, undefined, 24 * 60 * 60 * 1000); // Cache for 24 hours

      return timeSeries;
    } catch (error) {
      console.error('Error fetching Sentinel-2 NDVI:', error);
      return [];
    }
  }

  // Interpret NDVI value
  interpretNDVI(value: number, cropType?: string, growthStage?: string): string {
    if (value < 0.1) {
      return 'Bare soil or water - No vegetation detected';
    } else if (value < 0.2) {
      return 'Very sparse vegetation - Early germination or severe stress';
    } else if (value < 0.3) {
      return 'Sparse vegetation - Young crops or moderate stress';
    } else if (value < 0.5) {
      return 'Moderate vegetation - Growing crops, possible mild stress';
    } else if (value < 0.7) {
      return 'Dense vegetation - Healthy mature crops';
    } else if (value < 0.9) {
      return 'Very dense vegetation - Peak vegetative growth';
    } else {
      return 'Extremely dense vegetation - Optimal conditions';
    }
  }

  // Analyze NDVI changes for alerts
  analyzeNDVIChanges(timeSeries: NDVITimeSeries[]): CropHealthAlert[] {
    const alerts: CropHealthAlert[] = [];
    
    if (timeSeries.length < 2) return alerts;

    // Sort by date
    const sorted = [...timeSeries].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Check for sudden drops
    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const previous = sorted[i - 1];
      const change = current.value - previous.value;
      const changeRate = Math.abs(change / previous.value);

      if (changeRate > 0.3 && change < 0) {
        // Significant drop detected
        alerts.push({
          type: this.determineStressType(current.value, changeRate),
          severity: changeRate > 0.5 ? 'critical' : changeRate > 0.4 ? 'high' : 'medium',
          message: `NDVI dropped by ${(changeRate * 100).toFixed(1)}% between ${new Date(previous.date).toLocaleDateString()} and ${new Date(current.date).toLocaleDateString()}`,
          affectedArea: Math.min(100, changeRate * 200), // Estimate affected area
          recommendations: this.getStressRecommendations(current.value, changeRate),
          detectedDate: current.date
        });
      }
    }

    // Check for prolonged low NDVI
    const recentValues = sorted.slice(-3);
    const avgRecent = recentValues.reduce((sum, item) => sum + item.value, 0) / recentValues.length;
    
    if (avgRecent < 0.3) {
      alerts.push({
        type: 'stress',
        severity: avgRecent < 0.2 ? 'high' : 'medium',
        message: `Prolonged low vegetation health detected (NDVI: ${avgRecent.toFixed(2)})`,
        affectedArea: 80,
        recommendations: [
          'Check soil moisture levels',
          'Inspect for pest or disease damage',
          'Consider nutrient supplementation',
          'Review irrigation schedule'
        ],
        detectedDate: sorted[sorted.length - 1].date
      });
    }

    return alerts;
  }

  private determineStressType(ndviValue: number, changeRate: number): CropHealthAlert['type'] {
    if (changeRate > 0.5) return 'disease'; // Rapid decline suggests disease
    if (ndviValue < 0.2) return 'water'; // Very low NDVI suggests water stress
    if (changeRate > 0.3 && ndviValue > 0.3) return 'pest'; // Moderate decline with decent NDVI suggests pest
    if (ndviValue < 0.4) return 'nutrient'; // Low-moderate NDVI suggests nutrient deficiency
    return 'stress'; // General stress
  }

  private getStressRecommendations(ndviValue: number, changeRate: number): string[] {
    const recommendations: string[] = [];

    if (changeRate > 0.5) {
      recommendations.push(
        'Immediate field inspection required',
        'Take photos of affected areas for expert consultation',
        'Collect leaf samples for laboratory analysis'
      );
    }

    if (ndviValue < 0.3) {
      recommendations.push(
        'Check soil moisture at multiple depths',
        'Inspect irrigation system for blockages',
        'Consider foliar nutrient application'
      );
    }

    if (ndviValue < 0.2) {
      recommendations.push(
        'Emergency irrigation if soil is dry',
        'Apply stress-relief biostimulants',
        'Consult with agricultural expert immediately'
      );
    }

    recommendations.push(
      'Monitor daily for changes',
      'Document affected areas with photos',
      'Keep detailed activity log'
    );

    return recommendations;
  }

  // Compare with nearby fields
  async compareWithNearbyFields(
    landId: string,
    currentNDVI: number,
    centerPoint: { latitude: number; longitude: number },
    radiusKm: number = 5
  ): Promise<NDVIComparison[]> {
    try {
      // In production, this would query nearby lands from the database
      // For demo, return mock comparison data
      const mockComparisons: NDVIComparison[] = [
        {
          landId: 'nearby1',
          landName: 'Neighbor Field A',
          currentNDVI: 0.65,
          averageNDVI: 0.62,
          trend: currentNDVI > 0.65 ? 'better' : currentNDVI < 0.60 ? 'worse' : 'similar',
          difference: currentNDVI - 0.65
        },
        {
          landId: 'nearby2',
          landName: 'Neighbor Field B',
          currentNDVI: 0.58,
          averageNDVI: 0.60,
          trend: currentNDVI > 0.58 ? 'better' : currentNDVI < 0.55 ? 'worse' : 'similar',
          difference: currentNDVI - 0.58
        },
        {
          landId: 'regional',
          landName: 'Regional Average',
          currentNDVI: 0.61,
          averageNDVI: 0.61,
          trend: currentNDVI > 0.63 ? 'better' : currentNDVI < 0.59 ? 'worse' : 'similar',
          difference: currentNDVI - 0.61
        }
      ];

      return mockComparisons;
    } catch (error) {
      console.error('Error comparing with nearby fields:', error);
      return [];
    }
  }

  // Generate NDVI report
  generateNDVIReport(
    timeSeries: NDVITimeSeries[],
    alerts: CropHealthAlert[],
    comparisons: NDVIComparison[]
  ): {
    summary: string;
    healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    keyFindings: string[];
    recommendations: string[];
  } {
    const latestNDVI = timeSeries[timeSeries.length - 1]?.value || 0;
    const avgNDVI = timeSeries.reduce((sum, item) => sum + item.value, 0) / timeSeries.length;
    
    // Calculate trend
    const recentValues = timeSeries.slice(-5);
    const olderValues = timeSeries.slice(-10, -5);
    const recentAvg = recentValues.reduce((sum, item) => sum + item.value, 0) / recentValues.length;
    const olderAvg = olderValues.length > 0 
      ? olderValues.reduce((sum, item) => sum + item.value, 0) / olderValues.length
      : recentAvg;
    const trend = recentAvg - olderAvg;

    // Determine health status
    let healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    if (latestNDVI >= 0.7 && alerts.length === 0) {
      healthStatus = 'excellent';
    } else if (latestNDVI >= 0.5 && alerts.filter(a => a.severity === 'high' || a.severity === 'critical').length === 0) {
      healthStatus = 'good';
    } else if (latestNDVI >= 0.3 && alerts.filter(a => a.severity === 'critical').length === 0) {
      healthStatus = 'fair';
    } else if (latestNDVI >= 0.2) {
      healthStatus = 'poor';
    } else {
      healthStatus = 'critical';
    }

    // Key findings
    const keyFindings: string[] = [];
    keyFindings.push(`Current NDVI: ${latestNDVI.toFixed(2)} (${this.interpretNDVI(latestNDVI)})`);
    keyFindings.push(`Average NDVI (period): ${avgNDVI.toFixed(2)}`);
    
    if (Math.abs(trend) > 0.05) {
      keyFindings.push(`Vegetation health is ${trend > 0 ? 'improving' : 'declining'} (${(trend > 0 ? '+' : '')}${(trend * 100).toFixed(1)}%)`);
    } else {
      keyFindings.push('Vegetation health is stable');
    }

    if (comparisons.length > 0) {
      const betterThan = comparisons.filter(c => c.trend === 'better').length;
      const totalComparisons = comparisons.length;
      keyFindings.push(`Performing better than ${betterThan}/${totalComparisons} nearby fields`);
    }

    if (alerts.length > 0) {
      keyFindings.push(`${alerts.length} health alert${alerts.length > 1 ? 's' : ''} detected`);
    }

    // Recommendations
    const recommendations: string[] = [];
    
    if (healthStatus === 'excellent') {
      recommendations.push('Maintain current management practices');
      recommendations.push('Monitor for optimal harvest timing');
    } else if (healthStatus === 'good') {
      recommendations.push('Continue regular monitoring');
      recommendations.push('Consider preventive pest and disease management');
    } else if (healthStatus === 'fair') {
      recommendations.push('Increase monitoring frequency');
      recommendations.push('Inspect field for stress factors');
      recommendations.push('Review and adjust irrigation schedule');
      recommendations.push('Consider soil testing');
    } else {
      recommendations.push('Immediate field inspection required');
      recommendations.push('Consult with agricultural expert');
      recommendations.push('Implement emergency interventions');
      recommendations.push('Document all observations for analysis');
    }

    // Add alert-specific recommendations
    alerts.forEach(alert => {
      recommendations.push(...alert.recommendations.slice(0, 2));
    });

    // Generate summary
    const summary = `Your field's vegetation health is ${healthStatus}. ` +
      `Current NDVI is ${latestNDVI.toFixed(2)}, ${comparisons.length > 0 ? 
        (comparisons[0].trend === 'better' ? 'above' : comparisons[0].trend === 'worse' ? 'below' : 'matching') + ' local average. ' : ''}` +
      `${alerts.length > 0 ? `Attention needed: ${alerts.length} issue${alerts.length > 1 ? 's' : ''} detected. ` : ''}` +
      `${trend > 0.05 ? 'Positive growth trend observed.' : trend < -0.05 ? 'Declining trend requires attention.' : 'Stable conditions.'}`;

    return {
      summary,
      healthStatus,
      keyFindings,
      recommendations: [...new Set(recommendations)].slice(0, 5) // Remove duplicates and limit to 5
    };
  }

  // Save NDVI data to database
  async saveNDVIData(landId: string, ndviData: NDVITimeSeries, tenantId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ndvi_data')
        .insert({
          land_id: landId,
          tenant_id: tenantId,
          date: ndviData.date,
          ndvi_value: ndviData.value,
          satellite_source: 'Sentinel-2',
          image_url: ndviData.imageUrl,
          cloud_cover: ndviData.cloudCover
        });

      if (error) throw error;

      // Cache locally
      await db.setCachedData(
        `ndvi_latest_${landId}`,
        ndviData,
        undefined,
        24 * 60 * 60 * 1000 // Cache for 24 hours
      );
    } catch (error) {
      console.error('Error saving NDVI data:', error);
      throw error;
    }
  }

  // Download high-resolution NDVI image for offline viewing
  async downloadNDVIImage(imageUrl: string, landId: string): Promise<string> {
    try {
      // In production, this would download and store the image locally
      // For demo, return a local path
      const localPath = `offline/ndvi/${landId}/${Date.now()}.png`;
      
      // Save path to local database
      await db.setCachedData(
        `ndvi_image_${landId}`,
        { url: imageUrl, localPath, downloadDate: new Date().toISOString() },
        undefined,
        30 * 24 * 60 * 60 * 1000 // Cache for 30 days
      );

      return localPath;
    } catch (error) {
      console.error('Error downloading NDVI image:', error);
      throw error;
    }
  }
}

export const ndviService = NDVIService.getInstance();