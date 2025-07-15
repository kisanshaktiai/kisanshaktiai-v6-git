
import { AgentContext, AgentResponse, AgentConfig, SupportedLanguage } from '@/types/ai';

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected isOnline: boolean = true;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  abstract processQuery(
    query: string, 
    context: AgentContext
  ): Promise<AgentResponse>;

  protected async translateText(
    text: string,
    targetLanguage: SupportedLanguage
  ): Promise<string> {
    // Implementation for translation service
    // This would integrate with Google Translate or local translation models
    if (targetLanguage === 'en') return text;
    
    // For now, return original text
    // TODO: Implement actual translation
    return text;
  }

  protected buildContextualPrompt(
    query: string,
    context: AgentContext
  ): string {
    const { language, location, farmingProfile } = context;
    
    let prompt = this.config.prompts.system;
    
    // Add location context
    if (location) {
      prompt += `\nLocation: ${location.district}, ${location.state}`;
    }
    
    // Add farming profile context
    if (farmingProfile) {
      prompt += `\nFarming Profile: ${farmingProfile.crops.join(', ')}, ${farmingProfile.landArea} acres`;
      if (farmingProfile.soilType) {
        prompt += `, Soil: ${farmingProfile.soilType}`;
      }
    }
    
    // Add language preference
    prompt += `\nPreferred Language: ${language}`;
    prompt += `\nUser Query: ${query}`;
    
    return prompt;
  }

  protected async logInteraction(
    query: string,
    response: AgentResponse,
    context: AgentContext
  ): Promise<void> {
    // Implementation for logging to Supabase
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      await supabase.from('ai_interactions').insert({
        farmer_id: context.farmerId,
        tenant_id: context.tenantId,
        session_id: context.sessionId,
        query_text: query,
        query_language: context.language,
        response_text: response.message,
        interaction_type: this.config.agentType,
        processing_time_ms: response.processingTime,
        confidence_score: response.confidence,
        ai_model_version: this.config.settings.model || 'base-v1',
        location_context: context.location,
      });
    } catch (error) {
      console.error('Failed to log AI interaction:', error);
    }
  }

  protected async getOfflineResponse(
    query: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    // Fallback responses for offline scenarios
    return {
      id: `offline-${Date.now()}`,
      agentType: this.config.agentType,
      message: this.getOfflineFallbackMessage(context.language),
      confidence: 0.5,
      isOffline: true,
      processingTime: 10,
    };
  }

  private getOfflineFallbackMessage(language: SupportedLanguage): string {
    const messages = {
      hi: 'क्षमा करें, इस समय ऑनलाइन सेवा उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।',
      en: 'Sorry, online service is not available right now. Please try again later.',
      mr: 'माफ करा, ऑनलाइन सेवा सध्या उपलब्ध नाही. कृपया नंतर पुन्हा प्रयत्न करा.',
      pa: 'ਮਾਫ਼ ਕਰਨਾ, ਔਨਲਾਈਨ ਸੇਵਾ ਇਸ ਸਮੇਂ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਬਾਅਦ ਵਿੱਚ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
      te: 'క్షమించండి, ఆన్‌లైన్ సేవ ప్రస్తుతం అందుబాటులో లేదు. దయచేసి తర్వాత మళ్లీ ప్రయత్నించండి.',
      ta: 'மன்னிக்கவும், ஆன்லைன் சேவை தற்போது கிடைக்கவில்லை. தயவுசெய்து பின்னர் மீண்டும் முயற்சிக்கவும்.',
      gu: 'માફ કરશો, ઓનલાઇન સેવા હાલમાં ઉપલબ્ધ નથી. કૃપા કરીને પછીથી ફરીથી પ્રયાસ કરો.',
      kn: 'ಕ್ಷಮಿಸಿ, ಆನ್‌ಲೈನ್ ಸೇವೆ ಪ್ರಸ್ತುತ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    };
    
    return messages[language] || messages.en;
  }

  public setOnlineStatus(isOnline: boolean): void {
    this.isOnline = isOnline;
  }
}
