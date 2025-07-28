import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useContractDeployment } from '@/hooks/useContractDeployment';
import { FactoryContractTest } from '@/components/FactoryContractTest';
import { DatabaseCleanupTool } from '@/components/DatabaseCleanupTool';
import { FactoryDeploymentDebug } from '@/components/FactoryDeploymentDebug';
import { FactoryDiagnostics } from '@/components/FactoryDiagnostics';

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
      const result = await callSupabaseFunction('trigger-agent-graduation', {
        graduationEventId: null, // Will be created by the function
        agentId: '30d130d1-7da2-4174-a577-bbb5a57f9125',
        force: true
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

  const cleanupTestAgent = async () => {
    setLoading({ ...loading, cleanup: true });
    try {
      // First, reset the test agent's state completely
      const { error: agentError } = await supabase
        .from('agents')
        .update({ 
          token_address: null,
          token_graduated: false,
          graduation_event_id: null,
          prompt_raised: 7003 // Reset to original test value
        })
        .eq('id', '30d130d1-7da2-4174-a577-bbb5a57f9125');
      
      if (agentError) throw agentError;

      // Clean up any existing graduation events for this agent
      const { error: graduationError } = await supabase
        .from('agent_graduation_events')
        .delete()
        .eq('agent_id', '30d130d1-7da2-4174-a577-bbb5a57f9125');
      
      if (graduationError) {
        console.warn('Could not clean graduation events:', graduationError);
      }

      // Clean up any graduation transaction logs for this agent's events
      const { data: graduationEvents } = await supabase
        .from('agent_graduation_events')
        .select('id')
        .eq('agent_id', '30d130d1-7da2-4174-a577-bbb5a57f9125');

      if (graduationEvents && graduationEvents.length > 0) {
        const eventIds = graduationEvents.map(e => e.id);
        const { error: logsError } = await supabase
          .from('graduation_transaction_logs') 
          .delete()
          .in('graduation_event_id', eventIds);
        
        if (logsError) {
          console.warn('Could not clean graduation logs:', logsError);
        }
      }
      
      console.log('✅ Test agent state completely reset');
      toast.success('Test agent cleaned up successfully - ready for fresh testing');
    } catch (error: any) {
      console.error('Cleanup failed:', error);
      toast.error(`Cleanup failed: ${error.message}`);
    } finally {
      setLoading({ ...loading, cleanup: false });
    }
  };

  const testV2Deployment = async () => {
    setLoading({ ...loading, v2: true });
    try {
      const result = await callSupabaseFunction('deploy-agent-token-v2', {
        name: 'CryptoOracle Vision',
        symbol: 'ORACLE',
        agentId: '30d130d1-7da2-4174-a577-bbb5a57f9125',
        creatorAddress: '0x742d35Cc6636C0532925a3b8ba4e0e8A4b9f6d4e'
      });
      
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

  const verifyContracts = async () => {
    setLoading({ ...loading, verify: true });
    try {
      // Check contracts in database
      const contracts = await getDeployedContracts();
      setDeployedContracts(contracts);
      
      if (contracts.length === 0) {
        toast.error('No contracts found in database');
        return;
      }
      
      toast.success(`Found ${contracts.length} deployed contracts in database`);
      
      // Check on blockchain - for each contract
      for (const contract of contracts) {
        const explorerUrl = `https://sepolia.basescan.org/address/${contract.contract_address}`;
        console.log(`🔍 Verify ${contract.name} at: ${explorerUrl}`);
      }
      
    } catch (error: any) {
      toast.error(`Verification failed: ${error.message}`);
    } finally {
      setLoading({ ...loading, verify: false });
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
            <Button
              onClick={async () => {
                try {
                  console.log('Testing basic deployment...');
                  const { data, error } = await supabase.functions.invoke('test-basic-deploy');
                  if (error) {
                    console.error('Test error:', error);
                    toast.error(`Test failed: ${error.message}`);
                  } else {
                    console.log('Test success:', data);
                    if (data.success) {
                      toast.success(`Ready! Wallet: ${data.account}, Balance: ${data.balance}`);
                    } else {
                      toast.error(`Failed: ${data.error}`);
                    }
                    // Show logs
                    console.log('Detailed logs:', data.logs);
                  }
                } catch (e: any) {
                  console.error('Exception:', e);
                  toast.error(`Exception: ${e.message}`);
                }
              }}
              variant="outline"
              className="w-full mt-2"
            >
              Test Basic Setup
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
              <div className="flex gap-2">
                <Button 
                  onClick={deployFoundationContracts}
                  disabled={isDeploying || loading.deploy}
                  className="flex-1"
                >
                  {isDeploying || loading.deploy ? 'Deploying...' : 'Deploy Foundation Contracts'}
                </Button>
                
                <Button 
                  onClick={verifyContracts}
                  disabled={loading.verify}
                  variant="outline"
                >
                  {loading.verify ? 'Verifying...' : '🔍 Verify'}
                </Button>
              </div>
              
              {deployedContracts.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Deployed Contracts:</h4>
                  <div className="space-y-2">
                    {deployedContracts.map((contract, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{contract.name} ({contract.symbol})</div>
                            <div className="text-muted-foreground font-mono text-xs break-all">{contract.contract_address}</div>
                            <div className="text-xs text-muted-foreground capitalize">{contract.contract_type}</div>
                          </div>
                          <a 
                            href={`https://sepolia.basescan.org/address/${contract.contract_address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600 text-sm whitespace-nowrap ml-2"
                          >
                            🔗 BaseScan
                          </a>
                        </div>
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

        {/* Step 4: Factory Contract Direct Test */}
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Factory Contract Direct Test</CardTitle>
            <CardDescription>Test the factory contract directly via wallet</CardDescription>
          </CardHeader>
          <CardContent>
            <FactoryContractTest />
          </CardContent>
        </Card>

        {/* Step 4.5: Factory Deployment Debug */}
        <Card>
          <CardHeader>
            <CardTitle>Step 4.5: Factory Deployment Debug</CardTitle>
            <CardDescription>Debug the factory deployment with detailed error logging</CardDescription>
          </CardHeader>
          <CardContent>
            <FactoryDeploymentDebug />
          </CardContent>
        </Card>

        {/* Step 4.6: Factory Diagnostics */}
        <Card>
          <CardHeader>
            <CardTitle>Step 4.6: Factory Diagnostics</CardTitle>
            <CardDescription>
              Comprehensive analysis of all factory contracts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FactoryDiagnostics />
          </CardContent>
        </Card>

        {/* Step 5: Database Cleanup Tool */}
        <Card>
          <CardHeader>
            <CardTitle>Step 5: Database Cleanup</CardTitle>
            <CardDescription>Complete database cleanup for fresh testing</CardDescription>
          </CardHeader>
          <CardContent>
            <DatabaseCleanupTool />
          </CardContent>
        </Card>

        {/* Step 6: V2 Deployment Test */}
        <Card>
          <CardHeader>
            <CardTitle>Step 6: Test V2 Deployment</CardTitle>
            <CardDescription>Test the new V2 contract deployment system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={testV2Deployment}
              disabled={loading.v2Test}
              variant="outline"
            >
              {loading.v2Test ? 'Testing V2 Deployment...' : 'Test V2 Deployment'}
            </Button>

            {v2TestResult && (
              <ResultDisplay title="V2 Deployment Test Result" result={v2TestResult} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 7: Query Graduation Events</CardTitle>
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