
import React from 'react';
import { User, Sprout, TrendingUp } from 'lucide-react';

interface FarmerWelcomeProps {
  farmerName?: string;
  farmerCode?: string;
  lastLogin?: string;
  weatherInfo?: {
    temperature: number;
    condition: string;
    icon: string;
  };
}

export const FarmerWelcome: React.FC<FarmerWelcomeProps> = ({
  farmerName,
  farmerCode,
  lastLogin,
  weatherInfo
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'सुप्रभात'; // Good morning in Hindi
    if (hour < 17) return 'नमस्ते'; // Hello in Hindi
    return 'शुभ संध्या'; // Good evening in Hindi
  };

  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{getGreeting()}</h2>
            <p className="text-sm opacity-90">
              {farmerName || 'किसान भाई'} {farmerCode && `(${farmerCode})`}
            </p>
          </div>
        </div>
        
        {weatherInfo && (
          <div className="text-right">
            <div className="text-2xl mb-1">{weatherInfo.icon}</div>
            <div className="text-sm opacity-90">{weatherInfo.temperature}°C</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <Sprout className="w-6 h-6 mx-auto mb-2" />
          <p className="text-xs opacity-90">मेरी फसल</p>
          <p className="text-sm font-medium">गेहूं</p>
        </div>
        
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <TrendingUp className="w-6 h-6 mx-auto mb-2" />
          <p className="text-xs opacity-90">बाजार भाव</p>
          <p className="text-sm font-medium">₹2,150/क्विंटल</p>
        </div>
      </div>

      {lastLogin && (
        <p className="text-xs opacity-75 mt-4 text-center">
          अंतिम लॉगिन: {new Date(lastLogin).toLocaleDateString('hi-IN')}
        </p>
      )}
    </div>
  );
};
