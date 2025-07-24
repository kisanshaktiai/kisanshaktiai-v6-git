
import { Phone, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';

interface PhoneInputProps {
  phone: string;
  onPhoneChange: (value: string) => void;
  loading: boolean;
  checkingUser: boolean;
  userCheckComplete: boolean;
  isNewUser: boolean;
}

export const PhoneInput = ({
  phone,
  onPhoneChange,
  loading,
  checkingUser,
  userCheckComplete,
  isNewUser
}: PhoneInputProps) => {
  const [validationError, setValidationError] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(false);

  // Enhanced phone number validation
  const validatePhoneNumber = (value: string): { isValid: boolean; error?: string } => {
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length === 0) {
      return { isValid: false };
    }
    
    if (cleaned.length < 10) {
      return { isValid: false, error: 'Phone number must be 10 digits' };
    }
    
    if (cleaned.length > 10) {
      return { isValid: false, error: 'Phone number cannot exceed 10 digits' };
    }
    
    // Indian mobile number validation (starts with 6-9)
    if (!cleaned.match(/^[6-9]\d{9}$/)) {
      return { isValid: false, error: 'Enter a valid Indian mobile number' };
    }
    
    return { isValid: true };
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits and limit to 10 digits
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    return cleaned;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    const validation = validatePhoneNumber(formatted);
    
    setValidationError(validation.error || '');
    setIsValid(validation.isValid);
    
    onPhoneChange(formatted);
  };

  // Clear validation error when user starts typing
  useEffect(() => {
    if (phone.length > 0 && phone.length < 10) {
      setValidationError('');
    }
  }, [phone]);

  return (
    <div>
      <label className="block text-sm font-medium mb-3 text-foreground">
        Mobile Number
      </label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          <span className="text-muted-foreground text-sm">🇮🇳 +91</span>
          <div className="w-px h-4 bg-border"></div>
        </div>
        <Phone className="absolute left-20 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="9876543210"
          value={phone}
          onChange={handleChange}
          maxLength={10}
          disabled={loading || checkingUser}
          className={`text-lg pl-28 pr-12 border-2 transition-all duration-300 bg-background text-foreground ${
            validationError 
              ? 'border-destructive focus:border-destructive' 
              : userCheckComplete && isNewUser 
              ? 'focus:border-green-400 border-green-200' 
              : userCheckComplete && !isNewUser 
              ? 'focus:border-blue-400 border-blue-200' 
              : isValid
              ? 'border-green-200 focus:border-green-400'
              : 'focus:border-ring'
          }`}
        />
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          {checkingUser ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : validationError ? (
            <AlertCircle className="w-5 h-5 text-destructive" />
          ) : isValid && phone.length === 10 ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : null}
        </div>
      </div>
      
      {validationError && (
        <div className="mt-2 text-sm text-destructive flex items-center space-x-1">
          <AlertCircle className="w-4 h-4" />
          <span>{validationError}</span>
        </div>
      )}
      
      {phone.length === 10 && !validationError && (
        <div className="mt-2 text-sm text-muted-foreground">
          <CheckCircle className="w-4 h-4 inline mr-1 text-green-500" />
          Valid Indian mobile number
        </div>
      )}
    </div>
  );
};
