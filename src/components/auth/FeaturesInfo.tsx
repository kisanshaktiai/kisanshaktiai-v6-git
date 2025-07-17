
import { MessageCircle, Users, Leaf, Shield } from 'lucide-react';

export const FeaturesInfo = () => {
  const features = [
    {
      icon: MessageCircle,
      title: "AI Chat",
      description: "Get instant farming advice"
    },
    {
      icon: Users,
      title: "Community", 
      description: "Connect with farmers"
    },
    {
      icon: Leaf,
      title: "Smart Farming",
      description: "Advanced agriculture insights"
    },
    {
      icon: Shield,
      title: "Secure",
      description: "Your data is protected"
    }
  ];

  return (
    <div className="mt-8 pt-6">
      <div className="grid grid-cols-2 gap-4 mb-6">
        {features.map((feature, index) => (
          <div key={index} className="text-center p-4 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 mx-auto mb-2 text-gray-600">
              <feature.icon className="w-full h-full" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {feature.title}
            </h3>
            <p className="text-xs text-gray-600 leading-tight">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
      
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Secure authentication powered by KisanShakti AI
        </p>
      </div>
    </div>
  );
};
