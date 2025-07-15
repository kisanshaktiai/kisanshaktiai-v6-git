
import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, MapPin, Sprout, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTenant } from '@/context/TenantContext';

interface ChatContext {
  selectedLand?: string;
  selectedCrop?: string;
  location?: { lat: number; lng: number };
  activeContext: string[];
}

interface ContextChipsProps {
  context: ChatContext;
  onContextChange: (context: ChatContext) => void;
}

export const ContextChips: React.FC<ContextChipsProps> = ({ context, onContextChange }) => {
  const { t } = useTranslation();
  const { profile } = useTenant();

  const removeContext = (contextType: string) => {
    const newActiveContext = context.activeContext.filter(c => c !== contextType);
    const newContext = { ...context, activeContext: newActiveContext };
    
    // Remove specific context data
    if (contextType === 'location') {
      delete newContext.location;
    } else if (contextType === 'land') {
      delete newContext.selectedLand;
    } else if (contextType === 'crop') {
      delete newContext.selectedCrop;
    }
    
    onContextChange(newContext);
  };

  const addLandContext = () => {
    // This would open a land selector modal
    // For now, we'll simulate selecting a land
    onContextChange({
      ...context,
      selectedLand: 'land-1',
      activeContext: [...context.activeContext.filter(c => c !== 'land'), 'land'],
    });
  };

  const addCropContext = () => {
    // This would open a crop selector modal
    onContextChange({
      ...context,
      selectedCrop: 'wheat',
      activeContext: [...context.activeContext.filter(c => c !== 'crop'), 'crop'],
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {t('Context')}:
      </span>

      {/* Location Context */}
      {context.location && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span className="text-xs">
            {t('Current Location')}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => removeContext('location')}
          >
            <X className="h-2 w-2" />
          </Button>
        </Badge>
      )}

      {/* Land Context */}
      {context.selectedLand && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Sprout className="h-3 w-3" />
          <span className="text-xs">
            {t('Land')}: {context.selectedLand}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => removeContext('land')}
          >
            <X className="h-2 w-2" />
          </Button>
        </Badge>
      )}

      {/* Crop Context */}
      {context.selectedCrop && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span className="text-xs">
            {t('Crop')}: {context.selectedCrop}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => removeContext('crop')}
          >
            <X className="h-2 w-2" />
          </Button>
        </Badge>
      )}

      {/* Quick Add Buttons */}
      {!context.selectedLand && (
        <Button
          size="sm"
          variant="outline"
          onClick={addLandContext}
          className="h-6 px-2 text-xs"
        >
          + {t('Add Land')}
        </Button>
      )}

      {!context.selectedCrop && (
        <Button
          size="sm"
          variant="outline"
          onClick={addCropContext}
          className="h-6 px-2 text-xs"
        >
          + {t('Add Crop')}
        </Button>
      )}

      {context.activeContext.length === 0 && (
        <span className="text-xs text-muted-foreground italic">
          {t('No active context - responses will be general')}
        </span>
      )}
    </div>
  );
};
