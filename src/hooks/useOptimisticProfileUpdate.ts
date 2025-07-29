import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface OptimisticProfileUpdate {
  id?: string;
  name?: string;
  village?: string;
  district?: string;
  state?: string;
  mobile_number?: string;
  [key: string]: any;
}

export const useOptimisticProfileUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: OptimisticProfileUpdate) => {
      // Simulate API call - replace with actual profile update API
      await new Promise(resolve => setTimeout(resolve, 800));
      return update;
    },
    onMutate: async (newProfile) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['optimized-profile'] });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData(['optimized-profile']);

      // Optimistically update to the new value
      queryClient.setQueryData(['optimized-profile'], (old: any) => {
        if (!old) return newProfile;
        return { 
          ...old, 
          ...newProfile, 
          updated_at: new Date().toISOString() 
        };
      });

      // Return a context object with the snapshotted value
      return { previousProfile };
    },
    onError: (err, newProfile, context) => {
      // If the mutation fails, roll back to previous state
      queryClient.setQueryData(['optimized-profile'], context?.previousProfile);
      
      toast({
        title: "Update Failed",
        description: "Could not update profile. Please check your connection and try again.",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['optimized-profile'] });
      queryClient.invalidateQueries({ queryKey: ['optimized-dashboard'] });
    },
  });
};