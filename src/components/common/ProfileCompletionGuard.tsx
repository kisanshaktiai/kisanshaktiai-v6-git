
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { supabase } from '@/config/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, MapPin, Calendar, Users } from 'lucide-react';

interface ProfileCompletionGuardProps {
  children: React.ReactNode;
}

export const ProfileCompletionGuard: React.FC<ProfileCompletionGuardProps> = ({ children }) => {
  const { isAuthenticated, userId } = useSelector((state: RootState) => state.auth);
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    village: '',
    district: '',
    state: '',
    dateOfBirth: ''
  });

  useEffect(() => {
    if (isAuthenticated && userId) {
      checkProfileCompletion();
    }
  }, [isAuthenticated, userId]);

  const checkProfileCompletion = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('full_name, village, district, state, date_of_birth, metadata')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking profile:', error);
        setProfileCompleted(false);
        setShowProfileForm(true);
        return;
      }

      if (!profile) {
        setProfileCompleted(false);
        setShowProfileForm(true);
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

      setProfileCompleted(!!isCompleted);
      
      if (!isCompleted) {
        setFormData({
          fullName: profile.full_name || '',
          village: profile.village || '',
          district: profile.district || '',
          state: profile.state || '',
          dateOfBirth: profile.date_of_birth || ''
        });
        setShowProfileForm(true);
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
      setProfileCompleted(false);
      setShowProfileForm(true);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verify we have an authenticated session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        console.error('No authenticated session found:', sessionError);
        throw new Error('Please log in again to continue');
      }

      const currentUserId = session.user.id;
      console.log('Current user ID:', currentUserId);

      // Get phone number from user metadata or auth user
      const phone = session.user.user_metadata?.phone || 
                   session.user.email?.split('@')[0] || 
                   session.user.phone || '';

      console.log('Phone number:', phone);

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', currentUserId)
        .maybeSingle();

      const profileData = {
        id: currentUserId,
        phone: phone,
        full_name: formData.fullName,
        village: formData.village,
        district: formData.district,
        state: formData.state,
        date_of_birth: formData.dateOfBirth,
        metadata: {
          profile_completed: true,
          completion_date: new Date().toISOString()
        }
      };

      let error;
      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update(profileData)
          .eq('id', currentUserId);
        error = updateError;
      } else {
        // Create new profile
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert([profileData]);
        error = insertError;
      }

      if (error) {
        console.error('Profile operation error:', error);
        throw error;
      }

      // Also create/update farmer profile
      const { data: existingFarmer } = await supabase
        .from('farmers')
        .select('id')
        .eq('id', currentUserId)
        .maybeSingle();

      const farmerData = {
        id: currentUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (!existingFarmer) {
        const { error: farmerError } = await supabase
          .from('farmers')
          .insert([farmerData]);
        
        if (farmerError) {
          console.error('Farmer profile creation error:', farmerError);
          // Don't throw here, as the user profile was created successfully
        }
      }

      setProfileCompleted(true);
      setShowProfileForm(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      // Show more specific error message
      if (error instanceof Error) {
        alert(`Failed to save profile: ${error.message}`);
      } else {
        alert('Failed to save profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Show loading while checking profile
  if (profileCompleted === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show profile completion form if needed
  if (showProfileForm && !profileCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <User className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
            <p className="text-gray-600">Please provide your details to unlock all features</p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Full Name *
              </label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Village *
              </label>
              <Input
                type="text"
                placeholder="Enter your village"
                value={formData.village}
                onChange={(e) => handleInputChange('village', e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                District *
              </label>
              <Input
                type="text"
                placeholder="Enter your district"
                value={formData.district}
                onChange={(e) => handleInputChange('district', e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                State *
              </label>
              <Input
                type="text"
                placeholder="Enter your state"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Date of Birth *
              </label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                required
                className="h-12"
              />
            </div>

            <Button 
              type="submit"
              disabled={loading}
              className="w-full h-12 text-lg font-semibold bg-green-500 hover:bg-green-600"
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </Button>
          </form>

          <div className="text-xs text-gray-500 text-center">
            Some features will be locked until you complete your profile
          </div>
        </div>
      </div>
    );
  }

  // If profile is completed or not authenticated, show children
  return <>{children}</>;
};
