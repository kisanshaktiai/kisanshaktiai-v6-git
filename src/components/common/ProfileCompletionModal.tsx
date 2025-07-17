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
import { User, MapPin, IdCard, Tractor, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

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
  const [showSuccess, setShowSuccess] = useState(false);
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
        return true; // No mandatory fields in step 3, all optional
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
        taluka: formData.tahsil,
        district: formData.district,
        state: formData.state,
        date_of_birth: formData.dateOfBirth,
        aadhaar_number: formData.aadhaarNumber || null,
        farmer_id: formData.farmerId || null,
        shc_id: formData.shcId || null,
        metadata: {
          profile_completed: true,
          completion_date: new Date().toISOString()
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
        farmer_code: formData.farmerId || null,
        aadhaar_number: formData.aadhaarNumber || null,
        shc_id: formData.shcId || null,
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

      // Show success animation
      setShowSuccess(true);
      
      toast({
        title: "Profile Completed!",
        description: "Your profile has been successfully saved.",
      });

      // Auto close after animation
      setTimeout(() => {
        onComplete();
        onClose();
        setShowSuccess(false);
      }, 2000);
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
          <div className="space-y-4">
            <div className="text-center mb-4">
              <User className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Personal Information</h3>
              <p className="text-xs text-muted-foreground">Tell us about yourself</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="fullName" className="text-xs font-medium">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="dateOfBirth" className="text-xs font-medium">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Location Details</h3>
              <p className="text-xs text-muted-foreground">Where are you located?</p>
            </div>

            <div className="mb-3">
              <Button
                type="button"
                variant="outline"
                onClick={getLocationData}
                disabled={gettingLocation}
                className="w-full h-9 text-xs"
              >
                <MapPin className="w-3 h-3 mr-1" />
                {gettingLocation ? 'Getting Location...' : 'Auto-fill from GPS'}
              </Button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="village" className="text-xs font-medium">Village *</Label>
                <Input
                  id="village"
                  type="text"
                  placeholder="Enter your village"
                  value={formData.village}
                  onChange={(e) => handleInputChange('village', e.target.value)}
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="tahsil" className="text-xs font-medium">Tahsil</Label>
                <Input
                  id="tahsil"
                  type="text"
                  placeholder="Enter your tahsil"
                  value={formData.tahsil}
                  onChange={(e) => handleInputChange('tahsil', e.target.value)}
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="district" className="text-xs font-medium">District *</Label>
                <Input
                  id="district"
                  type="text"
                  placeholder="Enter your district"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="state" className="text-xs font-medium">State *</Label>
                <Input
                  id="state"
                  type="text"
                  placeholder="Enter your state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <IdCard className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="text-base font-semibold text-foreground">ID & Verification</h3>
              <p className="text-xs text-muted-foreground">Your identification details</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="aadhaarNumber" className="text-xs font-medium">Aadhaar Number (Optional)</Label>
                <Input
                  id="aadhaarNumber"
                  type="text"
                  placeholder="Enter 12-digit Aadhaar number"
                  value={formData.aadhaarNumber}
                  onChange={(e) => handleInputChange('aadhaarNumber', e.target.value)}
                  maxLength={12}
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="farmerId" className="text-xs font-medium">Farmer ID (Optional)</Label>
                <Input
                  id="farmerId"
                  type="text"
                  placeholder="Enter your farmer ID"
                  value={formData.farmerId}
                  onChange={(e) => handleInputChange('farmerId', e.target.value)}
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="shcId" className="text-xs font-medium">SHC ID (Optional)</Label>
                <Input
                  id="shcId"
                  type="text"
                  placeholder="Enter your SHC ID"
                  value={formData.shcId}
                  onChange={(e) => handleInputChange('shcId', e.target.value)}
                  className="h-10 text-sm"
                />
                <p className="text-[10px] text-muted-foreground">Soil Health Card ID (if available)</p>
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
      <DialogContent className="w-full max-w-sm mx-2 p-0 gap-0 h-[90vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="px-4 py-3 text-center border-b border-border shrink-0">
          <DialogTitle className="text-lg font-semibold text-foreground">Complete Your Profile</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Complete your profile to access {featureName} and get personalized farming insights
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-foreground">Step {currentStep} of {steps.length}</span>
            <span className="text-xs text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-1.5" />
          
          {/* Step indicators */}
          <div className="flex justify-between mt-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                    currentStep >= step.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {showSuccess ? (
            // Success Animation
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <CheckCircle className="w-16 h-16 text-green-500 animate-bounce" />
                <div className="absolute inset-0 w-16 h-16 bg-green-500/20 rounded-full animate-ping"></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Profile Completed!</h3>
                <p className="text-sm text-muted-foreground">
                  Your profile has been successfully saved.<br />
                  Redirecting to dashboard...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
              <div className="flex-1">
                {renderStepContent()}
              </div>

              {/* Navigation */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-border shrink-0">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="flex-1 h-10 text-sm"
                  >
                    <ChevronLeft className="w-3 h-3 mr-1" />
                    Previous
                  </Button>
                )}
                
                {currentStep === 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 h-10 text-sm"
                  >
                    Skip for now
                  </Button>
                )}

                {currentStep < steps.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!validateStep(currentStep)}
                    className="flex-1 h-10 text-sm"
                  >
                    Next
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading || !validateStep(currentStep)}
                    className="flex-1 h-10 text-sm"
                  >
                    {loading ? 'Saving...' : 'Complete Profile'}
                  </Button>
                )}
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};