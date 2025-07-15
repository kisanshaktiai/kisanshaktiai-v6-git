
export type SupportedLanguage = 'hi' | 'en' | 'mr' | 'pa' | 'te' | 'ta' | 'gu' | 'kn';

export type AgentType = 
  | 'crop_advisor'
  | 'fertilizer_guide'
  | 'image_scan'
  | 'market_advisor'
  | 'weather'
  | 'community'
  | 'language'
  | 'financial';

export interface AgentContext {
  farmerId: string;
  tenantId: string;
  language: SupportedLanguage;
  location?: {
    latitude: number;
    longitude: number;
    district?: string;
    state?: string;
  };
  farmingProfile?: {
    crops: string[];
    landArea: number;
    soilType?: string;
    irrigationType?: string;
    experience: number;
  };
  sessionId: string;
}

export interface AgentResponse {
  id: string;
  agentType: AgentType;
  message: string;
  confidence: number;
  metadata?: Record<string, any>;
  suggestedActions?: AgentAction[];
  isOffline?: boolean;
  processingTime: number;
}

export interface AgentAction {
  type: 'navigation' | 'call' | 'schedule' | 'purchase' | 'share';
  label: string;
  data: Record<string, any>;
}

export interface AgentConfig {
  tenantId: string;
  agentType: AgentType;
  isEnabled: boolean;
  settings: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    offlineCapable?: boolean;
    priority?: number;
  };
  prompts: {
    system: string;
    userPrefix?: string;
    contextTemplate?: string;
  };
  knowledgeBase?: {
    vectorIndexId?: string;
    documents: string[];
    lastUpdated: Date;
  };
}

export interface AISession {
  id: string;
  farmerId: string;
  tenantId: string;
  startedAt: Date;
  lastInteractionAt: Date;
  context: AgentContext;
  history: AgentResponse[];
  isActive: boolean;
}
