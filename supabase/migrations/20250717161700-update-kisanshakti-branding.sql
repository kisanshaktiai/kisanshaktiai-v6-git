
-- Update default tenant branding with correct KisanShakti AI colors
UPDATE public.tenant_branding 
SET 
  logo_url = '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
  app_name = 'KisanShakti AI',
  app_tagline = 'INTELLIGENT AI GURU FOR FARMERS',
  primary_color = '#8BC34A',
  secondary_color = '#4CAF50',
  accent_color = '#689F38',
  background_color = '#FFFFFF',
  text_color = '#2E7D32',
  updated_at = now()
WHERE tenant_id = '66372c6f-c996-4425-8749-a7561e5d6ae3';

-- If the branding doesn't exist, insert it
INSERT INTO public.tenant_branding (
  tenant_id,
  logo_url,
  app_name,
  app_tagline,
  primary_color,
  secondary_color,
  accent_color,
  background_color,
  text_color,
  created_at,
  updated_at
) VALUES (
  '66372c6f-c996-4425-8749-a7561e5d6ae3',
  '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
  'KisanShakti AI',
  'INTELLIGENT AI GURU FOR FARMERS',
  '#8BC34A',
  '#4CAF50', 
  '#689F38',
  '#FFFFFF',
  '#2E7D32',
  now(),
  now()
) ON CONFLICT (tenant_id) DO NOTHING;
