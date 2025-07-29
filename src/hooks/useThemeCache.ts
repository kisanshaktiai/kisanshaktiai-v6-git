
import { useMemo } from 'react';
import ThemeCache from '@/services/ThemeCache';

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
  const themeCache = ThemeCache.getInstance();
  
  return useMemo(() => {
    if (!tenantBranding) return null;
    
    const theme = themeCache.getCachedTheme(tenantId || 'default', tenantBranding);
    
    // Apply theme immediately using batched updates
    if (theme) {
      themeCache.applyTheme(theme);
    }
    
    return theme;
  }, [tenantBranding, tenantId, themeCache]);
};

export const clearThemeCache = (tenantId?: string) => {
  const themeCache = ThemeCache.getInstance();
  themeCache.clearCache();
};
