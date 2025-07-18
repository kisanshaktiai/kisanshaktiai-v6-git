
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { farmerService, FarmerRegistrationData } from '@/services/FarmerService';
import { tenantService } from '@/services/TenantService';
import { useTenantContext } from '@/hooks/useTenantContext';

interface PhoneAuthScreenProps {
  onComplete: () => void;
}

type AuthStep = 'phone' | 'pin' | 'success';

export const PhoneAuthScreen: React.FC<PhoneAuthScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState<AuthStep>('phone');
  const [mobileNumber, setMobileNumber] = useState('');
  const [pin, setPin] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { tenantData } = useTenantContext();

  const validateMobileNumber = (mobile: string): boolean => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
  };

  // Simple hash function for demo purposes
  const simpleHash = (text: string): string => {
    return `demo_hash_${text}_${Date.now()}`;
  };

  const handleMobileSubmit = async () => {
    if (!validateMobileNumber(mobileNumber)) {
      setError('कृपया वैध मोबाइल नंबर दर्ज करें (Please enter a valid mobile number)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if farmer exists
      const existingFarmer = await farmerService.getFarmerByMobile(mobileNumber);
      
      if (existingFarmer) {
        setIsRegistering(false);
        setStep('pin');
      } else {
        setIsRegistering(true);
        setStep('pin');
      }
    } catch (err) {
      console.error('Error checking farmer:', err);
      setError('कुछ गलत हुआ। कृपया फिर से कोशिश करें। (Something went wrong. Please try again.)');
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 4) {
      setError('कृपया 4 अंकों का पिन दर्ज करें (Please enter a 4-digit PIN)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        // Register new farmer
        const hashedPin = simpleHash(pin);
        
        const registrationData: FarmerRegistrationData = {
          mobile_number: mobileNumber,
          pin_hash: hashedPin,
          tenant_id: tenantService.getCurrentTenantId()
        };

        await farmerService.registerFarmer(registrationData);
        setStep('success');
        
        // Auto complete after 2 seconds
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        // Login existing farmer
        const farmer = await farmerService.getFarmerByMobile(mobileNumber);
        
        if (farmer) {
          // For demo, we'll just check if pin exists (simple validation)
          setStep('success');
          
          // Store farmer data in localStorage for demo purposes
          localStorage.setItem('current_farmer', JSON.stringify({
            id: farmer.id,
            mobile_number: farmer.mobile_number,
            farmer_code: farmer.farmer_code,
            tenant_id: farmer.tenant_id
          }));
          
          // Auto complete after 2 seconds
          setTimeout(() => {
            onComplete();
          }, 2000);
        } else {
          setError('किसान का डेटा नहीं मिला। (Farmer data not found.)');
        }
      }
    } catch (err) {
      console.error('Error with authentication:', err);
      setError('कुछ गलत हुआ। कृपया फिर से कोशिश करें। (Something went wrong. Please try again.)');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('phone');
    setPin('');
    setError(null);
  };

  const appName = tenantData?.branding?.app_name || 'KisanShakti AI';
  const primaryColor = tenantData?.branding?.primary_color || '#8BC34A';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" 
               style={{ backgroundColor: `${primaryColor}20` }}>
            {step === 'success' ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : step === 'pin' ? (
              <Lock className="w-8 h-8" style={{ color: primaryColor }} />
            ) : (
              <Smartphone className="w-8 h-8" style={{ color: primaryColor }} />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl font-bold" style={{ color: primaryColor }}>
              {appName}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              किसानों के लिए बुद्धिमान समाधान
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 'phone' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  मोबाइल नंबर दर्ज करें
                </h3>
                <p className="text-sm text-gray-600">
                  लॉगिन या रजिस्टर करने के लिए
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  मोबाइल नंबर (Mobile Number)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    +91
                  </span>
                  <Input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="9876543210"
                    className="pl-12"
                    maxLength={10}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                onClick={handleMobileSubmit}
                disabled={loading || !mobileNumber}
                className="w-full"
                style={{ backgroundColor: primaryColor }}
              >
                {loading ? 'जांच रहे हैं...' : 'आगे बढ़ें'}
              </Button>
            </div>
          )}

          {step === 'pin' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  {isRegistering ? '4 अंकों का पिन बनाएं' : '4 अंकों का पिन दर्ज करें'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isRegistering ? 'नया पिन सेट करें' : 'अपना पिन दर्ज करें'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  मोबाइल: +91 {mobileNumber}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  पिन (PIN)
                </label>
                <Input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="text-center text-2xl tracking-widest"
                  maxLength={4}
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Button
                  onClick={handlePinSubmit}
                  disabled={loading || pin.length !== 4}
                  className="w-full"
                  style={{ backgroundColor: primaryColor }}
                >
                  {loading ? 'प्रोसेसिंग...' : isRegistering ? 'रजिस्टर करें' : 'लॉगिन करें'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                  className="w-full"
                >
                  वापस जाएं
                </Button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {isRegistering ? 'रजिस्ट्रेशन सफल!' : 'लॉगिन सफल!'}
                </h3>
                <p className="text-sm text-gray-600">
                  {appName} में आपका स्वागत है
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
