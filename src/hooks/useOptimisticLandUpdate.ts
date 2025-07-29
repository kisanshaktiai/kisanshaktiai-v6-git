import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface OptimisticLandUpdate {
  id: string;
  name?: string;
  crop_name?: string;
  last_updated?: string;
}

export const useOptimisticLandUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: OptimisticLandUpdate) => {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      return update;
    },
    onMutate: async (newLand) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['optimized-lands'] });

      // Snapshot the previous value
      const previousLands = queryClient.getQueryData(['optimized-lands']);

      // Optimistically update to the new value
      queryClient.setQueryData(['optimized-lands'], (old: any) => {
        if (!old) return old;
        
        // Update the specific land in the array
        if (Array.isArray(old)) {
          return old.map(land => 
            land.id === newLand.id 
              ? { ...land, ...newLand, last_updated: new Date().toISOString() }
              : land
          );
        }
        
        // Update single land object
        if (old.id === newLand.id) {
          return { ...old, ...newLand, last_updated: new Date().toISOString() };
        }
        
        return old;
      });

      // Return a context object with the snapshotted value
      return { previousLands };
    },
    onError: (err, newLand, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['optimized-lands'], context?.previousLands);
      
      toast({
        title: "Update Failed",
        description: "Could not update land information. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Land information updated successfully.",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['optimized-lands'] });
      queryClient.invalidateQueries({ queryKey: ['optimized-dashboard'] });
    },
  });
};