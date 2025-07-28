-- Create storage bucket for land photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('land-photos', 'land-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for land photos
CREATE POLICY "Land photos are viewable by authenticated users" ON storage.objects
FOR SELECT USING (bucket_id = 'land-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can upload their own land photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'land-photos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own land photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'land-photos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own land photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'land-photos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);