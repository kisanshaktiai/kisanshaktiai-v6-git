
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone, ChevronRight } from 'lucide-react';

export const PromotionalBanner: React.FC = () => {
  const { t } = useTranslation('dashboard');

  return (
    <Card className="bg-gradient-to-r from-yellow-400 to-orange-400 border-0 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div className="text-white">
              <h3 className="font-semibold text-base">Get 20% off on fertilizers</h3>
              <p className="text-sm opacity-90">this summer</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-white" />
        </div>
      </CardContent>
    </Card>
  );
};
