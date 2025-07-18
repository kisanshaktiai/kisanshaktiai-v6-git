
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { Smartphone, Loader2, CheckCircle } from 'lucide-react';

interface SIMInfo {
  slotNumber: number;
  phoneNumber: string;
  carrierName: string;
  isDefault: boolean;
}

interface SIMSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSIMSelected: (phoneNumber: string) => void;
}

export const SIMSelectionModal: React.FC<SIMSelectionModalProps> = ({
  isOpen,
  onClose,
  onSIMSelected
}) => {
  const [sims, setSims] = useState<SIMInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSIM, setSelectedSIM] = useState<string | null>(null);
  const { checkExistingFarmer } = useCustomAuth();

  useEffect(() => {
    if (isOpen) {
      detectSIMs();
    }
  }, [isOpen]);

  const detectSIMs = async () => {
    setLoading(true);
    try {
      // Simulate SIM detection - in a real mobile app, this would use Capacitor plugins
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock SIM data for demo
      const mockSIMs: SIMInfo[] = [
        {
          slotNumber: 1,
          phoneNumber: '9876543210',
          carrierName: 'Airtel',
          isDefault: true
        },
        {
          slotNumber: 2,
          phoneNumber: '8765432109',
          carrierName: 'Jio',
          isDefault: false
        }
      ];
      
      setSims(mockSIMs);
    } catch (error) {
      console.error('SIM detection failed:', error);
      setSims([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSIMSelect = async (phoneNumber: string) => {
    setSelectedSIM(phoneNumber);
    
    // Check if this number is already registered
    const isRegistered = await checkExistingFarmer(phoneNumber);
    
    // Provide feedback to user about registration status
    if (isRegistered) {
      console.log('Number is registered - will proceed to PIN login');
    } else {
      console.log('New number - will proceed to registration');
    }
    
    onSIMSelected(phoneNumber);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-green-600" />
            <span>SIM कार्ड चुनें</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" />
                <p className="text-sm text-gray-600">SIM कार्ड खोज रहे हैं...</p>
              </div>
            </div>
          ) : sims.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">कोई SIM कार्ड नहीं मिला</p>
              <Button 
                variant="outline" 
                onClick={detectSIMs}
                className="mt-3"
              >
                फिर से खोजें
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                अपना मोबाइल नंबर चुनें:
              </p>
              
              {sims.map((sim) => (
                <Button
                  key={sim.slotNumber}
                  variant="outline"
                  className="w-full h-auto p-4 justify-start"
                  onClick={() => handleSIMSelect(sim.phoneNumber)}
                  disabled={selectedSIM === sim.phoneNumber}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold">
                        {sim.slotNumber}
                      </span>
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="font-medium">+91 {sim.phoneNumber}</div>
                      <div className="text-sm text-gray-500">
                        {sim.carrierName} {sim.isDefault && '(डिफ़ॉल्ट)'}
                      </div>
                    </div>
                    
                    {selectedSIM === sim.phoneNumber && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </Button>
              ))}
              
              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full mt-4"
              >
                बाद में
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
