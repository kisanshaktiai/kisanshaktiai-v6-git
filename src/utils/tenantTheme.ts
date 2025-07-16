
interface TenantBranding {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  font_family?: string;
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
    root.style.setProperty('--muted-foreground', `${h} ${s} 45%`);
    
    // Create border variant
    root.style.setProperty('--border', `${h} ${s} 90%`);
    root.style.setProperty('--input', `${h} ${s} 90%`);
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
    '--sidebar-primary'
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
