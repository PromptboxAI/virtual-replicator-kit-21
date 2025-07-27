import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { usePublicClient, useWalletClient } from 'wagmi';
import { useAccount } from 'wagmi';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

const FACTORY_ABI = [
  {
    inputs: [{ name: "_promptToken", type: "address" }, { name: "_treasury", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [],
    name: "promptToken",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "treasury",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getAllTokens",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "_name", type: "string" },
      { name: "_symbol", type: "string" },
      { name: "_initialSupply", type: "uint256" },
      { name: "_creator", type: "address" }
    ],
    name: "createAgentToken",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

interface FactoryDiagnostic {
  id: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  transactionHash?: string;
  hasCode: boolean;
  promptToken?: string;
  treasury?: string;
  tokenCount?: number;
  canSimulate: boolean;
  errors: string[];
}

export const FactoryDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState<FactoryDiagnostic[]>([]);
  const [loading, setLoading] = useState(false);
  
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address, isConnected } = useAccount();

  const fetchFactoryContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('deployed_contracts')
        .select('*')
        .eq('contract_type', 'factory')
        .eq('network', 'base_sepolia')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching factory contracts:', error);
      return [];
    }
  };

  const diagnoseSingleFactory = async (contract: any): Promise<FactoryDiagnostic> => {
    const diagnostic: FactoryDiagnostic = {
      id: contract.id,
      address: contract.contract_address,
      isActive: contract.is_active,
      createdAt: contract.created_at,
      transactionHash: contract.transaction_hash,
      hasCode: false,
      canSimulate: false,
      errors: []
    };

    if (!publicClient) {
      diagnostic.errors.push('No public client available');
      return diagnostic;
    }

    try {
      // Check if contract has bytecode
      const code = await publicClient.getCode({ address: contract.contract_address as `0x${string}` });
      diagnostic.hasCode = !!code && code !== '0x';

      if (!diagnostic.hasCode) {
        diagnostic.errors.push('No bytecode deployed at address');
        return diagnostic;
      }

      // Test contract functions
      try {
        const promptToken = await publicClient.readContract({
          address: contract.contract_address as `0x${string}`,
          abi: FACTORY_ABI,
          functionName: 'promptToken'
        });
        diagnostic.promptToken = promptToken as string;
      } catch (error) {
        diagnostic.errors.push(`promptToken() failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      try {
        const treasury = await publicClient.readContract({
          address: contract.contract_address as `0x${string}`,
          abi: FACTORY_ABI,
          functionName: 'treasury'
        });
        diagnostic.treasury = treasury as string;
      } catch (error) {
        diagnostic.errors.push(`treasury() failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      try {
        const tokens = await publicClient.readContract({
          address: contract.contract_address as `0x${string}`,
          abi: FACTORY_ABI,
          functionName: 'getAllTokens'
        });
        diagnostic.tokenCount = (tokens as string[]).length;
      } catch (error) {
        diagnostic.errors.push(`getAllTokens() failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Test createAgentToken simulation
      if (address && walletClient) {
        try {
          await publicClient.simulateContract({
            address: contract.contract_address as `0x${string}`,
            abi: FACTORY_ABI,
            functionName: 'createAgentToken',
            args: ['TestToken', 'TEST', BigInt(1000000), address],
            account: address
          });
          diagnostic.canSimulate = true;
        } catch (error) {
          diagnostic.canSimulate = false;
          diagnostic.errors.push(`createAgentToken simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

    } catch (error) {
      diagnostic.errors.push(`Contract interaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return diagnostic;
  };

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const contracts = await fetchFactoryContracts();
      const diagnosticsPromises = contracts.map(diagnoseSingleFactory);
      const results = await Promise.all(diagnosticsPromises);
      setDiagnostics(results);
    } catch (error) {
      toast({
        title: "Diagnostics Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (diagnostic: FactoryDiagnostic) => {
    if (!diagnostic.hasCode) return <XCircle className="h-4 w-4 text-destructive" />;
    if (diagnostic.errors.length > 0) return <AlertCircle className="h-4 w-4 text-warning" />;
    return <CheckCircle className="h-4 w-4 text-success" />;
  };

  const getStatusColor = (diagnostic: FactoryDiagnostic) => {
    if (!diagnostic.hasCode) return 'destructive';
    if (diagnostic.errors.length > 0) return 'secondary';
    return 'default';
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Factory Contract Diagnostics
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
        <CardDescription>
          Comprehensive analysis of all factory contracts in the database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDiagnostics} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Run Diagnostics
        </Button>

        {diagnostics.length === 0 ? (
          <Alert>
            <AlertDescription>
              No factory contracts found in database.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {diagnostics.map((diagnostic) => (
              <Card key={diagnostic.id} className="border-l-4" style={{
                borderLeftColor: diagnostic.hasCode ? (diagnostic.errors.length === 0 ? 'hsl(var(--success))' : 'hsl(var(--warning))') : 'hsl(var(--destructive))'
              }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(diagnostic)}
                      <code className="text-sm font-mono">
                        {diagnostic.address}
                      </code>
                      <Badge variant={getStatusColor(diagnostic)}>
                        {diagnostic.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(diagnostic.createdAt).toLocaleString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Has Bytecode:</strong> {diagnostic.hasCode ? '✅' : '❌'}
                    </div>
                    <div>
                      <strong>Can Simulate:</strong> {diagnostic.canSimulate ? '✅' : '❌'}
                    </div>
                  </div>
                  
                  {diagnostic.errors.length > 0 && (
                    <>
                      <Separator className="my-2" />
                      <div className="space-y-1">
                        <strong className="text-sm text-destructive">Errors:</strong>
                        {diagnostic.errors.map((error, index) => (
                          <div key={index} className="text-xs text-muted-foreground bg-muted p-2 rounded">
                            {error}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};