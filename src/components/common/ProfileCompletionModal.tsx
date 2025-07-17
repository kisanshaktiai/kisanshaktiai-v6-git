import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { supabase } from '@/config/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock } from 'lucide-react';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  featureName?: string;
}

export const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  featureName = 'this feature'
}) => {
  const { userId } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    village: '',
    district: '',
    state: '',
    dateOfBirth: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        throw new Error('Please log in again to continue');
      }

      const currentUserId = session.user.id;
      const phone = session.user.user_metadata?.phone || 
                   session.user.email?.split('@')[0] || 
                   session.user.phone || '';

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
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update(profileData)
          .eq('id', currentUserId);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert([profileData]);
        error = insertError;
      }

      if (error) {
        throw error;
      }

      // Create farmer profile if doesn't exist
      const { data: existingFarmer } = await supabase
        .from('farmers')
        .select('id')
        .eq('id', currentUserId)
        .maybeSingle();

      if (!existingFarmer) {
        await supabase
          .from('farmers')
          .insert([{
            id: currentUserId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
      }

      onComplete();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-orange-600" />
          </div>
          <DialogTitle className="text-xl font-bold">Complete Your Profile</DialogTitle>
          <DialogDescription className="text-gray-600">
            You need to complete your profile to access {featureName}. This helps us provide you with personalized farming insights.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="village">Village *</Label>
            <Input
              id="village"
              type="text"
              placeholder="Enter your village"
              value={formData.village}
              onChange={(e) => handleInputChange('village', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="district">District *</Label>
            <Input
              id="district"
              type="text"
              placeholder="Enter your district"
              value={formData.district}
              onChange={(e) => handleInputChange('district', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              type="text"
              placeholder="Enter your state"
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Later
            </Button>
            <Button 
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};