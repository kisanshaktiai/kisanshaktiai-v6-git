import { useEffect } from 'react';
import { useUnifiedTenantData } from './useUnifiedTenantData';
import { applyTenantTheme } from '@/utils/tenantTheme';

interface UseTenantThemeOptions {
  tenantId?: string;
  autoApply?: boolean;
}

export const useTenantTheme = (options: UseTenantThemeOptions = {}) => {
  const { tenantId, autoApply = true } = options;
  const { branding, isLoading } = useUnifiedTenantData(tenantId);

  useEffect(() => {
    if (!autoApply || isLoading || !branding) return;

    console.log('🎨 Applying tenant theme:', branding.app_name || 'Default');
    applyTenantTheme(branding);

    // Update document title
    if (branding.app_name) {
      document.title = branding.app_name;
    }

    // Update favicon if provided
    if (branding.logo_url) {
      const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (favicon) {
        favicon.href = branding.logo_url;
      } else {
        const newFavicon = document.createElement('link');
        newFavicon.rel = 'icon';
        newFavicon.href = branding.logo_url;
        document.head.appendChild(newFavicon);
      }
    }

    // Update meta theme color
    const metaThemeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (metaThemeColor && branding.primary_color) {
      metaThemeColor.content = branding.primary_color;
    } else if (branding.primary_color) {
      const newMeta = document.createElement('meta');
      newMeta.name = 'theme-color';
      newMeta.content = branding.primary_color;
      document.head.appendChild(newMeta);
    }

    // Add custom CSS if provided
    if (branding.custom_css) {
      const styleId = 'tenant-custom-styles';
      let styleElement = document.getElementById(styleId);
      
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      
      styleElement.textContent = branding.custom_css;
    }

  }, [branding, isLoading, autoApply]);

  return {
    branding,
    isLoading,
    applyTheme: () => branding && applyTenantTheme(branding),
    resetTheme: () => {
      const root = document.documentElement;
      // Remove all tenant-specific CSS variables
      const tenantVars = [
        '--primary', '--secondary', '--accent', '--background', '--foreground',
        '--muted', '--muted-foreground', '--border', '--input', '--card', '--card-foreground'
      ];
      tenantVars.forEach(varName => root.style.removeProperty(varName));
      
      // Remove custom CSS
      const customStyles = document.getElementById('tenant-custom-styles');
      if (customStyles) {
        customStyles.remove();
      }
    }
  };
};