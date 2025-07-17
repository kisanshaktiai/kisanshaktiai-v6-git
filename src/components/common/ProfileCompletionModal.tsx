import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { supabase } from '@/config/supabase';
import { LocationService } from '@/services/LocationService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { User, MapPin, IdCard, Tractor, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  featureName?: string;
}

interface FormData {
  fullName: string;
  village: string;
  tahsil: string;
  district: string;
  state: string;
  dateOfBirth: string;
  aadhaarNumber: string;
  farmerId: string;
  shcId: string;
}

const steps = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'Location', icon: MapPin },
  { id: 3, title: 'IDs & Verification', icon: IdCard }
];

export const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  featureName = 'this feature'
}) => {
  const { userId } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    village: '',
    tahsil: '',
    district: '',
    state: '',
    dateOfBirth: '',
    aadhaarNumber: '',
    farmerId: '',
    shcId: ''
  });

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFormData({
        fullName: '',
        village: '',
        tahsil: '',
        district: '',
        state: '',
        dateOfBirth: '',
        aadhaarNumber: '',
        farmerId: '',
        shcId: ''
      });
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getLocationData = async () => {
    setGettingLocation(true);
    try {
      const locationService = LocationService.getInstance();
      
      // Request permissions first
      const hasPermission = await locationService.requestPermissions();
      if (!hasPermission) {
        toast({
          title: "Location Permission Required",
          description: "Please allow location access to auto-fill location details",
          variant: "destructive"
        });
        return;
      }

      // Get current location
      const location = await locationService.getCurrentLocation();
      
      // Get address from coordinates
      const addressData = await locationService.reverseGeocode(
        location.latitude, 
        location.longitude
      );

      // Auto-fill location fields
      setFormData(prev => ({
        ...prev,
        district: addressData.district,
        state: addressData.state,
        tahsil: addressData.address // Using address as tahsil for now
      }));

      toast({
        title: "Location Retrieved",
        description: "Location details have been auto-filled",
      });
    } catch (error) {
      console.error('Error getting location:', error);
      toast({
        title: "Location Error",
        description: "Unable to get location. Please enter manually.",
        variant: "destructive"
      });
    } finally {
      setGettingLocation(false);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.fullName && formData.dateOfBirth);
      case 2:
        return !!(formData.village && formData.district && formData.state);
      case 3:
        return !!(formData.aadhaarNumber && formData.farmerId);
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      toast({
        title: "Please fill required fields",
        description: "All required fields must be completed",
        variant: "destructive"
      });
      return;
    }

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

      // Check if profile exists
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
          completion_date: new Date().toISOString(),
          tahsil: formData.tahsil,
          aadhaar_number: formData.aadhaarNumber,
          farmer_id: formData.farmerId,
          shc_id: formData.shcId || null
        }
      };

      // Save profile
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

      // Create/update farmer profile
      const { data: existingFarmer } = await supabase
        .from('farmers')
        .select('id')
        .eq('id', currentUserId)
        .maybeSingle();

      const farmerData = {
        id: currentUserId,
        farmer_code: formData.farmerId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (existingFarmer) {
        await supabase
          .from('farmers')
          .update(farmerData)
          .eq('id', currentUserId);
      } else {
        await supabase
          .from('farmers')
          .insert([farmerData]);
      }

      toast({
        title: "Profile Completed!",
        description: "Your profile has been successfully saved.",
      });

      onComplete();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <User className="w-12 h-12 mx-auto mb-3 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
              <p className="text-sm text-muted-foreground">Tell us about yourself</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-sm font-medium">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="h-12"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <MapPin className="w-12 h-12 mx-auto mb-3 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Location Details</h3>
              <p className="text-sm text-muted-foreground">Where are you located?</p>
            </div>

            <div className="mb-4">
              <Button
                type="button"
                variant="outline"
                onClick={getLocationData}
                disabled={gettingLocation}
                className="w-full h-12 text-sm"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {gettingLocation ? 'Getting Location...' : 'Auto-fill from GPS'}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="village" className="text-sm font-medium">Village *</Label>
                <Input
                  id="village"
                  type="text"
                  placeholder="Enter your village"
                  value={formData.village}
                  onChange={(e) => handleInputChange('village', e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tahsil" className="text-sm font-medium">Tahsil</Label>
                <Input
                  id="tahsil"
                  type="text"
                  placeholder="Enter your tahsil"
                  value={formData.tahsil}
                  onChange={(e) => handleInputChange('tahsil', e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="district" className="text-sm font-medium">District *</Label>
                <Input
                  id="district"
                  type="text"
                  placeholder="Enter your district"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-medium">State *</Label>
                <Input
                  id="state"
                  type="text"
                  placeholder="Enter your state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="h-12"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <IdCard className="w-12 h-12 mx-auto mb-3 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">ID & Verification</h3>
              <p className="text-sm text-muted-foreground">Your identification details</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aadhaarNumber" className="text-sm font-medium">Aadhaar Number *</Label>
                <Input
                  id="aadhaarNumber"
                  type="text"
                  placeholder="Enter 12-digit Aadhaar number"
                  value={formData.aadhaarNumber}
                  onChange={(e) => handleInputChange('aadhaarNumber', e.target.value)}
                  maxLength={12}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="farmerId" className="text-sm font-medium">Farmer ID *</Label>
                <Input
                  id="farmerId"
                  type="text"
                  placeholder="Enter your farmer ID"
                  value={formData.farmerId}
                  onChange={(e) => handleInputChange('farmerId', e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shcId" className="text-sm font-medium">SHC ID (Optional)</Label>
                <Input
                  id="shcId"
                  type="text"
                  placeholder="Enter your SHC ID"
                  value={formData.shcId}
                  onChange={(e) => handleInputChange('shcId', e.target.value)}
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground">Soil Health Card ID (if available)</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-4 p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 text-center border-b border-border">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tractor className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">Complete Your Profile</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Complete your profile to access {featureName} and get personalized farming insights
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">Step {currentStep} of {steps.length}</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                    currentStep >= step.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-muted-foreground text-center">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            {renderStepContent()}

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1 h-12"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
              
              {currentStep === 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-12"
                >
                  Skip for now
                </Button>
              )}

              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                  className="flex-1 h-12"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading || !validateStep(currentStep)}
                  className="flex-1 h-12"
                >
                  {loading ? 'Saving...' : 'Complete Profile'}
                </Button>
              )}
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};