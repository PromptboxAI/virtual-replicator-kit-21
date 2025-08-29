import React, { useState } from 'react';
import { V2ContractTester } from '@/components/V2ContractTester';
import { AgentMigrationManager } from '@/components/AgentMigrationManager';
import { NewAgentCreator } from '@/components/NewAgentCreator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TestTube, ArrowUpDown, Sparkles, Zap, Settings, Loader2 } from 'lucide-react';

export default function TestLab() {
  const { toast } = useToast();
  const [isTestingEnv, setIsTestingEnv] = useState(false);
  const [envTestResult, setEnvTestResult] = useState<any>(null);

  const testDeploymentEnvironment = async () => {
    setIsTestingEnv(true);
    setEnvTestResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('test-deployment-env');
      
      if (error) {
        throw error;
      }

      setEnvTestResult(data);
      
      if (data.success) {
        toast({
          title: "Environment Test Passed",
          description: "Deployment environment is properly configured",
        });
      } else {
        toast({
          title: "Environment Test Failed",
          description: data.results?.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Environment test error:', error);
      setEnvTestResult({ success: false, error: error.message });
      toast({
        title: "Environment Test Failed", 
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTestingEnv(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <TestTube className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold">Agent V2 Test Lab</h1>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Beta
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Test, deploy, and migrate agent tokens with enhanced V2 features including 
          slippage protection and improved bonding curves.
        </p>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Create V2 Agent
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Test Suite
          </TabsTrigger>
          <TabsTrigger value="migrate" className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4" />
            Migration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Create New V2 Agent
              </CardTitle>
              <CardDescription>
                Deploy agents with the latest V2 token contract featuring slippage protection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NewAgentCreator />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          {/* Environment Test Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Deployment Environment Test
              </CardTitle>
              <CardDescription>
                Check if the deployment environment is properly configured
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testDeploymentEnvironment}
                disabled={isTestingEnv}
                variant="outline"
              >
                {isTestingEnv ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Testing Environment...
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4 mr-2" />
                    Test Deployment Environment
                  </>
                )}
              </Button>

              {envTestResult && (
                <Alert className={envTestResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-medium">
                        {envTestResult.success ? "✅ Environment Test Passed" : "❌ Environment Test Failed"}
                      </div>
                      {envTestResult.results && (
                        <div className="text-sm space-y-1">
                          <div>Deployer Private Key: {envTestResult.results.deployerPrivateKey}</div>
                          <div>Supabase URL: {envTestResult.results.supabaseUrl}</div>
                          <div>Supabase Key: {envTestResult.results.supabaseKey}</div>
                          {envTestResult.results.accountAddress && (
                            <div>Account: {envTestResult.results.accountAddress}</div>
                          )}
                          {envTestResult.results.blockNumber && (
                            <div>Block Number: {envTestResult.results.blockNumber}</div>
                          )}
                          {envTestResult.results.balance && (
                            <div>Balance: {envTestResult.results.balance} wei</div>
                          )}
                          {envTestResult.results.error && (
                            <div className="text-red-600">Error: {envTestResult.results.error}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <V2ContractTester />
        </TabsContent>

        <TabsContent value="migrate" className="space-y-6">
          <AgentMigrationManager />
        </TabsContent>
      </Tabs>

      {/* Feature Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            V1 vs V2 Feature Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Feature</th>
                  <th className="text-center p-2">V1</th>
                  <th className="text-center p-2">V2</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b">
                  <td className="p-2 font-medium">Slippage Protection</td>
                  <td className="text-center p-2">❌</td>
                  <td className="text-center p-2">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Enhanced Bonding Curve</td>
                  <td className="text-center p-2">❌</td>
                  <td className="text-center p-2">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Gas Optimization</td>
                  <td className="text-center p-2">Basic</td>
                  <td className="text-center p-2">Improved</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Transaction Lifecycle</td>
                  <td className="text-center p-2">Basic</td>
                  <td className="text-center p-2">Enhanced</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Migration Support</td>
                  <td className="text-center p-2">❌</td>
                  <td className="text-center p-2">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Error Handling</td>
                  <td className="text-center p-2">Basic</td>
                  <td className="text-center p-2">Comprehensive</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}