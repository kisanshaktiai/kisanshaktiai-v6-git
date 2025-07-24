export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_model_metrics: {
        Row: {
          accuracy_score: number | null
          avg_response_time_ms: number | null
          created_at: string | null
          error_rate: number | null
          id: string
          metadata: Json | null
          model_name: string
          model_version: string | null
          query_count: number | null
          resource_usage: Json | null
          tenant_id: string | null
          timestamp: string
        }
        Insert: {
          accuracy_score?: number | null
          avg_response_time_ms?: number | null
          created_at?: string | null
          error_rate?: number | null
          id?: string
          metadata?: Json | null
          model_name: string
          model_version?: string | null
          query_count?: number | null
          resource_usage?: Json | null
          tenant_id?: string | null
          timestamp?: string
        }
        Update: {
          accuracy_score?: number | null
          avg_response_time_ms?: number | null
          created_at?: string | null
          error_rate?: number | null
          id?: string
          metadata?: Json | null
          model_name?: string
          model_version?: string | null
          query_count?: number | null
          resource_usage?: Json | null
          tenant_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_model_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_reports: {
        Row: {
          end_date: string
          farmer_id: string
          file_url: string | null
          generated_at: string
          id: string
          metadata: Json | null
          report_data: Json
          report_period: string
          report_type: string
          start_date: string
          status: string | null
          tenant_id: string
        }
        Insert: {
          end_date: string
          farmer_id: string
          file_url?: string | null
          generated_at?: string
          id?: string
          metadata?: Json | null
          report_data: Json
          report_period: string
          report_type: string
          start_date: string
          status?: string | null
          tenant_id: string
        }
        Update: {
          end_date?: string
          farmer_id?: string
          file_url?: string | null
          generated_at?: string
          id?: string
          metadata?: Json | null
          report_data?: Json
          report_period?: string
          report_type?: string
          start_date?: string
          status?: string | null
          tenant_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          api_key_hash: string
          api_key_prefix: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          key_name: string
          last_used_at: string | null
          permissions: Json
          rate_limit_per_hour: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          api_key_hash: string
          api_key_prefix: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_name: string
          last_used_at?: string | null
          permissions?: Json
          rate_limit_per_hour?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          api_key_hash?: string
          api_key_prefix?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_name?: string
          last_used_at?: string | null
          permissions?: Json
          rate_limit_per_hour?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      api_logs: {
        Row: {
          api_key_id: string | null
          created_at: string
          endpoint: string
          error_message: string | null
          id: string
          ip_address: unknown | null
          method: string
          request_body: Json | null
          request_headers: Json | null
          response_body: Json | null
          response_headers: Json | null
          response_time_ms: number | null
          status_code: number
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string
          endpoint: string
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          method: string
          request_body?: Json | null
          request_headers?: Json | null
          response_body?: Json | null
          response_headers?: Json | null
          response_time_ms?: number | null
          status_code: number
          tenant_id: string
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string | null
          created_at?: string
          endpoint?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          method?: string
          request_body?: Json | null
          request_headers?: Json | null
          response_body?: Json | null
          response_headers?: Json | null
          response_time_ms?: number | null
          status_code?: number
          tenant_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_health_assessments: {
        Row: {
          alert_level: string | null
          assessment_date: string
          comparison_data: Json | null
          created_at: string | null
          growth_stage: string | null
          id: string
          land_id: string
          ndvi_avg: number | null
          ndvi_max: number | null
          ndvi_min: number | null
          ndvi_std: number | null
          overall_health_score: number | null
          predicted_yield: number | null
          problem_areas: Json | null
          recommendations: Json | null
          stress_indicators: Json | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          alert_level?: string | null
          assessment_date: string
          comparison_data?: Json | null
          created_at?: string | null
          growth_stage?: string | null
          id?: string
          land_id: string
          ndvi_avg?: number | null
          ndvi_max?: number | null
          ndvi_min?: number | null
          ndvi_std?: number | null
          overall_health_score?: number | null
          predicted_yield?: number | null
          problem_areas?: Json | null
          recommendations?: Json | null
          stress_indicators?: Json | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          alert_level?: string | null
          assessment_date?: string
          comparison_data?: Json | null
          created_at?: string | null
          growth_stage?: string | null
          id?: string
          land_id?: string
          ndvi_avg?: number | null
          ndvi_max?: number | null
          ndvi_min?: number | null
          ndvi_std?: number | null
          overall_health_score?: number | null
          predicted_yield?: number | null
          problem_areas?: Json | null
          recommendations?: Json | null
          stress_indicators?: Json | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_health_assessments_land_id_fkey"
            columns: ["land_id"]
            isOneToOne: false
            referencedRelation: "lands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_crop_health_assessments_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_history: {
        Row: {
          created_at: string
          crop_name: string
          growth_stage: string | null
          harvest_date: string | null
          id: string
          land_id: string
          notes: string | null
          planting_date: string | null
          season: string | null
          status: string | null
          tenant_id: string
          updated_at: string
          variety: string | null
          yield_kg_per_acre: number | null
        }
        Insert: {
          created_at?: string
          crop_name: string
          growth_stage?: string | null
          harvest_date?: string | null
          id?: string
          land_id: string
          notes?: string | null
          planting_date?: string | null
          season?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string
          variety?: string | null
          yield_kg_per_acre?: number | null
        }
        Update: {
          created_at?: string
          crop_name?: string
          growth_stage?: string | null
          harvest_date?: string | null
          id?: string
          land_id?: string
          notes?: string | null
          planting_date?: string | null
          season?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string
          variety?: string | null
          yield_kg_per_acre?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_history_land_id_fkey"
            columns: ["land_id"]
            isOneToOne: false
            referencedRelation: "lands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_crop_history_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_configs: {
        Row: {
          created_at: string | null
          dashboard_name: string
          id: string
          is_default: boolean | null
          is_public: boolean | null
          layout: Json
          updated_at: string | null
          user_id: string
          widgets: Json
        }
        Insert: {
          created_at?: string | null
          dashboard_name: string
          id?: string
          is_default?: boolean | null
          is_public?: boolean | null
          layout: Json
          updated_at?: string | null
          user_id: string
          widgets?: Json
        }
        Update: {
          created_at?: string | null
          dashboard_name?: string
          id?: string
          is_default?: boolean | null
          is_public?: boolean | null
          layout?: Json
          updated_at?: string | null
          user_id?: string
          widgets?: Json
        }
        Relationships: []
      }
      data_migration_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_log: Json | null
          failed_records: number | null
          id: string
          mapping_config: Json | null
          migration_type: string
          processed_records: number | null
          progress_data: Json | null
          source_config: Json | null
          started_at: string | null
          status: string | null
          tenant_id: string | null
          total_records: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_log?: Json | null
          failed_records?: number | null
          id?: string
          mapping_config?: Json | null
          migration_type: string
          processed_records?: number | null
          progress_data?: Json | null
          source_config?: Json | null
          started_at?: string | null
          status?: string | null
          tenant_id?: string | null
          total_records?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_log?: Json | null
          failed_records?: number | null
          id?: string
          mapping_config?: Json | null
          migration_type?: string
          processed_records?: number | null
          progress_data?: Json | null
          source_config?: Json | null
          started_at?: string | null
          status?: string | null
          tenant_id?: string | null
          total_records?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_migration_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      data_transformations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          source_format: string
          target_format: string
          tenant_id: string
          transformation_rules: Json
          updated_at: string
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          source_format: string
          target_format: string
          tenant_id: string
          transformation_rules: Json
          updated_at?: string
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          source_format?: string
          target_format?: string
          tenant_id?: string
          transformation_rules?: Json
          updated_at?: string
          validation_rules?: Json | null
        }
        Relationships: []
      }
      dealer_commissions: {
        Row: {
          base_amount: number
          calculation_details: Json | null
          commission_amount: number
          commission_rate: number
          commission_type: string
          created_at: string
          dealer_id: string
          id: string
          notes: string | null
          payment_date: string | null
          payment_reference: string | null
          payment_status: string | null
          period_end: string
          period_start: string
          tenant_id: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          base_amount: number
          calculation_details?: Json | null
          commission_amount: number
          commission_rate: number
          commission_type: string
          created_at?: string
          dealer_id: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          period_end: string
          period_start: string
          tenant_id: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          base_amount?: number
          calculation_details?: Json | null
          commission_amount?: number
          commission_rate?: number
          commission_type?: string
          created_at?: string
          dealer_id?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          period_end?: string
          period_start?: string
          tenant_id?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dealer_communications: {
        Row: {
          attachments: Json | null
          communication_type: string
          content: string | null
          created_at: string
          delivery_status: Json | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          priority: string | null
          read_receipts: Json | null
          recipient_ids: string[]
          scheduled_at: string | null
          sender_id: string
          sent_at: string | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          communication_type: string
          content?: string | null
          created_at?: string
          delivery_status?: Json | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          priority?: string | null
          read_receipts?: Json | null
          recipient_ids: string[]
          scheduled_at?: string | null
          sender_id: string
          sent_at?: string | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          communication_type?: string
          content?: string | null
          created_at?: string
          delivery_status?: Json | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          priority?: string | null
          read_receipts?: Json | null
          recipient_ids?: string[]
          scheduled_at?: string | null
          sender_id?: string
          sent_at?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      dealer_documents: {
        Row: {
          created_at: string
          dealer_id: string
          document_name: string
          document_type: string
          expiry_date: string | null
          file_url: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          rejection_reason: string | null
          tenant_id: string
          updated_at: string
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          dealer_id: string
          document_name: string
          document_type: string
          expiry_date?: string | null
          file_url: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          rejection_reason?: string | null
          tenant_id: string
          updated_at?: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          dealer_id?: string
          document_name?: string
          document_type?: string
          expiry_date?: string | null
          file_url?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          rejection_reason?: string | null
          tenant_id?: string
          updated_at?: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      dealer_performance: {
        Row: {
          achievements: Json | null
          average_response_time_hours: number | null
          bonus_earned: number | null
          commission_earned: number | null
          created_at: string
          customer_satisfaction_score: number | null
          dealer_id: string
          farmers_acquired: number | null
          farmers_target: number | null
          id: string
          orders_processed: number | null
          performance_score: number | null
          period_end: string
          period_start: string
          ranking: number | null
          sales_achieved: number | null
          sales_target: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          achievements?: Json | null
          average_response_time_hours?: number | null
          bonus_earned?: number | null
          commission_earned?: number | null
          created_at?: string
          customer_satisfaction_score?: number | null
          dealer_id: string
          farmers_acquired?: number | null
          farmers_target?: number | null
          id?: string
          orders_processed?: number | null
          performance_score?: number | null
          period_end: string
          period_start: string
          ranking?: number | null
          sales_achieved?: number | null
          sales_target?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          achievements?: Json | null
          average_response_time_hours?: number | null
          bonus_earned?: number | null
          commission_earned?: number | null
          created_at?: string
          customer_satisfaction_score?: number | null
          dealer_id?: string
          farmers_acquired?: number | null
          farmers_target?: number | null
          id?: string
          orders_processed?: number | null
          performance_score?: number | null
          period_end?: string
          period_start?: string
          ranking?: number | null
          sales_achieved?: number | null
          sales_target?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      dealer_territories: {
        Row: {
          assigned_dealer_id: string | null
          assignment_date: string | null
          coverage_status: string | null
          created_at: string
          description: string | null
          geographic_bounds: Json | null
          id: string
          is_active: boolean | null
          market_potential: Json | null
          performance_metrics: Json | null
          population_data: Json | null
          tenant_id: string
          territory_code: string
          territory_name: string
          updated_at: string
        }
        Insert: {
          assigned_dealer_id?: string | null
          assignment_date?: string | null
          coverage_status?: string | null
          created_at?: string
          description?: string | null
          geographic_bounds?: Json | null
          id?: string
          is_active?: boolean | null
          market_potential?: Json | null
          performance_metrics?: Json | null
          population_data?: Json | null
          tenant_id: string
          territory_code: string
          territory_name: string
          updated_at?: string
        }
        Update: {
          assigned_dealer_id?: string | null
          assignment_date?: string | null
          coverage_status?: string | null
          created_at?: string
          description?: string | null
          geographic_bounds?: Json | null
          id?: string
          is_active?: boolean | null
          market_potential?: Json | null
          performance_metrics?: Json | null
          population_data?: Json | null
          tenant_id?: string
          territory_code?: string
          territory_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      dealers: {
        Row: {
          agreement_signed_at: string | null
          agreement_url: string | null
          bank_details: Json | null
          business_address: Json | null
          business_name: string
          business_type: string | null
          commission_rate: number | null
          contact_person: string
          created_at: string
          credit_limit: number | null
          dealer_code: string
          email: string
          gst_number: string | null
          id: string
          is_active: boolean | null
          kyc_status: string | null
          metadata: Json | null
          onboarding_date: string | null
          pan_number: string | null
          payment_terms: string | null
          performance_rating: number | null
          phone: string
          product_authorizations: Json | null
          registration_status: string | null
          tenant_id: string
          territory_ids: string[] | null
          updated_at: string
          verification_status: string | null
        }
        Insert: {
          agreement_signed_at?: string | null
          agreement_url?: string | null
          bank_details?: Json | null
          business_address?: Json | null
          business_name: string
          business_type?: string | null
          commission_rate?: number | null
          contact_person: string
          created_at?: string
          credit_limit?: number | null
          dealer_code: string
          email: string
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          kyc_status?: string | null
          metadata?: Json | null
          onboarding_date?: string | null
          pan_number?: string | null
          payment_terms?: string | null
          performance_rating?: number | null
          phone: string
          product_authorizations?: Json | null
          registration_status?: string | null
          tenant_id: string
          territory_ids?: string[] | null
          updated_at?: string
          verification_status?: string | null
        }
        Update: {
          agreement_signed_at?: string | null
          agreement_url?: string | null
          bank_details?: Json | null
          business_address?: Json | null
          business_name?: string
          business_type?: string | null
          commission_rate?: number | null
          contact_person?: string
          created_at?: string
          credit_limit?: number | null
          dealer_code?: string
          email?: string
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          kyc_status?: string | null
          metadata?: Json | null
          onboarding_date?: string | null
          pan_number?: string | null
          payment_terms?: string | null
          performance_rating?: number | null
          phone?: string
          product_authorizations?: Json | null
          registration_status?: string | null
          tenant_id?: string
          territory_ids?: string[] | null
          updated_at?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      farmers: {
        Row: {
          aadhaar_number: string | null
          annual_income_range: string | null
          app_install_date: string | null
          associated_tenants: string[] | null
          created_at: string | null
          farm_type: string | null
          farmer_code: string | null
          farming_experience_years: number | null
          has_irrigation: boolean | null
          has_loan: boolean | null
          has_storage: boolean | null
          has_tractor: boolean | null
          id: string
          irrigation_type: string | null
          is_verified: boolean | null
          last_app_open: string | null
          loan_amount: number | null
          preferred_dealer_id: string | null
          primary_crops: string[] | null
          shc_id: string | null
          tenant_id: string | null
          total_app_opens: number | null
          total_land_acres: number | null
          total_queries: number | null
          updated_at: string | null
          verification_documents: Json | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          aadhaar_number?: string | null
          annual_income_range?: string | null
          app_install_date?: string | null
          associated_tenants?: string[] | null
          created_at?: string | null
          farm_type?: string | null
          farmer_code?: string | null
          farming_experience_years?: number | null
          has_irrigation?: boolean | null
          has_loan?: boolean | null
          has_storage?: boolean | null
          has_tractor?: boolean | null
          id: string
          irrigation_type?: string | null
          is_verified?: boolean | null
          last_app_open?: string | null
          loan_amount?: number | null
          preferred_dealer_id?: string | null
          primary_crops?: string[] | null
          shc_id?: string | null
          tenant_id?: string | null
          total_app_opens?: number | null
          total_land_acres?: number | null
          total_queries?: number | null
          updated_at?: string | null
          verification_documents?: Json | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          aadhaar_number?: string | null
          annual_income_range?: string | null
          app_install_date?: string | null
          associated_tenants?: string[] | null
          created_at?: string | null
          farm_type?: string | null
          farmer_code?: string | null
          farming_experience_years?: number | null
          has_irrigation?: boolean | null
          has_loan?: boolean | null
          has_storage?: boolean | null
          has_tractor?: boolean | null
          id?: string
          irrigation_type?: string | null
          is_verified?: boolean | null
          last_app_open?: string | null
          loan_amount?: number | null
          preferred_dealer_id?: string | null
          primary_crops?: string[] | null
          shc_id?: string | null
          tenant_id?: string | null
          total_app_opens?: number | null
          total_land_acres?: number | null
          total_queries?: number | null
          updated_at?: string | null
          verification_documents?: Json | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farmers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_configs: {
        Row: {
          config_data: Json | null
          created_at: string | null
          feature_name: string
          id: string
          is_enabled: boolean | null
          limits: Json | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          config_data?: Json | null
          created_at?: string | null
          feature_name: string
          id?: string
          is_enabled?: boolean | null
          limits?: Json | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          config_data?: Json | null
          created_at?: string | null
          feature_name?: string
          id?: string
          is_enabled?: boolean | null
          limits?: Json | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_metrics: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          metric_name: string
          period_end: string | null
          period_start: string | null
          tenant_id: string | null
          timestamp: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          metric_name: string
          period_end?: string | null
          period_start?: string | null
          tenant_id?: string | null
          timestamp?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          period_end?: string | null
          period_start?: string | null
          tenant_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          crop_name: string | null
          currency: string
          description: string | null
          farmer_id: string
          id: string
          land_id: string | null
          metadata: Json | null
          payment_method: string | null
          receipt_url: string | null
          season: string | null
          tenant_id: string
          transaction_date: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          crop_name?: string | null
          currency?: string
          description?: string | null
          farmer_id: string
          id?: string
          land_id?: string | null
          metadata?: Json | null
          payment_method?: string | null
          receipt_url?: string | null
          season?: string | null
          tenant_id: string
          transaction_date: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          crop_name?: string | null
          currency?: string
          description?: string | null
          farmer_id?: string
          id?: string
          land_id?: string | null
          metadata?: Json | null
          payment_method?: string | null
          receipt_url?: string | null
          season?: string | null
          tenant_id?: string
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      integration_sync_logs: {
        Row: {
          completed_at: string | null
          direction: string
          error_details: Json | null
          id: string
          integration_id: string
          records_failed: number
          records_processed: number
          records_success: number
          started_at: string
          status: string
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          direction: string
          error_details?: Json | null
          id?: string
          integration_id: string
          records_failed?: number
          records_processed?: number
          records_success?: number
          started_at?: string
          status?: string
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          direction?: string
          error_details?: Json | null
          id?: string
          integration_id?: string
          records_failed?: number
          records_processed?: number
          records_success?: number
          started_at?: string
          status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          configuration: Json
          created_at: string
          credentials: Json
          error_log: string | null
          field_mappings: Json
          id: string
          integration_type: string
          is_active: boolean
          last_sync_at: string | null
          name: string
          sync_settings: Json
          sync_status: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          configuration?: Json
          created_at?: string
          credentials?: Json
          error_log?: string | null
          field_mappings?: Json
          id?: string
          integration_type: string
          is_active?: boolean
          last_sync_at?: string | null
          name: string
          sync_settings?: Json
          sync_status?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          configuration?: Json
          created_at?: string
          credentials?: Json
          error_log?: string | null
          field_mappings?: Json
          id?: string
          integration_type?: string
          is_active?: boolean
          last_sync_at?: string | null
          name?: string
          sync_settings?: Json
          sync_status?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      land_activities: {
        Row: {
          activity_date: string
          activity_type: string
          cost: number | null
          created_at: string
          description: string | null
          id: string
          land_id: string
          notes: string | null
          quantity: number | null
          tenant_id: string
          unit: string | null
        }
        Insert: {
          activity_date: string
          activity_type: string
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          land_id: string
          notes?: string | null
          quantity?: number | null
          tenant_id: string
          unit?: string | null
        }
        Update: {
          activity_date?: string
          activity_type?: string
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          land_id?: string
          notes?: string | null
          quantity?: number | null
          tenant_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_land_activities_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_activities_land_id_fkey"
            columns: ["land_id"]
            isOneToOne: false
            referencedRelation: "lands"
            referencedColumns: ["id"]
          },
        ]
      }
      lands: {
        Row: {
          area_acres: number
          area_guntas: number | null
          boundary: unknown | null
          boundary_polygon_old: Json | null
          center_point_old: Json | null
          created_at: string
          crop_stage: string | null
          current_crop: string | null
          district: string | null
          elevation_meters: number | null
          expected_harvest_date: string | null
          farmer_id: string
          id: string
          irrigation_source: string | null
          is_active: boolean | null
          land_documents: Json | null
          land_type: string | null
          last_soil_test_date: string | null
          last_sowing_date: string | null
          name: string
          nitrogen_kg_per_ha: number | null
          organic_carbon_percent: number | null
          ownership_type: string | null
          phosphorus_kg_per_ha: number | null
          potassium_kg_per_ha: number | null
          slope_percentage: number | null
          soil_ph: number | null
          soil_type: string | null
          state: string | null
          survey_number: string | null
          taluka: string | null
          tenant_id: string
          updated_at: string
          village: string | null
          water_source: string | null
        }
        Insert: {
          area_acres: number
          area_guntas?: number | null
          boundary?: unknown | null
          boundary_polygon_old?: Json | null
          center_point_old?: Json | null
          created_at?: string
          crop_stage?: string | null
          current_crop?: string | null
          district?: string | null
          elevation_meters?: number | null
          expected_harvest_date?: string | null
          farmer_id: string
          id?: string
          irrigation_source?: string | null
          is_active?: boolean | null
          land_documents?: Json | null
          land_type?: string | null
          last_soil_test_date?: string | null
          last_sowing_date?: string | null
          name: string
          nitrogen_kg_per_ha?: number | null
          organic_carbon_percent?: number | null
          ownership_type?: string | null
          phosphorus_kg_per_ha?: number | null
          potassium_kg_per_ha?: number | null
          slope_percentage?: number | null
          soil_ph?: number | null
          soil_type?: string | null
          state?: string | null
          survey_number?: string | null
          taluka?: string | null
          tenant_id: string
          updated_at?: string
          village?: string | null
          water_source?: string | null
        }
        Update: {
          area_acres?: number
          area_guntas?: number | null
          boundary?: unknown | null
          boundary_polygon_old?: Json | null
          center_point_old?: Json | null
          created_at?: string
          crop_stage?: string | null
          current_crop?: string | null
          district?: string | null
          elevation_meters?: number | null
          expected_harvest_date?: string | null
          farmer_id?: string
          id?: string
          irrigation_source?: string | null
          is_active?: boolean | null
          land_documents?: Json | null
          land_type?: string | null
          last_soil_test_date?: string | null
          last_sowing_date?: string | null
          name?: string
          nitrogen_kg_per_ha?: number | null
          organic_carbon_percent?: number | null
          ownership_type?: string | null
          phosphorus_kg_per_ha?: number | null
          potassium_kg_per_ha?: number | null
          slope_percentage?: number | null
          soil_ph?: number | null
          soil_type?: string | null
          state?: string | null
          survey_number?: string | null
          taluka?: string | null
          tenant_id?: string
          updated_at?: string
          village?: string | null
          water_source?: string | null
        }
        Relationships: []
      }
      market_prices: {
        Row: {
          created_at: string
          crop_name: string
          district: string | null
          id: string
          market_location: string
          metadata: Json | null
          price_date: string
          price_per_unit: number
          price_type: string | null
          quality_grade: string | null
          source: string | null
          state: string | null
          unit: string
          variety: string | null
        }
        Insert: {
          created_at?: string
          crop_name: string
          district?: string | null
          id?: string
          market_location: string
          metadata?: Json | null
          price_date: string
          price_per_unit: number
          price_type?: string | null
          quality_grade?: string | null
          source?: string | null
          state?: string | null
          unit?: string
          variety?: string | null
        }
        Update: {
          created_at?: string
          crop_name?: string
          district?: string | null
          id?: string
          market_location?: string
          metadata?: Json | null
          price_date?: string
          price_per_unit?: number
          price_type?: string | null
          quality_grade?: string | null
          source?: string | null
          state?: string | null
          unit?: string
          variety?: string | null
        }
        Relationships: []
      }
      marketplace_reviews: {
        Row: {
          created_at: string
          helpful_count: number | null
          id: string
          images: string[] | null
          is_verified: boolean | null
          rating: number | null
          review_text: string | null
          reviewed_entity_id: string
          reviewed_entity_type: string
          reviewer_id: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          helpful_count?: number | null
          id?: string
          images?: string[] | null
          is_verified?: boolean | null
          rating?: number | null
          review_text?: string | null
          reviewed_entity_id: string
          reviewed_entity_type: string
          reviewer_id: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          helpful_count?: number | null
          id?: string
          images?: string[] | null
          is_verified?: boolean | null
          rating?: number | null
          review_text?: string | null
          reviewed_entity_id?: string
          reviewed_entity_type?: string
          reviewer_id?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_reviews_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "marketplace_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_saved_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_marketplace_saved_items_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_transactions: {
        Row: {
          buyer_id: string
          commission_amount: number | null
          created_at: string
          delivery_address: Json | null
          delivery_date: string | null
          delivery_method: string | null
          escrow_enabled: boolean | null
          id: string
          listing_id: string | null
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          product_id: string | null
          quantity: number
          seller_id: string | null
          status: string | null
          tenant_id: string
          total_amount: number
          transaction_type: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          commission_amount?: number | null
          created_at?: string
          delivery_address?: Json | null
          delivery_date?: string | null
          delivery_method?: string | null
          escrow_enabled?: boolean | null
          id?: string
          listing_id?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          product_id?: string | null
          quantity: number
          seller_id?: string | null
          status?: string | null
          tenant_id: string
          total_amount: number
          transaction_type: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          commission_amount?: number | null
          created_at?: string
          delivery_address?: Json | null
          delivery_date?: string | null
          delivery_method?: string | null
          escrow_enabled?: boolean | null
          id?: string
          listing_id?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          product_id?: string | null
          quantity?: number
          seller_id?: string | null
          status?: string | null
          tenant_id?: string
          total_amount?: number
          transaction_type?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      ndvi_data: {
        Row: {
          cloud_cover: number | null
          cloud_coverage: number | null
          collection_id: string | null
          created_at: string
          date: string
          evi_value: number | null
          id: string
          image_url: string | null
          land_id: string
          metadata: Json | null
          ndvi_value: number | null
          ndwi_value: number | null
          processing_level: string | null
          satellite_source: string | null
          savi_value: number | null
          scene_id: string | null
          spatial_resolution: number | null
          tenant_id: string
          tile_id: string | null
        }
        Insert: {
          cloud_cover?: number | null
          cloud_coverage?: number | null
          collection_id?: string | null
          created_at?: string
          date: string
          evi_value?: number | null
          id?: string
          image_url?: string | null
          land_id: string
          metadata?: Json | null
          ndvi_value?: number | null
          ndwi_value?: number | null
          processing_level?: string | null
          satellite_source?: string | null
          savi_value?: number | null
          scene_id?: string | null
          spatial_resolution?: number | null
          tenant_id: string
          tile_id?: string | null
        }
        Update: {
          cloud_cover?: number | null
          cloud_coverage?: number | null
          collection_id?: string | null
          created_at?: string
          date?: string
          evi_value?: number | null
          id?: string
          image_url?: string | null
          land_id?: string
          metadata?: Json | null
          ndvi_value?: number | null
          ndwi_value?: number | null
          processing_level?: string | null
          satellite_source?: string | null
          savi_value?: number | null
          scene_id?: string | null
          spatial_resolution?: number | null
          tenant_id?: string
          tile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ndvi_data_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ndvi_data_land_id_fkey"
            columns: ["land_id"]
            isOneToOne: false
            referencedRelation: "lands"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_steps: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          step_data: Json | null
          step_name: string
          step_number: number
          step_status:
            | Database["public"]["Enums"]["onboarding_step_status"]
            | null
          updated_at: string | null
          validation_errors: Json | null
          workflow_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          step_data?: Json | null
          step_name: string
          step_number: number
          step_status?:
            | Database["public"]["Enums"]["onboarding_step_status"]
            | null
          updated_at?: string | null
          validation_errors?: Json | null
          workflow_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          step_data?: Json | null
          step_name?: string
          step_number?: number
          step_status?:
            | Database["public"]["Enums"]["onboarding_step_status"]
            | null
          updated_at?: string | null
          validation_errors?: Json | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "onboarding_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_workflows: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_step: number | null
          id: string
          metadata: Json | null
          started_at: string | null
          status: string | null
          tenant_id: string | null
          total_steps: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          status?: string | null
          tenant_id?: string | null
          total_steps?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          status?: string | null
          tenant_id?: string | null
          total_steps?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_workflows_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_admin_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          email: string
          expires_at: string
          full_name: string
          id: string
          metadata: Json | null
          password_hash: string
          rejection_reason: string | null
          request_token: string
          requested_at: string
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          email: string
          expires_at?: string
          full_name: string
          id?: string
          metadata?: Json | null
          password_hash: string
          rejection_reason?: string | null
          request_token?: string
          requested_at?: string
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          email?: string
          expires_at?: string
          full_name?: string
          id?: string
          metadata?: Json | null
          password_hash?: string
          rejection_reason?: string | null
          request_token?: string
          requested_at?: string
          status?: string
        }
        Relationships: []
      }
      platform_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_name: string
          created_at: string | null
          current_value: number | null
          description: string | null
          id: string
          metadata: Json | null
          metric_name: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          status: Database["public"]["Enums"]["alert_status"] | null
          tenant_id: string | null
          threshold_value: number | null
          triggered_at: string | null
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_name: string
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          metadata?: Json | null
          metric_name?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          status?: Database["public"]["Enums"]["alert_status"] | null
          tenant_id?: string | null
          threshold_value?: number | null
          triggered_at?: string | null
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_name?: string
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          metadata?: Json | null
          metric_name?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          status?: Database["public"]["Enums"]["alert_status"] | null
          tenant_id?: string | null
          threshold_value?: number | null
          triggered_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_maps: {
        Row: {
          application_method: string | null
          applied_date: string | null
          created_at: string | null
          created_date: string
          crop_name: string | null
          estimated_cost: number | null
          farmer_id: string
          growth_stage: string | null
          id: string
          land_id: string
          map_data: Json
          map_type: string
          status: string | null
          tenant_id: string
          total_area_acres: number | null
          updated_at: string | null
          zones: Json
        }
        Insert: {
          application_method?: string | null
          applied_date?: string | null
          created_at?: string | null
          created_date: string
          crop_name?: string | null
          estimated_cost?: number | null
          farmer_id: string
          growth_stage?: string | null
          id?: string
          land_id: string
          map_data: Json
          map_type: string
          status?: string | null
          tenant_id: string
          total_area_acres?: number | null
          updated_at?: string | null
          zones: Json
        }
        Update: {
          application_method?: string | null
          applied_date?: string | null
          created_at?: string | null
          created_date?: string
          crop_name?: string | null
          estimated_cost?: number | null
          farmer_id?: string
          growth_stage?: string | null
          id?: string
          land_id?: string
          map_data?: Json
          map_type?: string
          status?: string | null
          tenant_id?: string
          total_area_acres?: number | null
          updated_at?: string | null
          zones?: Json
        }
        Relationships: [
          {
            foreignKeyName: "fk_prescription_maps_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_maps_land_id_fkey"
            columns: ["land_id"]
            isOneToOne: false
            referencedRelation: "lands"
            referencedColumns: ["id"]
          },
        ]
      }
      produce_listings: {
        Row: {
          available_until: string | null
          category_id: string | null
          created_at: string
          crop_name: string
          description: string | null
          farmer_id: string
          harvest_date: string | null
          id: string
          images: string[] | null
          is_organic: boolean | null
          location_details: Json | null
          minimum_order: number | null
          payment_options: string[] | null
          pickup_options: string[] | null
          price_per_unit: number
          quality_grade: string | null
          quantity_available: number
          status: string | null
          storage_type: string | null
          tenant_id: string
          unit_type: string | null
          updated_at: string
          variety: string | null
        }
        Insert: {
          available_until?: string | null
          category_id?: string | null
          created_at?: string
          crop_name: string
          description?: string | null
          farmer_id: string
          harvest_date?: string | null
          id?: string
          images?: string[] | null
          is_organic?: boolean | null
          location_details?: Json | null
          minimum_order?: number | null
          payment_options?: string[] | null
          pickup_options?: string[] | null
          price_per_unit: number
          quality_grade?: string | null
          quantity_available: number
          status?: string | null
          storage_type?: string | null
          tenant_id: string
          unit_type?: string | null
          updated_at?: string
          variety?: string | null
        }
        Update: {
          available_until?: string | null
          category_id?: string | null
          created_at?: string
          crop_name?: string
          description?: string | null
          farmer_id?: string
          harvest_date?: string | null
          id?: string
          images?: string[] | null
          is_organic?: boolean | null
          location_details?: Json | null
          minimum_order?: number | null
          payment_options?: string[] | null
          pickup_options?: string[] | null
          price_per_unit?: number
          quality_grade?: string | null
          quantity_available?: number
          status?: string | null
          storage_type?: string | null
          tenant_id?: string
          unit_type?: string | null
          updated_at?: string
          variety?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produce_listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          availability_status: string | null
          brand: string | null
          bulk_pricing: Json | null
          category_id: string | null
          created_at: string
          credit_options: Json | null
          dealer_locations: Json | null
          description: string | null
          discount_percentage: number | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          max_order_quantity: number | null
          min_order_quantity: number | null
          name: string
          price_per_unit: number | null
          sku: string | null
          specifications: Json | null
          stock_quantity: number | null
          tags: string[] | null
          tenant_id: string
          unit_type: string | null
          updated_at: string
        }
        Insert: {
          availability_status?: string | null
          brand?: string | null
          bulk_pricing?: Json | null
          category_id?: string | null
          created_at?: string
          credit_options?: Json | null
          dealer_locations?: Json | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          max_order_quantity?: number | null
          min_order_quantity?: number | null
          name: string
          price_per_unit?: number | null
          sku?: string | null
          specifications?: Json | null
          stock_quantity?: number | null
          tags?: string[] | null
          tenant_id: string
          unit_type?: string | null
          updated_at?: string
        }
        Update: {
          availability_status?: string | null
          brand?: string | null
          bulk_pricing?: Json | null
          category_id?: string | null
          created_at?: string
          credit_options?: Json | null
          dealer_locations?: Json | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          max_order_quantity?: number | null
          min_order_quantity?: number | null
          name?: string
          price_per_unit?: number | null
          sku?: string | null
          specifications?: Json | null
          stock_quantity?: number | null
          tags?: string[] | null
          tenant_id?: string
          unit_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_usage: {
        Row: {
          application_method: string | null
          cost_per_unit: number | null
          created_at: string
          effectiveness_rating: number | null
          farmer_id: string
          id: string
          land_id: string
          notes: string | null
          quantity: number
          resource_name: string
          resource_type: string
          tenant_id: string
          total_cost: number | null
          unit: string
          updated_at: string
          usage_date: string
          weather_conditions: Json | null
        }
        Insert: {
          application_method?: string | null
          cost_per_unit?: number | null
          created_at?: string
          effectiveness_rating?: number | null
          farmer_id: string
          id?: string
          land_id: string
          notes?: string | null
          quantity: number
          resource_name: string
          resource_type: string
          tenant_id: string
          total_cost?: number | null
          unit: string
          updated_at?: string
          usage_date: string
          weather_conditions?: Json | null
        }
        Update: {
          application_method?: string | null
          cost_per_unit?: number | null
          created_at?: string
          effectiveness_rating?: number | null
          farmer_id?: string
          id?: string
          land_id?: string
          notes?: string | null
          quantity?: number
          resource_name?: string
          resource_type?: string
          tenant_id?: string
          total_cost?: number | null
          unit?: string
          updated_at?: string
          usage_date?: string
          weather_conditions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_resource_usage_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      satellite_alerts: {
        Row: {
          affected_area_percentage: number | null
          alert_type: string
          created_at: string | null
          description: string | null
          farmer_id: string
          id: string
          land_id: string
          metadata: Json | null
          ndvi_change: number | null
          recommendations: Json | null
          resolved_at: string | null
          severity: string
          status: string | null
          tenant_id: string
          title: string
          trigger_values: Json | null
        }
        Insert: {
          affected_area_percentage?: number | null
          alert_type: string
          created_at?: string | null
          description?: string | null
          farmer_id: string
          id?: string
          land_id: string
          metadata?: Json | null
          ndvi_change?: number | null
          recommendations?: Json | null
          resolved_at?: string | null
          severity: string
          status?: string | null
          tenant_id: string
          title: string
          trigger_values?: Json | null
        }
        Update: {
          affected_area_percentage?: number | null
          alert_type?: string
          created_at?: string | null
          description?: string | null
          farmer_id?: string
          id?: string
          land_id?: string
          metadata?: Json | null
          ndvi_change?: number | null
          recommendations?: Json | null
          resolved_at?: string | null
          severity?: string
          status?: string | null
          tenant_id?: string
          title?: string
          trigger_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_satellite_alerts_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "satellite_alerts_land_id_fkey"
            columns: ["land_id"]
            isOneToOne: false
            referencedRelation: "lands"
            referencedColumns: ["id"]
          },
        ]
      }
      satellite_imagery: {
        Row: {
          acquisition_date: string
          bounds: Json
          cloud_coverage: number | null
          collection_id: string
          created_at: string | null
          download_status: string | null
          file_size_mb: number | null
          id: string
          image_urls: Json
          land_id: string
          processed_indices: Json | null
          scene_id: string
          spatial_resolution: number | null
          tenant_id: string
          tile_id: string | null
          updated_at: string | null
        }
        Insert: {
          acquisition_date: string
          bounds: Json
          cloud_coverage?: number | null
          collection_id?: string
          created_at?: string | null
          download_status?: string | null
          file_size_mb?: number | null
          id?: string
          image_urls: Json
          land_id: string
          processed_indices?: Json | null
          scene_id: string
          spatial_resolution?: number | null
          tenant_id: string
          tile_id?: string | null
          updated_at?: string | null
        }
        Update: {
          acquisition_date?: string
          bounds?: Json
          cloud_coverage?: number | null
          collection_id?: string
          created_at?: string | null
          download_status?: string | null
          file_size_mb?: number | null
          id?: string
          image_urls?: Json
          land_id?: string
          processed_indices?: Json | null
          scene_id?: string
          spatial_resolution?: number | null
          tenant_id?: string
          tile_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_satellite_imagery_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "satellite_imagery_land_id_fkey"
            columns: ["land_id"]
            isOneToOne: false
            referencedRelation: "lands"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reports: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          next_run_at: string | null
          recipients: string[]
          report_config: Json
          report_name: string
          schedule_cron: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          recipients: string[]
          report_config: Json
          report_name: string
          schedule_cron: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          recipients?: string[]
          report_config?: Json
          report_name?: string
          schedule_cron?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      soil_health: {
        Row: {
          bulk_density: number | null
          created_at: string
          id: string
          land_id: string
          nitrogen_level: string | null
          organic_carbon: number | null
          ph_level: number | null
          phosphorus_level: string | null
          potassium_level: string | null
          soil_type: string | null
          source: string | null
          tenant_id: string
          test_date: string | null
          test_report_url: string | null
          texture: string | null
          updated_at: string
        }
        Insert: {
          bulk_density?: number | null
          created_at?: string
          id?: string
          land_id: string
          nitrogen_level?: string | null
          organic_carbon?: number | null
          ph_level?: number | null
          phosphorus_level?: string | null
          potassium_level?: string | null
          soil_type?: string | null
          source?: string | null
          tenant_id: string
          test_date?: string | null
          test_report_url?: string | null
          texture?: string | null
          updated_at?: string
        }
        Update: {
          bulk_density?: number | null
          created_at?: string
          id?: string
          land_id?: string
          nitrogen_level?: string | null
          organic_carbon?: number | null
          ph_level?: number | null
          phosphorus_level?: string | null
          potassium_level?: string | null
          soil_type?: string | null
          source?: string | null
          tenant_id?: string
          test_date?: string | null
          test_report_url?: string | null
          texture?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_soil_health_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soil_health_land_id_fkey"
            columns: ["land_id"]
            isOneToOne: false
            referencedRelation: "lands"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_custom: boolean | null
          limits: Json | null
          name: string
          plan_type: Database["public"]["Enums"]["subscription_plan_type"]
          price_annually: number | null
          price_monthly: number | null
          price_quarterly: number | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          limits?: Json | null
          name: string
          plan_type: Database["public"]["Enums"]["subscription_plan_type"]
          price_annually?: number | null
          price_monthly?: number | null
          price_quarterly?: number | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          limits?: Json | null
          name?: string
          plan_type?: Database["public"]["Enums"]["subscription_plan_type"]
          price_annually?: number | null
          price_monthly?: number | null
          price_quarterly?: number | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      system_metrics: {
        Row: {
          created_at: string | null
          id: string
          labels: Json | null
          metadata: Json | null
          metric_name: string
          metric_type: Database["public"]["Enums"]["metric_type"]
          tenant_id: string | null
          timestamp: string
          unit: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          labels?: Json | null
          metadata?: Json | null
          metric_name: string
          metric_type: Database["public"]["Enums"]["metric_type"]
          tenant_id?: string | null
          timestamp?: string
          unit?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          labels?: Json | null
          metadata?: Json | null
          metric_name?: string
          metric_type?: Database["public"]["Enums"]["metric_type"]
          tenant_id?: string | null
          timestamp?: string
          unit?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "system_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invitation_token: string
          invited_by: string | null
          role: string
          status: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invitation_token: string
          invited_by?: string | null
          role: string
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invitation_token?: string
          invited_by?: string | null
          role?: string
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_branding: {
        Row: {
          accent_color: string | null
          app_icon_url: string | null
          app_name: string | null
          app_tagline: string | null
          background_color: string | null
          company_description: string | null
          created_at: string | null
          custom_css: string | null
          email_footer_html: string | null
          email_header_html: string | null
          favicon_url: string | null
          font_family: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          splash_screen_url: string | null
          tenant_id: string | null
          text_color: string | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          app_icon_url?: string | null
          app_name?: string | null
          app_tagline?: string | null
          background_color?: string | null
          company_description?: string | null
          created_at?: string | null
          custom_css?: string | null
          email_footer_html?: string | null
          email_header_html?: string | null
          favicon_url?: string | null
          font_family?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          splash_screen_url?: string | null
          tenant_id?: string | null
          text_color?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          app_icon_url?: string | null
          app_name?: string | null
          app_tagline?: string | null
          background_color?: string | null
          company_description?: string | null
          created_at?: string | null
          custom_css?: string | null
          email_footer_html?: string | null
          email_header_html?: string | null
          favicon_url?: string | null
          font_family?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          splash_screen_url?: string | null
          tenant_id?: string | null
          text_color?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_branding_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_features: {
        Row: {
          advanced_analytics: boolean | null
          ai_chat: boolean | null
          api_access: boolean | null
          basic_analytics: boolean | null
          community_forum: boolean | null
          created_at: string | null
          custom_reports: boolean | null
          drone_monitoring: boolean | null
          ecommerce: boolean | null
          id: string
          inventory_management: boolean | null
          iot_integration: boolean | null
          logistics_tracking: boolean | null
          marketplace: boolean | null
          payment_gateway: boolean | null
          predictive_analytics: boolean | null
          satellite_imagery: boolean | null
          soil_testing: boolean | null
          tenant_id: string | null
          third_party_integrations: boolean | null
          updated_at: string | null
          weather_forecast: boolean | null
          webhook_support: boolean | null
          white_label_mobile_app: boolean | null
        }
        Insert: {
          advanced_analytics?: boolean | null
          ai_chat?: boolean | null
          api_access?: boolean | null
          basic_analytics?: boolean | null
          community_forum?: boolean | null
          created_at?: string | null
          custom_reports?: boolean | null
          drone_monitoring?: boolean | null
          ecommerce?: boolean | null
          id?: string
          inventory_management?: boolean | null
          iot_integration?: boolean | null
          logistics_tracking?: boolean | null
          marketplace?: boolean | null
          payment_gateway?: boolean | null
          predictive_analytics?: boolean | null
          satellite_imagery?: boolean | null
          soil_testing?: boolean | null
          tenant_id?: string | null
          third_party_integrations?: boolean | null
          updated_at?: string | null
          weather_forecast?: boolean | null
          webhook_support?: boolean | null
          white_label_mobile_app?: boolean | null
        }
        Update: {
          advanced_analytics?: boolean | null
          ai_chat?: boolean | null
          api_access?: boolean | null
          basic_analytics?: boolean | null
          community_forum?: boolean | null
          created_at?: string | null
          custom_reports?: boolean | null
          drone_monitoring?: boolean | null
          ecommerce?: boolean | null
          id?: string
          inventory_management?: boolean | null
          iot_integration?: boolean | null
          logistics_tracking?: boolean | null
          marketplace?: boolean | null
          payment_gateway?: boolean | null
          predictive_analytics?: boolean | null
          satellite_imagery?: boolean | null
          soil_testing?: boolean | null
          tenant_id?: string | null
          third_party_integrations?: boolean | null
          updated_at?: string | null
          weather_forecast?: boolean | null
          webhook_support?: boolean | null
          white_label_mobile_app?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_features_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_subscriptions: {
        Row: {
          auto_renew: boolean | null
          billing_address: Json | null
          billing_interval: Database["public"]["Enums"]["billing_interval"]
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json | null
          payment_method: Json | null
          plan_id: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          billing_address?: Json | null
          billing_interval: Database["public"]["Enums"]["billing_interval"]
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: Json | null
          plan_id?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          billing_address?: Json | null
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: Json | null
          plan_id?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          business_address: Json | null
          business_registration: string | null
          created_at: string | null
          custom_domain: string | null
          deleted_at: string | null
          established_date: string | null
          id: string
          max_api_calls_per_day: number | null
          max_dealers: number | null
          max_farmers: number | null
          max_products: number | null
          max_storage_gb: number | null
          metadata: Json | null
          name: string
          owner_email: string | null
          owner_name: string | null
          owner_phone: string | null
          slug: string
          status: Database["public"]["Enums"]["tenant_status"] | null
          subdomain: string | null
          subscription_end_date: string | null
          subscription_plan:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_start_date: string | null
          trial_ends_at: string | null
          type: Database["public"]["Enums"]["tenant_type"]
          updated_at: string | null
        }
        Insert: {
          business_address?: Json | null
          business_registration?: string | null
          created_at?: string | null
          custom_domain?: string | null
          deleted_at?: string | null
          established_date?: string | null
          id?: string
          max_api_calls_per_day?: number | null
          max_dealers?: number | null
          max_farmers?: number | null
          max_products?: number | null
          max_storage_gb?: number | null
          metadata?: Json | null
          name: string
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          slug: string
          status?: Database["public"]["Enums"]["tenant_status"] | null
          subdomain?: string | null
          subscription_end_date?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_start_date?: string | null
          trial_ends_at?: string | null
          type: Database["public"]["Enums"]["tenant_type"]
          updated_at?: string | null
        }
        Update: {
          business_address?: Json | null
          business_registration?: string | null
          created_at?: string | null
          custom_domain?: string | null
          deleted_at?: string | null
          established_date?: string | null
          id?: string
          max_api_calls_per_day?: number | null
          max_dealers?: number | null
          max_farmers?: number | null
          max_products?: number | null
          max_storage_gb?: number | null
          metadata?: Json | null
          name?: string
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["tenant_status"] | null
          subdomain?: string | null
          subscription_end_date?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_start_date?: string | null
          trial_ends_at?: string | null
          type?: Database["public"]["Enums"]["tenant_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      usage_analytics: {
        Row: {
          created_at: string | null
          endpoint_path: string | null
          feature_name: string
          id: string
          metadata: Json | null
          response_time_ms: number | null
          session_duration: unknown | null
          status_code: number | null
          tenant_id: string | null
          timestamp: string
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint_path?: string | null
          feature_name: string
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          session_duration?: unknown | null
          status_code?: number | null
          tenant_id?: string | null
          timestamp?: string
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint_path?: string | null
          feature_name?: string
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          session_duration?: unknown | null
          status_code?: number | null
          tenant_id?: string | null
          timestamp?: string
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_analytics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          aadhaar_number: string | null
          address_line1: string | null
          address_line2: string | null
          avatar_url: string | null
          bio: string | null
          coordinates: unknown | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          device_tokens: Json | null
          display_name: string | null
          district: string | null
          expertise_areas: string[] | null
          farmer_id: string | null
          full_name: string | null
          gender: string | null
          id: string
          last_active_at: string | null
          metadata: Json | null
          notification_preferences: Json | null
          phone: string
          phone_verified: boolean | null
          pincode: string | null
          preferred_language:
            | Database["public"]["Enums"]["language_code"]
            | null
          shc_id: string | null
          state: string | null
          taluka: string | null
          updated_at: string | null
          village: string | null
        }
        Insert: {
          aadhaar_number?: string | null
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          bio?: string | null
          coordinates?: unknown | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          device_tokens?: Json | null
          display_name?: string | null
          district?: string | null
          expertise_areas?: string[] | null
          farmer_id?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          last_active_at?: string | null
          metadata?: Json | null
          notification_preferences?: Json | null
          phone: string
          phone_verified?: boolean | null
          pincode?: string | null
          preferred_language?:
            | Database["public"]["Enums"]["language_code"]
            | null
          shc_id?: string | null
          state?: string | null
          taluka?: string | null
          updated_at?: string | null
          village?: string | null
        }
        Update: {
          aadhaar_number?: string | null
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          bio?: string | null
          coordinates?: unknown | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          device_tokens?: Json | null
          display_name?: string | null
          district?: string | null
          expertise_areas?: string[] | null
          farmer_id?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          last_active_at?: string | null
          metadata?: Json | null
          notification_preferences?: Json | null
          phone?: string
          phone_verified?: boolean | null
          pincode?: string | null
          preferred_language?:
            | Database["public"]["Enums"]["language_code"]
            | null
          shc_id?: string | null
          state?: string | null
          taluka?: string | null
          updated_at?: string | null
          village?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          access_token_hash: string | null
          created_at: string
          device_info: Json | null
          expires_at: string
          id: string
          is_active: boolean | null
          last_activity_at: string | null
          refresh_token_hash: string | null
          session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_hash?: string | null
          created_at?: string
          device_info?: Json | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          last_activity_at?: string | null
          refresh_token_hash?: string | null
          session_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_hash?: string | null
          created_at?: string
          device_info?: Json | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          last_activity_at?: string | null
          refresh_token_hash?: string | null
          session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_tenants: {
        Row: {
          created_at: string | null
          department: string | null
          designation: string | null
          employee_id: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean | null
          is_primary: boolean | null
          joined_at: string | null
          permissions: Json | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          designation?: string | null
          employee_id?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          joined_at?: string | null
          permissions?: Json | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          designation?: string | null
          employee_id?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          joined_at?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_activity_recommendations: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          farmer_id: string
          id: string
          is_critical: boolean | null
          land_id: string | null
          optimal_conditions: string[] | null
          precautions: string[] | null
          recommended_date: string
          recommended_time_end: string | null
          recommended_time_start: string | null
          status: string | null
          suitability_score: number
          tenant_id: string
          title: string
          updated_at: string
          weather_conditions: Json | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          farmer_id: string
          id?: string
          is_critical?: boolean | null
          land_id?: string | null
          optimal_conditions?: string[] | null
          precautions?: string[] | null
          recommended_date: string
          recommended_time_end?: string | null
          recommended_time_start?: string | null
          status?: string | null
          suitability_score: number
          tenant_id: string
          title: string
          updated_at?: string
          weather_conditions?: Json | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          farmer_id?: string
          id?: string
          is_critical?: boolean | null
          land_id?: string | null
          optimal_conditions?: string[] | null
          precautions?: string[] | null
          recommended_date?: string
          recommended_time_end?: string | null
          recommended_time_start?: string | null
          status?: string | null
          suitability_score?: number
          tenant_id?: string
          title?: string
          updated_at?: string
          weather_conditions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_weather_activity_recommendations_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weather_activity_recommendations_land_id_fkey"
            columns: ["land_id"]
            isOneToOne: false
            referencedRelation: "lands"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_alerts: {
        Row: {
          affected_activities: string[] | null
          alert_id: string
          area_name: string
          certainty: string
          created_at: string
          crop_impact_level: string | null
          data_source: string
          description: string | null
          end_time: string | null
          event_type: string
          id: string
          instruction: string | null
          is_active: boolean
          latitude: number | null
          longitude: number | null
          recommendations: string[] | null
          severity: string
          start_time: string
          title: string
          urgency: string
        }
        Insert: {
          affected_activities?: string[] | null
          alert_id: string
          area_name: string
          certainty: string
          created_at?: string
          crop_impact_level?: string | null
          data_source: string
          description?: string | null
          end_time?: string | null
          event_type: string
          id?: string
          instruction?: string | null
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          recommendations?: string[] | null
          severity: string
          start_time: string
          title: string
          urgency: string
        }
        Update: {
          affected_activities?: string[] | null
          alert_id?: string
          area_name?: string
          certainty?: string
          created_at?: string
          crop_impact_level?: string | null
          data_source?: string
          description?: string | null
          end_time?: string | null
          event_type?: string
          id?: string
          instruction?: string | null
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          recommendations?: string[] | null
          severity?: string
          start_time?: string
          title?: string
          urgency?: string
        }
        Relationships: []
      }
      weather_current: {
        Row: {
          cloud_cover_percent: number | null
          created_at: string
          data_source: string
          evapotranspiration_mm: number | null
          feels_like_celsius: number | null
          growing_degree_days: number | null
          humidity_percent: number | null
          id: string
          latitude: number
          longitude: number
          moon_phase: number | null
          observation_time: string
          pressure_hpa: number | null
          rain_1h_mm: number | null
          rain_24h_mm: number | null
          snow_1h_mm: number | null
          soil_moisture_percent: number | null
          soil_temperature_celsius: number | null
          station_id: string | null
          sunrise: string | null
          sunset: string | null
          temperature_celsius: number | null
          uv_index: number | null
          visibility_km: number | null
          weather_description: string | null
          weather_icon: string | null
          weather_main: string | null
          wind_direction_degrees: number | null
          wind_gust_kmh: number | null
          wind_speed_kmh: number | null
        }
        Insert: {
          cloud_cover_percent?: number | null
          created_at?: string
          data_source: string
          evapotranspiration_mm?: number | null
          feels_like_celsius?: number | null
          growing_degree_days?: number | null
          humidity_percent?: number | null
          id?: string
          latitude: number
          longitude: number
          moon_phase?: number | null
          observation_time: string
          pressure_hpa?: number | null
          rain_1h_mm?: number | null
          rain_24h_mm?: number | null
          snow_1h_mm?: number | null
          soil_moisture_percent?: number | null
          soil_temperature_celsius?: number | null
          station_id?: string | null
          sunrise?: string | null
          sunset?: string | null
          temperature_celsius?: number | null
          uv_index?: number | null
          visibility_km?: number | null
          weather_description?: string | null
          weather_icon?: string | null
          weather_main?: string | null
          wind_direction_degrees?: number | null
          wind_gust_kmh?: number | null
          wind_speed_kmh?: number | null
        }
        Update: {
          cloud_cover_percent?: number | null
          created_at?: string
          data_source?: string
          evapotranspiration_mm?: number | null
          feels_like_celsius?: number | null
          growing_degree_days?: number | null
          humidity_percent?: number | null
          id?: string
          latitude?: number
          longitude?: number
          moon_phase?: number | null
          observation_time?: string
          pressure_hpa?: number | null
          rain_1h_mm?: number | null
          rain_24h_mm?: number | null
          snow_1h_mm?: number | null
          soil_moisture_percent?: number | null
          soil_temperature_celsius?: number | null
          station_id?: string | null
          sunrise?: string | null
          sunset?: string | null
          temperature_celsius?: number | null
          uv_index?: number | null
          visibility_km?: number | null
          weather_description?: string | null
          weather_icon?: string | null
          weather_main?: string | null
          wind_direction_degrees?: number | null
          wind_gust_kmh?: number | null
          wind_speed_kmh?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weather_current_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "weather_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_forecasts: {
        Row: {
          cloud_cover_percent: number | null
          created_at: string
          data_source: string
          evapotranspiration_mm: number | null
          feels_like_celsius: number | null
          forecast_time: string
          forecast_type: string
          growing_degree_days: number | null
          humidity_percent: number | null
          id: string
          latitude: number
          longitude: number
          pressure_hpa: number | null
          rain_amount_mm: number | null
          rain_probability_percent: number | null
          snow_amount_mm: number | null
          soil_temperature_celsius: number | null
          station_id: string | null
          temperature_celsius: number | null
          temperature_max_celsius: number | null
          temperature_min_celsius: number | null
          uv_index: number | null
          weather_description: string | null
          weather_icon: string | null
          weather_main: string | null
          wind_direction_degrees: number | null
          wind_gust_kmh: number | null
          wind_speed_kmh: number | null
        }
        Insert: {
          cloud_cover_percent?: number | null
          created_at?: string
          data_source: string
          evapotranspiration_mm?: number | null
          feels_like_celsius?: number | null
          forecast_time: string
          forecast_type: string
          growing_degree_days?: number | null
          humidity_percent?: number | null
          id?: string
          latitude: number
          longitude: number
          pressure_hpa?: number | null
          rain_amount_mm?: number | null
          rain_probability_percent?: number | null
          snow_amount_mm?: number | null
          soil_temperature_celsius?: number | null
          station_id?: string | null
          temperature_celsius?: number | null
          temperature_max_celsius?: number | null
          temperature_min_celsius?: number | null
          uv_index?: number | null
          weather_description?: string | null
          weather_icon?: string | null
          weather_main?: string | null
          wind_direction_degrees?: number | null
          wind_gust_kmh?: number | null
          wind_speed_kmh?: number | null
        }
        Update: {
          cloud_cover_percent?: number | null
          created_at?: string
          data_source?: string
          evapotranspiration_mm?: number | null
          feels_like_celsius?: number | null
          forecast_time?: string
          forecast_type?: string
          growing_degree_days?: number | null
          humidity_percent?: number | null
          id?: string
          latitude?: number
          longitude?: number
          pressure_hpa?: number | null
          rain_amount_mm?: number | null
          rain_probability_percent?: number | null
          snow_amount_mm?: number | null
          soil_temperature_celsius?: number | null
          station_id?: string | null
          temperature_celsius?: number | null
          temperature_max_celsius?: number | null
          temperature_min_celsius?: number | null
          uv_index?: number | null
          weather_description?: string | null
          weather_icon?: string | null
          weather_main?: string | null
          wind_direction_degrees?: number | null
          wind_gust_kmh?: number | null
          wind_speed_kmh?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weather_forecasts_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "weather_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_historical: {
        Row: {
          created_at: string
          data_source: string
          evapotranspiration_mm: number | null
          growing_degree_days: number | null
          humidity_avg_percent: number | null
          id: string
          latitude: number
          longitude: number
          rainfall_mm: number | null
          record_date: string
          temperature_avg_celsius: number | null
          temperature_max_celsius: number | null
          temperature_min_celsius: number | null
          wind_speed_avg_kmh: number | null
        }
        Insert: {
          created_at?: string
          data_source: string
          evapotranspiration_mm?: number | null
          growing_degree_days?: number | null
          humidity_avg_percent?: number | null
          id?: string
          latitude: number
          longitude: number
          rainfall_mm?: number | null
          record_date: string
          temperature_avg_celsius?: number | null
          temperature_max_celsius?: number | null
          temperature_min_celsius?: number | null
          wind_speed_avg_kmh?: number | null
        }
        Update: {
          created_at?: string
          data_source?: string
          evapotranspiration_mm?: number | null
          growing_degree_days?: number | null
          humidity_avg_percent?: number | null
          id?: string
          latitude?: number
          longitude?: number
          rainfall_mm?: number | null
          record_date?: string
          temperature_avg_celsius?: number | null
          temperature_max_celsius?: number | null
          temperature_min_celsius?: number | null
          wind_speed_avg_kmh?: number | null
        }
        Relationships: []
      }
      weather_preferences: {
        Row: {
          alert_language: string | null
          created_at: string
          enable_activity_recommendations: boolean | null
          enable_push_notifications: boolean | null
          enable_sms_alerts: boolean | null
          enable_voice_alerts: boolean | null
          farmer_id: string
          humidity_high_alert_percent: number | null
          humidity_low_alert_percent: number | null
          id: string
          latitude: number
          longitude: number
          max_rain_probability_spray_percent: number | null
          max_temperature_spray_celsius: number | null
          max_wind_speed_spray_kmh: number | null
          min_temperature_spray_celsius: number | null
          preferred_station_id: string | null
          preferred_work_end_time: string | null
          preferred_work_start_time: string | null
          rain_probability_alert_percent: number | null
          temperature_max_alert: number | null
          temperature_min_alert: number | null
          tenant_id: string
          updated_at: string
          wind_speed_alert_kmh: number | null
        }
        Insert: {
          alert_language?: string | null
          created_at?: string
          enable_activity_recommendations?: boolean | null
          enable_push_notifications?: boolean | null
          enable_sms_alerts?: boolean | null
          enable_voice_alerts?: boolean | null
          farmer_id: string
          humidity_high_alert_percent?: number | null
          humidity_low_alert_percent?: number | null
          id?: string
          latitude: number
          longitude: number
          max_rain_probability_spray_percent?: number | null
          max_temperature_spray_celsius?: number | null
          max_wind_speed_spray_kmh?: number | null
          min_temperature_spray_celsius?: number | null
          preferred_station_id?: string | null
          preferred_work_end_time?: string | null
          preferred_work_start_time?: string | null
          rain_probability_alert_percent?: number | null
          temperature_max_alert?: number | null
          temperature_min_alert?: number | null
          tenant_id: string
          updated_at?: string
          wind_speed_alert_kmh?: number | null
        }
        Update: {
          alert_language?: string | null
          created_at?: string
          enable_activity_recommendations?: boolean | null
          enable_push_notifications?: boolean | null
          enable_sms_alerts?: boolean | null
          enable_voice_alerts?: boolean | null
          farmer_id?: string
          humidity_high_alert_percent?: number | null
          humidity_low_alert_percent?: number | null
          id?: string
          latitude?: number
          longitude?: number
          max_rain_probability_spray_percent?: number | null
          max_temperature_spray_celsius?: number | null
          max_wind_speed_spray_kmh?: number | null
          min_temperature_spray_celsius?: number | null
          preferred_station_id?: string | null
          preferred_work_end_time?: string | null
          preferred_work_start_time?: string | null
          rain_probability_alert_percent?: number | null
          temperature_max_alert?: number | null
          temperature_min_alert?: number | null
          tenant_id?: string
          updated_at?: string
          wind_speed_alert_kmh?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_weather_preferences_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weather_preferences_preferred_station_id_fkey"
            columns: ["preferred_station_id"]
            isOneToOne: false
            referencedRelation: "weather_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_stations: {
        Row: {
          created_at: string
          data_source: string
          elevation_meters: number | null
          id: string
          is_active: boolean
          last_updated: string | null
          latitude: number
          longitude: number
          name: string
          station_code: string
        }
        Insert: {
          created_at?: string
          data_source: string
          elevation_meters?: number | null
          id?: string
          is_active?: boolean
          last_updated?: string | null
          latitude: number
          longitude: number
          name: string
          station_code: string
        }
        Update: {
          created_at?: string
          data_source?: string
          elevation_meters?: number | null
          id?: string
          is_active?: boolean
          last_updated?: string | null
          latitude?: number
          longitude?: number
          name?: string
          station_code?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          attempt_number: number
          created_at: string
          delivered_at: string | null
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_time_ms: number | null
          status_code: number | null
          webhook_id: string
        }
        Insert: {
          attempt_number?: number
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          response_body?: string | null
          response_time_ms?: number | null
          status_code?: number | null
          webhook_id: string
        }
        Update: {
          attempt_number?: number
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_time_ms?: number | null
          status_code?: number | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          custom_headers: Json | null
          event_filters: Json | null
          events: string[]
          failure_count: number
          id: string
          is_active: boolean
          last_triggered_at: string | null
          name: string
          retry_attempts: number
          secret_key: string
          success_count: number
          tenant_id: string
          timeout_seconds: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          custom_headers?: Json | null
          event_filters?: Json | null
          events?: string[]
          failure_count?: number
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name: string
          retry_attempts?: number
          secret_key: string
          success_count?: number
          tenant_id: string
          timeout_seconds?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          custom_headers?: Json | null
          event_filters?: Json | null
          events?: string[]
          failure_count?: number
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name?: string
          retry_attempts?: number
          secret_key?: string
          success_count?: number
          tenant_id?: string
          timeout_seconds?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      white_label_configs: {
        Row: {
          app_store_config: Json | null
          brand_identity: Json | null
          created_at: string | null
          domain_config: Json | null
          email_templates: Json | null
          id: string
          pwa_config: Json | null
          splash_screens: Json | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          app_store_config?: Json | null
          brand_identity?: Json | null
          created_at?: string | null
          domain_config?: Json | null
          email_templates?: Json | null
          id?: string
          pwa_config?: Json | null
          splash_screens?: Json | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          app_store_config?: Json | null
          brand_identity?: Json | null
          created_at?: string | null
          domain_config?: Json | null
          email_templates?: Json | null
          id?: string
          pwa_config?: Json | null
          splash_screens?: Json | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "white_label_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      yield_predictions: {
        Row: {
          actual_yield_per_acre: number | null
          confidence_score: number | null
          created_at: string
          crop_name: string
          factors_considered: Json | null
          farmer_id: string
          harvest_date_estimate: string | null
          id: string
          land_id: string
          model_version: string | null
          predicted_yield_per_acre: number
          prediction_accuracy: number | null
          prediction_date: string
          tenant_id: string
          updated_at: string
          variety: string | null
        }
        Insert: {
          actual_yield_per_acre?: number | null
          confidence_score?: number | null
          created_at?: string
          crop_name: string
          factors_considered?: Json | null
          farmer_id: string
          harvest_date_estimate?: string | null
          id?: string
          land_id: string
          model_version?: string | null
          predicted_yield_per_acre: number
          prediction_accuracy?: number | null
          prediction_date: string
          tenant_id: string
          updated_at?: string
          variety?: string | null
        }
        Update: {
          actual_yield_per_acre?: number | null
          confidence_score?: number | null
          created_at?: string
          crop_name?: string
          factors_considered?: Json | null
          farmer_id?: string
          harvest_date_estimate?: string | null
          id?: string
          land_id?: string
          model_version?: string | null
          predicted_yield_per_acre?: number
          prediction_accuracy?: number | null
          prediction_date?: string
          tenant_id?: string
          updated_at?: string
          variety?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_yield_predictions_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown | null
          f_table_catalog: unknown | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown | null
          f_table_catalog: string | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { oldname: string; newname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { tbl: unknown; col: string }
        Returns: unknown
      }
      _postgis_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_scripts_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_selectivity: {
        Args: { tbl: unknown; att_name: string; geom: unknown; mode?: string }
        Returns: number
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_bestsrid: {
        Args: { "": unknown }
        Returns: number
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_pointoutside: {
        Args: { "": unknown }
        Returns: unknown
      }
      _st_sortablehash: {
        Args: { geom: unknown }
        Returns: number
      }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          g1: unknown
          clip?: unknown
          tolerance?: number
          return_polygons?: boolean
        }
        Returns: unknown
      }
      _st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      addauth: {
        Args: { "": string }
        Returns: boolean
      }
      addgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              schema_name: string
              table_name: string
              column_name: string
              new_srid_in: number
              new_type: string
              new_dim: number
              use_typmod?: boolean
            }
          | {
              schema_name: string
              table_name: string
              column_name: string
              new_srid: number
              new_type: string
              new_dim: number
              use_typmod?: boolean
            }
          | {
              table_name: string
              column_name: string
              new_srid: number
              new_type: string
              new_dim: number
              use_typmod?: boolean
            }
        Returns: string
      }
      box: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box3d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3dtobox: {
        Args: { "": unknown }
        Returns: unknown
      }
      bytea: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      calculate_evapotranspiration: {
        Args: {
          temp_celsius: number
          humidity_percent: number
          wind_speed_kmh: number
          solar_radiation?: number
        }
        Returns: number
      }
      calculate_growing_degree_days: {
        Args: { temp_max: number; temp_min: number; base_temp?: number }
        Returns: number
      }
      calculate_land_health_score: {
        Args: { land_uuid: string }
        Returns: number
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      disablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      dropgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              schema_name: string
              table_name: string
              column_name: string
            }
          | { schema_name: string; table_name: string; column_name: string }
          | { table_name: string; column_name: string }
        Returns: string
      }
      dropgeometrytable: {
        Args:
          | { catalog_name: string; schema_name: string; table_name: string }
          | { schema_name: string; table_name: string }
          | { table_name: string }
        Returns: string
      }
      enablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      gbt_bit_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bool_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bool_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bpchar_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bytea_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_inet_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_numeric_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_text_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_timetz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_tstz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey2_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey2_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      geography_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geography_gist_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_gist_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_send: {
        Args: { "": unknown }
        Returns: string
      }
      geography_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geography_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry: {
        Args:
          | { "": string }
          | { "": string }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
        Returns: unknown
      }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_sortsupport_2d: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_hash: {
        Args: { "": unknown }
        Returns: number
      }
      geometry_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_recv: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_send: {
        Args: { "": unknown }
        Returns: string
      }
      geometry_sortsupport: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_spgist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_3d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geometry_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometrytype: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      get_current_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_proj4_from_srid: {
        Args: { "": number }
        Returns: string
      }
      get_spray_suitability: {
        Args: {
          temp_celsius: number
          wind_speed_kmh: number
          humidity_percent: number
          rain_probability_percent: number
        }
        Returns: number
      }
      gettransactionid: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      gidx_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gidx_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_tenant_admin: {
        Args: { _tenant_id: string }
        Returns: boolean
      }
      json: {
        Args: { "": unknown }
        Returns: Json
      }
      jsonb: {
        Args: { "": unknown }
        Returns: Json
      }
      longtransactionsenabled: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      path: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_asflatgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_geometry_clusterintersecting_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_clusterwithin_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_collect_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_makeline_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_polygonize_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      point: {
        Args: { "": unknown }
        Returns: unknown
      }
      polygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      populate_geometry_columns: {
        Args:
          | { tbl_oid: unknown; use_typmod?: boolean }
          | { use_typmod?: boolean }
        Returns: number
      }
      postgis_addbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_constraint_dims: {
        Args: { geomschema: string; geomtable: string; geomcolumn: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomschema: string; geomtable: string; geomcolumn: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomschema: string; geomtable: string; geomcolumn: string }
        Returns: string
      }
      postgis_dropbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_extensions_upgrade: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_full_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_geos_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_geos_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_getbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_hasbbox: {
        Args: { "": unknown }
        Returns: boolean
      }
      postgis_index_supportfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_lib_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_revision: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libjson_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_liblwgeom_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libprotobuf_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libxml_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_proj_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_installed: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_released: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_svn_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_type_name: {
        Args: {
          geomname: string
          coord_dimension: number
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_typmod_dims: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_srid: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_type: {
        Args: { "": number }
        Returns: string
      }
      postgis_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_wagyu_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      spheroid_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      spheroid_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlength: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dperimeter: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle: {
        Args:
          | { line1: unknown; line2: unknown }
          | { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
        Returns: number
      }
      st_area: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_area2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_asbinary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_asewkt: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asgeojson: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; options?: number }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
          | {
              r: Record<string, unknown>
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
            }
        Returns: string
      }
      st_asgml: {
        Args:
          | { "": string }
          | {
              geog: unknown
              maxdecimaldigits?: number
              options?: number
              nprefix?: string
              id?: string
            }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
          | {
              version: number
              geog: unknown
              maxdecimaldigits?: number
              options?: number
              nprefix?: string
              id?: string
            }
          | {
              version: number
              geom: unknown
              maxdecimaldigits?: number
              options?: number
              nprefix?: string
              id?: string
            }
        Returns: string
      }
      st_ashexewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_askml: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
          | { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
        Returns: string
      }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: {
        Args: { geom: unknown; format?: string }
        Returns: string
      }
      st_asmvtgeom: {
        Args: {
          geom: unknown
          bounds: unknown
          extent?: number
          buffer?: number
          clip_geom?: boolean
        }
        Returns: unknown
      }
      st_assvg: {
        Args:
          | { "": string }
          | { geog: unknown; rel?: number; maxdecimaldigits?: number }
          | { geom: unknown; rel?: number; maxdecimaldigits?: number }
        Returns: string
      }
      st_astext: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_astwkb: {
        Args:
          | {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_z?: number
              prec_m?: number
              with_sizes?: boolean
              with_boxes?: boolean
            }
          | {
              geom: unknown
              prec?: number
              prec_z?: number
              prec_m?: number
              with_sizes?: boolean
              with_boxes?: boolean
            }
        Returns: string
      }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_boundary: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_boundingdiagonal: {
        Args: { geom: unknown; fits?: boolean }
        Returns: unknown
      }
      st_buffer: {
        Args:
          | { geom: unknown; radius: number; options?: string }
          | { geom: unknown; radius: number; quadsegs: number }
        Returns: unknown
      }
      st_buildarea: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_centroid: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      st_cleangeometry: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_clipbybox2d: {
        Args: { geom: unknown; box: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_clusterintersecting: {
        Args: { "": unknown[] }
        Returns: unknown[]
      }
      st_collect: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collectionextract: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_collectionhomogenize: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_concavehull: {
        Args: {
          param_geom: unknown
          param_pctconvex: number
          param_allow_holes?: boolean
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_convexhull: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_coorddim: {
        Args: { geometry: unknown }
        Returns: number
      }
      st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_curvetoline: {
        Args: { geom: unknown; tol?: number; toltype?: number; flags?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { g1: unknown; tolerance?: number; flags?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_dimension: {
        Args: { "": unknown }
        Returns: number
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance: {
        Args:
          | { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_distancesphere: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; radius: number }
        Returns: number
      }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dump: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumppoints: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumprings: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumpsegments: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_endpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_envelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_expand: {
        Args:
          | { box: unknown; dx: number; dy: number }
          | { box: unknown; dx: number; dy: number; dz?: number }
          | { geom: unknown; dx: number; dy: number; dz?: number; dm?: number }
        Returns: unknown
      }
      st_exteriorring: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_flipcoordinates: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force3d: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; zvalue?: number; mvalue?: number }
        Returns: unknown
      }
      st_forcecollection: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcecurve: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygonccw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygoncw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcerhr: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcesfs: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_generatepoints: {
        Args:
          | { area: unknown; npoints: number }
          | { area: unknown; npoints: number; seed: number }
        Returns: unknown
      }
      st_geogfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geogfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geographyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geohash: {
        Args:
          | { geog: unknown; maxchars?: number }
          | { geom: unknown; maxchars?: number }
        Returns: string
      }
      st_geomcollfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomcollfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometricmedian: {
        Args: {
          g: unknown
          tolerance?: number
          max_iter?: number
          fail_if_not_converged?: boolean
        }
        Returns: unknown
      }
      st_geometryfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometrytype: {
        Args: { "": unknown }
        Returns: string
      }
      st_geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromgeojson: {
        Args: { "": Json } | { "": Json } | { "": string }
        Returns: unknown
      }
      st_geomfromgml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromkml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfrommarc21: {
        Args: { marc21xml: string }
        Returns: unknown
      }
      st_geomfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromtwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_gmltosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_hasarc: {
        Args: { geometry: unknown }
        Returns: boolean
      }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { size: number; cell_i: number; cell_j: number; origin?: unknown }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { size: number; bounds: unknown }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_isclosed: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_iscollection: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isempty: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygonccw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygoncw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isring: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_issimple: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvalid: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvaliddetail: {
        Args: { geom: unknown; flags?: number }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
      }
      st_isvalidreason: {
        Args: { "": unknown }
        Returns: string
      }
      st_isvalidtrajectory: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_length: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_length2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_letters: {
        Args: { letters: string; font?: Json }
        Returns: unknown
      }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { txtin: string; nprecision?: number }
        Returns: unknown
      }
      st_linefrommultipoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_linefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linemerge: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linestringfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linetocurve: {
        Args: { geometry: unknown }
        Returns: unknown
      }
      st_locatealong: {
        Args: { geometry: unknown; measure: number; leftrightoffset?: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          geometry: unknown
          frommeasure: number
          tomeasure: number
          leftrightoffset?: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { geometry: unknown; fromelevation: number; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_m: {
        Args: { "": unknown }
        Returns: number
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makepolygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { "": unknown } | { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_maximuminscribedcircle: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_memsize: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_minimumboundingradius: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_minimumclearance: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumclearanceline: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_mlinefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mlinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multi: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_multilinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multilinestringfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_ndims: {
        Args: { "": unknown }
        Returns: number
      }
      st_node: {
        Args: { g: unknown }
        Returns: unknown
      }
      st_normalize: {
        Args: { geom: unknown }
        Returns: unknown
      }
      st_npoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_nrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numgeometries: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorring: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpatches: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_offsetcurve: {
        Args: { line: unknown; distance: number; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_orientedenvelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { "": unknown } | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_perimeter2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_pointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointm: {
        Args: {
          xcoordinate: number
          ycoordinate: number
          mcoordinate: number
          srid?: number
        }
        Returns: unknown
      }
      st_pointonsurface: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_points: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
          srid?: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
          mcoordinate: number
          srid?: number
        }
        Returns: unknown
      }
      st_polyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonize: {
        Args: { "": unknown[] }
        Returns: unknown
      }
      st_project: {
        Args: { geog: unknown; distance: number; azimuth: number }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_x: number
          prec_y?: number
          prec_z?: number
          prec_m?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: string
      }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_reverse: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid: {
        Args: { geog: unknown; srid: number } | { geom: unknown; srid: number }
        Returns: unknown
      }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shiftlongitude: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; vertex_fraction: number; is_outer?: boolean }
        Returns: unknown
      }
      st_split: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_square: {
        Args: { size: number; cell_i: number; cell_j: number; origin?: unknown }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { size: number; bounds: unknown }
        Returns: Record<string, unknown>[]
      }
      st_srid: {
        Args: { geog: unknown } | { geom: unknown }
        Returns: number
      }
      st_startpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_subdivide: {
        Args: { geom: unknown; maxvertices?: number; gridsize?: number }
        Returns: unknown[]
      }
      st_summary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          zoom: number
          x: number
          y: number
          bounds?: unknown
          margin?: number
        }
        Returns: unknown
      }
      st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_transform: {
        Args:
          | { geom: unknown; from_proj: string; to_proj: string }
          | { geom: unknown; from_proj: string; to_srid: number }
          | { geom: unknown; to_proj: string }
        Returns: unknown
      }
      st_triangulatepolygon: {
        Args: { g1: unknown }
        Returns: unknown
      }
      st_union: {
        Args:
          | { "": unknown[] }
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; gridsize: number }
        Returns: unknown
      }
      st_voronoilines: {
        Args: { g1: unknown; tolerance?: number; extend_to?: unknown }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { g1: unknown; tolerance?: number; extend_to?: unknown }
        Returns: unknown
      }
      st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_wkbtosql: {
        Args: { wkb: string }
        Returns: unknown
      }
      st_wkttosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_wrapx: {
        Args: { geom: unknown; wrap: number; move: number }
        Returns: unknown
      }
      st_x: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmin: {
        Args: { "": unknown }
        Returns: number
      }
      st_y: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymax: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymin: {
        Args: { "": unknown }
        Returns: number
      }
      st_z: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmflag: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmin: {
        Args: { "": unknown }
        Returns: number
      }
      text: {
        Args: { "": unknown }
        Returns: string
      }
      unlockrows: {
        Args: { "": string }
        Returns: number
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          schema_name: string
          table_name: string
          column_name: string
          new_srid_in: number
        }
        Returns: string
      }
    }
    Enums: {
      alert_severity: "low" | "medium" | "high" | "critical"
      alert_status: "active" | "acknowledged" | "resolved"
      billing_interval: "monthly" | "quarterly" | "annually"
      language_code:
        | "en"
        | "hi"
        | "mr"
        | "pa"
        | "gu"
        | "te"
        | "ta"
        | "kn"
        | "ml"
        | "or"
        | "bn"
      metric_type: "system" | "usage" | "ai_model" | "financial" | "custom"
      onboarding_step_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "skipped"
        | "failed"
      payment_status: "pending" | "paid" | "partial" | "overdue" | "failed"
      subscription_plan: "starter" | "growth" | "enterprise" | "custom"
      subscription_plan_type: "basic" | "premium" | "enterprise" | "custom"
      tenant_status: "trial" | "active" | "suspended" | "cancelled"
      tenant_type:
        | "agri_company"
        | "dealer"
        | "ngo"
        | "government"
        | "university"
        | "sugar_factory"
        | "cooperative"
        | "insurance"
      transaction_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
      user_role:
        | "super_admin"
        | "tenant_owner"
        | "tenant_admin"
        | "tenant_manager"
        | "dealer"
        | "agent"
        | "farmer"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown | null
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alert_severity: ["low", "medium", "high", "critical"],
      alert_status: ["active", "acknowledged", "resolved"],
      billing_interval: ["monthly", "quarterly", "annually"],
      language_code: [
        "en",
        "hi",
        "mr",
        "pa",
        "gu",
        "te",
        "ta",
        "kn",
        "ml",
        "or",
        "bn",
      ],
      metric_type: ["system", "usage", "ai_model", "financial", "custom"],
      onboarding_step_status: [
        "pending",
        "in_progress",
        "completed",
        "skipped",
        "failed",
      ],
      payment_status: ["pending", "paid", "partial", "overdue", "failed"],
      subscription_plan: ["starter", "growth", "enterprise", "custom"],
      subscription_plan_type: ["basic", "premium", "enterprise", "custom"],
      tenant_status: ["trial", "active", "suspended", "cancelled"],
      tenant_type: [
        "agri_company",
        "dealer",
        "ngo",
        "government",
        "university",
        "sugar_factory",
        "cooperative",
        "insurance",
      ],
      transaction_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
      ],
      user_role: [
        "super_admin",
        "tenant_owner",
        "tenant_admin",
        "tenant_manager",
        "dealer",
        "agent",
        "farmer",
      ],
    },
  },
} as const
