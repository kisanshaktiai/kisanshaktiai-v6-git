
-- Row Level Security Policies for Multi-Tenant Architecture

-- Security definer functions to avoid recursive RLS issues
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.farmer_tenant_associations 
  WHERE farmer_id = auth.uid() AND status = 'active'
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(_tenant_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.farmer_tenant_associations 
    WHERE farmer_id = auth.uid() 
    AND tenant_id = _tenant_id 
    AND role IN ('admin', 'owner')
    AND status = 'active'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Tenants policies (only admins can manage tenants)
CREATE POLICY "Tenant admins can view their tenant" 
  ON public.tenants FOR SELECT 
  USING (public.is_tenant_admin(id));

CREATE POLICY "Tenant admins can update their tenant" 
  ON public.tenants FOR UPDATE 
  USING (public.is_tenant_admin(id));

-- Tenant features policies
CREATE POLICY "Tenant admins can view features" 
  ON public.tenant_features FOR SELECT 
  USING (public.is_tenant_admin(tenant_id));

CREATE POLICY "Tenant admins can update features" 
  ON public.tenant_features FOR UPDATE 
  USING (public.is_tenant_admin(tenant_id));

CREATE POLICY "Tenant admins can insert features" 
  ON public.tenant_features FOR INSERT 
  WITH CHECK (public.is_tenant_admin(tenant_id));

-- Tenant branding policies
CREATE POLICY "Anyone can view tenant branding" 
  ON public.tenant_branding FOR SELECT 
  USING (true);

CREATE POLICY "Tenant admins can update branding" 
  ON public.tenant_branding FOR UPDATE 
  USING (public.is_tenant_admin(tenant_id));

CREATE POLICY "Tenant admins can insert branding" 
  ON public.tenant_branding FOR INSERT 
  WITH CHECK (public.is_tenant_admin(tenant_id));

-- Tenant subscriptions policies
CREATE POLICY "Tenant admins can view subscriptions" 
  ON public.tenant_subscriptions FOR SELECT 
  USING (public.is_tenant_admin(tenant_id));

CREATE POLICY "Tenant admins can update subscriptions" 
  ON public.tenant_subscriptions FOR UPDATE 
  USING (public.is_tenant_admin(tenant_id));

-- Farmers policies (farmers can view/update their own data)
CREATE POLICY "Farmers can view their own profile" 
  ON public.farmers FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Farmers can update their own profile" 
  ON public.farmers FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Tenant admins can view their farmers" 
  ON public.farmers FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.farmer_tenant_associations fta 
    WHERE fta.farmer_id = farmers.id 
    AND public.is_tenant_admin(fta.tenant_id)
  ));

-- Farmer tenant associations policies
CREATE POLICY "Farmers can view their associations" 
  ON public.farmer_tenant_associations FOR SELECT 
  USING (auth.uid() = farmer_id);

CREATE POLICY "Tenant admins can manage associations" 
  ON public.farmer_tenant_associations FOR ALL 
  USING (public.is_tenant_admin(tenant_id));

-- Lands policies (tenant-isolated)
CREATE POLICY "Tenant users can view tenant lands" 
  ON public.lands FOR SELECT 
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Farmers can manage their lands" 
  ON public.lands FOR ALL 
  USING (auth.uid() = farmer_id AND tenant_id = public.get_current_tenant_id());

-- Products policies (tenant-isolated)
CREATE POLICY "Tenant users can view products" 
  ON public.products FOR SELECT 
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Tenant admins can manage products" 
  ON public.products FOR ALL 
  USING (public.is_tenant_admin(tenant_id));

-- Dealers policies (tenant-isolated)
CREATE POLICY "Tenant users can view dealers" 
  ON public.dealers FOR SELECT 
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Tenant admins can manage dealers" 
  ON public.dealers FOR ALL 
  USING (public.is_tenant_admin(tenant_id));

-- AI interactions policies (tenant-isolated)
CREATE POLICY "Farmers can view their interactions" 
  ON public.ai_interactions FOR SELECT 
  USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can insert interactions" 
  ON public.ai_interactions FOR INSERT 
  WITH CHECK (auth.uid() = farmer_id AND tenant_id = public.get_current_tenant_id());

CREATE POLICY "Tenant admins can view all interactions" 
  ON public.ai_interactions FOR SELECT 
  USING (public.is_tenant_admin(tenant_id));

-- Offline sync queue policies
CREATE POLICY "Farmers can manage their sync queue" 
  ON public.offline_sync_queue FOR ALL 
  USING (auth.uid() = farmer_id);

-- Audit logs policies (tenant-isolated)
CREATE POLICY "Tenant admins can view audit logs" 
  ON public.audit_logs FOR SELECT 
  USING (public.is_tenant_admin(tenant_id));

CREATE POLICY "System can insert audit logs" 
  ON public.audit_logs FOR INSERT 
  WITH CHECK (true);

-- Storage policies for tenant-assets bucket
CREATE POLICY "Anyone can view tenant assets" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'tenant-assets');

CREATE POLICY "Tenant admins can upload assets" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'tenant-assets' AND 
    public.is_tenant_admin((storage.foldername(name))[1]::UUID));

-- Storage policies for farmer-media bucket
CREATE POLICY "Farmers can manage their media" 
  ON storage.objects FOR ALL 
  USING (bucket_id = 'farmer-media' AND 
    (storage.foldername(name))[1]::UUID = auth.uid());

-- Storage policies for product-catalog bucket
CREATE POLICY "Anyone can view product catalog" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'product-catalog');

CREATE POLICY "Tenant admins can manage product catalog" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'product-catalog' AND 
    public.is_tenant_admin((storage.foldername(name))[1]::UUID));
