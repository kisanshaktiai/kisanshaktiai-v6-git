
interface TenantBranding {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  font_family?: string;
  neutral_color?: string;
  muted_color?: string;
  gray_50?: string;
  gray_100?: string;
  gray_200?: string;
  gray_300?: string;
  gray_400?: string;
  gray_500?: string;
  gray_600?: string;
  gray_700?: string;
  gray_800?: string;
  gray_900?: string;
}

export const applyTenantTheme = (branding: TenantBranding | null) => {
  if (!branding) return;

  const root = document.documentElement;

  // Apply CSS custom properties for theming with smooth transitions
  root.style.setProperty('transition', 'color 0.3s ease, background-color 0.3s ease');

  // Core theme colors
  if (branding.primary_color) {
    const primaryHSL = hexToHSL(branding.primary_color);
    root.style.setProperty('--primary', primaryHSL);
    root.style.setProperty('--splash-primary', branding.primary_color);
  }
  
  if (branding.secondary_color) {
    const secondaryHSL = hexToHSL(branding.secondary_color);
    root.style.setProperty('--secondary', secondaryHSL);
  }
  
  if (branding.accent_color) {
    const accentHSL = hexToHSL(branding.accent_color);
    root.style.setProperty('--accent', accentHSL);
  }
  
  if (branding.background_color) {
    const backgroundHSL = hexToHSL(branding.background_color);
    root.style.setProperty('--background', backgroundHSL);
    root.style.setProperty('--splash-background', branding.background_color);
  }
  
  if (branding.text_color) {
    const textHSL = hexToHSL(branding.text_color);
    root.style.setProperty('--foreground', textHSL);
    root.style.setProperty('--splash-text', branding.text_color);
  }

  // Gray/neutral colors from tenant branding
  if (branding.neutral_color) {
    const neutralHSL = hexToHSL(branding.neutral_color);
    root.style.setProperty('--neutral', neutralHSL);
  }

  if (branding.muted_color) {
    const mutedHSL = hexToHSL(branding.muted_color);
    root.style.setProperty('--muted-foreground', mutedHSL);
  }

  // Apply tenant-specific gray colors
  const grayColors = ['gray_50', 'gray_100', 'gray_200', 'gray_300', 'gray_400', 'gray_500', 'gray_600', 'gray_700', 'gray_800', 'gray_900'];
  grayColors.forEach(grayColor => {
    if (branding[grayColor as keyof TenantBranding]) {
      const grayHSL = hexToHSL(branding[grayColor as keyof TenantBranding] as string);
      const cssVar = `--${grayColor.replace('_', '-')}`;
      root.style.setProperty(cssVar, grayHSL);
    }
  });
  
  if (branding.font_family) {
    root.style.setProperty('--font-family', branding.font_family);
  }

  // Apply theme-aware sidebar colors
  if (branding.primary_color) {
    const primaryHSL = hexToHSL(branding.primary_color);
    root.style.setProperty('--sidebar-primary', primaryHSL);
  }

  // Create theme-aware variants
  createThemeVariants(root, branding);
};

const createThemeVariants = (root: HTMLElement, branding: TenantBranding) => {
  // Create muted variants of primary color
  if (branding.primary_color) {
    const primary = hexToHSL(branding.primary_color);
    const [h, s] = primary.split(' ');
    
    // Create lighter variant for muted backgrounds
    root.style.setProperty('--muted', `${h} ${s} 95%`);
    
    // Create border variant
    root.style.setProperty('--border', `${h} ${s} 90%`);
    root.style.setProperty('--input', `${h} ${s} 90%`);
  }

  // Use tenant gray colors or create neutral gray variants
  if (branding.gray_500) {
    const gray500 = hexToHSL(branding.gray_500);
    const [h, s] = gray500.split(' ');
    
    // Create gray variants for buttons and UI elements using tenant colors
    if (!branding.gray_50) root.style.setProperty('--gray-50', `${h} ${s} 98%`);
    if (!branding.gray_100) root.style.setProperty('--gray-100', `${h} ${s} 95%`);
    if (!branding.gray_200) root.style.setProperty('--gray-200', `${h} ${s} 90%`);
    if (!branding.gray_300) root.style.setProperty('--gray-300', `${h} ${s} 80%`);
    if (!branding.gray_400) root.style.setProperty('--gray-400', `${h} ${s} 60%`);
    if (!branding.gray_600) root.style.setProperty('--gray-600', `${h} ${s} 40%`);
  }

  // Create card variants
  if (branding.background_color) {
    const background = hexToHSL(branding.background_color);
    root.style.setProperty('--card', background);
    
    if (branding.text_color) {
      const text = hexToHSL(branding.text_color);
      root.style.setProperty('--card-foreground', text);
    }
  }
};

const hexToHSL = (hex: string): string => {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Find the minimum and maximum values
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  let h: number, s: number, l: number;
  
  // Calculate lightness
  l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    h /= 6;
  }
  
  // Convert to HSL format expected by CSS
  const hValue = Math.round(h * 360);
  const sValue = Math.round(s * 100);
  const lValue = Math.round(l * 100);
  
  return `${hValue} ${sValue}% ${lValue}%`;
};

export const resetTenantTheme = () => {
  const root = document.documentElement;
  
  // Reset to default values
  const defaultProperties = [
    '--primary', '--secondary', '--accent', '--background', '--foreground',
    '--font-family', '--splash-primary', '--splash-background', '--splash-text',
    '--muted', '--muted-foreground', '--border', '--input', '--card', '--card-foreground',
    '--sidebar-primary', '--neutral', '--gray-50', '--gray-100', '--gray-200', 
    '--gray-300', '--gray-400', '--gray-500', '--gray-600', '--gray-700', '--gray-800', '--gray-900'
  ];
  
  defaultProperties.forEach(prop => {
    root.style.removeProperty(prop);
  });
};

// Utility for preloading theme assets
export const preloadThemeAssets = async (branding: TenantBranding | null) => {
  if (!branding) return;
  
  const assetsToPreload = [
    branding.primary_color,
    branding.secondary_color,
    branding.accent_color
  ].filter(Boolean);
  
  // Create style elements for preloading color calculations
  assetsToPreload.forEach(color => {
    if (color) {
      const style = document.createElement('style');
      style.textContent = `.preload-${color.replace('#', '')} { color: ${color}; }`;
      document.head.appendChild(style);
      // Remove after a short delay
      setTimeout(() => document.head.removeChild(style), 100);
    }
  });
};
