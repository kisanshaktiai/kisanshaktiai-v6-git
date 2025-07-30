import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { useUnifiedTenantData } from '@/hooks';
import { setAuthenticated } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, Lock } from 'lucide-react';

interface PinAuthScreenProps {
  phoneNumber: string;
  onBack: () => void;
}

export const PinAuthScreen: React.FC<PinAuthScreenProps> = ({ phoneNumber, onBack }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentTenant } = useSelector((state: RootState) => state.auth);
  const { branding } = useUnifiedTenantData(currentTenant);

  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Simulate loading for 2 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pin || pin.length !== 6) {
      toast({
        title: t('auth.invalidPin'),
        description: t('auth.pinLength'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    // Simulate successful authentication
    setTimeout(() => {
      setIsLoading(false);
      dispatch(setAuthenticated({ userId: 'user-123', phoneNumber }));
      navigate('/mobile');
      toast({
        title: t('auth.success'),
        description: t('auth.loggedIn'),
      });
    }, 2000);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            <Lock className="inline-block w-6 h-6 mr-2" />
            {t('auth.enterPin')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="pin">{t('auth.pinCode')}</Label>
            <Input
              id="pin"
              type="number"
              placeholder="******"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button onClick={onBack} variant="secondary" disabled={isLoading}>
            {t('common.back')}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('auth.verify')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
