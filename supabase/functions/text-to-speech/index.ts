import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TextToSpeechRequest {
  text: string;
  voice?: string;
  language?: string;
  model?: string;
  format?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, voice, language, model, format }: TextToSpeechRequest = await req.json();
    
    if (!text) {
      throw new Error('Text is required');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Map language codes to appropriate voices
    const getVoiceForLanguage = (lang?: string, voicePreference?: string): string => {
      if (voicePreference) return voicePreference;
      
      const voiceMap: Record<string, string> = {
        'hi': 'alloy',    // Hindi
        'hi-IN': 'alloy',
        'en': 'nova',     // English
        'en-US': 'nova',
        'en-IN': 'nova',
        'mr': 'alloy',    // Marathi
        'ta': 'alloy',    // Tamil
        'te': 'alloy',    // Telugu
        'gu': 'alloy',    // Gujarati
        'kn': 'alloy',    // Kannada
        'pa': 'alloy',    // Punjabi
      };

      return voiceMap[lang || 'hi'] || 'alloy';
    };

    const selectedVoice = getVoiceForLanguage(language, voice);
    
    console.log(`Generating speech for text: "${text.substring(0, 50)}..." with voice: ${selectedVoice}`);

    // Generate speech using OpenAI TTS
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'tts-1',
        input: text,
        voice: selectedVoice,
        response_format: format || 'mp3',
        speed: 1.0
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI TTS API error:', errorText);
      throw new Error(`OpenAI TTS API error: ${response.status} ${errorText}`);
    }

    // Convert audio buffer to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    console.log('Speech generation successful');

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        voice: selectedVoice,
        language: language || 'hi',
        format: format || 'mp3'
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );

  } catch (error) {
    console.error('Error in text-to-speech function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Text-to-speech generation failed'
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