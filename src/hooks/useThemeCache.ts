import { useMemo } from 'react';

interface TenantBranding {
  logo_url?: string;
  app_name?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
}

interface TenantTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
}

export const useThemeCache = (
  tenantBranding: TenantBranding | null,
  tenantId?: string
) => {
  return useMemo(() => {
    if (!tenantBranding) return null;
    
    // Check localStorage cache first
    const cacheKey = `tenant-theme-${tenantId || 'default'}`;
    const cachedTheme = localStorage.getItem(cacheKey);
    
    if (cachedTheme) {
      try {
        const parsed = JSON.parse(cachedTheme);
        // Validate cache has required properties
        if (parsed.primary && parsed.background) {
          return parsed as TenantTheme;
        }
      } catch (e) {
        // Invalid cache, continue with creation
        localStorage.removeItem(cacheKey);
      }
    }
    
    // Create new theme
    const newTheme: TenantTheme = {
      primary: tenantBranding.primary_color || '142 76% 36%',
      secondary: tenantBranding.secondary_color || '210 40% 98%',
      accent: tenantBranding.accent_color || '210 40% 96%',
      background: tenantBranding.background_color || '0 0% 100%',
      foreground: tenantBranding.text_color || '222.2 84% 4.9%'
    };
    
    // Cache for future use
    try {
      localStorage.setItem(cacheKey, JSON.stringify(newTheme));
    } catch (e) {
      // localStorage might be full, ignore caching error
      console.warn('Failed to cache theme:', e);
    }
    
    return newTheme;
  }, [tenantBranding, tenantId]);
};

export const clearThemeCache = (tenantId?: string) => {
  const cacheKey = `tenant-theme-${tenantId || 'default'}`;
  localStorage.removeItem(cacheKey);
};