
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Land, LandWithDetails, SoilHealth, CropHistory, NDVIData, LandActivity, LandCreateInput, LandUpdateInput } from '@/types/land';

export const useLands = () => {
  return useQuery({
    queryKey: ['lands'],
    queryFn: async (): Promise<LandWithDetails[]> => {
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

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
        .eq('farmer_id', user.id)
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

        // Calculate enhanced health score
        const healthScore = calculateLandHealthScore(soilHealth, recentNdvi, currentCrop);

        return {
          ...land,
          soil_health: soilHealth,
          current_crop: currentCrop,
          recent_ndvi: recentNdvi,
          recent_activities: recentActivities,
          health_score: healthScore,
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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const finalLandData = {
        ...landData,
        farmer_id: user.id,
      };

      const { data, error } = await supabase
        .from('lands')
        .insert([finalLandData])
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

// Enhanced health score calculation
const calculateLandHealthScore = (
  soilHealth?: SoilHealth, 
  ndviData?: NDVIData, 
  currentCrop?: CropHistory
): number => {
  let score = 0;
  let factors = 0;

  // Soil health factors (60% weight)
  if (soilHealth) {
    let soilScore = 0;
    let soilFactors = 0;

    // pH level (optimal 6.0-7.5)
    if (soilHealth.ph_level) {
      const ph = soilHealth.ph_level;
      if (ph >= 6.0 && ph <= 7.5) {
        soilScore += 5;
      } else if (ph >= 5.5 && ph <= 8.0) {
        soilScore += 3;
      } else {
        soilScore += 1;
      }
      soilFactors++;
    }

    // Organic carbon (higher is better, >0.75% is good)
    if (soilHealth.organic_carbon) {
      const oc = soilHealth.organic_carbon;
      if (oc >= 0.75) {
        soilScore += 5;
      } else if (oc >= 0.5) {
        soilScore += 3;
      } else {
        soilScore += 1;
      }
      soilFactors++;
    }

    // NPK levels
    const nutrientLevels = [
      soilHealth.nitrogen_level,
      soilHealth.phosphorus_level,
      soilHealth.potassium_level
    ];

    nutrientLevels.forEach(level => {
      if (level) {
        switch (level) {
          case 'high':
            soilScore += 5;
            break;
          case 'medium':
            soilScore += 3;
            break;
          case 'low':
            soilScore += 1;
            break;
        }
        soilFactors++;
      }
    });

    if (soilFactors > 0) {
      score += (soilScore / soilFactors) * 0.6;
      factors += 0.6;
    }
  }

  // NDVI health factors (25% weight)
  if (ndviData?.ndvi_value) {
    const ndvi = ndviData.ndvi_value;
    let ndviScore = 0;
    
    if (ndvi >= 0.7) {
      ndviScore = 5; // Excellent vegetation health
    } else if (ndvi >= 0.5) {
      ndviScore = 4; // Good vegetation health
    } else if (ndvi >= 0.3) {
      ndviScore = 3; // Fair vegetation health
    } else if (ndvi >= 0.1) {
      ndviScore = 2; // Poor vegetation health
    } else {
      ndviScore = 1; // Very poor vegetation health
    }
    
    score += ndviScore * 0.25;
    factors += 0.25;
  }

  // Crop status factors (15% weight)
  if (currentCrop) {
    let cropScore = 3; // Base score for having active crop
    
    if (currentCrop.status === 'active') {
      cropScore = 4;
    } else if (currentCrop.status === 'harvested') {
      cropScore = 3;
    } else if (currentCrop.status === 'failed') {
      cropScore = 1;
    }
    
    score += cropScore * 0.15;
    factors += 0.15;
  }

  // Return calculated score or default
  return factors > 0 ? Math.min(5, score / factors) : 2.5;
};
