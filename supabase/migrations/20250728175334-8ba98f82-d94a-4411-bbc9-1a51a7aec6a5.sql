-- Create storage bucket for tenant assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('tenant-assets', 'tenant-assets', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);

-- Create storage policies for tenant assets
CREATE POLICY "Anyone can view tenant assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'tenant-assets');

CREATE POLICY "Tenant admins can upload assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'tenant-assets' AND 
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM user_tenants ut
    WHERE ut.user_id = auth.uid() 
    AND ut.is_active = true 
    AND ut.role IN ('tenant_owner', 'tenant_admin')
  )
);

CREATE POLICY "Tenant admins can update assets" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'tenant-assets' AND 
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM user_tenants ut
    WHERE ut.user_id = auth.uid() 
    AND ut.is_active = true 
    AND ut.role IN ('tenant_owner', 'tenant_admin')
  )
);

CREATE POLICY "Tenant admins can delete assets" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'tenant-assets' AND 
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM user_tenants ut
    WHERE ut.user_id = auth.uid() 
    AND ut.is_active = true 
    AND ut.role IN ('tenant_owner', 'tenant_admin')
  )
);