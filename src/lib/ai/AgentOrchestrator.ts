
import { AgentContext, AgentResponse, AgentType, AgentConfig } from '@/types/ai';
import { CropAdvisorAgent } from './agents/CropAdvisorAgent';
import { WeatherAgent } from './agents/WeatherAgent';
import { BaseAgent } from './BaseAgent';

export class AgentOrchestrator {
  private agents: Map<AgentType, BaseAgent> = new Map();
  private configs: Map<string, AgentConfig[]> = new Map(); // tenantId -> configs

  constructor() {
    this.initializeAgents();
  }

  private initializeAgents(): void {
    // Default configurations for each agent type
    const defaultConfigs: Record<AgentType, Partial<AgentConfig>> = {
      crop_advisor: {
        agentType: 'crop_advisor',
        settings: {
          model: 'gpt-4o-mini',
          temperature: 0.3,
          maxTokens: 500,
          offlineCapable: true,
          priority: 1,
        },
        prompts: {
          system: 'You are an expert crop advisor for Indian farmers. Provide practical, region-specific cultivation advice in the farmer\'s preferred language.',
        },
      },
      weather: {
        agentType: 'weather',
        settings: {
          model: 'gpt-4o-mini',
          temperature: 0.1,
          maxTokens: 300,
          offlineCapable: false,
          priority: 2,
        },
        prompts: {
          system: 'You are a weather expert for farmers. Provide actionable farming advice based on weather forecasts and alerts.',
        },
      },
      fertilizer_guide: {
        agentType: 'fertilizer_guide',
        settings: { offlineCapable: true, priority: 3 },
        prompts: { system: 'You are a fertilizer and soil nutrition expert.' },
      },
      image_scan: {
        agentType: 'image_scan',
        settings: { offlineCapable: true, priority: 4 },
        prompts: { system: 'You are a plant disease and pest identification expert.' },
      },
      market_advisor: {
        agentType: 'market_advisor',
        settings: { offlineCapable: false, priority: 5 },
        prompts: { system: 'You are a market price and trading expert for agricultural products.' },
      },
      community: {
        agentType: 'community',
        settings: { offlineCapable: true, priority: 6 },
        prompts: { system: 'You help farmers connect and share knowledge.' },
      },
      language: {
        agentType: 'language',
        settings: { offlineCapable: true, priority: 7 },
        prompts: { system: 'You are a language translation and communication assistant.' },
      },
      financial: {
        agentType: 'financial',
        settings: { offlineCapable: false, priority: 8 },
        prompts: { system: 'You are a financial advisor for farmers, helping with loans and insurance.' },
      },
    };

    // Initialize base agents (will be customized per tenant)
    this.agents.set('crop_advisor', new CropAdvisorAgent(defaultConfigs.crop_advisor as AgentConfig));
    this.agents.set('weather', new WeatherAgent(defaultConfigs.weather as AgentConfig));
  }

  async loadTenantConfigs(tenantId: string): Promise<void> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Fetch tenant-specific agent configurations with type assertion
      const { data: tenantFeatures } = await (supabase as any)
        .from('tenant_features')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (tenantFeatures) {
        const configs: AgentConfig[] = [];
        
        // Build configs based on enabled features
        if (tenantFeatures.crop_advisory) {
          configs.push(this.buildTenantConfig(tenantId, 'crop_advisor'));
        }
        if (tenantFeatures.weather_forecasts) {
          configs.push(this.buildTenantConfig(tenantId, 'weather'));
        }
        // Add more agents based on features...

        this.configs.set(tenantId, configs);
      }
    } catch (error) {
      console.error('Failed to load tenant configs:', error);
    }
  }

  private buildTenantConfig(tenantId: string, agentType: AgentType): AgentConfig {
    // Build tenant-specific configuration
    // This would customize prompts, models, and settings based on tenant preferences
    return {
      tenantId,
      agentType,
      isEnabled: true,
      settings: {
        model: 'gpt-4o-mini',
        temperature: 0.3,
        maxTokens: 500,
        offlineCapable: true,
        priority: 1,
      },
      prompts: {
        system: `You are an AI assistant for ${tenantId}. Provide helpful farming advice.`,
      },
    };
  }

  async processQuery(
    query: string,
    agentType: AgentType,
    context: AgentContext
  ): Promise<AgentResponse> {
    try {
      // Load tenant configs if not already loaded
      if (!this.configs.has(context.tenantId)) {
        await this.loadTenantConfigs(context.tenantId);
      }

      const agent = this.agents.get(agentType);
      if (!agent) {
        throw new Error(`Agent type ${agentType} not found`);
      }

      return await agent.processQuery(query, context);
    } catch (error) {
      console.error('AgentOrchestrator error:', error);
      
      // Return fallback response
      return {
        id: `fallback-${Date.now()}`,
        agentType,
        message: 'Sorry, I encountered an error processing your request. Please try again.',
        confidence: 0.1,
        processingTime: 10,
      };
    }
  }

  async classifyQuery(query: string, context: AgentContext): Promise<AgentType> {
    // Simple rule-based classification (would be enhanced with ML)
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('weather') || lowerQuery.includes('rain') || lowerQuery.includes('मौसम')) {
      return 'weather';
    }
    if (lowerQuery.includes('crop') || lowerQuery.includes('seed') || lowerQuery.includes('फसल')) {
      return 'crop_advisor';
    }
    if (lowerQuery.includes('fertilizer') || lowerQuery.includes('urea') || lowerQuery.includes('खाद')) {
      return 'fertilizer_guide';
    }
    if (lowerQuery.includes('price') || lowerQuery.includes('market') || lowerQuery.includes('बाजार')) {
      return 'market_advisor';
    }
    
    // Default to crop advisor
    return 'crop_advisor';
  }

  setOfflineMode(isOffline: boolean): void {
    this.agents.forEach(agent => agent.setOnlineStatus(!isOffline));
  }
}

// Singleton instance
export const agentOrchestrator = new AgentOrchestrator();
