-- Create analytics and financial data tables for comprehensive farm insights

-- Financial transactions table
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  category TEXT NOT NULL, -- e.g., 'seeds', 'fertilizer', 'labor', 'sale', 'equipment'
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  description TEXT,
  transaction_date DATE NOT NULL,
  land_id UUID, -- Optional: associate with specific land
  crop_name TEXT, -- Optional: associate with specific crop
  season TEXT, -- Optional: rabi, kharif, zaid
  payment_method TEXT DEFAULT 'cash', -- cash, upi, bank, check
  receipt_url TEXT, -- Optional: link to receipt image
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Resource usage tracking table
CREATE TABLE IF NOT EXISTS public.resource_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL,
  land_id UUID NOT NULL,
  resource_type TEXT NOT NULL, -- 'water', 'fertilizer', 'pesticide', 'labor', 'equipment'
  resource_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL, -- liters, kg, hours, etc.
  cost_per_unit NUMERIC,
  total_cost NUMERIC,
  usage_date DATE NOT NULL,
  application_method TEXT, -- for chemicals/fertilizers
  weather_conditions JSONB, -- temperature, humidity, etc. at time of application
  effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Market prices tracking table
CREATE TABLE IF NOT EXISTS public.market_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crop_name TEXT NOT NULL,
  variety TEXT,
  price_per_unit NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'quintal',
  market_location TEXT NOT NULL,
  district TEXT,
  state TEXT,
  price_date DATE NOT NULL,
  price_type TEXT DEFAULT 'wholesale', -- wholesale, retail, minimum_support_price
  quality_grade TEXT, -- A, B, C grade
  source TEXT DEFAULT 'manual', -- manual, government_api, market_api
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crop yield predictions table
CREATE TABLE IF NOT EXISTS public.yield_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  land_id UUID NOT NULL,
  farmer_id UUID NOT NULL,
  crop_name TEXT NOT NULL,
  variety TEXT,
  predicted_yield_per_acre NUMERIC NOT NULL,
  confidence_score NUMERIC CHECK (confidence_score BETWEEN 0 AND 1),
  prediction_date DATE NOT NULL,
  harvest_date_estimate DATE,
  factors_considered JSONB, -- weather, soil, historical data, etc.
  actual_yield_per_acre NUMERIC, -- filled after harvest
  prediction_accuracy NUMERIC, -- calculated after harvest
  model_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Farm analytics reports table
CREATE TABLE IF NOT EXISTS public.analytics_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  report_type TEXT NOT NULL, -- 'financial', 'crop_performance', 'resource_utilization', 'market_intelligence'
  report_period TEXT NOT NULL, -- 'monthly', 'seasonal', 'yearly'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  report_data JSONB NOT NULL, -- Contains calculated metrics and charts data
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  file_url TEXT, -- URL to generated PDF report
  status TEXT DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'failed')),
  metadata JSONB DEFAULT '{}'
);

-- Add RLS policies
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yield_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_reports ENABLE ROW LEVEL SECURITY;

-- Financial transactions policies
CREATE POLICY "Users can manage their own financial transactions"
  ON public.financial_transactions
  FOR ALL
  USING (auth.uid() = farmer_id);

-- Resource usage policies
CREATE POLICY "Users can manage resource usage for their lands"
  ON public.resource_usage
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM lands 
      WHERE lands.id = resource_usage.land_id 
      AND lands.farmer_id = auth.uid()
    )
  );

-- Market prices policies (public read access for all users)
CREATE POLICY "Anyone can view market prices"
  ON public.market_prices
  FOR SELECT
  USING (true);

CREATE POLICY "Users can add market prices"
  ON public.market_prices
  FOR INSERT
  WITH CHECK (true);

-- Yield predictions policies
CREATE POLICY "Users can manage yield predictions for their lands"
  ON public.yield_predictions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM lands 
      WHERE lands.id = yield_predictions.land_id 
      AND lands.farmer_id = auth.uid()
    )
  );

-- Analytics reports policies
CREATE POLICY "Users can manage their own analytics reports"
  ON public.analytics_reports
  FOR ALL
  USING (auth.uid() = farmer_id);

-- Add indexes for performance
CREATE INDEX idx_financial_transactions_farmer_date ON public.financial_transactions(farmer_id, transaction_date);
CREATE INDEX idx_financial_transactions_category ON public.financial_transactions(category, transaction_type);
CREATE INDEX idx_resource_usage_land_date ON public.resource_usage(land_id, usage_date);
CREATE INDEX idx_resource_usage_type ON public.resource_usage(resource_type, resource_name);
CREATE INDEX idx_market_prices_crop_date ON public.market_prices(crop_name, price_date);
CREATE INDEX idx_market_prices_location ON public.market_prices(market_location, district);
CREATE INDEX idx_yield_predictions_land ON public.yield_predictions(land_id, prediction_date);
CREATE INDEX idx_analytics_reports_farmer_type ON public.analytics_reports(farmer_id, report_type);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resource_usage_updated_at
  BEFORE UPDATE ON public.resource_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_yield_predictions_updated_at
  BEFORE UPDATE ON public.yield_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();