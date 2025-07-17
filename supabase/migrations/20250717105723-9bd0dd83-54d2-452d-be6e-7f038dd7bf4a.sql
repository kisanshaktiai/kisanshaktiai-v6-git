-- Create marketplace database schema

-- Product categories for organizing marketplace items
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  parent_id UUID REFERENCES public.product_categories(id),
  tenant_id UUID,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products for B2B (tenant products like seeds, fertilizers, etc.)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  category_id UUID REFERENCES public.product_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  specifications JSONB DEFAULT '{}',
  brand TEXT,
  sku TEXT,
  images TEXT[] DEFAULT '{}',
  price_per_unit DECIMAL(10,2),
  unit_type TEXT DEFAULT 'kg', -- kg, liter, piece, etc.
  min_order_quantity INTEGER DEFAULT 1,
  max_order_quantity INTEGER,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  bulk_pricing JSONB DEFAULT '[]', -- Array of {min_quantity, price_per_unit}
  availability_status TEXT DEFAULT 'in_stock', -- in_stock, out_of_stock, limited
  stock_quantity INTEGER,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  dealer_locations JSONB DEFAULT '[]', -- Array of dealer location objects
  credit_options JSONB DEFAULT '{}', -- EMI and credit options
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Farmer produce listings for C2C
CREATE TABLE public.produce_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  category_id UUID REFERENCES public.product_categories(id),
  crop_name TEXT NOT NULL,
  variety TEXT,
  quantity_available DECIMAL(10,2) NOT NULL,
  unit_type TEXT DEFAULT 'quintal',
  price_per_unit DECIMAL(10,2) NOT NULL,
  quality_grade TEXT, -- A, B, C grade
  harvest_date DATE,
  images TEXT[] DEFAULT '{}',
  description TEXT,
  location_details JSONB, -- {district, taluka, village, coordinates}
  pickup_options TEXT[] DEFAULT '{}', -- farm_pickup, market_delivery, etc.
  payment_options TEXT[] DEFAULT '{}', -- cash, upi, bank_transfer
  minimum_order DECIMAL(10,2),
  is_organic BOOLEAN DEFAULT false,
  storage_type TEXT, -- warehouse, farm, cold_storage
  available_until DATE,
  status TEXT DEFAULT 'active', -- active, sold, expired, inactive
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Marketplace transactions
CREATE TABLE public.marketplace_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL,
  seller_id UUID, -- NULL for B2B (tenant products)
  tenant_id UUID NOT NULL,
  product_id UUID, -- For B2B products
  listing_id UUID, -- For C2C listings
  transaction_type TEXT NOT NULL, -- 'b2b' or 'c2c'
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT, -- upi, cash, bank_transfer, credit
  payment_status TEXT DEFAULT 'pending', -- pending, paid, failed, refunded
  delivery_method TEXT, -- pickup, delivery, dealer
  delivery_address JSONB,
  delivery_date DATE,
  status TEXT DEFAULT 'pending', -- pending, confirmed, in_transit, delivered, cancelled
  notes TEXT,
  escrow_enabled BOOLEAN DEFAULT false,
  commission_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews and ratings
CREATE TABLE public.marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.marketplace_transactions(id),
  reviewer_id UUID NOT NULL,
  reviewed_entity_type TEXT NOT NULL, -- 'product', 'listing', 'seller', 'buyer'
  reviewed_entity_id UUID NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  images TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Saved items/wishlist
CREATE TABLE public.marketplace_saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL, -- 'product' or 'listing'
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- Enable RLS on all tables
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produce_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_saved_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_categories
CREATE POLICY "Anyone can view active categories" ON public.product_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Tenant admins can manage categories" ON public.product_categories
  FOR ALL USING (
    tenant_id IN (
      SELECT user_tenants.tenant_id FROM user_tenants 
      WHERE user_tenants.user_id = auth.uid() AND user_tenants.is_active = true
    )
  );

-- RLS Policies for products
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Tenant admins can manage their products" ON public.products
  FOR ALL USING (
    tenant_id IN (
      SELECT user_tenants.tenant_id FROM user_tenants 
      WHERE user_tenants.user_id = auth.uid() AND user_tenants.is_active = true
    )
  );

-- RLS Policies for produce_listings
CREATE POLICY "Users can view active listings in their tenant" ON public.produce_listings
  FOR SELECT USING (
    status = 'active' AND 
    tenant_id IN (
      SELECT user_tenants.tenant_id FROM user_tenants 
      WHERE user_tenants.user_id = auth.uid() AND user_tenants.is_active = true
    )
  );

CREATE POLICY "Farmers can manage their own listings" ON public.produce_listings
  FOR ALL USING (farmer_id = auth.uid());

-- RLS Policies for marketplace_transactions
CREATE POLICY "Users can view their own transactions" ON public.marketplace_transactions
  FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Users can create transactions as buyer" ON public.marketplace_transactions
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Transaction parties can update their transactions" ON public.marketplace_transactions
  FOR UPDATE USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- RLS Policies for marketplace_reviews
CREATE POLICY "Anyone can view reviews" ON public.marketplace_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their transactions" ON public.marketplace_reviews
  FOR INSERT WITH CHECK (
    reviewer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM marketplace_transactions 
      WHERE id = transaction_id AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own reviews" ON public.marketplace_reviews
  FOR UPDATE USING (reviewer_id = auth.uid());

-- RLS Policies for marketplace_saved_items
CREATE POLICY "Users can manage their saved items" ON public.marketplace_saved_items
  FOR ALL USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_products_tenant_category ON public.products(tenant_id, category_id);
CREATE INDEX idx_products_featured ON public.products(is_featured, is_active);
CREATE INDEX idx_listings_farmer_status ON public.produce_listings(farmer_id, status);
CREATE INDEX idx_listings_location ON public.produce_listings USING GIN(location_details);
CREATE INDEX idx_transactions_buyer ON public.marketplace_transactions(buyer_id);
CREATE INDEX idx_transactions_seller ON public.marketplace_transactions(seller_id);
CREATE INDEX idx_reviews_entity ON public.marketplace_reviews(reviewed_entity_type, reviewed_entity_id);

-- Insert default categories
INSERT INTO public.product_categories (name, slug, description, icon_url) VALUES
('Seeds', 'seeds', 'All types of seeds for farming', '🌱'),
('Fertilizers', 'fertilizers', 'Organic and chemical fertilizers', '🧪'),
('Pesticides', 'pesticides', 'Crop protection chemicals', '🛡️'),
('Tools & Equipment', 'tools-equipment', 'Farming tools and machinery', '🔧'),
('Irrigation', 'irrigation', 'Irrigation systems and equipment', '💧'),
('Grains', 'grains', 'Wheat, rice, corn and other grains', '🌾'),
('Vegetables', 'vegetables', 'Fresh vegetables', '🥕'),
('Fruits', 'fruits', 'Fresh fruits', '🍎'),
('Spices', 'spices', 'Spices and herbs', '🌶️'),
('Dairy', 'dairy', 'Milk and dairy products', '🥛');