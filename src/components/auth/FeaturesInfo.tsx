import { Bot, Cloud, Smartphone } from 'lucide-react';

export const FeaturesInfo = () => {
  const features = [
    {
      icon: Bot,
      text: "AI-powered farming advice"
    },
    {
      icon: Cloud,
      text: "Weather & crop insights"
    },
    {
      icon: Smartphone,
      text: "Easy mobile experience"
    }
  ];

  return (
    <div className="mt-6 pt-6 border-t border-border">
      <div className="grid grid-cols-3 gap-4 text-center">
        {features.map((feature, index) => (
          <div key={index} className="space-y-2">
            <div className="w-8 h-8 mx-auto text-primary">
              <feature.icon className="w-full h-full" />
            </div>
            <p className="text-xs text-muted-foreground leading-tight">
              {feature.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};