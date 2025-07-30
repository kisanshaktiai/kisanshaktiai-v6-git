
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUnifiedTenantData } from '@/hooks';
import { Gift, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface PromoBannerProps {
  title?: string;
  subtitle?: string;
  actionUrl?: string;
  iconName?: string;
}

export const TenantPromoBanner: React.FC<PromoBannerProps> = ({
  title,
  subtitle,
  actionUrl = '/offers',
  iconName = 'gift'
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { branding } = useUnifiedTenantData();

  const handleClick = () => {
    navigate(actionUrl);
  };

  return (
    <Card 
      className="mx-4 mb-4 cursor-pointer transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: `linear-gradient(135deg, ${branding?.accent_color || '#ff6b35'}, ${branding?.secondary_color || '#ff8a5b'})`
      }}
      onClick={handleClick}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm">
                {title || t('dashboard.promo.title', 'Special Offers Available')}
              </h3>
              <p className="text-white/80 text-xs">
                {subtitle || t('dashboard.promo.subtitle', 'Tap to explore exclusive deals')}
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-white" />
        </div>
      </div>
    </Card>
  );
};
