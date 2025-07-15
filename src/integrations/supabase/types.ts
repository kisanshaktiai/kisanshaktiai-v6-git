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
        ]
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
          unit?: string | null
        }
        Relationships: [
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
          boundary_polygon: Json | null
          center_point: Json | null
          created_at: string
          farmer_id: string
          id: string
          irrigation_source: string | null
          name: string
          ownership_type: string | null
          survey_number: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          area_acres: number
          boundary_polygon?: Json | null
          center_point?: Json | null
          created_at?: string
          farmer_id: string
          id?: string
          irrigation_source?: string | null
          name: string
          ownership_type?: string | null
          survey_number?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          area_acres?: number
          boundary_polygon?: Json | null
          center_point?: Json | null
          created_at?: string
          farmer_id?: string
          id?: string
          irrigation_source?: string | null
          name?: string
          ownership_type?: string | null
          survey_number?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      ndvi_data: {
        Row: {
          cloud_cover: number | null
          created_at: string
          date: string
          id: string
          image_url: string | null
          land_id: string
          ndvi_value: number | null
          satellite_source: string | null
        }
        Insert: {
          cloud_cover?: number | null
          created_at?: string
          date: string
          id?: string
          image_url?: string | null
          land_id: string
          ndvi_value?: number | null
          satellite_source?: string | null
        }
        Update: {
          cloud_cover?: number | null
          created_at?: string
          date?: string
          id?: string
          image_url?: string | null
          land_id?: string
          ndvi_value?: number | null
          satellite_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ndvi_data_land_id_fkey"
            columns: ["land_id"]
            isOneToOne: false
            referencedRelation: "lands"
            referencedColumns: ["id"]
          },
        ]
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
          test_date?: string | null
          test_report_url?: string | null
          texture?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "soil_health_land_id_fkey"
            columns: ["land_id"]
            isOneToOne: false
            referencedRelation: "lands"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_land_health_score: {
        Args: { land_uuid: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
