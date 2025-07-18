
import { CheckCircle, UserPlus, Clock } from 'lucide-react';

interface UserStatusIndicatorProps {
  phone: string;
  checkingUser: boolean;
  userCheckComplete: boolean;
  isNewUser: boolean;
}

export const UserStatusIndicator = ({
  phone,
  checkingUser,
  userCheckComplete,
  isNewUser
}: UserStatusIndicatorProps) => {
  if (phone.length < 10) return null;

  if (checkingUser) {
    return (
      <div className="flex items-center justify-center space-x-2 text-gray-600 bg-gray-50 rounded-lg p-3">
        <Clock className="w-4 h-4 animate-pulse" />
        <span className="text-sm">Checking user...</span>
      </div>
    );
  }

  if (userCheckComplete) {
    return (
      <div className={`flex items-center justify-center space-x-2 rounded-lg p-3 transition-all duration-300 ${
        isNewUser 
          ? 'text-green-700 bg-green-50 border border-green-200' 
          : 'text-blue-700 bg-blue-50 border border-blue-200'
      }`}>
        {isNewUser ? (
          <UserPlus className="w-4 h-4" />
        ) : (
          <CheckCircle className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {isNewUser ? 'New number detected - Ready to create account' : 'Welcome back! Account found'}
        </span>
      </div>
    );
  }

  return null;
};
