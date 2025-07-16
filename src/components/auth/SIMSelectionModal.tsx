
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Smartphone, Signal } from 'lucide-react';

interface SIMInfo {
  slot: number;
  phoneNumber: string;
  carrierName: string;
  countryCode: string;
  isDefault?: boolean;
}

interface SIMSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sims: SIMInfo[];
  onSelectSIM: (sim: SIMInfo) => void;
  primaryColor?: string;
}

export const SIMSelectionModal: React.FC<SIMSelectionModalProps> = ({
  isOpen,
  onClose,
  sims,
  onSelectSIM,
  primaryColor = '#10B981'
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5" style={{ color: primaryColor }} />
            <span>Select SIM Card</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Multiple SIM cards detected. Please select which number to use:
          </p>
          
          <div className="space-y-3">
            {sims.map((sim) => (
              <Card 
                key={sim.slot}
                className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-gray-300"
                onClick={() => onSelectSIM(sim)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}15` }}
                      >
                        <Signal className="w-5 h-5" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold text-lg">{sim.phoneNumber}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {sim.carrierName} • SIM {sim.slot}
                          {sim.isDefault && (
                            <span 
                              className="ml-2 px-2 py-1 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: `${primaryColor}20`, 
                                color: primaryColor 
                              }}
                            >
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full"
          >
            Enter Manually
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
