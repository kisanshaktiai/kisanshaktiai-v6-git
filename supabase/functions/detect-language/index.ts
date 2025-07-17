import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DetectLanguageRequest {
  text: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text }: DetectLanguageRequest = await req.json();
    
    if (!text || text.trim().length === 0) {
      throw new Error('Text is required');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    console.log(`Detecting language for: "${text.substring(0, 50)}..."`);

    // Use OpenAI to detect language with agricultural context
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a language detection expert specializing in Indian languages and agricultural content. 
            Detect the primary language of the given text. The text may contain agricultural terms, crop names, or farming-related vocabulary.
            
            Return only the ISO language code from this list:
            - hi (Hindi)
            - en (English)
            - mr (Marathi)
            - ta (Tamil)
            - te (Telugu)
            - gu (Gujarati)
            - kn (Kannada)
            - pa (Punjabi)
            
            If the language is not in this list or cannot be determined, return "hi" as default.
            Return only the language code, nothing else.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0,
        max_tokens: 10
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI language detection error:', errorText);
      throw new Error(`Language detection API error: ${response.status}`);
    }

    const result = await response.json();
    let detectedLanguage = result.choices[0]?.message?.content?.trim() || 'hi';

    // Validate the detected language
    const supportedLanguages = ['hi', 'en', 'mr', 'ta', 'te', 'gu', 'kn', 'pa'];
    if (!supportedLanguages.includes(detectedLanguage)) {
      detectedLanguage = 'hi'; // Default to Hindi
    }

    console.log(`Language detected: ${detectedLanguage}`);

    return new Response(
      JSON.stringify({ 
        language: detectedLanguage,
        confidence: 'high' // OpenAI doesn't provide confidence scores, but we can assume high confidence
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in detect-language function:', error);
    
    return new Response(
      JSON.stringify({ 
        language: 'hi', // Default fallback
        confidence: 'low',
        error: error.message
      }),
      {
        status: 200, // Return 200 with fallback language instead of error
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});