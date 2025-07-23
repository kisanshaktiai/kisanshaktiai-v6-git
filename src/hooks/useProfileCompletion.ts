
import { useState, useEffect } from 'react';
import { useCustomAuth } from './useCustomAuth';
import { localStorageService } from '@/services/storage/localStorageService';
import { sessionService } from '@/services/sessionService';

export const useProfileCompletion = () => {
  const { farmer, isAuthenticated } = useCustomAuth();
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [unlockedFeatures, setUnlockedFeatures] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && farmer) {
      calculateCompletion();
    } else {
      setLoading(false);
    }
  }, [farmer, isAuthenticated]);

  const calculateCompletion = () => {
    setLoading(true);
    
    try {
      const completion = sessionService.calculateProfileCompletion(farmer);
      setCompletionPercentage(completion);
      
      // Update feature access based on completion
      const featureRules = localStorageService.getFeatureAccessRules();
      const newUnlockedFeatures: Record<string, boolean> = {};
      
      Object.entries(featureRules).forEach(([feature, rule]) => {
        const hasAccess = rule.alwaysAvailable || completion >= rule.minCompletion;
        newUnlockedFeatures[feature] = hasAccess;
        
        // Update session
        sessionService.updateFeatureAccess(feature, hasAccess);
      });
      
      setUnlockedFeatures(newUnlockedFeatures);
      
      // Cache the results
      localStorageService.setCacheWithTTL('profile_completion', completion, 60); // 1 hour
      localStorageService.setCacheWithTTL('feature_access_status', newUnlockedFeatures, 60);
      
    } catch (error) {
      console.error('Error calculating profile completion:', error);
      
      // Fallback to cached values
      const cachedCompletion = localStorageService.getCacheIfValid('profile_completion');
      const cachedFeatures = localStorageService.getCacheIfValid('feature_access_status');
      
      if (cachedCompletion !== null) {
        setCompletionPercentage(cachedCompletion);
      }
      
      if (cachedFeatures) {
        setUnlockedFeatures(cachedFeatures);
      }
    } finally {
      setLoading(false);
    }
  };

  const getRequiredFieldsForCompletion = () => {
    const requiredFields = [
      { field: 'farmer_code', label: 'Farmer Name', weight: 25 },
      { field: 'primary_crops', label: 'Primary Crops', weight: 15 },
      { field: 'total_land_acres', label: 'Land Size', weight: 15 },
      { field: 'farming_experience_years', label: 'Experience', weight: 10 },
      { field: 'annual_income_range', label: 'Income Range', weight: 10 },
      { field: 'farm_type', label: 'Farm Type', weight: 10 },
      { field: 'has_irrigation', label: 'Irrigation', weight: 10 },
      { field: 'aadhaar_number', label: 'Aadhaar Number', weight: 5 }
    ];

    return requiredFields.map(field => ({
      ...field,
      completed: farmer && farmer[field.field] !== null && farmer[field.field] !== undefined && farmer[field.field] !== ''
    }));
  };

  const getNextStepsForCompletion = () => {
    const fields = getRequiredFieldsForCompletion();
    return fields
      .filter(field => !field.completed)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3); // Show top 3 missing fields
  };

  const isFeatureUnlocked = (feature: string): boolean => {
    return unlockedFeatures[feature] || false;
  };

  const getFeatureUnlockThreshold = (feature: string): number => {
    const featureRules = localStorageService.getFeatureAccessRules();
    return featureRules[feature]?.minCompletion || 0;
  };

  const refresh = () => {
    if (isAuthenticated && farmer) {
      calculateCompletion();
    }
  };

  const isProfileComplete = completionPercentage >= 100;

  const refreshProfileStatus = () => {
    refresh();
  };

  return {
    completionPercentage,
    unlockedFeatures,
    loading,
    getRequiredFieldsForCompletion,
    getNextStepsForCompletion,
    isFeatureUnlocked,
    getFeatureUnlockThreshold,
    refresh,
    isProfileComplete,
    refreshProfileStatus
  };
};
