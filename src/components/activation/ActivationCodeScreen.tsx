import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ActivationCodeScreenProps {
  onActivationSuccess: (tenantData: any) => void;
  onSkip: () => void;
}

export const ActivationCodeScreen: React.FC<ActivationCodeScreenProps> = ({
  onActivationSuccess,
  onSkip
}) => {
  const { t } = useTranslation();
  const [activationCode, setActivationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateActivationCode = async (code: string) => {
    setIsValidating(true);
    setError(null);

    try {
      // Call edge function to validate activation code
      const { data, error } = await fetch('/api/validate-activation-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activation_code: code.toUpperCase() })
      }).then(res => res.json());

      if (error) throw new Error(error.message);

      if (data?.tenant) {
        // Store activation in local storage for offline access
        localStorage.setItem('activation_code', code.toUpperCase());
        localStorage.setItem('tenant_activation_data', JSON.stringify(data.tenant));
        
        onActivationSuccess(data.tenant);
        return true;
      }
      
      throw new Error('Invalid activation code');
    } catch (error) {
      console.error('Activation validation error:', error);
      setError(error instanceof Error ? error.message : 'Activation failed');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleActivate = async () => {
    if (!activationCode.trim()) {
      setError('Please enter an activation code');
      return;
    }

    setIsLoading(true);
    const success = await validateActivationCode(activationCode.trim());
    setIsLoading(false);

    if (!success) {
      // Clear the input on failed activation
      setActivationCode('');
    }
  };

  const handleCodeChange = (value: string) => {
    // Format as groups of 4 characters with hyphens
    const cleaned = value.replace(/[^A-Z0-9]/g, '').substring(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join('-') || cleaned;
    setActivationCode(formatted);
    
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && activationCode.trim() && !isLoading && !isValidating) {
      handleActivate();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-green-400/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <Card className="w-full max-w-md mx-auto backdrop-blur-sm bg-white/5 border-white/10 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full flex items-center justify-center mb-4 border border-green-400/30">
            <Sparkles className="w-8 h-8 text-green-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-white mb-2">
            Activate Your App
          </CardTitle>
          <p className="text-gray-300 text-sm">
            Enter your organization's activation code to unlock your customized farming experience
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="activation-code" className="text-white text-sm font-medium">
              Activation Code
            </Label>
            <Input
              id="activation-code"
              type="text"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={activationCode}
              onChange={(e) => handleCodeChange(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              className="text-center font-mono text-lg tracking-widest bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-green-400/50 focus:ring-green-400/20"
              disabled={isLoading || isValidating}
              maxLength={19} // 16 chars + 3 hyphens
            />
          </div>

          {error && (
            <Alert className="border-red-400/20 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleActivate}
              disabled={!activationCode.trim() || isLoading || isValidating}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-0"
            >
              {isLoading || isValidating ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Validating...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Activate App
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              )}
            </Button>

            <Button
              onClick={onSkip}
              variant="ghost"
              className="w-full text-gray-400 hover:text-white hover:bg-white/5 py-2"
              disabled={isLoading || isValidating}
            >
              Continue with Default Experience
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Don't have an activation code?{' '}
              <button
                onClick={onSkip}
                className="text-green-400 hover:text-green-300 underline"
                disabled={isLoading || isValidating}
              >
                Start with basic features
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};