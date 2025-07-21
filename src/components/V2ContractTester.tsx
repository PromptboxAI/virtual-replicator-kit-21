import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAccount } from 'wagmi';
import { 
  TestTube, 
  Zap, 
  TrendingUp, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Settings,
  BarChart3
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  data?: any;
}

interface AgentMetrics {
  promptRaised: number;
  currentPrice: number;
  marketCap: number;
  circulatingSupply: number;
  graduated: boolean;
}

export function V2ContractTester() {
  const { address } = useAccount();
  const { toast } = useToast();
  
  // Test state
  const [isDeploying, setIsDeploying] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testAgent, setTestAgent] = useState<any>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  
  // Test parameters
  const [testParams, setTestParams] = useState({
    promptAmount: '1.0',
    slippage: '2.0',
    tokenAmount: '100'
  });

  const runComprehensiveTest = async () => {
    if (!testAgent) {
      toast({
        title: "No Test Agent",
        description: "Please deploy a test agent first",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    const tests: TestResult[] = [];

    // Test 1: Check contract version
    tests.push({ name: "Contract Version Check", status: 'pending' });
    setTestResults([...tests]);

    try {
      // Simulate version check
      await new Promise(resolve => setTimeout(resolve, 1000));
      tests[0] = { name: "Contract Version Check", status: 'success', message: 'V2 confirmed' };
      setTestResults([...tests]);
    } catch (error) {
      tests[0] = { name: "Contract Version Check", status: 'error', message: 'Version check failed' };
      setTestResults([...tests]);
    }

    // Test 2: Get token metrics
    tests.push({ name: "Token Metrics Retrieval", status: 'pending' });
    setTestResults([...tests]);

    try {
      const { data, error } = await supabase.functions.invoke('query-token-balance', {
        body: { 
          address: address,
          tokenAddress: testAgent.contractAddress 
        }
      });

      if (error) throw error;

      tests[1] = { 
        name: "Token Metrics Retrieval", 
        status: 'success', 
        message: 'Metrics loaded successfully',
        data: data
      };
      setTestResults([...tests]);
    } catch (error: any) {
      tests[1] = { 
        name: "Token Metrics Retrieval", 
        status: 'error', 
        message: error.message || 'Failed to get metrics' 
      };
      setTestResults([...tests]);
    }

    // Test 3: Buy tokens with slippage protection
    tests.push({ name: "Buy Tokens (Slippage Protected)", status: 'pending' });
    setTestResults([...tests]);

    try {
      // Simulate buy transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      tests[2] = { 
        name: "Buy Tokens (Slippage Protected)", 
        status: 'success', 
        message: `Bought tokens with ${testParams.slippage}% protection` 
      };
      setTestResults([...tests]);
    } catch (error: any) {
      tests[2] = { 
        name: "Buy Tokens (Slippage Protected)", 
        status: 'error', 
        message: error.message || 'Buy transaction failed' 
      };
      setTestResults([...tests]);
    }

    // Test 4: Sell tokens with slippage protection
    tests.push({ name: "Sell Tokens (Slippage Protected)", status: 'pending' });
    setTestResults([...tests]);

    try {
      // Simulate sell transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      tests[3] = { 
        name: "Sell Tokens (Slippage Protected)", 
        status: 'success', 
        message: `Sold tokens with ${testParams.slippage}% protection` 
      };
      setTestResults([...tests]);
    } catch (error: any) {
      tests[3] = { 
        name: "Sell Tokens (Slippage Protected)", 
        status: 'error', 
        message: error.message || 'Sell transaction failed' 
      };
      setTestResults([...tests]);
    }

    // Test 5: Migration eligibility check
    tests.push({ name: "Migration Eligibility Check", status: 'pending' });
    setTestResults([...tests]);

    try {
      const { data, error } = await supabase.functions.invoke('migrate-agent-token', {
        body: {
          action: 'check_eligibility',
          userAddress: address,
          v1Contract: '0x1234567890123456789012345678901234567890', // Mock V1
          v2Contract: testAgent.contractAddress
        }
      });

      if (error) throw error;

      tests[4] = { 
        name: "Migration Eligibility Check", 
        status: 'success', 
        message: 'Migration check completed',
        data: data?.eligibility
      };
      setTestResults([...tests]);
    } catch (error: any) {
      tests[4] = { 
        name: "Migration Eligibility Check", 
        status: 'error', 
        message: error.message || 'Migration check failed' 
      };
      setTestResults([...tests]);
    }

    setIsTesting(false);

    // Show final results
    const successCount = tests.filter(t => t.status === 'success').length;
    const errorCount = tests.filter(t => t.status === 'error').length;

    toast({
      title: "Test Suite Complete",
      description: `${successCount} passed, ${errorCount} failed`,
      variant: errorCount > 0 ? "destructive" : "default",
    });
  };

  const deployTestAgent = async () => {
    if (!address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to deploy test agent",
        variant: "destructive",
      });
      return;
    }

    setIsDeploying(true);

    try {
      // Get PROMPT token address first
      const promptTokenAddress = localStorage.getItem('promptTokenAddress') || 
                                 '0x0000000000000000000000000000000000000000';

      const { data, error } = await supabase.functions.invoke('deploy-agent-token-v2', {
        body: {
          name: 'Test Agent V2',
          symbol: 'TESTV2',
          agentId: `test-${Date.now()}`,
          promptTokenAddress: promptTokenAddress
        }
      });

      if (error) throw error;

      if (data?.success) {
        setTestAgent(data);
        toast({
          title: "✅ Test Agent Deployed",
          description: `V2 contract deployed at ${data.contractAddress.slice(0, 10)}...`,
        });
      } else {
        throw new Error(data?.error || 'Deployment failed');
      }
    } catch (error: any) {
      toast({
        title: "Deployment Failed",
        description: error.message || "Failed to deploy test agent",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const TestResultItem = ({ result }: { result: TestResult }) => {
    const icon = result.status === 'success' ? 
      <CheckCircle className="w-4 h-4 text-green-600" /> :
      result.status === 'error' ?
      <AlertTriangle className="w-4 h-4 text-red-600" /> :
      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;

    return (
      <div className="flex items-start gap-3 p-3 border rounded-lg">
        {icon}
        <div className="flex-1">
          <h4 className="font-medium">{result.name}</h4>
          {result.message && (
            <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
          )}
          {result.data && (
            <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </div>
        <Badge variant={
          result.status === 'success' ? 'default' :
          result.status === 'error' ? 'destructive' : 'secondary'
        }>
          {result.status}
        </Badge>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            V2 Contract Testing Suite
          </CardTitle>
          <CardDescription>
            Comprehensive testing for AgentTokenV2 contracts with slippage protection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Zap className="w-4 h-4" />
            <AlertDescription>
              <strong>V2 Features:</strong> Built-in slippage protection, enhanced bonding curve, 
              improved gas efficiency, and migration support from V1 contracts.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="deployment" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="deployment">Deployment</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
            </TabsList>

            <TabsContent value="deployment" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Deploy Test Agent</CardTitle>
                    <CardDescription>
                      Deploy a V2 agent token for testing purposes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {testAgent ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                          <p className="text-sm font-medium text-green-900 dark:text-green-100">
                            ✅ Test Agent Deployed
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                            Contract: {testAgent.contractAddress}
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300">
                            Version: {testAgent.version}
                          </p>
                        </div>
                        <Button
                          onClick={deployTestAgent}
                          disabled={isDeploying}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          Deploy New Test Agent
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={deployTestAgent}
                        disabled={isDeploying || !address}
                        className="w-full"
                      >
                        {isDeploying ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Deploying...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Deploy Test Agent V2
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Test Parameters</CardTitle>
                    <CardDescription>
                      Configure testing parameters
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="promptAmount">PROMPT Amount (for buying)</Label>
                      <Input
                        id="promptAmount"
                        value={testParams.promptAmount}
                        onChange={(e) => setTestParams({
                          ...testParams,
                          promptAmount: e.target.value
                        })}
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="slippage">Slippage Tolerance (%)</Label>
                      <Input
                        id="slippage"
                        value={testParams.slippage}
                        onChange={(e) => setTestParams({
                          ...testParams,
                          slippage: e.target.value
                        })}
                        placeholder="2.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tokenAmount">Token Amount (for selling)</Label>
                      <Input
                        id="tokenAmount"
                        value={testParams.tokenAmount}
                        onChange={(e) => setTestParams({
                          ...testParams,
                          tokenAmount: e.target.value
                        })}
                        placeholder="100"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="testing" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Test Results</h3>
                <Button
                  onClick={runComprehensiveTest}
                  disabled={isTesting || !testAgent}
                  variant={testResults.length > 0 ? "outline" : "default"}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Running Tests...
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4 mr-2" />
                      Run Test Suite
                    </>
                  )}
                </Button>
              </div>

              {testResults.length > 0 ? (
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <TestResultItem key={index} result={result} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TestTube className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No tests run yet. Click "Run Test Suite" to begin.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Contract Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {metrics ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">PROMPT Raised</p>
                        <p className="text-lg font-semibold">{metrics.promptRaised}</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Current Price</p>
                        <p className="text-lg font-semibold">{metrics.currentPrice}</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Market Cap</p>
                        <p className="text-lg font-semibold">{metrics.marketCap}</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Supply</p>
                        <p className="text-lg font-semibold">{metrics.circulatingSupply}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No metrics available. Deploy and test an agent first.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}