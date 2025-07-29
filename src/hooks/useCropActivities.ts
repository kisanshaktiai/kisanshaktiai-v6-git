import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CropActivity {
  id?: string;
  crop_name: string;
  variety?: string;
  planting_date?: string;
  harvest_date?: string;
  season?: string;
  status?: string;
  notes?: string;
  tenant_id: string;
}

export const useCropActivities = (landId?: string) => {
  const queryClient = useQueryClient();

  // Query for crop activities
  const activitiesQuery = useQuery({
    queryKey: ['crop-activities', landId],
    queryFn: async () => {
      if (!landId) return [];
      
      const { data, error } = await supabase
        .from('crop_history')
        .select('*')
        .eq('land_id', landId)
        .order('planting_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!landId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: true,
  });

  // Optimistic mutation for adding activities
  const addActivity = useMutation({
    mutationFn: async (newActivity: CropActivity) => {
      const { data, error } = await supabase
        .from('crop_history')
        .insert([{ ...newActivity, land_id: landId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newActivity) => {
      await queryClient.cancelQueries({ queryKey: ['crop-activities', landId] });
      
      const previousActivities = queryClient.getQueryData(['crop-activities', landId]);
      
      const optimisticActivity = {
        ...newActivity,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      
      queryClient.setQueryData(['crop-activities', landId], (old: any[]) => [
        ...(old || []),
        optimisticActivity
      ]);

      return { previousActivities };
    },
    onError: (err, newActivity, context) => {
      queryClient.setQueryData(['crop-activities', landId], context?.previousActivities);
      toast({
        title: "Failed to add activity",
        description: "Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Activity added",
        description: "New crop activity has been scheduled.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['crop-activities', landId] });
      queryClient.invalidateQueries({ queryKey: ['optimized-dashboard'] });
    },
  });

  // Optimistic mutation for updating activity completion
  const toggleActivityCompletion = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { data, error } = await supabase
        .from('crop_history')
        .update({ 
          status: completed ? 'completed' : 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['crop-activities', landId] });
      
      const previousActivities = queryClient.getQueryData(['crop-activities', landId]);
      
      queryClient.setQueryData(['crop-activities', landId], (old: any[]) => 
        old?.map(activity => 
          activity.id === id 
            ? { 
                ...activity, 
                status: completed ? 'completed' : 'active',
                updated_at: new Date().toISOString()
              }
            : activity
        ) || []
      );

      return { previousActivities };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['crop-activities', landId], context?.previousActivities);
      toast({
        title: "Update failed",
        description: "Could not update activity status.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['crop-activities', landId] });
    },
  });

  return {
    activities: activitiesQuery.data || [],
    isLoading: activitiesQuery.isLoading,
    error: activitiesQuery.error,
    addActivity: addActivity.mutate,
    toggleCompletion: toggleActivityCompletion.mutate,
    isAddingActivity: addActivity.isPending,
    isUpdatingActivity: toggleActivityCompletion.isPending,
    refetch: activitiesQuery.refetch,
  };
};