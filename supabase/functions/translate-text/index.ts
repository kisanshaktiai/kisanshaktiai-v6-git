
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslateRequest {
  text: string;
  from: string;
  to: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, from, to }: TranslateRequest = await req.json();
    
    if (!text) {
      throw new Error('Text is required');
    }

    if (from === to) {
      return new Response(
        JSON.stringify({ translatedText: text }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Language mapping for better context - updated with new languages
    const languageNames: Record<string, string> = {
      'hi': 'Hindi',
      'en': 'English',
      'mr': 'Marathi',
      'ta': 'Tamil',
      'te': 'Telugu',
      'gu': 'Gujarati',
      'kn': 'Kannada',
      'pa': 'Punjabi',
      'bn': 'Bengali',
      'ml': 'Malayalam',
      'or': 'Odia',
      'ur': 'Urdu'
    };

    const fromLang = languageNames[from] || from;
    const toLang = languageNames[to] || to;

    console.log(`Translating from ${fromLang} to ${toLang}: "${text.substring(0, 50)}..."`);

    // Use OpenAI for translation with agricultural context
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
            content: `You are a translator specializing in agricultural and farming terminology. Translate the given text from ${fromLang} to ${toLang}. 
            Preserve agricultural terms, crop names, farming practices, and technical vocabulary accurately. 
            If you encounter regional terms or colloquialisms, provide the most appropriate equivalent.
            For Urdu text, ensure proper RTL formatting and diacritics when necessary.
            Return only the translated text without any explanations or additional formatting.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI translation error:', errorText);
      throw new Error(`Translation API error: ${response.status}`);
    }

    const result = await response.json();
    const translatedText = result.choices[0]?.message?.content?.trim() || text;

    console.log(`Translation successful: "${translatedText.substring(0, 50)}..."`);

    return new Response(
      JSON.stringify({ 
        translatedText,
        originalLanguage: fromLang,
        targetLanguage: toLang
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in translate-text function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Translation failed'
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});
