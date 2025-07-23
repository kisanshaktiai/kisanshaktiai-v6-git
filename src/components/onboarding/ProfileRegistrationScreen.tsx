
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { User, ArrowRight, Loader2 } from 'lucide-react';
import { mobileNumberService } from '@/services/MobileNumberService';
import { useToast } from '@/hooks/use-toast';

interface ProfileRegistrationScreenProps {
  mobileNumber: string;
  pin: string;
  onNext: (userData: any) => void;
  onPrev: () => void;
}

export const ProfileRegistrationScreen: React.FC<ProfileRegistrationScreenProps> = ({ 
  mobileNumber, 
  pin, 
  onNext, 
  onPrev 
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    village: '',
    district: '',
    state: '',
    farming_experience_years: '',
    total_land_acres: '',
    farm_type: '',
    primary_crops: [] as string[],
    annual_income_range: '',
    has_irrigation: false,
    has_tractor: false,
    has_storage: false,
    irrigation_type: '',
    preferred_language: 'hi'
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCropChange = (crop: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      primary_crops: checked 
        ? [...prev.primary_crops, crop]
        : prev.primary_crops.filter(c => c !== crop)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.full_name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const registrationData = {
        ...formData,
        farming_experience_years: formData.farming_experience_years ? parseInt(formData.farming_experience_years) : null,
        total_land_acres: formData.total_land_acres ? parseFloat(formData.total_land_acres) : null,
        irrigation_type: formData.has_irrigation ? formData.irrigation_type : null,
        mobile_number: mobileNumber
      };

      const result = await mobileNumberService.registerNewUser(mobileNumber, pin, registrationData);
      
      if (result.success) {
        toast({
          title: "Registration successful!",
          description: "Welcome to KisanShakti AI",
        });
        onNext(result);
      } else {
        toast({
          title: "Registration failed",
          description: result.error || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Error",
        description: "Registration failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cropOptions = [
    { value: 'wheat', label: 'Wheat' },
    { value: 'rice', label: 'Rice' },
    { value: 'cotton', label: 'Cotton' },
    { value: 'sugarcane', label: 'Sugarcane' },
    { value: 'tomato', label: 'Tomato' },
    { value: 'onion', label: 'Onion' },
    { value: 'potato', label: 'Potato' },
    { value: 'maize', label: 'Maize' },
    { value: 'soybean', label: 'Soybean' },
    { value: 'groundnut', label: 'Groundnut' }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            Help us personalize your farming experience
          </p>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="village">Village</Label>
              <Input
                id="village"
                value={formData.village}
                onChange={(e) => handleInputChange('village', e.target.value)}
                placeholder="Village"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Input
                id="district"
                value={formData.district}
                onChange={(e) => handleInputChange('district', e.target.value)}
                placeholder="District"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              placeholder="State"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="farming_experience">Experience (years)</Label>
              <Input
                id="farming_experience"
                type="number"
                value={formData.farming_experience_years}
                onChange={(e) => handleInputChange('farming_experience_years', e.target.value)}
                placeholder="Years"
                min="0"
                max="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_land">Total Land (acres)</Label>
              <Input
                id="total_land"
                type="number"
                value={formData.total_land_acres}
                onChange={(e) => handleInputChange('total_land_acres', e.target.value)}
                placeholder="Acres"
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="farm_type">Farm Type</Label>
            <Select value={formData.farm_type} onValueChange={(value) => handleInputChange('farm_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select farm type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="organic">Organic</SelectItem>
                <SelectItem value="conventional">Conventional</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Primary Crops</Label>
            <div className="grid grid-cols-2 gap-2">
              {cropOptions.map((crop) => (
                <div key={crop.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={crop.value}
                    checked={formData.primary_crops.includes(crop.value)}
                    onCheckedChange={(checked) => handleCropChange(crop.value, checked as boolean)}
                  />
                  <Label htmlFor={crop.value} className="text-sm">
                    {crop.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="annual_income">Annual Income Range</Label>
            <Select value={formData.annual_income_range} onValueChange={(value) => handleInputChange('annual_income_range', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select income range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="below-1-lakh">Below ₹1 Lakh</SelectItem>
                <SelectItem value="1-2-lakhs">₹1-2 Lakhs</SelectItem>
                <SelectItem value="2-5-lakhs">₹2-5 Lakhs</SelectItem>
                <SelectItem value="5-10-lakhs">₹5-10 Lakhs</SelectItem>
                <SelectItem value="above-10-lakhs">Above ₹10 Lakhs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Farm Resources</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_irrigation"
                  checked={formData.has_irrigation}
                  onCheckedChange={(checked) => handleInputChange('has_irrigation', checked)}
                />
                <Label htmlFor="has_irrigation">Has Irrigation</Label>
              </div>
              
              {formData.has_irrigation && (
                <Select value={formData.irrigation_type} onValueChange={(value) => handleInputChange('irrigation_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select irrigation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drip">Drip Irrigation</SelectItem>
                    <SelectItem value="sprinkler">Sprinkler</SelectItem>
                    <SelectItem value="flood">Flood Irrigation</SelectItem>
                    <SelectItem value="rainfed">Rainfed</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_tractor"
                  checked={formData.has_tractor}
                  onCheckedChange={(checked) => handleInputChange('has_tractor', checked)}
                />
                <Label htmlFor="has_tractor">Has Tractor</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_storage"
                  checked={formData.has_storage}
                  onCheckedChange={(checked) => handleInputChange('has_storage', checked)}
                />
                <Label htmlFor="has_storage">Has Storage Facility</Label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handleSubmit}
            disabled={loading || !formData.full_name.trim()}
            className="w-full py-3 text-lg"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        <Button 
          variant="ghost" 
          onClick={onPrev}
          className="w-full"
        >
          Back
        </Button>
      </div>
    </div>
  );
};
