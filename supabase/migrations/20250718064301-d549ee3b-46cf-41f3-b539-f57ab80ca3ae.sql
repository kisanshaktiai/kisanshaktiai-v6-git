
-- Clean up all pre-filled data from the database
-- This will remove all existing records and reset the database to a clean state

-- First, disable RLS temporarily to allow cleanup
SET session_replication_role = replica;

-- Clear user sessions
DELETE FROM public.user_sessions;

-- Clear user-tenant relationships
DELETE FROM public.user_tenants;

-- Clear user profiles
DELETE FROM public.user_profiles;

-- Clear farmers data
DELETE FROM public.farmers;

-- Clear tenant-related data
DELETE FROM public.tenant_branding;
DELETE FROM public.tenant_features;

-- Clear all tenants (this will cascade to related tables)
DELETE FROM public.tenants;

-- Clear any land-related data
DELETE FROM public.crop_health_assessments;
DELETE FROM public.crop_history;
DELETE FROM public.land_activities;
DELETE FROM public.ndvi_data;
DELETE FROM public.lands;

-- Clear marketplace data
DELETE FROM public.marketplace_transactions;
DELETE FROM public.marketplace_reviews;
DELETE FROM public.marketplace_saved_items;

-- Clear financial data
DELETE FROM public.financial_transactions;
DELETE FROM public.analytics_reports;

-- Clear market prices
DELETE FROM public.market_prices;

-- Clear dealer-related data
DELETE FROM public.dealer_commissions;
DELETE FROM public.dealer_communications;
DELETE FROM public.dealer_documents;
DELETE FROM public.dealer_performance;
DELETE FROM public.dealer_territories;
DELETE FROM public.dealers;

-- Clear integration data
DELETE FROM public.integration_sync_logs;
DELETE FROM public.integrations;

-- Clear configuration data
DELETE FROM public.dashboard_configs;
DELETE FROM public.feature_configs;
DELETE FROM public.data_transformations;
DELETE FROM public.data_migration_jobs;

-- Clear API-related data
DELETE FROM public.api_logs;
DELETE FROM public.api_keys;

-- Clear metrics data
DELETE FROM public.ai_model_metrics;
DELETE FROM public.financial_metrics;

-- Clear onboarding data
DELETE FROM public.onboarding_steps;
DELETE FROM public.onboarding_workflows;

-- Re-enable RLS
SET session_replication_role = DEFAULT;

-- Reset sequences if any (this ensures auto-generated IDs start fresh)
-- Note: Since we're using UUIDs, this is not necessary, but included for completeness

-- Clear auth users (this requires admin privileges)
-- WARNING: This will remove ALL users including admin users
-- Uncomment the next line only if you want to remove ALL authentication data
-- DELETE FROM auth.users;
