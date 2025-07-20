
import { Phone, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.slice(0, 10);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onPhoneChange(formatted);
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-3 text-gray-700">
        Mobile Number
      </label>
      <div className="relative">
        <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="9898989495"
          value={phone}
          onChange={handleChange}
          maxLength={10}
          disabled={loading || checkingUser}
          className={`text-lg pl-12 border-2 transition-all duration-300 bg-white text-black rounded-xl ${
            userCheckComplete && isNewUser 
              ? 'focus:border-green-400 border-green-200' 
              : userCheckComplete && !isNewUser 
              ? 'focus:border-blue-400 border-blue-200' 
              : 'focus:border-gray-400'
          }`}
        />
        {checkingUser && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
};
