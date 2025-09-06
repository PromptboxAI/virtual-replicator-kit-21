import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { getChainConfig, isChainSupported, SUPPORTED_CHAINS } from '@/lib/chainConfig';

interface DeploymentStatus {
  chainId: number;
  status: 'idle' | 'deploying' | 'success' | 'error';
  contractAddress?: string;
  transactionHash?: string;
  error?: string;
}

export function useMultiChainDeployment() {
  const { address, isConnected } = useAccount();
  const { writeContract } = useWriteContract();
  const [deploymentStatuses, setDeploymentStatuses] = useState<Record<number, DeploymentStatus>>({});

  const updateDeploymentStatus = useCallback((chainId: number, update: Partial<DeploymentStatus>) => {
    setDeploymentStatuses(prev => ({
      ...prev,
      [chainId]: { ...prev[chainId], chainId, ...update }
    }));
  }, []);

  const deployToChain = useCallback(async (
    chainId: number,
    contractType: 'prompt-token' | 'factory' | 'lp-lock',
    params: any = {}
  ) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return false;
    }

    if (!isChainSupported(chainId)) {
      toast.error(`Chain ${chainId} is not supported`);
      return false;
    }

    const chainConfig = getChainConfig(chainId);
    if (!chainConfig) {
      toast.error(`Chain configuration not found for ${chainId}`);
      return false;
    }

    updateDeploymentStatus(chainId, { status: 'deploying' });

    try {
      let functionName: string;
      let requestBody: any;

      switch (contractType) {
        case 'prompt-token':
          functionName = 'deploy-prompt-test-token';
          requestBody = {
            chain_id: chainId,
            deployer_address: address,
            ...params
          };
          break;
        
        case 'factory':
          functionName = 'deploy-factory-contract';
          requestBody = {
            chain_id: chainId,
            deployer_address: address,
            prompt_token_address: params.promptTokenAddress,
            treasury_address: params.treasuryAddress,
            ...params
          };
          break;
        
        case 'lp-lock':
          functionName = 'deploy-lp-lock-contract';
          requestBody = {
            chain_id: chainId,
            deployer_address: address,
            ...params
          };
          break;
        
        default:
          throw new Error(`Unknown contract type: ${contractType}`);
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: requestBody
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Deployment failed');
      }

      updateDeploymentStatus(chainId, {
        status: 'success',
        contractAddress: data.contract_address,
        transactionHash: data.transaction_hash
      });

      toast.success(`${contractType} deployed successfully on ${chainConfig.displayName}`);
      return true;

    } catch (error: any) {
      console.error(`Deployment error on chain ${chainId}:`, error);
      updateDeploymentStatus(chainId, {
        status: 'error',
        error: error.message
      });
      
      toast.error(`Deployment failed on ${chainConfig.displayName}: ${error.message}`);
      return false;
    }
  }, [isConnected, address, updateDeploymentStatus]);

  const deployToAllChains = useCallback(async (
    contractType: 'prompt-token' | 'factory' | 'lp-lock',
    params: any = {}
  ) => {
    const activeChains = Object.values(SUPPORTED_CHAINS).filter(chain => chain.isActive);
    const results: Record<number, boolean> = {};

    // Deploy sequentially to avoid rate limits
    for (const chain of activeChains) {
      const success = await deployToChain(chain.id, contractType, params);
      results[chain.id] = success;
      
      // Add delay between deployments
      if (activeChains.indexOf(chain) < activeChains.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const successCount = Object.values(results).filter(Boolean).length;
    const totalCount = activeChains.length;

    toast.success(`Multi-chain deployment completed: ${successCount}/${totalCount} chains successful`);
    
    return results;
  }, [deployToChain]);

  const resetDeploymentStatuses = useCallback(() => {
    setDeploymentStatuses({});
  }, []);

  const getDeploymentStatus = useCallback((chainId: number) => {
    return deploymentStatuses[chainId] || { chainId, status: 'idle' as const };
  }, [deploymentStatuses]);

  return {
    deployToChain,
    deployToAllChains,
    deploymentStatuses,
    getDeploymentStatus,
    resetDeploymentStatuses,
    isDeploying: Object.values(deploymentStatuses).some(status => status.status === 'deploying'),
    isConnected,
    address
  };
}