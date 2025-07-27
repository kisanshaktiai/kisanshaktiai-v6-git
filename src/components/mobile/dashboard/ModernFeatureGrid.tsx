
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Sprout, 
  MessageCircle, 
  Calendar, 
  ScanLine, 
  Store,
  Leaf
} from 'lucide-react';

interface FeatureItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  path: string;
  className?: string;
  size?: 'normal' | 'large';
}

export const ModernFeatureGrid: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  const features: FeatureItem[] = [
    {
      id: 'my-land',
      icon: Leaf,
      title: 'My Land',
      path: '/my-lands',
      className: 'bg-green-50 hover:bg-green-100',
      size: 'normal'
    },
    {
      id: 'ai-chat',
      icon: MessageCircle,
      title: 'AI Chat',
      path: '/ai-chat',
      className: 'bg-green-100 hover:bg-green-200',
      size: 'large'
    },
    {
      id: 'crop-schedule',
      icon: Calendar,
      title: 'Crop Schedule',
      path: '/crop-schedule',
      className: 'bg-green-50 hover:bg-green-100',
      size: 'normal'
    },
    {
      id: 'insta-scan',
      icon: ScanLine,
      title: 'Insta Scan',
      path: '/insta-scan',
      className: 'bg-gray-50 hover:bg-gray-100',
      size: 'large'
    },
    {
      id: 'market',
      icon: Store,
      title: 'Market',
      path: '/market',
      className: 'bg-green-50 hover:bg-green-100',
      size: 'normal'
    }
  ];

  const handleFeatureClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        const isLarge = feature.size === 'large';
        const gridClass = isLarge ? 'col-span-1 row-span-2' : 'col-span-1';
        
        return (
          <Card
            key={feature.id}
            className={`${feature.className} ${gridClass} border-0 cursor-pointer transition-all duration-200 hover:shadow-md ${
              index === 1 ? 'row-start-1 row-end-3' : ''
            } ${index === 3 ? 'row-start-2 row-end-4' : ''}`}
            onClick={() => handleFeatureClick(feature.path)}
          >
            <CardContent className={`flex flex-col items-center justify-center space-y-2 ${
              isLarge ? 'p-8' : 'p-4'
            }`}>
              <div className={`p-3 rounded-full ${
                feature.id === 'ai-chat' || feature.id === 'insta-scan' 
                  ? 'bg-green-600' 
                  : 'bg-transparent'
              }`}>
                <Icon className={`${isLarge ? 'w-8 h-8' : 'w-6 h-6'} ${
                  feature.id === 'ai-chat' || feature.id === 'insta-scan'
                    ? 'text-white' 
                    : 'text-green-600'
                }`} />
              </div>
              <span className="text-sm font-medium text-gray-900 text-center">
                {feature.title}
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
