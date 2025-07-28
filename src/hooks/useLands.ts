
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Land, LandWithDetails, SoilHealth, CropHistory, NDVIData, LandActivity, LandCreateInput, LandUpdateInput } from '@/types/land';

export const useLands = () => {
  return useQuery({
    queryKey: ['lands'],
    queryFn: async (): Promise<LandWithDetails[]> => {
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return []; // Return empty array instead of throwing error

      const { data: lands, error } = await supabase
        .from('lands')
        .select('*')
        .eq('farmer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching lands:', error);
        throw error;
      }

      // Process the data to match LandWithDetails interface
      const landsWithDetails: LandWithDetails[] = lands?.map(land => {
        // Create soil health from direct columns
        const soilHealth = land.soil_ph ? {
          id: `${land.id}_soil`,
          land_id: land.id,
          ph_level: land.soil_ph,
          organic_carbon: land.organic_carbon_percent,
          nitrogen_level: (land.nitrogen_kg_per_ha > 300 ? 'high' : land.nitrogen_kg_per_ha > 150 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
          phosphorus_level: (land.phosphorus_kg_per_ha > 25 ? 'high' : land.phosphorus_kg_per_ha > 12 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
          potassium_level: (land.potassium_kg_per_ha > 250 ? 'high' : land.potassium_kg_per_ha > 125 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
          soil_type: land.soil_type || 'Unknown',
          test_date: land.last_soil_test_date,
          source: 'manual' as const,
          created_at: land.created_at,
          updated_at: land.updated_at,
        } : undefined;

        // Create current crop from direct columns
        const currentCrop = land.current_crop ? {
          id: `${land.id}_crop`,
          land_id: land.id,
          crop_name: land.current_crop,
          variety: null,
          season: null,
          planting_date: land.last_sowing_date,
          harvest_date: land.expected_harvest_date,
          yield_kg_per_acre: null,
          growth_stage: land.crop_stage || 'unknown',
          status: 'active' as const,
          notes: null,
          created_at: land.created_at,
          updated_at: land.updated_at,
        } : undefined;

        // Calculate health score based on available data
        const healthScore = calculateLandHealthScore(soilHealth, undefined, currentCrop);

        return {
          ...land,
          soil_health: soilHealth,
          current_crop: currentCrop,
          recent_ndvi: undefined,
          recent_activities: [],
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

      // Use the land-operations edge function for consistent data handling
      const { data: result, error } = await supabase.functions.invoke('land-operations', {
        body: {
          action: 'CREATE',
          ...landData,
          farmer_id: user.id,
        }
      });

      if (error) throw new Error(error.message || 'Failed to create land');
      if (!result?.success) throw new Error(result?.error || 'Failed to create land');
      
      return result.data;
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
