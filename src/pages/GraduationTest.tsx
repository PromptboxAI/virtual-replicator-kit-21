import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useContractDeployment } from '@/hooks/useContractDeployment';

const GraduationTest = () => {
  const [forceResult, setForceResult] = useState<any>(null);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [v2TestResult, setV2TestResult] = useState<any>(null);
  const [deployedContracts, setDeployedContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  
  const { deployAll, getDeployedContracts, isDeploying, promptTokenAddress, factoryAddress } = useContractDeployment();

  useEffect(() => {
    loadDeployedContracts();
  }, []);

  const loadDeployedContracts = async () => {
    const contracts = await getDeployedContracts();
    setDeployedContracts(contracts);
  };

  const callSupabaseFunction = async (functionName: string, body: any) => {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: body
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  };

  const testForceGraduation = async () => {
    setLoading({ ...loading, force: true });
    try {
      const result = await callSupabaseFunction('test-graduation-trigger', {
        agentId: '30d130d1-7da2-4174-a577-bbb5a57f9125',
        forceGraduation: true
      });
      
      setForceResult(result);
      toast.success('Force graduation test completed');
    } catch (error: any) {
      setForceResult({ error: error.message });
      toast.error('Force graduation test failed');
    } finally {
      setLoading({ ...loading, force: false });
    }
  };

  const testGraduationCheck = async () => {
    setLoading({ ...loading, check: true });
    try {
      const result = await callSupabaseFunction('test-graduation-trigger', {
        agentId: '30d130d1-7da2-4174-a577-bbb5a57f9125',
        forceGraduation: false
      });
      
      setCheckResult(result);
      toast.success('Graduation check test completed');
    } catch (error: any) {
      setCheckResult({ error: error.message });
      toast.error('Graduation check test failed');
    } finally {
      setLoading({ ...loading, check: false });
    }
  };

  const testV2Deployment = async () => {
    setLoading({ ...loading, v2: true });
    try {
      const result = await callSupabaseFunction('test-v2-deployment', {});
      
      setV2TestResult(result);
      toast.success('V2 deployment test completed');
    } catch (error: any) {
      setV2TestResult({ error: error.message });
      toast.error('V2 deployment test failed');
    } finally {
      setLoading({ ...loading, v2: false });
    }
  };

  const deployFoundationContracts = async () => {
    setLoading({ ...loading, deploy: true });
    try {
      const result = await deployAll();
      await loadDeployedContracts();
      toast.success('Foundation contracts deployed successfully!');
    } catch (error: any) {
      toast.error(`Failed to deploy foundation contracts: ${error.message}`);
    } finally {
      setLoading({ ...loading, deploy: false });
    }
  };

  const ResultDisplay = ({ result, title }: { result: any; title: string }) => {
    if (!result) return null;

    return (
      <div className="mt-4">
        <h4 className="font-medium mb-2">{title} Result:</h4>
        <pre className={`p-3 rounded-md text-sm overflow-auto ${
          result.error ? 'bg-destructive/10 text-destructive' : 'bg-muted'
        }`}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Graduation System Test</h1>
        <p className="text-muted-foreground mt-2">
          Test the agent graduation trigger and V2 contract deployment system
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Step 0: Test Deployer Key</CardTitle>
            <CardDescription>
              Verify that the DEPLOYER_PRIVATE_KEY is working correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={async () => {
                setLoading({ ...loading, keyTest: true });
                try {
                  const result = await callSupabaseFunction('test-deployer-key', {});
                  console.log('Key test result:', result);
                  toast.success('Deployer key test completed - check logs');
                } catch (error: any) {
                  console.error('Key test failed:', error);
                  toast.error(`Key test failed: ${error.message}`);
                } finally {
                  setLoading({ ...loading, keyTest: false });
                }
              }}
              disabled={loading.keyTest}
              className="w-full"
            >
              {loading.keyTest ? 'Testing...' : 'Test Deployer Key'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 1: Deploy Foundation Contracts</CardTitle>
            <CardDescription>
              Deploy PROMPT token and AgentTokenFactory to Base Sepolia testnet
              <br />
              <span className="text-yellow-600">⚠️ Requires DEPLOYER_PRIVATE_KEY secret to be configured</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={deployFoundationContracts}
                disabled={isDeploying || loading.deploy}
                className="w-full"
              >
                {isDeploying || loading.deploy ? 'Deploying...' : 'Deploy Foundation Contracts'}
              </Button>
              
              {deployedContracts.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Deployed Contracts:</h4>
                  <div className="space-y-2">
                    {deployedContracts.map((contract, index) => (
                      <div key={index} className="p-2 bg-muted rounded text-sm">
                        <div className="font-medium">{contract.name} ({contract.symbol})</div>
                        <div className="text-muted-foreground font-mono">{contract.contract_address}</div>
                        <div className="text-xs text-muted-foreground">{contract.contract_type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Force Graduation (CryptoOracle Vision)</CardTitle>
            <CardDescription>
              Agent ID: 30d130d1-7da2-4174-a577-bbb5a57f9125<br/>
              Current PROMPT: 7,003 (needs 42,000 to graduate)<br/>
              <span className="text-yellow-600">Requires foundation contracts to be deployed first</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testForceGraduation}
              disabled={loading.force || deployedContracts.length === 0}
              className="w-full"
            >
              {loading.force ? 'Testing...' : 'Force Graduation'}
            </Button>
            <ResultDisplay result={forceResult} title="Force Graduation" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 3: Check Graduation Requirements (CryptoOracle Vision)</CardTitle>
            <CardDescription>
              Agent ID: 30d130d1-7da2-4174-a577-bbb5a57f9125<br/>
              Current PROMPT: 42,000 (should pass graduation check)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testGraduationCheck}
              disabled={loading.check}
              className="w-full"
            >
              {loading.check ? 'Testing...' : 'Check Requirements'}
            </Button>
            <ResultDisplay result={checkResult} title="Graduation Check" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 4: V2 Deployment System</CardTitle>
            <CardDescription>
              Test the V2 contract deployment infrastructure (private key, viem, network)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testV2Deployment}
              disabled={loading.v2}
              className="w-full"
            >
              {loading.v2 ? 'Testing...' : 'Test V2 Deployment'}
            </Button>
            <ResultDisplay result={v2TestResult} title="V2 Deployment Test" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 5: Query Graduation Events</CardTitle>
            <CardDescription>
              Check the database for graduation events and transaction logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You can query graduation events directly in the Supabase dashboard:<br/>
              • graduation_events table<br/>
              • graduation_transaction_logs table
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GraduationTest;