import { supabase } from '@/integrations/supabase/client';
import { LanguageService } from './LanguageService';

export interface TranslationRequest {
  text: string;
  fromLanguage: string;
  toLanguage: string;
}

export interface TranslationCache {
  [key: string]: string;
}

export class TranslationService {
  private static instance: TranslationService;
  private cache: TranslationCache = {};
  private languageService: LanguageService;

  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  constructor() {
    this.languageService = LanguageService.getInstance();
    this.loadCacheFromStorage();
  }

  private loadCacheFromStorage(): void {
    try {
      const cached = localStorage.getItem('translation_cache');
      if (cached) {
        this.cache = JSON.parse(cached);
      }
    } catch (error) {
      console.error('Failed to load translation cache:', error);
    }
  }

  private saveCacheToStorage(): void {
    try {
      localStorage.setItem('translation_cache', JSON.stringify(this.cache));
    } catch (error) {
      console.error('Failed to save translation cache:', error);
    }
  }

  private getCacheKey(text: string, fromLang: string, toLang: string): string {
    return `${fromLang}-${toLang}-${text}`;
  }

  async translateText(request: TranslationRequest): Promise<string> {
    const { text, fromLanguage, toLanguage } = request;
    
    // Check if same language
    if (fromLanguage === toLanguage) {
      return text;
    }

    // Check cache first
    const cacheKey = this.getCacheKey(text, fromLanguage, toLanguage);
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    try {
      // Use edge function for translation
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: {
          text,
          from: fromLanguage,
          to: toLanguage
        }
      });

      if (error) throw error;

      const translatedText = data?.translatedText || text;
      
      // Cache the result
      this.cache[cacheKey] = translatedText;
      this.saveCacheToStorage();

      return translatedText;
    } catch (error) {
      console.error('Translation failed:', error);
      return text; // Return original text on failure
    }
  }

  async translateBatch(texts: string[], fromLanguage: string, toLanguage: string): Promise<string[]> {
    const promises = texts.map(text => 
      this.translateText({ text, fromLanguage, toLanguage })
    );
    
    return Promise.all(promises);
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('detect-language', {
        body: { text }
      });

      if (error) throw error;
      return data?.language || 'hi'; // Default to Hindi
    } catch (error) {
      console.error('Language detection failed:', error);
      return 'hi';
    }
  }

  async translateUserContent(content: string, targetLanguage?: string): Promise<string> {
    const currentLanguage = this.languageService.getCurrentLanguage();
    const target = targetLanguage || currentLanguage;

    if (!content || content.trim().length === 0) {
      return content;
    }

    // Detect source language
    const sourceLanguage = await this.detectLanguage(content);
    
    return this.translateText({
      text: content,
      fromLanguage: sourceLanguage,
      toLanguage: target
    });
  }

  async translateVoiceMessage(audioBlob: Blob, targetLanguage: string): Promise<{
    originalText: string;
    translatedText: string;
    audioUrl?: string;
  }> {
    try {
      // First transcribe the audio
      const { data: transcriptData, error: transcriptError } = await supabase.functions.invoke('voice-to-text', {
        body: {
          audio: await this.blobToBase64(audioBlob),
          language: 'auto'
        }
      });

      if (transcriptError) throw transcriptError;

      const originalText = transcriptData?.text || '';
      
      // Detect source language
      const sourceLanguage = await this.detectLanguage(originalText);
      
      // Translate text
      const translatedText = await this.translateText({
        text: originalText,
        fromLanguage: sourceLanguage,
        toLanguage: targetLanguage
      });

      // Generate audio for translated text
      let audioUrl;
      try {
        const { data: audioData, error: audioError } = await supabase.functions.invoke('text-to-speech', {
          body: {
            text: translatedText,
            language: targetLanguage,
            voice: 'alloy'
          }
        });

        if (!audioError && audioData?.audioContent) {
          audioUrl = `data:audio/mp3;base64,${audioData.audioContent}`;
        }
      } catch (audioError) {
        console.error('Audio generation failed:', audioError);
      }

      return {
        originalText,
        translatedText,
        audioUrl
      };
    } catch (error) {
      console.error('Voice translation failed:', error);
      throw error;
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    const arrayBuffer = await blob.arrayBuffer();
    return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  }

  async translateImageText(imageBlob: Blob, targetLanguage: string): Promise<{
    extractedText: string;
    translatedText: string;
  }> {
    try {
      // Extract text from image using OCR
      const { data: ocrData, error: ocrError } = await supabase.functions.invoke('extract-text-from-image', {
        body: {
          image: await this.blobToBase64(imageBlob)
        }
      });

      if (ocrError) throw ocrError;

      const extractedText = ocrData?.text || '';
      
      if (!extractedText) {
        return { extractedText: '', translatedText: '' };
      }

      // Detect and translate
      const sourceLanguage = await this.detectLanguage(extractedText);
      const translatedText = await this.translateText({
        text: extractedText,
        fromLanguage: sourceLanguage,
        toLanguage: targetLanguage
      });

      return {
        extractedText,
        translatedText
      };
    } catch (error) {
      console.error('Image text translation failed:', error);
      throw error;
    }
  }

  getTransliterationOptions(language: string): string[] {
    const transliterationMap: Record<string, string[]> = {
      'hi': ['devanagari', 'roman'],
      'ta': ['tamil', 'roman'],
      'te': ['telugu', 'roman'],
      'gu': ['gujarati', 'roman'],
      'kn': ['kannada', 'roman'],
      'mr': ['devanagari', 'roman'],
      'pa': ['gurmukhi', 'roman']
    };

    return transliterationMap[language] || ['roman'];
  }

  async transliterate(text: string, fromScript: string, toScript: string): Promise<string> {
    if (fromScript === toScript) return text;

    try {
      const { data, error } = await supabase.functions.invoke('transliterate-text', {
        body: {
          text,
          from: fromScript,
          to: toScript
        }
      });

      if (error) throw error;
      return data?.transliteratedText || text;
    } catch (error) {
      console.error('Transliteration failed:', error);
      return text;
    }
  }

  clearCache(): void {
    this.cache = {};
    localStorage.removeItem('translation_cache');
  }

  getCacheSize(): number {
    return Object.keys(this.cache).length;
  }
}