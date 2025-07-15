
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

  // Apply CSS custom properties for theming
  if (branding.primary_color) {
    root.style.setProperty('--primary', branding.primary_color);
  }
  
  if (branding.secondary_color) {
    root.style.setProperty('--secondary', branding.secondary_color);
  }
  
  if (branding.accent_color) {
    root.style.setProperty('--accent', branding.accent_color);
  }
  
  if (branding.background_color) {
    root.style.setProperty('--background', branding.background_color);
  }
  
  if (branding.text_color) {
    root.style.setProperty('--foreground', branding.text_color);
  }
  
  if (branding.font_family) {
    root.style.setProperty('--font-family', branding.font_family);
  }
};

export const resetTenantTheme = () => {
  const root = document.documentElement;
  
  // Reset to default values
  root.style.removeProperty('--primary');
  root.style.removeProperty('--secondary');
  root.style.removeProperty('--accent');
  root.style.removeProperty('--background');
  root.style.removeProperty('--foreground');
  root.style.removeProperty('--font-family');
};
