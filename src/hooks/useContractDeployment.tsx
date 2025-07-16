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
      toast.info('Deploying real ERC20 PROMPTTEST token...');

      const { data, error } = await supabase.functions.invoke('deploy-real-erc20-token');

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to deploy PROMPTTEST token');
      }

      setPromptTokenAddress(data.contractAddress);
      toast.success(`Real PROMPTTEST token deployed at: ${data.contractAddress}`);
      
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
      if (!user) {
        throw new Error('Please sign in to deploy contracts');
      }

      // Deploy the real ERC20 PROMPTTEST token
      const promptAddr = await deployPromptTestToken();
      
      // Use the user's wallet address as treasury if available, otherwise use deployer address
      const treasuryAddr = address || "0x23d03610584B0f0988A6F9C281a37094D5611388";
      
      // Deploy factory with the new PROMPTTEST token address
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