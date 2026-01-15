/**
 * V8 Smart Contract Creation Hook
 * 
 * Uses V8 Factory to deploy agents with on-chain trading support.
 * Key difference from V6: agentId is passed as bytes32 to the contract,
 * allowing the bonding curve to track the agent by its database UUID.
 */

import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { parseEther, formatEther, Address, keccak256, toHex } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  V8_CONTRACTS,
  PROMPT_TOKEN_ADDRESS,
  AGENT_FACTORY_V8_ABI,
  BONDING_CURVE_V8_ABI,
  uuidToBytes32,
  V8_CONSTANTS,
} from '@/lib/contractsV8';

// Standard ERC20 ABI for PROMPT token
const PROMPT_TOKEN_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export interface AgentFormDataV8 {
  id: string; // Required for V8 - agent UUID from database
  name: string;
  symbol: string;
  prebuy_amount?: number;
  [key: string]: any;
}

export interface DeploymentResultV8 {
  success: boolean;
  txHash: string;
  tokenAddress?: string;
  error?: string;
}

const CREATION_FEE = 100n * 10n ** 18n; // 100 PROMPT

export const useSmartContractCreationV8 = () => {
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
    query: { enabled: !!address && isConnected },
  });

  // Read PROMPT token allowance for V8 factory
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: PROMPT_TOKEN_ADDRESS as Address,
    abi: PROMPT_TOKEN_ABI,
    functionName: 'allowance',
    args: address && V8_CONTRACTS.AGENT_FACTORY
      ? [address, V8_CONTRACTS.AGENT_FACTORY as Address]
      : undefined,
    query: { enabled: !!address && !!V8_CONTRACTS.AGENT_FACTORY && isConnected },
  });

  // Approve PROMPT tokens for V8 factory spending
  const approvePrompt = async (amount: bigint = CREATION_FEE): Promise<string> => {
    if (!isConnected || !address || !writeContractAsync) {
      throw new Error('Wallet not connected');
    }

    console.log('[V8] Approving PROMPT for factory:', {
      factory: V8_CONTRACTS.AGENT_FACTORY,
      amount: formatEther(amount),
    });

    setIsApproving(true);
    try {
      toast({
        title: 'Approving PROMPT',
        description: `Approving ${formatEther(amount)} PROMPT for V8 factory...`,
      });

      const tx = await writeContractAsync({
        address: PROMPT_TOKEN_ADDRESS as Address,
        abi: PROMPT_TOKEN_ABI,
        functionName: 'approve',
        args: [V8_CONTRACTS.AGENT_FACTORY as Address, amount],
        account: address,
        chain,
      });

      console.log('[V8] Approval tx sent:', tx);

      // Wait for confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: tx });
        console.log('[V8] Approval confirmed');
      }

      // Refetch allowance
      await refetchAllowance();

      toast({
        title: 'Approval Successful',
        description: 'PROMPT spending approved for V8 factory',
      });

      return tx;
    } catch (error) {
      console.error('[V8] Approval error:', error);
      toast({
        title: 'Approval Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsApproving(false);
    }
  };

  /**
   * Deploy agent using V8 Factory
   * Flow: User wallet calls createAgent(agentId, name, symbol, creator)
   * Factory charges 100 PROMPT and deploys PrototypeToken registered with V8 bonding curve
   */
  const deployAgentV8 = async (agentData: AgentFormDataV8): Promise<DeploymentResultV8> => {
    if (!isConnected || !address || !writeContractAsync || !publicClient) {
      throw new Error('Wallet not connected');
    }

    if (!agentData.id) {
      throw new Error('Agent ID is required for V8 deployment');
    }

    const agentIdBytes32 = uuidToBytes32(agentData.id);

    console.log('[V8] Starting agent deployment:', {
      agentId: agentData.id,
      agentIdBytes32,
      name: agentData.name,
      symbol: agentData.symbol,
      creator: address,
      factory: V8_CONTRACTS.AGENT_FACTORY,
    });

    setIsDeploying(true);

    try {
      // Step 1: Check balance
      const currentBalance = promptBalance || 0n;
      if (currentBalance < CREATION_FEE) {
        throw new Error(`Insufficient PROMPT balance. Need 100, have ${formatEther(currentBalance)}`);
      }
      console.log('[V8] Step 1: Balance check passed:', formatEther(currentBalance));

      // Step 2: Check/handle approval
      const currentAllowance = allowance || 0n;
      if (currentAllowance < CREATION_FEE) {
        console.log('[V8] Step 2: Approval needed, current:', formatEther(currentAllowance));
        await approvePrompt(CREATION_FEE);
      } else {
        console.log('[V8] Step 2: Approval already sufficient:', formatEther(currentAllowance));
      }

      // Step 3: Call createAgent via user's wallet
      toast({
        title: 'Creating V8 Agent',
        description: `Deploying ${agentData.name} (${agentData.symbol}) on-chain with V8 factory...`,
      });

      console.log('[V8] Step 3: Calling createAgent with V8 factory...');
      const tx = await writeContractAsync({
        address: V8_CONTRACTS.AGENT_FACTORY as Address,
        abi: AGENT_FACTORY_V8_ABI,
        functionName: 'createAgent',
        args: [agentIdBytes32, agentData.name, agentData.symbol, address],
        account: address,
        chain,
      });

      console.log('[V8] Step 4: Transaction sent:', tx);

      // IMPORTANT: persist tx hash immediately (pre-confirmation) to prevent cleanup deleting agent
      const { error: txUpdateError } = await supabase
        .from('agents')
        .update({ deployment_tx_hash: tx })
        .eq('id', agentData.id);

      if (txUpdateError) {
        console.error('[V8] CRITICAL: Failed to persist deployment tx hash:', txUpdateError);
        toast({
          title: 'Warning',
          description: 'Transaction submitted but failed to save. Note your tx: ' + tx.slice(0, 20) + '...',
          variant: 'destructive',
        });
      } else {
        console.log('[V8] Updated agent with tx hash (pre-confirmation):', tx);
      }

      toast({
        title: 'Transaction Sent',
        description: 'Waiting for confirmation...',
      });

      // Step 4: Wait for receipt and parse AgentCreated event
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      console.log('[V8] Step 5: Transaction confirmed, parsing events...');

      // Parse V8 AgentCreated event to get prototype token address
      let tokenAddress: string | undefined;

      // V8 AgentCreated event signature: AgentCreated(bytes32 indexed agentId, address indexed prototypeToken, address indexed creator, string name, string symbol, uint256 timestamp)
      const agentCreatedSignature = keccak256(toHex('AgentCreated(bytes32,address,address,string,string,uint256)'));

      for (const log of receipt.logs) {
        const logWithTopics = log as { address: string; topics?: readonly string[]; data: string };
        if (logWithTopics.topics && logWithTopics.topics[0] === agentCreatedSignature) {
          // topics[1] = agentId (bytes32), topics[2] = prototypeToken (address indexed)
          const rawAddress = logWithTopics.topics[2];
          if (rawAddress) {
            tokenAddress = '0x' + rawAddress.slice(-40);
            console.log('[V8] Step 6: Parsed prototype token address:', tokenAddress);
          }
          break;
        }
      }

      if (!tokenAddress) {
        console.warn('[V8] Could not parse AgentCreated event, checking all logs from factory...');
        // Fallback: try to find any event from factory
        for (const log of receipt.logs) {
          const logWithTopics = log as { address: string; topics?: readonly string[]; data: string };
          if (log.address.toLowerCase() === V8_CONTRACTS.AGENT_FACTORY.toLowerCase()) {
            if (logWithTopics.topics && logWithTopics.topics[2]) {
              tokenAddress = '0x' + logWithTopics.topics[2].slice(-40);
              console.log('[V8] Fallback: Found token address:', tokenAddress);
              break;
            }
          }
        }
      }

      // Refetch balance
      await refetchBalance();

      toast({
        title: 'V8 Agent Created!',
        description: tokenAddress
          ? `Prototype token deployed at: ${tokenAddress.slice(0, 10)}...`
          : 'Token deployed successfully',
      });

      console.log('[V8] Deployment complete:', {
        txHash: tx,
        tokenAddress,
        success: true,
      });

      return {
        txHash: tx,
        tokenAddress,
        success: true,
      };
    } catch (error) {
      console.error('[V8] Deployment error:', error);
      toast({
        title: 'V8 Deployment Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      return {
        txHash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      setIsDeploying(false);
    }
  };

  /**
   * Execute prebuy via V8 bonding curve
   * Uses direct on-chain buy through BondingCurveV8.buy()
   * User wallet signs the transaction - no edge function needed
   */
  const executePrebuyV8 = async (agentId: string, promptAmount: number): Promise<boolean> => {
    if (!address || !writeContractAsync || !publicClient || !isConnected || promptAmount <= 0) {
      console.log('[V8] Skipping prebuy: missing wallet or amount');
      return true;
    }

    const agentIdBytes32 = uuidToBytes32(agentId);
    const amountWei = parseEther(String(promptAmount));

    console.log('[V8] Executing on-chain prebuy:', {
      agentId,
      agentIdBytes32,
      walletAddress: address,
      promptAmount,
      amountWei: amountWei.toString(),
      bondingCurve: V8_CONTRACTS.BONDING_CURVE,
    });

    try {
      toast({
        title: 'Processing V8 Prebuy',
        description: `Approving ${promptAmount} PROMPT for bonding curve...`,
      });

      // Step 1: Approve PROMPT for bonding curve spending
      const approveTx = await writeContractAsync({
        address: PROMPT_TOKEN_ADDRESS as `0x${string}`,
        abi: PROMPT_TOKEN_ABI,
        functionName: 'approve',
        args: [V8_CONTRACTS.BONDING_CURVE as `0x${string}`, amountWei],
        account: address,
        chain,
      });

      console.log('[V8] Prebuy approval tx sent:', approveTx);
      await publicClient.waitForTransactionReceipt({ hash: approveTx });
      console.log('[V8] Prebuy approval confirmed');

      toast({
        title: 'Approval Confirmed',
        description: `Buying ${promptAmount} PROMPT worth of tokens...`,
      });

      // Step 2: Call buy on bonding curve with minTokensOut = 0 (accept any slippage for prebuy)
      const buyTx = await writeContractAsync({
        address: V8_CONTRACTS.BONDING_CURVE as `0x${string}`,
        abi: BONDING_CURVE_V8_ABI,
        functionName: 'buy',
        args: [agentIdBytes32, amountWei, 0n], // minTokensOut = 0 for simplicity
        account: address,
        chain,
      });

      console.log('[V8] Prebuy buy tx sent:', buyTx);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: buyTx });
      console.log('[V8] Prebuy buy confirmed:', receipt.transactionHash);

      toast({
        title: 'V8 Prebuy Successful!',
        description: `Prebuy completed. Tx: ${buyTx.slice(0, 10)}...`,
      });

      // Refetch balance after buy
      await refetchBalance();

      return true;
    } catch (error) {
      console.error('[V8] Prebuy failed:', error);
      toast({
        title: 'V8 Prebuy Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    // V8 methods
    deployAgentV8,
    executePrebuyV8,
    approvePrompt,

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
    factoryAddress: V8_CONTRACTS.AGENT_FACTORY,
    bondingCurveAddress: V8_CONTRACTS.BONDING_CURVE,
    promptTokenAddress: PROMPT_TOKEN_ADDRESS,
    creationFee: '100', // 100 PROMPT
    graduationThreshold: V8_CONSTANTS.GRADUATION_THRESHOLD,
  };
};
