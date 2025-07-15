
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIRequest {
  query: string;
  agentType: string;
  context: {
    farmerId: string;
    tenantId: string;
    language: string;
    location?: any;
    farmingProfile?: any;
    sessionId: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, agentType, context }: AIRequest = await req.json();
    
    console.log('AI request:', { query, agentType, context });

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get tenant-specific configuration
    const { data: tenantFeatures } = await supabase
      .from('tenant_features')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .single();

    if (!tenantFeatures) {
      throw new Error('Tenant not found or features not configured');
    }

    // Check if agent is enabled for tenant
    const agentEnabled = getAgentEnabledStatus(agentType, tenantFeatures);
    if (!agentEnabled) {
      throw new Error(`Agent ${agentType} not enabled for this tenant`);
    }

    // Process with OpenAI based on agent type
    const openAIResponse = await processWithOpenAI(query, agentType, context);
    
    // Log interaction
    await supabase.from('ai_interactions').insert({
      farmer_id: context.farmerId,
      tenant_id: context.tenantId,
      session_id: context.sessionId,
      query_text: query,
      query_language: context.language,
      response_text: openAIResponse.message,
      interaction_type: agentType,
      processing_time_ms: openAIResponse.processingTime,
      confidence_score: openAIResponse.confidence,
      ai_model_version: 'gpt-4o-mini',
      location_context: context.location,
    });

    return new Response(JSON.stringify(openAIResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI orchestrator error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        fallbackMessage: 'I apologize, but I encountered an error. Please try again later.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getAgentEnabledStatus(agentType: string, features: any): boolean {
  const agentFeatureMap: Record<string, keyof typeof features> = {
    'crop_advisor': 'crop_advisory',
    'weather': 'weather_forecasts',
    'fertilizer_guide': 'crop_advisory',
    'market_advisor': 'marketplace',
    'financial': 'loan_assistance',
    'image_scan': 'crop_advisory',
    'community': 'analytics_dashboard',
    'language': 'multilingual_support',
  };

  const featureKey = agentFeatureMap[agentType];
  return featureKey ? features[featureKey] : false;
}

async function processWithOpenAI(query: string, agentType: string, context: any) {
  const startTime = performance.now();
  
  try {
    const systemPrompts: Record<string, string> = {
      crop_advisor: `You are an expert crop advisor for Indian farmers. Provide practical, region-specific cultivation advice in ${context.language}. Focus on sustainable farming practices, seasonal recommendations, and local varieties.`,
      weather: `You are a weather expert for farmers. Provide actionable farming advice based on weather conditions in ${context.language}. Include irrigation, pesticide application, and crop protection recommendations.`,
      fertilizer_guide: `You are a fertilizer and soil nutrition expert. Provide specific NPK recommendations, organic alternatives, and application schedules in ${context.language}.`,
      market_advisor: `You are a market expert for agricultural products. Provide price trends, best selling times, and market selection advice in ${context.language}.`,
      financial: `You are a financial advisor for farmers. Help with loan eligibility, insurance options, and government subsidies in ${context.language}.`,
    };

    const prompt = systemPrompts[agentType] || systemPrompts.crop_advisor;

    // Call OpenAI (mock response for now)
    const mockResponse = generateMockResponse(agentType, query, context);
    
    return {
      id: `ai-${Date.now()}`,
      agentType,
      message: mockResponse,
      confidence: 0.85,
      processingTime: performance.now() - startTime,
      metadata: {
        model: 'gpt-4o-mini',
        language: context.language,
      },
    };

  } catch (error) {
    throw new Error(`OpenAI processing failed: ${error.message}`);
  }
}

function generateMockResponse(agentType: string, query: string, context: any): string {
  const { language } = context;
  
  const responses: Record<string, Record<string, string>> = {
    crop_advisor: {
      hi: 'आपकी मिट्टी और मौसम के अनुसार, इस समय गेहूं और सरसों की बुआई सबसे अच्छी होगी। बीज दर 100 किलो प्रति हेक्टेयर रखें।',
      en: 'Based on your soil and weather conditions, wheat and mustard would be ideal crops for this season. Use a seed rate of 100 kg per hectare.',
    },
    weather: {
      hi: 'अगले 3 दिन हल्की बारिश की संभावना है। कीटनाशक का छिड़काव टालें और सिंचाई की जरूरत नहीं।',
      en: 'Light rainfall expected in the next 3 days. Avoid pesticide application and irrigation is not needed.',
    },
    fertilizer_guide: {
      hi: 'आपकी फसल के लिए 120 किलो यूरिया, 60 किलो DAP प्रति हेक्टेयर डालें। पहली डोज बुआई के समय।',
      en: 'For your crop, apply 120 kg urea and 60 kg DAP per hectare. First dose at sowing time.',
    },
  };

  const agentResponses = responses[agentType] || responses.crop_advisor;
  return agentResponses[language] || agentResponses.en;
}
