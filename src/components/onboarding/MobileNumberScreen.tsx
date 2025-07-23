
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, ArrowRight, Loader2 } from 'lucide-react';
import { mobileNumberService } from '@/services/MobileNumberService';
import { useToast } from '@/hooks/use-toast';

interface MobileNumberScreenProps {
  onNext: (mobileNumber: string, userExists: boolean, userData?: any) => void;
  onPrev: () => void;
}

export const MobileNumberScreen: React.FC<MobileNumberScreenProps> = ({ onNext, onPrev }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!mobileNumber.trim()) {
      toast({
        title: "Mobile number required",
        description: "Please enter your mobile number",
        variant: "destructive",
      });
      return;
    }

    if (!mobileNumberService.validateMobileNumber(mobileNumber)) {
      toast({
        title: "Invalid mobile number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await mobileNumberService.checkUserExists(mobileNumber);
      
      if (result.exists) {
        // User exists, pass user data and redirect to PIN screen
        onNext(mobileNumber, true, { farmer: result.farmer, profile: result.profile });
      } else {
        // User doesn't exist, redirect to registration
        onNext(mobileNumber, false);
      }
    } catch (error) {
      console.error('Error checking user existence:', error);
      toast({
        title: "Error",
        description: "Failed to check user existence. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMobileNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and limit to 10 digits
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(cleaned);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('onboarding.mobileNumber.title', 'Enter Mobile Number')}
          </h1>
          <p className="text-gray-600">
            {t('onboarding.mobileNumber.subtitle', 'We\'ll check if you\'re already registered')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              +91
            </div>
            <Input
              type="tel"
              placeholder="Enter 10-digit mobile number"
              value={mobileNumber}
              onChange={handleMobileNumberChange}
              className="pl-12 text-center text-lg py-3"
              maxLength={10}
            />
          </div>
          
          <Button 
            onClick={handleNext}
            disabled={!mobileNumber.trim() || loading}
            className="w-full py-3 text-lg"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.checking', 'Checking...')}
              </>
            ) : (
              <>
                {t('common.next', 'Next')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            {t('onboarding.mobileNumber.privacy', 'Your mobile number is secure and will not be shared')}
          </p>
        </div>

        <Button 
          variant="ghost" 
          onClick={onPrev}
          className="w-full"
        >
          {t('common.back', 'Back')}
        </Button>
      </div>
    </div>
  );
};
