import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function ContractDeploymentTest() {
  const [testing, setTesting] = useState(false);
  const [keyStatus, setKeyStatus] = useState<any>(null);
  const [deployingPrompt, setDeployingPrompt] = useState(false);
  const [deployingFactory, setDeployingFactory] = useState(false);
  const [promptTokenResult, setPromptTokenResult] = useState<any>(null);
  const [factoryResult, setFactoryResult] = useState<any>(null);

  const testPrivateKey = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-deployer-key');
      
      if (error) {
        console.error('Test error:', error);
        setKeyStatus({ success: false, error: error.message });
        toast({
          title: "Test Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log('Test result:', data);
        setKeyStatus(data);
        toast({
          title: data.success ? "Test Passed" : "Test Failed",
          description: data.message || data.error,
          variant: data.success ? "default" : "destructive"
        });
      }
    } catch (error) {
      console.error('Test error:', error);
      setKeyStatus({ success: false, error: 'Network error' });
      toast({
        title: "Test Failed",
        description: "Network error occurred",
        variant: "destructive"
      });
    }
    setTesting(false);
  };

  const deployPromptToken = async () => {
    setDeployingPrompt(true);
    try {
      const { data, error } = await supabase.functions.invoke('deploy-prompt-test-token');
      
      if (error) {
        console.error('Deploy error:', error);
        setPromptTokenResult({ success: false, error: error.message });
        toast({
          title: "Deployment Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log('Deploy result:', data);
        setPromptTokenResult(data);
        toast({
          title: data.success ? "Deployment Successful" : "Deployment Failed",
          description: data.message || data.error,
          variant: data.success ? "default" : "destructive"
        });
      }
    } catch (error) {
      console.error('Deploy error:', error);
      setPromptTokenResult({ success: false, error: 'Network error' });
      toast({
        title: "Deployment Failed",
        description: "Network error occurred",
        variant: "destructive"
      });
    }
    setDeployingPrompt(false);
  };

  const deployFactory = async () => {
    if (!promptTokenResult?.contractAddress) {
      toast({
        title: "Deploy PROMPT Token First",
        description: "Factory deployment requires PROMPT token address",
        variant: "destructive"
      });
      return;
    }

    setDeployingFactory(true);
    try {
      // Use a placeholder treasury address for now
      const treasuryAddress = "0x742d35Cc6634C0532925a3b8D497b94c2F35B7";
      
      const { data, error } = await supabase.functions.invoke('deploy-factory-contract', {
        body: {
          promptTokenAddress: promptTokenResult.contractAddress,
          treasuryAddress: treasuryAddress
        }
      });
      
      if (error) {
        console.error('Deploy error:', error);
        setFactoryResult({ success: false, error: error.message });
        toast({
          title: "Factory Deployment Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log('Factory deploy result:', data);
        setFactoryResult(data);
        toast({
          title: data.success ? "Factory Deployed!" : "Factory Deployment Failed",
          description: data.success 
            ? `Factory deployed at ${data.contractAddress}` 
            : data.error,
          variant: data.success ? "default" : "destructive"
        });
      }
    } catch (error) {
      console.error('Factory deploy error:', error);
      setFactoryResult({ success: false, error: 'Network error' });
      toast({
        title: "Factory Deployment Failed",
        description: "Network error occurred",
        variant: "destructive"
      });
    }
    setDeployingFactory(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contract Deployment Test & Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Private Key Test */}
          <div className="space-y-2">
            <h3 className="font-semibold">1. Test DEPLOYER_PRIVATE_KEY</h3>
            <Button 
              onClick={testPrivateKey} 
              disabled={testing}
              variant="outline"
            >
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Private Key Access
            </Button>
            
            {keyStatus && (
              <div className="flex items-center gap-2">
                {keyStatus.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={keyStatus.success ? "text-green-600" : "text-red-600"}>
                  {keyStatus.message || keyStatus.error}
                </span>
                {keyStatus.success && (
                  <Badge variant="secondary">
                    Key Length: {keyStatus.keyLength}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* PROMPT Token Deployment */}
          <div className="space-y-2">
            <h3 className="font-semibold">2. Deploy PROMPT Test Token</h3>
            <Button 
              onClick={deployPromptToken} 
              disabled={deployingPrompt || !keyStatus?.success}
              variant="outline"
            >
              {deployingPrompt && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Deploy PROMPT Token
            </Button>
            
            {promptTokenResult && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {promptTokenResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={promptTokenResult.success ? "text-green-600" : "text-red-600"}>
                    {promptTokenResult.message || promptTokenResult.error}
                  </span>
                </div>
                {promptTokenResult.success && (
                  <div className="p-2 bg-green-50 rounded text-sm">
                    <strong>Contract Address:</strong> {promptTokenResult.contractAddress}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Factory Deployment */}
          <div className="space-y-2">
            <h3 className="font-semibold">3. Deploy Agent Token Factory</h3>
            <Button 
              onClick={deployFactory} 
              disabled={deployingFactory || !promptTokenResult?.success}
              variant="outline"
            >
              {deployingFactory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Deploy Factory Contract
            </Button>
            
            {factoryResult && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {factoryResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={factoryResult.success ? "text-green-600" : "text-red-600"}>
                    {factoryResult.success ? "Factory deployed successfully!" : factoryResult.error}
                  </span>
                </div>
                {factoryResult.success && (
                  <div className="p-2 bg-green-50 rounded text-sm">
                    <strong>Factory Address:</strong> {factoryResult.contractAddress}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status Summary */}
          {(keyStatus || promptTokenResult || factoryResult) && (
            <div className="mt-6 p-4 bg-gray-50 rounded">
              <h4 className="font-semibold mb-2">Deployment Status</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  {keyStatus?.success ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-orange-500" />}
                  <span>Private Key: {keyStatus?.success ? 'Ready' : 'Not tested'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {promptTokenResult?.success ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-orange-500" />}
                  <span>PROMPT Token: {promptTokenResult?.success ? 'Deployed' : 'Not deployed'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {factoryResult?.success ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-orange-500" />}
                  <span>Factory Contract: {factoryResult?.success ? 'Deployed' : 'Not deployed'}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}