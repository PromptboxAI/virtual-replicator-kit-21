import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { parseEther, formatEther, Address, decodeEventLog, keccak256, toHex } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  PROMPT_TOKEN_ADDRESS, 
  AGENT_FACTORY_V6_ADDRESS, 
  AGENT_FACTORY_V6_ABI 
} from '@/lib/contractsV6';

// Standard ERC20 ABI for PROMPT token
const PROMPT_TOKEN_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// V6 Factory ABI for wagmi
const FACTORY_V6_ABI_WAGMI = [
  {
    "inputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "string", "name": "symbol", "type": "string"}
    ],
    "name": "createAgent",
    "outputs": [{"internalType": "address", "name": "agentToken", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "agentToken", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "name", "type": "string"},
      {"indexed": false, "internalType": "string", "name": "symbol", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "AgentCreated",
    "type": "event"
  }
] as const;

export interface AgentFormData {
  id?: string;
  name: string;
  symbol: string;
  prebuy_amount?: number;
  [key: string]: any;
}

export interface DeploymentResult {
  success: boolean;
  txHash: string;
  tokenAddress?: string;
  error?: string;
}

const CREATION_FEE = 100n * 10n ** 18n; // 100 PROMPT

export const useSmartContractCreation = () => {
  const { address, isConnected, chain } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { toast } = useToast();
  const [isDeploying, setIsDeploying] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Read PROMPT token balance
  const { data: promptBalance, refetch: refetchBalance } = useReadContract({
    address: PROMPT_TOKEN_ADDRESS as Address,
    abi: PROMPT_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected }
  });

  // Read PROMPT token allowance for V6 factory
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: PROMPT_TOKEN_ADDRESS as Address,
    abi: PROMPT_TOKEN_ABI,
    functionName: 'allowance',
    args: address && AGENT_FACTORY_V6_ADDRESS ? [address, AGENT_FACTORY_V6_ADDRESS as Address] : undefined,
    query: { enabled: !!address && !!AGENT_FACTORY_V6_ADDRESS && isConnected }
  });

  // Approve PROMPT tokens for V6 factory spending
  const approvePrompt = async (amount: bigint = CREATION_FEE): Promise<string> => {
    if (!isConnected || !address || !writeContractAsync) {
      throw new Error('Wallet not connected');
    }

    console.log('[V6] Approving PROMPT for factory:', {
      factory: AGENT_FACTORY_V6_ADDRESS,
      amount: formatEther(amount)
    });

    setIsApproving(true);
    try {
      toast({
        title: "Approving PROMPT",
        description: `Approving ${formatEther(amount)} PROMPT for factory...`,
      });

      const tx = await writeContractAsync({
        address: PROMPT_TOKEN_ADDRESS as Address,
        abi: PROMPT_TOKEN_ABI,
        functionName: 'approve',
        args: [AGENT_FACTORY_V6_ADDRESS as Address, amount],
        account: address,
        chain
      });

      console.log('[V6] Approval tx sent:', tx);

      // Wait for confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: tx });
        console.log('[V6] Approval confirmed');
      }

      // Refetch allowance
      await refetchAllowance();

      toast({
        title: "Approval Successful",
        description: "PROMPT spending approved for factory",
      });

      return tx;
    } catch (error) {
      console.error('[V6] Approval error:', error);
      toast({
        title: "Approval Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsApproving(false);
    }
  };

  /**
   * Deploy agent using V6 Factory
   * Flow: User wallet calls createAgent(name, symbol)
   * Factory charges 100 PROMPT and deploys AgentTokenV6
   */
  const deployAgentV6 = async (agentData: AgentFormData): Promise<DeploymentResult> => {
    if (!isConnected || !address || !writeContractAsync || !publicClient) {
      throw new Error('Wallet not connected');
    }

    console.log('[V6] Starting agent deployment:', {
      name: agentData.name,
      symbol: agentData.symbol,
      factory: AGENT_FACTORY_V6_ADDRESS
    });

    setIsDeploying(true);

    try {
      // Step 1: Check balance
      const currentBalance = promptBalance || 0n;
      if (currentBalance < CREATION_FEE) {
        throw new Error(`Insufficient PROMPT balance. Need 100, have ${formatEther(currentBalance)}`);
      }
      console.log('[V6] Step 1: Balance check passed:', formatEther(currentBalance));

      // Step 2: Check/handle approval
      const currentAllowance = allowance || 0n;
      if (currentAllowance < CREATION_FEE) {
        console.log('[V6] Step 2: Approval needed, current:', formatEther(currentAllowance));
        await approvePrompt(CREATION_FEE);
      } else {
        console.log('[V6] Step 2: Approval already sufficient:', formatEther(currentAllowance));
      }

      // Step 3: Call createAgent via user's wallet
      toast({
        title: "Creating Agent",
        description: `Deploying ${agentData.name} (${agentData.symbol}) on-chain...`,
      });

      console.log('[V6] Step 3: Calling createAgent...');
      const tx = await writeContractAsync({
        address: AGENT_FACTORY_V6_ADDRESS as Address,
        abi: FACTORY_V6_ABI_WAGMI,
        functionName: 'createAgent',
        args: [agentData.name, agentData.symbol],
        account: address,
        chain
      });

      console.log('[V6] Step 4: Transaction sent:', tx);

      toast({
        title: "Transaction Sent",
        description: "Waiting for confirmation...",
      });

      // Step 4: Wait for receipt and parse AgentCreated event
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      console.log('[V6] Step 5: Transaction confirmed, parsing events...');

      // Parse AgentCreated event to get token address
      let tokenAddress: string | undefined;
      
      // AgentCreated event signature
      const agentCreatedSignature = keccak256(toHex('AgentCreated(address,address,string,string,uint256)'));
      
      for (const log of receipt.logs) {
        // Type assertion for log with topics
        const logWithTopics = log as { address: string; topics?: readonly string[]; data: string };
        if (logWithTopics.topics && logWithTopics.topics[0] === agentCreatedSignature) {
          // First indexed param (topics[1]) is agentToken address
          // Need to pad/unpad the address from 32 bytes
          const rawAddress = logWithTopics.topics[1];
          if (rawAddress) {
            tokenAddress = '0x' + rawAddress.slice(-40);
            console.log('[V6] Step 6: Parsed token address:', tokenAddress);
          }
          break;
        }
      }

      if (!tokenAddress) {
        console.warn('[V6] Could not parse AgentCreated event, checking receipt...');
        // Fallback: try to find in logs
        for (const log of receipt.logs) {
          const logWithTopics = log as { address: string; topics?: readonly string[]; data: string };
          if (log.address.toLowerCase() === AGENT_FACTORY_V6_ADDRESS.toLowerCase()) {
            if (logWithTopics.topics && logWithTopics.topics[1]) {
              tokenAddress = '0x' + logWithTopics.topics[1].slice(-40);
              console.log('[V6] Fallback: Found token address:', tokenAddress);
              break;
            }
          }
        }
      }

      // Refetch balance
      await refetchBalance();

      toast({
        title: "Agent Created!",
        description: tokenAddress 
          ? `Token deployed at: ${tokenAddress.slice(0, 10)}...`
          : "Token deployed successfully",
      });

      console.log('[V6] Deployment complete:', {
        txHash: tx,
        tokenAddress,
        success: true
      });

      return { 
        txHash: tx,
        tokenAddress,
        success: true
      };

    } catch (error) {
      console.error('[V6] Deployment error:', error);
      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      return {
        txHash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsDeploying(false);
    }
  };

  /**
   * Execute prebuy via trading-engine-v6 (database mode)
   * Called after successful agent creation
   */
  const executePrebuy = async (agentId: string, promptAmount: number): Promise<boolean> => {
    if (!address || promptAmount <= 0) {
      console.log('[V6] Skipping prebuy: no address or amount');
      return true;
    }

    console.log('[V6] Executing prebuy:', {
      agentId,
      walletAddress: address,
      promptAmount
    });

    try {
      toast({
        title: "Processing Prebuy",
        description: `Purchasing ${promptAmount} PROMPT worth of tokens...`,
      });

      const { data, error } = await supabase.functions.invoke('trading-engine-v6', {
        body: {
          agentId,
          walletAddress: address,
          promptAmount,
          action: 'buy'
        }
      });

      if (error) {
        console.error('[V6] Prebuy error:', error);
        toast({
          title: "Prebuy Failed",
          description: error.message || "Failed to execute prebuy",
          variant: "destructive"
        });
        return false;
      }

      console.log('[V6] Prebuy result:', data);
      
      if (data?.success) {
        toast({
          title: "Prebuy Successful!",
          description: `Received ${data.sharesReceived?.toLocaleString() || 'your'} shares`,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('[V6] Prebuy exception:', error);
      toast({
        title: "Prebuy Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
      return false;
    }
  };

  // Legacy method - kept for backward compatibility but redirects to V6
  const deployAtomicAgent = async (agentData: AgentFormData): Promise<DeploymentResult> => {
    console.log('[V6] deployAtomicAgent called, redirecting to deployAgentV6');
    return deployAgentV6(agentData);
  };

  return {
    // V6 methods
    deployAgentV6,
    executePrebuy,
    approvePrompt,
    
    // Legacy method (redirects to V6)
    deployAtomicAgent,
    
    // State
    isConnected,
    isDeploying,
    isApproving,
    promptBalance: promptBalance ? formatEther(promptBalance) : '0',
    allowance: allowance ? formatEther(allowance) : '0',
    
    // Refetch helpers
    refetchBalance,
    refetchAllowance,
    
    // Constants
    factoryAddress: AGENT_FACTORY_V6_ADDRESS,
    promptTokenAddress: PROMPT_TOKEN_ADDRESS,
    creationFee: '100' // 100 PROMPT
  };
};
