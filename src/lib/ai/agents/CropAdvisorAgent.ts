
import { BaseAgent } from '../BaseAgent';
import { AgentContext, AgentResponse, AgentConfig } from '@/types/ai';

export class CropAdvisorAgent extends BaseAgent {
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

      const prompt = this.buildContextualPrompt(query, context);
      const response = await this.callOpenAI(prompt, context);
      
      const agentResponse: AgentResponse = {
        id: `crop-${Date.now()}`,
        agentType: 'crop_advisor',
        message: response.message,
        confidence: response.confidence,
        metadata: {
          cropSuggestions: response.crops,
          seasonalAdvice: response.seasonal,
          weatherConsiderations: response.weather,
        },
        suggestedActions: [
          {
            type: 'schedule',
            label: 'Schedule Field Visit',
            data: { type: 'field_visit', crop: response.recommendedCrop },
          },
          {
            type: 'purchase',
            label: 'Buy Seeds',
            data: { category: 'seeds', crop: response.recommendedCrop },
          },
        ],
        processingTime: performance.now() - startTime,
      };

      await this.logInteraction(query, agentResponse, context);
      return agentResponse;
      
    } catch (error) {
      console.error('CropAdvisorAgent error:', error);
      return await this.getOfflineResponse(query, context);
    }
  }

  private async callOpenAI(prompt: string, context: AgentContext): Promise<any> {
    // This would integrate with OpenAI API via Edge Function
    // For now, return mock response
    return {
      message: this.getMockCropAdvice(context),
      confidence: 0.85,
      crops: ['wheat', 'mustard'],
      seasonal: 'Good time for Rabi crops',
      weather: 'Favorable conditions expected',
      recommendedCrop: 'wheat',
    };
  }

  private getMockCropAdvice(context: AgentContext): string {
    const { language, location, farmingProfile } = context;
    
    const advice = {
      hi: `आपकी ${farmingProfile?.landArea || 2} एकड़ भूमि के लिए इस समय गेहूं और सरसों की बुआई उत्तम होगी। मिट्टी की जांच के अनुसार यूरिया और DAP का प्रयोग करें।`,
      en: `For your ${farmingProfile?.landArea || 2} acre land, wheat and mustard would be ideal crops for this season. Based on soil analysis, use urea and DAP fertilizers.`,
    };
    
    return advice[language] || advice.en;
  }
}
