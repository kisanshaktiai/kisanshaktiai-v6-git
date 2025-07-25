
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Land, LandWithDetails, SoilHealth, CropHistory, NDVIData, LandActivity, LandCreateInput, LandUpdateInput } from '@/types/land';

export const useLands = () => {
  return useQuery({
    queryKey: ['lands'],
    queryFn: async (): Promise<LandWithDetails[]> => {
      const { data: lands, error } = await supabase
        .from('lands')
        .select(`
          *,
          soil_health:soil_health!soil_health_land_id_fkey(
            id, land_id, ph_level, organic_carbon, nitrogen_level, 
            phosphorus_level, potassium_level, soil_type, 
            test_date, source, created_at, updated_at
          ),
          crop_history!crop_history_land_id_fkey(
            id, land_id, crop_name, variety, season, planting_date, 
            harvest_date, yield_kg_per_acre, growth_stage, 
            status, notes, created_at, updated_at
          ),
          ndvi_data!ndvi_data_land_id_fkey(
            id, land_id, date, ndvi_value, satellite_source, 
            image_url, cloud_cover, created_at
          ),
          land_activities!land_activities_land_id_fkey(
            id, land_id, activity_type, description, quantity, 
            unit, cost, activity_date, notes, created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process the data to get the most recent related records
      const landsWithDetails: LandWithDetails[] = lands?.map(land => {
        const soilHealthArray = land.soil_health as any[];
        const soilHealth = soilHealthArray && soilHealthArray.length > 0 
          ? soilHealthArray[0] as SoilHealth
          : undefined;
        
        const cropHistoryArray = land.crop_history as any[];
        const currentCrop = cropHistoryArray 
          ? cropHistoryArray.find((crop: any) => crop.status === 'active') as CropHistory | undefined
          : undefined;
        
        const ndviDataArray = land.ndvi_data as any[];
        const recentNdvi = ndviDataArray && ndviDataArray.length > 0 
          ? ndviDataArray[0] as NDVIData
          : undefined;
        
        const activitiesArray = land.land_activities as any[];
        const recentActivities = activitiesArray 
          ? (activitiesArray as LandActivity[]).slice(0, 5)
          : [];

        return {
          ...land,
          soil_health: soilHealth,
          current_crop: currentCrop,
          recent_ndvi: recentNdvi,
          recent_activities: recentActivities,
        } as LandWithDetails;
      }) || [];

      return landsWithDetails;
    },
  });
};

export const useCreateLand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (landData: LandCreateInput) => {
      const { data, error } = await supabase
        .from('lands')
        .insert([landData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lands'] });
    },
  });
};

export const useUpdateLand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: LandUpdateInput }) => {
      const { data, error } = await supabase
        .from('lands')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lands'] });
    },
  });
};

export const useDeleteLand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lands')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lands'] });
    },
  });
};

export const useLandHealthScore = (landId: string) => {
  return useQuery({
    queryKey: ['land-health-score', landId],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .rpc('calculate_land_health_score', { land_uuid: landId });

      if (error) throw error;
      return data || 2.5;
    },
    enabled: !!landId,
  });
};
