
export const APP_CONFIG = {
  name: 'KisanShakti AI V6',
  version: '6.0.0',
  defaultLanguage: 'hi',
  supportedLanguages: ['hi', 'en', 'mr', 'gu', 'pa', 'ta', 'te', 'kn'],
  defaultTenant: 'default',
  apiTimeout: 30000,
  cacheTimeout: 300000, // 5 minutes
  syncInterval: 60000, // 1 minute
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  TENANT_ID: 'tenant_id',
  USER_PROFILE: 'user_profile',
  LANGUAGE: 'selected_language',
  OFFLINE_QUEUE: 'offline_queue',
  CACHE_PREFIX: 'cache_',
};

export const API_ENDPOINTS = {
  FARMERS: '/farmers',
  LANDS: '/lands',
  CROPS: '/crops',
  WEATHER: '/weather',
  MARKETPLACE: '/marketplace',
  AI_CHAT: '/ai-chat',
  TENANTS: '/tenants',
};

export const FEATURE_FLAGS = {
  AI_CHAT: 'ai_chat',
  WEATHER_FORECAST: 'weather_forecast',
  MARKETPLACE: 'marketplace',
  BASIC_ANALYTICS: 'basic_analytics',
  COMMUNITY_FORUM: 'community_forum',
  SATELLITE_IMAGERY: 'satellite_imagery',
  SOIL_TESTING: 'soil_testing',
  DRONE_MONITORING: 'drone_monitoring',
  IOT_INTEGRATION: 'iot_integration',
  ECOMMERCE: 'ecommerce',
};
