import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const EdgeFunctionDiagnostic = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{
    testFunction?: { success: boolean; message: string };
    mobileAuthPin?: { success: boolean; message: string };
  }>({});

  const testFunction = async (functionName: string) => {
    console.log(`Testing edge function: ${functionName}`);
    
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: functionName === 'mobile-auth-pin' 
          ? { action: 'test' }
          : {}
      });
      
      console.log(`${functionName} response:`, { data, error });
      
      if (error) {
        return { success: false, message: `Error: ${error.message}` };
      }
      
      return { 
        success: true, 
        message: data?.message || 'Function responded successfully' 
      };
    } catch (err) {
      console.error(`${functionName} test error:`, err);
      return { 
        success: false, 
        message: `Exception: ${err?.message || 'Unknown error'}` 
      };
    }
  };

  const runDiagnostics = async () => {
    setTesting(true);
    setResults({});
    
    // Test the simple test function first
    const testResult = await testFunction('test-function');
    setResults(prev => ({ ...prev, testFunction: testResult }));
    
    // Test mobile-auth-pin function
    const authResult = await testFunction('mobile-auth-pin');
    setResults(prev => ({ ...prev, mobileAuthPin: authResult }));
    
    setTesting(false);
  };

  const getStatusIcon = (result?: { success: boolean }) => {
    if (!result) return null;
    return result.success ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle>Edge Function Diagnostics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={testing}
          className="w-full"
        >
          {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {testing ? 'Testing...' : 'Run Diagnostics'}
        </Button>
        
        {Object.keys(results).length > 0 && (
          <div className="space-y-3">
            {results.testFunction && (
              <Alert className={results.testFunction.success ? 'border-green-500' : 'border-red-500'}>
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.testFunction)}
                  <AlertDescription>
                    <strong>Test Function:</strong> {results.testFunction.message}
                  </AlertDescription>
                </div>
              </Alert>
            )}
            
            {results.mobileAuthPin && (
              <Alert className={results.mobileAuthPin.success ? 'border-green-500' : 'border-red-500'}>
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.mobileAuthPin)}
                  <AlertDescription>
                    <strong>Mobile Auth PIN:</strong> {results.mobileAuthPin.message}
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          <p>Project ID: qfklkkzxemsbeniyugiz</p>
          <p>Check console for detailed logs</p>
        </div>
      </CardContent>
    </Card>
  );
};