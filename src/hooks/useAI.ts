
import { useState } from 'react';
import { agentOrchestrator } from '@/lib/ai/AgentOrchestrator';
import { AgentContext, AgentResponse, AgentType, SupportedLanguage } from '@/types/ai';
import { useAuth } from './useAuth';

export const useAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { farmer, currentAssociation } = useAuth();

  const askAgent = async (
    query: string,
    agentType?: AgentType,
    language: SupportedLanguage = 'hi'
  ): Promise<AgentResponse | null> => {
    if (!farmer || !currentAssociation) {
      setError('Authentication required');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const context: AgentContext = {
        farmerId: farmer.id,
        tenantId: currentAssociation.tenant_id,
        language,
        sessionId: `session-${Date.now()}`,
        location: {
          latitude: 0,
          longitude: 0,
          district: 'Unknown',
          state: 'Unknown',
        },
        farmingProfile: {
          crops: Array.isArray(farmer.primary_crops) ? farmer.primary_crops : [],
          landArea: farmer.total_land_acres || 0,
          experience: farmer.farming_experience_years || 0,
        },
      };

      // Classify query if agent type not specified
      const targetAgentType = agentType || await agentOrchestrator.classifyQuery(query, context);
      
      const response = await agentOrchestrator.processQuery(query, targetAgentType, context);
      return response;
      
    } catch (err) {
      console.error('AI query error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process query');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const setOfflineMode = (isOffline: boolean) => {
    agentOrchestrator.setOfflineMode(isOffline);
  };

  return {
    askAgent,
    setOfflineMode,
    loading,
    error,
  };
};
