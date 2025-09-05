import { supabase } from '@/integrations/supabase/client';
import { db } from '@/services/offline/db';

export interface SoilGridData {
  ph: number;
  organicCarbon: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  texture: string;
  bulkDensity: number;
  cec: number; // Cation Exchange Capacity
  moisture: number;
}

export interface SoilRecommendation {
  parameter: string;
  currentValue: number | string;
  optimalRange: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  products?: { name: string; quantity: string; timing: string }[];
}

export class SoilHealthService {
  private static instance: SoilHealthService;
  private soilGridApiKey: string = 'demo'; // In production, use actual API key

  static getInstance(): SoilHealthService {
    if (!SoilHealthService.instance) {
      SoilHealthService.instance = new SoilHealthService();
    }
    return SoilHealthService.instance;
  }

  // Fetch soil data from SoilGrid API
  async fetchSoilGridData(latitude: number, longitude: number): Promise<SoilGridData | null> {
    try {
      // Check cache first
      const cacheKey = `soilgrid_${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
      const cached = await db.getCachedData(cacheKey);
      if (cached) return cached;

      // Mock data for demo - in production, call actual SoilGrid API
      const mockData: SoilGridData = {
        ph: 6.5 + (Math.random() * 1.5 - 0.75),
        organicCarbon: 0.8 + (Math.random() * 0.4 - 0.2),
        nitrogen: 280 + Math.random() * 100,
        phosphorus: 15 + Math.random() * 10,
        potassium: 180 + Math.random() * 70,
        texture: ['loamy', 'clay', 'sandy', 'silty'][Math.floor(Math.random() * 4)],
        bulkDensity: 1.3 + (Math.random() * 0.2 - 0.1),
        cec: 15 + Math.random() * 10,
        moisture: 20 + Math.random() * 15
      };

      // Cache the data
      await db.setCachedData(cacheKey, mockData, undefined, 7 * 24 * 60 * 60 * 1000); // Cache for 7 days

      return mockData;
    } catch (error) {
      console.error('Error fetching SoilGrid data:', error);
      return null;
    }
  }

  // Analyze soil health and generate recommendations
  analyzeSoilHealth(soilData: SoilGridData, cropType?: string): {
    healthScore: number;
    recommendations: SoilRecommendation[];
    summary: string;
  } {
    const recommendations: SoilRecommendation[] = [];
    let healthScore = 100;

    // pH Analysis
    const optimalPH = this.getOptimalPH(cropType);
    if (soilData.ph < optimalPH.min || soilData.ph > optimalPH.max) {
      const phDiff = soilData.ph < optimalPH.min ? optimalPH.min - soilData.ph : soilData.ph - optimalPH.max;
      healthScore -= Math.min(20, phDiff * 10);
      
      recommendations.push({
        parameter: 'pH Level',
        currentValue: soilData.ph,
        optimalRange: `${optimalPH.min} - ${optimalPH.max}`,
        recommendation: soilData.ph < optimalPH.min 
          ? 'Apply lime to increase soil pH' 
          : 'Apply sulfur or organic matter to decrease pH',
        priority: phDiff > 1 ? 'high' : 'medium',
        products: soilData.ph < optimalPH.min
          ? [{ name: 'Agricultural Lime', quantity: '2-3 tons/acre', timing: 'Before planting' }]
          : [{ name: 'Elemental Sulfur', quantity: '500-800 kg/acre', timing: 'Before planting' }]
      });
    }

    // Organic Carbon Analysis
    if (soilData.organicCarbon < 0.75) {
      healthScore -= 15;
      recommendations.push({
        parameter: 'Organic Carbon',
        currentValue: soilData.organicCarbon,
        optimalRange: '> 0.75%',
        recommendation: 'Increase organic matter through compost or green manure',
        priority: soilData.organicCarbon < 0.5 ? 'high' : 'medium',
        products: [
          { name: 'Farm Yard Manure', quantity: '10-15 tons/acre', timing: 'Before land preparation' },
          { name: 'Vermicompost', quantity: '2-3 tons/acre', timing: 'During sowing' }
        ]
      });
    }

    // NPK Analysis
    const npkAnalysis = this.analyzeNPK(soilData, cropType);
    recommendations.push(...npkAnalysis.recommendations);
    healthScore -= npkAnalysis.penalty;

    // Texture and Structure
    if (soilData.bulkDensity > 1.6) {
      healthScore -= 10;
      recommendations.push({
        parameter: 'Soil Compaction',
        currentValue: `${soilData.bulkDensity} g/cm³`,
        optimalRange: '< 1.6 g/cm³',
        recommendation: 'Improve soil structure through deep plowing and organic matter addition',
        priority: 'medium',
        products: [
          { name: 'Gypsum', quantity: '500 kg/acre', timing: 'Before plowing' }
        ]
      });
    }

    // CEC Analysis
    if (soilData.cec < 10) {
      healthScore -= 10;
      recommendations.push({
        parameter: 'Cation Exchange Capacity',
        currentValue: soilData.cec,
        optimalRange: '> 10 meq/100g',
        recommendation: 'Add organic matter and clay minerals to improve nutrient retention',
        priority: 'low',
        products: [
          { name: 'Bentonite Clay', quantity: '200-300 kg/acre', timing: 'During land preparation' }
        ]
      });
    }

    // Generate summary
    const summary = this.generateHealthSummary(healthScore, recommendations);

    return {
      healthScore: Math.max(0, healthScore),
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
      summary
    };
  }

  private getOptimalPH(cropType?: string): { min: number; max: number } {
    const cropPHRanges: { [key: string]: { min: number; max: number } } = {
      'rice': { min: 5.5, max: 7.0 },
      'wheat': { min: 6.0, max: 7.5 },
      'cotton': { min: 6.0, max: 7.8 },
      'sugarcane': { min: 6.0, max: 8.0 },
      'maize': { min: 5.8, max: 7.0 },
      'pulses': { min: 6.0, max: 7.5 },
      'vegetables': { min: 6.0, max: 7.0 },
      'fruits': { min: 6.0, max: 7.5 }
    };

    return cropPHRanges[cropType?.toLowerCase() || ''] || { min: 6.0, max: 7.5 };
  }

  private analyzeNPK(soilData: SoilGridData, cropType?: string): {
    recommendations: SoilRecommendation[];
    penalty: number;
  } {
    const recommendations: SoilRecommendation[] = [];
    let penalty = 0;

    // Nitrogen
    const nLevel = this.getNutrientLevel(soilData.nitrogen, 'nitrogen');
    if (nLevel !== 'medium' && nLevel !== 'high') {
      penalty += 10;
      recommendations.push({
        parameter: 'Nitrogen',
        currentValue: soilData.nitrogen,
        optimalRange: '280-560 kg/ha',
        recommendation: nLevel === 'low' 
          ? 'Apply nitrogen fertilizers in split doses'
          : 'Reduce nitrogen application to prevent leaching',
        priority: nLevel === 'low' ? 'high' : 'medium',
        products: nLevel === 'low'
          ? [
              { name: 'Urea', quantity: '100-150 kg/acre', timing: 'Split application' },
              { name: 'DAP', quantity: '50-75 kg/acre', timing: 'Basal dose' }
            ]
          : []
      });
    }

    // Phosphorus
    const pLevel = this.getNutrientLevel(soilData.phosphorus, 'phosphorus');
    if (pLevel !== 'medium' && pLevel !== 'high') {
      penalty += 10;
      recommendations.push({
        parameter: 'Phosphorus',
        currentValue: soilData.phosphorus,
        optimalRange: '10-25 kg/ha',
        recommendation: pLevel === 'low'
          ? 'Apply phosphatic fertilizers as basal dose'
          : 'Reduce phosphorus to prevent fixation',
        priority: pLevel === 'low' ? 'high' : 'low',
        products: pLevel === 'low'
          ? [
              { name: 'SSP', quantity: '150-200 kg/acre', timing: 'Basal application' },
              { name: 'Rock Phosphate', quantity: '200-300 kg/acre', timing: 'Before planting' }
            ]
          : []
      });
    }

    // Potassium
    const kLevel = this.getNutrientLevel(soilData.potassium, 'potassium');
    if (kLevel !== 'medium' && kLevel !== 'high') {
      penalty += 10;
      recommendations.push({
        parameter: 'Potassium',
        currentValue: soilData.potassium,
        optimalRange: '110-280 kg/ha',
        recommendation: kLevel === 'low'
          ? 'Apply potassic fertilizers for better fruit/grain development'
          : 'Monitor potassium levels, may cause nutrient imbalance',
        priority: kLevel === 'low' ? 'medium' : 'low',
        products: kLevel === 'low'
          ? [
              { name: 'MOP', quantity: '40-60 kg/acre', timing: 'Split application' },
              { name: 'SOP', quantity: '50-75 kg/acre', timing: 'During fruiting' }
            ]
          : []
      });
    }

    return { recommendations, penalty };
  }

  private getNutrientLevel(value: number, nutrient: 'nitrogen' | 'phosphorus' | 'potassium'): 'low' | 'medium' | 'high' {
    const thresholds = {
      nitrogen: { low: 280, high: 560 },
      phosphorus: { low: 10, high: 25 },
      potassium: { low: 110, high: 280 }
    };

    const threshold = thresholds[nutrient];
    if (value < threshold.low) return 'low';
    if (value > threshold.high) return 'high';
    return 'medium';
  }

  private generateHealthSummary(healthScore: number, recommendations: SoilRecommendation[]): string {
    const highPriorityCount = recommendations.filter(r => r.priority === 'high').length;
    const mediumPriorityCount = recommendations.filter(r => r.priority === 'medium').length;

    if (healthScore >= 80) {
      return `Excellent soil health! Your soil is well-balanced with ${recommendations.length} minor suggestions for optimization.`;
    } else if (healthScore >= 60) {
      return `Good soil health with room for improvement. Address ${highPriorityCount} high priority issues for better crop yield.`;
    } else if (healthScore >= 40) {
      return `Fair soil health. Immediate attention needed for ${highPriorityCount} critical parameters and ${mediumPriorityCount} moderate issues.`;
    } else {
      return `Poor soil health requiring urgent intervention. ${highPriorityCount + mediumPriorityCount} parameters need correction for sustainable farming.`;
    }
  }

  // Save soil test report
  async saveSoilTestReport(
    landId: string,
    tenantId: string,
    reportData: {
      testDate: string;
      labName?: string;
      reportUrl?: string;
      parameters: Partial<SoilGridData>;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('soil_health')
        .upsert({
          land_id: landId,
          tenant_id: tenantId,
          ph_level: reportData.parameters.ph,
          organic_carbon: reportData.parameters.organicCarbon,
          nitrogen_level: this.getNutrientLevel(reportData.parameters.nitrogen || 0, 'nitrogen'),
          phosphorus_level: this.getNutrientLevel(reportData.parameters.phosphorus || 0, 'phosphorus'),
          potassium_level: this.getNutrientLevel(reportData.parameters.potassium || 0, 'potassium'),
          texture: reportData.parameters.texture,
          bulk_density: reportData.parameters.bulkDensity,
          test_date: reportData.testDate,
          test_report_url: reportData.reportUrl,
          source: 'lab_test' as const
        });

      if (error) throw error;

      // Cache the data locally
      await db.setCachedData(
        `soil_test_${landId}`,
        reportData,
        undefined,
        30 * 24 * 60 * 60 * 1000 // Cache for 30 days
      );
    } catch (error) {
      console.error('Error saving soil test report:', error);
      throw error;
    }
  }

  // Get historical soil data
  async getHistoricalSoilData(landId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('soil_health')
        .select('*')
        .eq('land_id', landId)
        .order('test_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching historical soil data:', error);
      
      // Return cached data if available
      const cached = await db.getCachedData(`soil_history_${landId}`);
      return cached || [];
    }
  }

  // Generate soil health trends
  analyzeTrends(historicalData: any[]): {
    parameter: string;
    trend: 'improving' | 'stable' | 'declining';
    changePercentage: number;
  }[] {
    if (historicalData.length < 2) return [];

    const trends: any[] = [];
    const latest = historicalData[0];
    const previous = historicalData[1];

    // pH trend
    if (latest.ph_level && previous.ph_level) {
      const change = ((latest.ph_level - previous.ph_level) / previous.ph_level) * 100;
      trends.push({
        parameter: 'pH Level',
        trend: Math.abs(change) < 5 ? 'stable' : change > 0 ? 'improving' : 'declining',
        changePercentage: change
      });
    }

    // Organic carbon trend
    if (latest.organic_carbon && previous.organic_carbon) {
      const change = ((latest.organic_carbon - previous.organic_carbon) / previous.organic_carbon) * 100;
      trends.push({
        parameter: 'Organic Carbon',
        trend: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
        changePercentage: change
      });
    }

    return trends;
  }
}

export const soilHealthService = SoilHealthService.getInstance();