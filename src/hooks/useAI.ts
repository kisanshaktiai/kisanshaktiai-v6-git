
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AIContext {
  farmerInfo?: any;
  landInfo?: any;
  weatherInfo?: any;
  cropInfo?: any;
  userProfile?: any;
  tenant?: any;
}

export const useAI = () => {
  const [loading, setLoading] = useState(false);

  const generateContextualPrompt = (userQuery: string, context: AIContext = {}) => {
    let contextPrompt = `User Query: ${userQuery}\n\nContext:\n`;
    
    if (context.farmerInfo) {
      const farmer = context.farmerInfo;
      contextPrompt += `Farmer Profile:
- Primary Crops: ${farmer.primary_crops || 'Not specified'}
- Total Land: ${farmer.total_land_acres || 'Not specified'} acres
- Experience: ${farmer.farming_experience_years || 'Not specified'} years
- Location: ${farmer.village || 'Not specified'}, ${farmer.district || 'Not specified'}
`;
    }

    if (context.userProfile) {
      const profile = context.userProfile;
      contextPrompt += `User Profile:
- Language: ${profile.preferred_language || 'Not specified'}
- Name: ${profile.full_name || 'Not specified'}
`;
    }

    if (context.landInfo && context.landInfo.length > 0) {
      contextPrompt += `\nLand Information:\n`;
      context.landInfo.forEach((land: any, index: number) => {
        contextPrompt += `Land ${index + 1}: ${land.name} - ${land.area_acres} acres, Current Crop: ${land.current_crop || 'None'}\n`;
      });
    }

    if (context.weatherInfo) {
      contextPrompt += `\nWeather Context: ${JSON.stringify(context.weatherInfo)}\n`;
    }

    if (context.cropInfo) {
      contextPrompt += `\nCrop Context: ${JSON.stringify(context.cropInfo)}\n`;
    }

    return contextPrompt;
  };

  const queryAI = async (userQuery: string, context: AIContext = {}) => {
    setLoading(true);
    try {
      const contextualPrompt = generateContextualPrompt(userQuery, context);
      
      const { data, error } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          query: contextualPrompt,
          context: context
        }
      });

      if (error) throw error;

      return {
        success: true,
        response: data.response,
        suggestions: data.suggestions || []
      };
    } catch (error) {
      console.error('AI Query Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    queryAI,
    loading,
    generateContextualPrompt
  };
};
