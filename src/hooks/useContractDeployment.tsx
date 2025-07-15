import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useContractDeployment = () => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [promptTokenAddress, setPromptTokenAddress] = useState<string>('');
  const [factoryAddress, setFactoryAddress] = useState<string>('');
  const { user } = useAuth();
  const address = user?.wallet?.address;

  const deployPromptTestToken = async () => {
    try {
      setIsDeploying(true);
      toast.info('Deploying PROMPTTEST token...');

      const { data, error } = await supabase.functions.invoke('deploy-prompt-test-token');

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to deploy PROMPTTEST token');
      }

      setPromptTokenAddress(data.contractAddress);
      toast.success(`PROMPTTEST token deployed at: ${data.contractAddress}`);
      
      return data.contractAddress;
    } catch (error) {
      console.error('Error deploying PROMPTTEST token:', error);
      toast.error('Failed to deploy PROMPTTEST token');
      throw error;
    } finally {
      setIsDeploying(false);
    }
  };

  const deployFactory = async (promptTokenAddr: string, treasuryAddr: string) => {
    try {
      setIsDeploying(true);
      toast.info('Deploying AgentTokenFactory...');

      const { data, error } = await supabase.functions.invoke('deploy-factory-contract', {
        body: {
          promptTokenAddress: promptTokenAddr,
          treasuryAddress: treasuryAddr
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to deploy factory contract');
      }

      setFactoryAddress(data.contractAddress);
      toast.success(`Factory deployed at: ${data.contractAddress}`);
      
      return data.contractAddress;
    } catch (error) {
      console.error('Error deploying factory contract:', error);
      toast.error('Failed to deploy factory contract');
      throw error;
    } finally {
      setIsDeploying(false);
    }
  };

  const deployAll = async () => {
    try {
      if (!address) {
        throw new Error('Please connect your wallet');
      }

      // Deploy PROMPTTEST token first
      const promptAddr = await deployPromptTestToken();
      
      // Use deployer address as treasury for now
      const treasuryAddr = address;
      
      // Deploy factory with PROMPTTEST address
      const factoryAddr = await deployFactory(promptAddr, treasuryAddr);
      
      toast.success('All contracts deployed successfully!');
      
      return {
        promptTokenAddress: promptAddr,
        factoryAddress: factoryAddr
      };
    } catch (error) {
      console.error('Error deploying contracts:', error);
      toast.error('Failed to deploy contracts');
      throw error;
    }
  };

  return {
    deployPromptTestToken,
    deployFactory,
    deployAll,
    isDeploying,
    promptTokenAddress,
    factoryAddress
  };
};