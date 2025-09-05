import { db } from '@/services/offline/db';
import { supabase } from '@/integrations/supabase/client';

export interface CachedResponse {
  query: string;
  response: string;
  confidence: number;
  context?: any;
  language: string;
  timestamp: number;
}

export interface KnowledgePack {
  id: string;
  name: string;
  cropType?: string;
  region?: string;
  language: string;
  data: {
    faqs: { question: string; answer: string; }[];
    guides: { title: string; content: string; }[];
    tips: string[];
  };
  version: number;
  downloadedAt: number;
}

export class ChatOfflineService {
  private static instance: ChatOfflineService;
  private cachedResponses: Map<string, CachedResponse> = new Map();
  private knowledgePacks: Map<string, KnowledgePack> = new Map();
  private commonQueries: Map<string, string> = new Map();

  static getInstance(): ChatOfflineService {
    if (!ChatOfflineService.instance) {
      ChatOfflineService.instance = new ChatOfflineService();
    }
    return ChatOfflineService.instance;
  }

  constructor() {
    this.initializeCommonQueries();
    this.loadCachedResponses();
  }

  private initializeCommonQueries() {
    // Initialize common farming queries with responses
    this.commonQueries.set('weather today', 'Based on your location, today\'s weather is expected to be partly cloudy with temperatures between 25-32°C. Good conditions for field work.');
    this.commonQueries.set('आज का मौसम', 'आपके क्षेत्र में आज आंशिक बादल छाए रहेंगे, तापमान 25-32°C के बीच रहेगा। खेत के काम के लिए अच्छी स्थिति है।');
    this.commonQueries.set('when to sow wheat', 'Wheat sowing is best done from mid-October to November when temperatures are between 20-25°C.');
    this.commonQueries.set('गेहूं कब बोएं', 'गेहूं की बुवाई अक्टूबर मध्य से नवंबर तक सबसे अच्छी होती है जब तापमान 20-25°C के बीच हो।');
    this.commonQueries.set('fertilizer for rice', 'Rice requires 120 kg N, 60 kg P2O5, and 40 kg K2O per hectare. Apply in 3 splits.');
    this.commonQueries.set('धान के लिए खाद', 'धान के लिए प्रति हेक्टेयर 120 किलो नाइट्रोजन, 60 किलो फास्फोरस और 40 किलो पोटाश की आवश्यकता होती है। 3 भागों में दें।');
  }

  async loadCachedResponses() {
    try {
      // Load from IndexedDB
      const cached = await db.getCachedData('chat_responses');
      if (cached) {
        cached.forEach((item: CachedResponse) => {
          this.cachedResponses.set(this.generateCacheKey(item.query, item.language), item);
        });
      }
    } catch (error) {
      console.error('Error loading cached responses:', error);
    }
  }

  private generateCacheKey(query: string, language: string): string {
    return `${query.toLowerCase().trim()}_${language}`;
  }

  async getCachedResponse(query: string, language: string): Promise<CachedResponse | null> {
    const key = this.generateCacheKey(query, language);
    
    // Check exact match
    if (this.cachedResponses.has(key)) {
      const response = this.cachedResponses.get(key)!;
      // Check if cache is not too old (7 days)
      if (Date.now() - response.timestamp < 7 * 24 * 60 * 60 * 1000) {
        return response;
      }
    }

    // Check common queries
    const commonKey = query.toLowerCase().trim();
    if (this.commonQueries.has(commonKey)) {
      return {
        query,
        response: this.commonQueries.get(commonKey)!,
        confidence: 0.8,
        language,
        timestamp: Date.now()
      };
    }

    // Try fuzzy matching for similar queries
    return this.findSimilarResponse(query, language);
  }

  private findSimilarResponse(query: string, language: string): CachedResponse | null {
    const queryWords = query.toLowerCase().split(' ');
    let bestMatch: CachedResponse | null = null;
    let bestScore = 0;

    this.cachedResponses.forEach((response, key) => {
      if (!key.endsWith(`_${language}`)) return;
      
      const cachedWords = response.query.toLowerCase().split(' ');
      const commonWords = queryWords.filter(word => cachedWords.includes(word));
      const score = commonWords.length / Math.max(queryWords.length, cachedWords.length);
      
      if (score > 0.6 && score > bestScore) {
        bestScore = score;
        bestMatch = response;
      }
    });

    if (bestMatch) {
      return {
        ...bestMatch,
        confidence: bestMatch.confidence * bestScore
      };
    }

    return null;
  }

  async cacheResponse(query: string, response: string, language: string, confidence: number = 1) {
    const cachedResponse: CachedResponse = {
      query,
      response,
      confidence,
      language,
      timestamp: Date.now()
    };

    const key = this.generateCacheKey(query, language);
    this.cachedResponses.set(key, cachedResponse);

    // Save to IndexedDB
    try {
      const allResponses = Array.from(this.cachedResponses.values());
      await db.setCachedData('chat_responses', allResponses);
    } catch (error) {
      console.error('Error caching response:', error);
    }
  }

  async downloadKnowledgePack(packId: string, cropType?: string, region?: string): Promise<boolean> {
    try {
      // In production, this would download from server
      const mockPack: KnowledgePack = {
        id: packId,
        name: `${cropType || 'General'} Knowledge Pack - ${region || 'All India'}`,
        cropType,
        region,
        language: 'hi',
        data: {
          faqs: [
            { question: 'When to irrigate wheat?', answer: 'Irrigate wheat at crown root initiation, tillering, jointing, flowering, and grain filling stages.' },
            { question: 'गेहूं में सिंचाई कब करें?', answer: 'गेहूं में सिंचाई क्राउन रूट, कल्ले फूटते समय, गांठ बनते समय, फूल आने और दाना भरते समय करें।' }
          ],
          guides: [
            { title: 'Crop Calendar', content: 'Detailed month-wise farming activities...' },
            { title: 'फसल कैलेंडर', content: 'महीने के अनुसार खेती की गतिविधियां...' }
          ],
          tips: [
            'Always test soil before sowing',
            'बुवाई से पहले हमेशा मिट्टी की जांच करें'
          ]
        },
        version: 1,
        downloadedAt: Date.now()
      };

      this.knowledgePacks.set(packId, mockPack);
      
      // Save to IndexedDB
      await db.setCachedData(`knowledge_pack_${packId}`, mockPack);
      
      // Cache all FAQs as responses
      mockPack.data.faqs.forEach(faq => {
        this.cacheResponse(faq.question, faq.answer, mockPack.language, 0.9);
      });

      return true;
    } catch (error) {
      console.error('Error downloading knowledge pack:', error);
      return false;
    }
  }

  async getOfflineResponse(query: string, language: string): Promise<{ response: string; confidence: number; source: string } | null> {
    // First check cached responses
    const cached = await this.getCachedResponse(query, language);
    if (cached) {
      return {
        response: cached.response,
        confidence: cached.confidence,
        source: 'cache'
      };
    }

    // Check knowledge packs
    for (const pack of this.knowledgePacks.values()) {
      for (const faq of pack.data.faqs) {
        if (this.isSimilarQuery(query, faq.question)) {
          return {
            response: faq.answer,
            confidence: 0.7,
            source: `knowledge_pack_${pack.name}`
          };
        }
      }
    }

    // Generate basic response based on keywords
    return this.generateBasicResponse(query, language);
  }

  private isSimilarQuery(query1: string, query2: string): boolean {
    const words1 = query1.toLowerCase().split(' ');
    const words2 = query2.toLowerCase().split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length >= Math.min(2, Math.min(words1.length, words2.length) / 2);
  }

  private generateBasicResponse(query: string, language: string): { response: string; confidence: number; source: string } | null {
    const lowerQuery = query.toLowerCase();
    
    // Basic keyword-based responses
    if (lowerQuery.includes('water') || lowerQuery.includes('पानी')) {
      return {
        response: language === 'hi' 
          ? 'फसल की आवश्यकता के अनुसार सिंचाई करें। अधिक जानकारी के लिए ऑनलाइन होने पर पूछें।'
          : 'Water crops based on their requirements. Ask when online for specific advice.',
        confidence: 0.3,
        source: 'basic_offline'
      };
    }

    if (lowerQuery.includes('disease') || lowerQuery.includes('रोग')) {
      return {
        response: language === 'hi'
          ? 'रोग की पहचान के लिए फोटो खींचें। ऑनलाइन होने पर विस्तृत जानकारी मिलेगी।'
          : 'Take a photo for disease identification. Detailed analysis available when online.',
        confidence: 0.3,
        source: 'basic_offline'
      };
    }

    return null;
  }

  async syncOfflineMessages(messages: any[]): Promise<void> {
    try {
      // Store messages in local storage for now
      // In production, this would sync with the actual backend
      const syncedMessages = messages.map(msg => ({
        ...msg,
        syncedAt: new Date().toISOString()
      }));
      
      await db.setCachedData('synced_messages', syncedMessages);
    } catch (error) {
      console.error('Error syncing offline messages:', error);
    }
  }

  getAvailableKnowledgePacks(): KnowledgePack[] {
    return Array.from(this.knowledgePacks.values());
  }

  async clearOldCache(daysOld: number = 30): Promise<void> {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    
    // Remove old cached responses
    const keysToDelete: string[] = [];
    this.cachedResponses.forEach((response, key) => {
      if (response.timestamp < cutoffTime) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cachedResponses.delete(key));
    
    // Save updated cache
    const allResponses = Array.from(this.cachedResponses.values());
    await db.setCachedData('chat_responses', allResponses);
  }
}

export const chatOfflineService = ChatOfflineService.getInstance();