import React, { useState, useEffect } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { parseAbiItem, decodeEventLog, getAddress } from 'viem';
import { supabase } from '@/integrations/supabase/client';

// Factory ABI with event
const FACTORY_ABI = [
  {
    "inputs": [
      {"name": "name", "type": "string"},
      {"name": "symbol", "type": "string"},
      {"name": "agentId", "type": "string"}
    ],
    "name": "createAgentToken",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllTokens",
    "outputs": [{"name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// AgentTokenCreated event ABI
const AGENT_TOKEN_CREATED_EVENT = parseAbiItem(
  'event AgentTokenCreated(address indexed token, address indexed creator, string agentId)'
);

export function FactoryContractTest() {
  const publicClient = usePublicClient({ chainId: baseSepolia.id });
  const { data: walletClient } = useWalletClient({ chainId: baseSepolia.id });
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [factoryAddress, setFactoryAddress] = useState<string>('');

  // Fetch the latest deployed factory contract from database
  useEffect(() => {
    const fetchLatestFactory = async () => {
      try {
        console.log('🔍 Fetching latest factory contract from database...');
        const { data, error } = await supabase
          .from('deployed_contracts')
          .select('contract_address, created_at')
          .eq('contract_type', 'factory')
          .eq('network', 'base_sepolia')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        console.log('Database query result:', { data, error });

        if (error) {
          console.error('Error fetching factory contract:', error);
          // Use the latest known address
          setFactoryAddress('0x0fe57068756dbf86ad8c19fbf711a8fcd4f08585');
          return;
        }

        if (data?.contract_address) {
          setFactoryAddress(data.contract_address);
          console.log('✅ Using factory contract:', data.contract_address);
          console.log('✅ Contract deployed at:', data.created_at);
        }
      } catch (error) {
        console.error('Error in fetchLatestFactory:', error);
        setFactoryAddress('0x0fe57068756dbf86ad8c19fbf711a8fcd4f08585');
      }
    };

    fetchLatestFactory();
  }, []);

  const testFactory = async () => {
    if (!publicClient || !walletClient) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!factoryAddress) {
      toast.error('Factory address not loaded yet');
      return;
    }

    setLoading(true);
    const results: any = {};

    try {
      console.log('🏭 FACTORY TEST DEBUG:');
      console.log('- Factory address being tested:', factoryAddress);
      console.log('- Public client:', !!publicClient);
      console.log('- Wallet client:', !!walletClient);
      console.log('- Chain ID:', publicClient?.chain?.id);
      console.log('- Chain name:', publicClient?.chain?.name);
      console.log('- Expected chain (Base Sepolia):', baseSepolia.id, baseSepolia.name);
      
      // Verify we're on the right network
      if (publicClient?.chain?.id !== baseSepolia.id) {
        throw new Error(`Wrong network! Expected Base Sepolia (${baseSepolia.id}) but got ${publicClient?.chain?.id}`);
      }

      // Try to fetch the deployment transaction to verify it exists
      console.log('🔍 Checking deployment transaction: 0x34a4ff77423169d346db35bb2332b0f3382df9bedbb07b8cbd38345eec160fd6');
      let deploymentTx;
      try {
        deploymentTx = await publicClient.getTransaction({
          hash: '0x34a4ff77423169d346db35bb2332b0f3382df9bedbb07b8cbd38345eec160fd6'
        });
        console.log('✅ Deployment transaction found:', {
          to: deploymentTx.to,
          blockNumber: deploymentTx.blockNumber,
          status: 'confirmed'
        });
        
        // Get the transaction receipt to see the contract address
        const receipt = await publicClient.getTransactionReceipt({
          hash: '0x34a4ff77423169d346db35bb2332b0f3382df9bedbb07b8cbd38345eec160fd6'
        });
        console.log('📄 Transaction receipt:', {
          status: receipt.status,
          contractAddress: receipt.contractAddress,
          gasUsed: receipt.gasUsed.toString()
        });
        
        if (receipt.contractAddress && receipt.contractAddress !== factoryAddress) {
          console.log('⚠️ ADDRESS MISMATCH!');
          console.log('- Expected:', factoryAddress);
          console.log('- Actual deployed address:', receipt.contractAddress);
          
          // Update to use the actual deployed address
          setFactoryAddress(receipt.contractAddress);
          results.actualDeployedAddress = receipt.contractAddress;
          return; // Exit and let the user run the test again with correct address
        }
        
      } catch (txError) {
        console.error('❌ Could not fetch deployment transaction:', txError);
        results.deploymentTxError = txError.message;
      }
      
      // Step 1: Check if factory has bytecode
      console.log('🔍 Checking factory bytecode...');
      console.log('- Calling getBytecode for address:', factoryAddress);
      
      // Try multiple approaches to verify the contract
      let bytecode;
      try {
        bytecode = await publicClient.getBytecode({
          address: factoryAddress as `0x${string}`
        });
      } catch (bytecodeError) {
        console.error('❌ getBytecode failed:', bytecodeError);
        results.bytecodeError = bytecodeError.message;
      }

      console.log('- Raw bytecode result:', bytecode);
      console.log('- Bytecode type:', typeof bytecode);
      console.log('- Bytecode length:', bytecode?.length);
      
      // Also try to get transaction count (nonce) as another way to verify the address exists
      let transactionCount;
      try {
        transactionCount = await publicClient.getTransactionCount({
          address: factoryAddress as `0x${string}`
        });
        console.log('- Transaction count (nonce):', transactionCount);
      } catch (nonceError) {
        console.error('❌ getTransactionCount failed:', nonceError);
      }

      // Try to call a view function to see if the contract responds
      let contractCallResult;
      try {
        contractCallResult = await publicClient.readContract({
          address: factoryAddress as `0x${string}`,
          abi: FACTORY_ABI,
          functionName: 'getAllTokens'
        });
        console.log('- Contract call result:', contractCallResult);
      } catch (contractError) {
        console.error('❌ Contract call failed:', contractError);
        results.contractCallError = contractError.message;
      }
      
      results.hasBytecode = bytecode && bytecode !== '0x';
      results.rawBytecode = bytecode;
      results.transactionCount = transactionCount;
      results.contractCallResult = contractCallResult;
      console.log('Factory has bytecode:', results.hasBytecode);

      if (!results.hasBytecode && !contractCallResult) {
        console.log('❌ Factory contract verification failed');
        console.log('- Expected: non-empty bytecode or successful contract call');
        console.log('- Received bytecode:', bytecode);
        console.log('- Contract call result:', contractCallResult);
        throw new Error(`Factory contract not found at address ${factoryAddress}. Check deployment transaction 0x34a4ff77423169d346db35bb2332b0f3382df9bedbb07b8cbd38345eec160fd6 on Base Sepolia`);
      }

      // If contract call worked but bytecode didn't, continue anyway
      if (contractCallResult && !results.hasBytecode) {
        console.log('⚠️ Bytecode check failed but contract call succeeded - continuing...');
        results.hasBytecode = true; // Override since contract is responding
      }

      // Step 2: Get current tokens before deployment
      console.log('📋 Getting existing tokens...');
      const tokensBefore = await publicClient.readContract({
        address: factoryAddress as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: 'getAllTokens'
      });
      results.tokensBefore = tokensBefore;
      console.log('Tokens before:', tokensBefore);

      // Step 3: Create a test token
      const testName = `Test Token ${Date.now()}`;
      const testSymbol = 'TEST';
      const testAgentId = `test-${Date.now()}`;

      console.log('🚀 Creating test token...');
      const hash = await walletClient.writeContract({
        address: factoryAddress as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: 'createAgentToken',
        args: [testName, testSymbol, testAgentId],
        account: walletClient.account,
        value: BigInt(0)
      });

      console.log('Transaction hash:', hash);
      results.transactionHash = hash;

      // Step 4: Wait for transaction receipt
      console.log('⏳ Waiting for confirmation...');
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 60_000
      });

      results.receipt = {
        status: receipt.status,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        logs: receipt.logs.length
      };

      console.log('Receipt:', receipt);

      // Step 5: Parse events from logs
      console.log('🔍 Parsing events...');
      let tokenAddress: string | null = null;

      // Method 1: Try to decode AgentTokenCreated event
      for (const log of receipt.logs) {
        try {
          if (log.address.toLowerCase() === factoryAddress.toLowerCase()) {
            // Try to decode as AgentTokenCreated event
            const decoded = decodeEventLog({
              abi: [AGENT_TOKEN_CREATED_EVENT],
              data: log.data,
              topics: (log as any).topics
            }) as any;

            if (decoded.eventName === 'AgentTokenCreated') {
              tokenAddress = decoded.args.token;
              results.eventDecoded = {
                token: decoded.args.token,
                creator: decoded.args.creator,
                agentId: decoded.args.agentId
              };
              console.log('Decoded event:', decoded);
              break;
            }
          }
        } catch (e) {
          // Try alternative parsing
          console.log('Standard decode failed, trying alternative...');

          // Method 2: Manual topic parsing
          const logTopics = (log as any).topics;
          if (logTopics && logTopics.length >= 3) {
            // Second topic might be the token address
            const possibleAddress = `0x${logTopics[1]?.slice(-40)}`;
            if (possibleAddress.startsWith('0x') && possibleAddress.length === 42) {
              try {
                const checksummed = getAddress(possibleAddress);
                tokenAddress = checksummed;
                results.topicParsed = checksummed;
                console.log('Parsed from topics:', checksummed);
                break;
              } catch {}
            }
          }
        }
      }

      // Method 3: Check getAllTokens after deployment
      console.log('📋 Getting tokens after deployment...');
      const tokensAfter = await publicClient.readContract({
        address: factoryAddress as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: 'getAllTokens'
      });
      results.tokensAfter = tokensAfter;

      // Find new token by comparing arrays
      if (tokensAfter.length > tokensBefore.length) {
        tokenAddress = tokensAfter[tokensAfter.length - 1];
        results.newTokenFromArray = tokenAddress;
      }

      results.tokenAddress = tokenAddress;
      results.success = !!tokenAddress;

      // Step 6: Verify token exists if we found an address
      if (tokenAddress) {
        const tokenBytecode = await publicClient.getBytecode({
          address: tokenAddress as `0x${string}`
        });
        results.tokenDeployed = tokenBytecode && tokenBytecode !== '0x';
      }

      setTestResults(results);

      if (results.success) {
        toast.success(`Test passed! Token deployed at ${tokenAddress}`);
      } else {
        toast.error('Test failed - could not determine token address');
      }

    } catch (error: any) {
      console.error('Factory test error:', error);
      results.error = error.message;
      setTestResults(results);
      toast.error(`Test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Factory Contract Direct Test</CardTitle>
        <CardDescription>
          Test the AgentTokenFactory at {factoryAddress || 'Loading...'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={testFactory}
          disabled={loading}
          className="mb-4"
        >
          {loading ? 'Testing...' : 'Run Factory Test'}
        </Button>

        {Object.keys(testResults).length > 0 && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>

            {testResults.tokenAddress && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-green-800">
                  ✅ Token deployed at: {testResults.tokenAddress}
                </p>
              </div>
            )}

            {!testResults.success && testResults.error && (
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-red-800">
                  ❌ Error: {testResults.error}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}