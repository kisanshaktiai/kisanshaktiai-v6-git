
import { BaseAgent } from '../BaseAgent';
import { AgentContext, AgentResponse, AgentConfig } from '@/types/ai';

export class WeatherAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    super(config);
  }

  async processQuery(
    query: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    const startTime = performance.now();
    
    try {
      if (!this.isOnline) {
        return await this.getOfflineResponse(query, context);
      }

      const weatherData = await this.getWeatherData(context.location);
      const farmingAdvice = this.generateFarmingAdvice(weatherData, context);
      
      const agentResponse: AgentResponse = {
        id: `weather-${Date.now()}`,
        agentType: 'weather',
        message: farmingAdvice,
        confidence: 0.9,
        metadata: {
          forecast: weatherData.forecast,
          alerts: weatherData.alerts,
          farmingRecommendations: weatherData.farmingTips,
        },
        suggestedActions: [
          {
            type: 'schedule',
            label: context.language === 'hi' ? 'सिंचाई की योजना बनाएं' : 'Plan Irrigation',
            data: { type: 'irrigation', days: weatherData.dryDays },
          },
        ],
        processingTime: performance.now() - startTime,
      };

      await this.logInteraction(query, agentResponse, context);
      return agentResponse;
      
    } catch (error) {
      console.error('WeatherAgent error:', error);
      return await this.getOfflineResponse(query, context);
    }
  }

  private async getWeatherData(location?: any): Promise<any> {
    // Mock weather data - would integrate with weather API
    return {
      forecast: '25°C, Partly cloudy, 30% chance of rain',
      alerts: ['Heavy rain expected in 2 days'],
      farmingTips: ['Good time for pesticide application', 'Avoid irrigation for next 2 days'],
      dryDays: 5,
    };
  }

  private generateFarmingAdvice(weatherData: any, context: AgentContext): string {
    const { language } = context;
    
    const advice = {
      hi: `मौसम पूर्वानुमान: ${weatherData.forecast}। कृषि सुझाव: ${weatherData.farmingTips.join(', ')}`,
      en: `Weather forecast: ${weatherData.forecast}. Farming advice: ${weatherData.farmingTips.join(', ')}`,
    };
    
    return advice[language] || advice.en;
  }
}
