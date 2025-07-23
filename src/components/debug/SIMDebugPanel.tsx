
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const SIMDebugPanel: React.FC = () => {
  const [simInfo, setSIMInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const detectSIMCards = async () => {
    setLoading(true);
    try {
      // Simplified SIM detection - in a real app this would use native APIs
      const mockSIMInfo = {
        count: 2,
        cards: [
          { slot: 0, carrier: 'Airtel', number: '+91 98765 43210', active: true },
          { slot: 1, carrier: 'Jio', number: '+91 87654 32109', active: false }
        ]
      };
      setSIMInfo(mockSIMInfo);
    } catch (error) {
      console.error('SIM detection error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    detectSIMCards();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>SIM Card Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={detectSIMCards} disabled={loading}>
          {loading ? 'Detecting...' : 'Refresh SIM Info'}
        </Button>

        {simInfo && (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              Detected SIM Cards: {simInfo.count}
            </p>
            {simInfo.cards.map((card: any, index: number) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Slot {card.slot + 1}: {card.carrier}</p>
                    <p className="text-sm text-gray-600">{card.number}</p>
                  </div>
                  <Badge variant={card.active ? 'default' : 'secondary'}>
                    {card.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
