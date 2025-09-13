import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
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
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { toast } = useToast();
  const [isDeploying, setIsDeploying] = useState(false);

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
    isConnected,
    isDeploying,
    promptBalance: '0',
    allowance: '0'
  };
};