import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { supabase } from '@/config/supabase';

export const useProfileCompletion = () => {
  const { isAuthenticated, userId } = useSelector((state: RootState) => state.auth);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isAuthenticated && userId) {
      checkProfileCompletion();
    } else {
      setLoading(false);
      setIsProfileComplete(false);
    }
  }, [isAuthenticated, userId]);

  const checkProfileCompletion = async () => {
    try {
      setLoading(true);
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('full_name, village, district, state, date_of_birth, metadata')
        .eq('id', userId)
        .maybeSingle();

      if (error || !profile) {
        setIsProfileComplete(false);
        return;
      }

      const metadata = profile.metadata as any;
      const isCompleted = metadata?.profile_completed || (
        profile.full_name && 
        profile.village && 
        profile.district && 
        profile.state &&
        profile.date_of_birth
      );

      setIsProfileComplete(!!isCompleted);
    } catch (error) {
      console.error('Error checking profile completion:', error);
      setIsProfileComplete(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfileStatus = () => {
    if (isAuthenticated && userId) {
      checkProfileCompletion();
    }
  };

  return {
    isProfileComplete,
    loading,
    refreshProfileStatus
  };
};