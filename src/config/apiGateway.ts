
// API Gateway Configuration
export const API_GATEWAY_CONFIG = {
  // Development - Local API Gateway
  development: {
    baseUrl: 'http://localhost:8080',
    websocketUrl: 'ws://localhost:8080/ws',
  },
  
  // Production - Deployed API Gateway
  production: {
    baseUrl: 'https://api.kisanshaktiai.com',
    websocketUrl: 'wss://api.kisanshaktiai.com/ws',
  },
  
  // Rate Limiting
  rateLimits: {
    farmer: 1000, // requests per hour
    tenant_admin: 5000,
    super_admin: 10000,
  },
  
  // Security Settings
  security: {
    jwtExpiryHours: 24,
    refreshThresholdMinutes: 30,
    maxRetries: 3,
    timeoutMs: 30000,
  },
  
  // Tenant Isolation
  tenantHeaders: {
    tenantId: 'x-tenant-id',
    apiKey: 'x-api-key',
  },
};

// Get current environment config
export const getCurrentApiConfig = () => {
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  return API_GATEWAY_CONFIG[env];
};

// Feature flags for API Gateway migration
export const FEATURE_FLAGS = {
  useApiGateway: true, // Set to true to enable API Gateway
  fallbackToSupabase: false, // Fallback to direct Supabase calls if API Gateway fails
  enableOfflineMode: true,
  enableRealTimeSync: true,
};
