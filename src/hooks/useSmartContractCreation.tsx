import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseEther, formatEther, Address } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PROMPT_TOKEN_ADDRESS, PROMPT_TOKEN_ABI, FACTORY_ADDRESS, FACTORY_ABI } from '@/lib/contracts';

export interface AgentFormData {
  id?: string;
  name: string;
  symbol: string;
  prebuy_amount: number;
  [key: string]: any;
}

export const useSmartContractCreation = () => {
  const { address, isConnected, chain } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { toast } = useToast();
  const [isDeploying, setIsDeploying] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Read PROMPT token balance
  const { data: promptBalance } = useReadContract({
    address: PROMPT_TOKEN_ADDRESS as Address,
    abi: PROMPT_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected }
  });

  // Read PROMPT token allowance for factory
  const { data: allowance } = useReadContract({
    address: PROMPT_TOKEN_ADDRESS as Address,
    abi: PROMPT_TOKEN_ABI,
    functionName: 'allowance',
    args: address && FACTORY_ADDRESS ? [address, FACTORY_ADDRESS as Address] : undefined,
    query: { enabled: !!address && !!FACTORY_ADDRESS && isConnected }
  });

  // Approve PROMPT tokens for factory spending
  const approvePrompt = async (spender: Address, amount: bigint) => {
    if (!isConnected || !address || !writeContractAsync) {
      throw new Error('Wallet not connected');
    }

    setIsApproving(true);
    try {
      const tx = await writeContractAsync({
        address: PROMPT_TOKEN_ADDRESS as Address,
        abi: PROMPT_TOKEN_ABI,
        functionName: 'approve',
        args: [spender, amount],
        account: address,
        chain
      });

      toast({
        title: "Approval Sent",
        description: "PROMPT spending approved",
      });

      return tx;
    } catch (error) {
      console.error('Approval error:', error);
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

  const deployAtomicAgent = async (agentData: AgentFormData) => {
    if (!isConnected || !address || !writeContractAsync) {
      throw new Error('Wallet not connected');
    }

    setIsDeploying(true);

    try {
      const prebuyAmount = parseEther(agentData.prebuy_amount.toString());

      toast({
        title: "Deploying Agent Token",
        description: "Creating agent token with atomic prebuy...",
      });

      // Call atomic deployment
      const tx = await writeContractAsync({
        address: FACTORY_ADDRESS as Address,
        abi: FACTORY_ABI,
        functionName: 'createAgentTokenWithPrebuy',
        args: [
          agentData.name,
          agentData.symbol,
          agentData.id || '',
          prebuyAmount,
          500n
        ],
        account: address,
        chain
      });

      toast({
        title: "Transaction Sent",
        description: `Tx: ${tx}`,
      });

      return { 
        txHash: tx,
        success: true
      };

    } catch (error) {
      console.error('Atomic deployment error:', error);
      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsDeploying(false);
    }
  };

  return {
    deployAtomicAgent,
    approvePrompt,
    isConnected,
    isDeploying,
    isApproving,
    promptBalance: promptBalance ? formatEther(promptBalance) : '0',
    allowance: allowance ? formatEther(allowance) : '0'
  };
};