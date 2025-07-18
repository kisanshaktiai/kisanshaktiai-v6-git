
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { Loader2, Phone, Lock, ArrowLeft, Smartphone, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { VoiceEnabledInput } from './VoiceEnabledInput';
import { LanguageSelector } from './LanguageSelector';
import { OfflineIndicator } from './OfflineIndicator';
import { FarmerWelcome } from './FarmerWelcome';
import { SecurityTips } from './SecurityTips';

interface CustomMobileAuthScreenProps {
  onComplete?: () => void;
}

type AuthStep = 'language' | 'mobile' | 'pin' | 'register' | 'security-tips' | 'welcome';

export const CustomMobileAuthScreen: React.FC<CustomMobileAuthScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState<AuthStep>('language');
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [mobileNumber, setMobileNumber] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);
  const [showSecurityTips, setShowSecurityTips] = useState(false);
  
  const { login, register, checkExistingFarmer } = useCustomAuth();

  // Auto-detect language based on browser settings
  useEffect(() => {
    const browserLang = navigator.language.split('-')[0];
    const supportedLangs = ['hi', 'en', 'mr', 'gu', 'pa', 'te', 'ta', 'kn'];
    if (supportedLangs.includes(browserLang)) {
      setSelectedLanguage(browserLang);
    }
  }, []);

  // Auto-detect mobile number from SIM (placeholder for actual implementation)
  useEffect(() => {
    // In a real mobile app, this would use Capacitor plugins to detect SIM
    // For now, we'll skip to mobile entry after language selection
  }, []);

  const formatMobileNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      return cleaned;
    }
    return cleaned.substring(0, 10);
  };

  const validateMobileNumber = (mobile: string) => {
    const cleaned = mobile.replace(/\D/g, '');
    return cleaned.length === 10 && /^[6-9]/.test(cleaned);
  };

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setStep('mobile');
  };

  const handleMobileSubmit = async () => {
    if (!validateMobileNumber(mobileNumber)) {
      toast({
        title: "Invalid Mobile Number",
        description: "कृपया वैध 10 अंकों का मोबाइल नंबर दर्ज करें",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const exists = await checkExistingFarmer(mobileNumber);
      setIsExistingUser(exists);
      
      if (exists) {
        setStep('pin');
      } else {
        setShowSecurityTips(true);
      }
    } catch (error) {
      console.error('Error checking farmer:', error);
      toast({
        title: "Error",
        description: "मोबाइल नंबर सत्यापित करने में त्रुटि। कृपया पुनः प्रयास करें।",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (pin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "PIN में बिल्कुल 4 अंक होने चाहिए",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await login(mobileNumber, pin);
      if (!result.success) {
        toast({
          title: "Login Failed",
          description: result.error || "गलत मोबाइल नंबर या PIN",
          variant: "destructive",
        });
      } else {
        setStep('welcome');
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "अप्रत्याशित त्रुटि हुई। कृपया पुनः प्रयास करें।",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (pin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "PIN में बिल्कुल 4 अंक होने चाहिए",
        variant: "destructive",
      });
      return;
    }

    if (confirmPin.length !== 4) {
      toast({
        title: "Invalid Confirm PIN",
        description: "पुष्टि PIN में बिल्कुल 4 अंक होने चाहिए",
        variant: "destructive",
      });
      return;
    }

    if (pin !== confirmPin) {
      toast({
        title: "PIN Mismatch",
        description: "PIN और पुष्टि PIN मेल नहीं खाते",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await register(mobileNumber, pin);
      if (!result.success) {
        toast({
          title: "Registration Failed",
          description: result.error || "खाता बनाने में विफल। कृपया पुनः प्रयास करें।",
          variant: "destructive",
        });
      } else {
        setStep('welcome');
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: "अप्रत्याशित त्रुटि हुई। कृपया पुनः प्रयास करें।",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'pin' || step === 'register') {
      setStep('mobile');
      setPin('');
      setConfirmPin('');
    } else if (step === 'mobile') {
      setStep('language');
    }
  };

  const renderLanguageSelection = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">KisanShakti AI</h1>
          <p className="text-gray-600">अपनी भाषा चुनें / Choose your language</p>
        </div>

        <LanguageSelector
          selectedLanguage={selectedLanguage}
          onLanguageChange={handleLanguageSelect}
        />

        <div className="mt-6">
          <OfflineIndicator />
        </div>
      </div>
    </div>
  );

  const renderMobileEntry = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center mb-4 relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="absolute left-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Phone className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold">मोबाइल नंबर दर्ज करें</CardTitle>
          <p className="text-sm text-gray-600">Enter your mobile number</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              मोबाइल नंबर / Mobile Number
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                <span className="text-lg">🇮🇳</span>
                <span className="text-gray-600 font-medium">+91</span>
                <div className="w-px h-6 bg-gray-300"></div>
              </div>
              <VoiceEnabledInput
                type="tel"
                value={mobileNumber}
                onChange={formatMobileNumber}
                placeholder="9876543210"
                maxLength={10}
                className="pl-20 h-14 text-lg font-medium text-center tracking-wider"
                autoFocus
              />
            </div>
          </div>

          {isExistingUser !== null && (
            <div className={`text-sm text-center p-3 rounded-lg border ${
              isExistingUser 
                ? 'bg-green-50 text-green-800 border-green-200' 
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              {isExistingUser 
                ? 'स्वागत वापसी! अपना PIN दर्ज करें।' 
                : 'नया उपयोगकर्ता - हम आपका खाता बनाएंगे।'}
            </div>
          )}

          <Button 
            onClick={handleMobileSubmit}
            disabled={!validateMobileNumber(mobileNumber) || loading}
            className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>जांच रहे हैं...</span>
              </div>
            ) : (
              'जारी रखें / Continue'
            )}
          </Button>

          <div className="mt-4">
            <OfflineIndicator />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPinEntry = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center mb-4 relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="absolute left-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold">
            {isExistingUser ? 'स्वागत वापसी!' : 'PIN बनाएं'}
          </CardTitle>
          <p className="text-sm text-gray-600">
            {isExistingUser 
              ? `अपना PIN दर्ज करें +91 ${mobileNumber}` 
              : 'अपने खाते के लिए 4 अंकों का PIN सेट करें'
            }
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {isExistingUser ? 'PIN दर्ज करें' : 'नया PIN बनाएं'}
              </label>
              <VoiceEnabledInput
                type="password"
                value={pin}
                onChange={(value) => setPin(value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                maxLength={4}
                className="h-14 text-2xl font-bold text-center tracking-[0.5em] placeholder:tracking-normal"
                autoFocus
              />
            </div>

            {!isExistingUser && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  PIN की पुष्टि करें
                </label>
                <VoiceEnabledInput
                  type="password"
                  value={confirmPin}
                  onChange={(value) => setConfirmPin(value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  maxLength={4}
                  className="h-14 text-2xl font-bold text-center tracking-[0.5em] placeholder:tracking-normal"
                />
              </div>
            )}
          </div>

          <Button 
            onClick={isExistingUser ? handleLogin : handleRegister}
            disabled={pin.length !== 4 || (!isExistingUser && confirmPin.length !== 4) || loading}
            className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{isExistingUser ? 'लॉग इन हो रहे हैं...' : 'खाता बना रहे हैं...'}</span>
              </div>
            ) : (
              isExistingUser ? 'लॉग इन करें' : 'खाता बनाएं'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderWelcome = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <FarmerWelcome
          farmerName="किसान भाई"
          farmerCode={`F${mobileNumber.slice(-4)}`}
          weatherInfo={{
            temperature: 28,
            condition: 'Sunny',
            icon: '☀️'
          }}
        />
        
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {isExistingUser ? 'सफलतापूर्वक लॉग इन!' : 'खाता सफलतापूर्वक बना!'}
          </h2>
          <p className="text-gray-600">
            डैशबोर्ड पर जा रहे हैं...
          </p>
        </div>
      </div>
    </div>
  );

  if (showSecurityTips) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <SecurityTips
          onClose={() => {
            setShowSecurityTips(false);
            setStep('register');
          }}
        />
      </div>
    );
  }

  switch (step) {
    case 'language':
      return renderLanguageSelection();
    case 'mobile':
      return renderMobileEntry();
    case 'pin':
    case 'register':
      return renderPinEntry();
    case 'welcome':
      return renderWelcome();
    default:
      return renderLanguageSelection();
  }
};
