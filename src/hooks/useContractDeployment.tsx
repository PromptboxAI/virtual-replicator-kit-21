
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
      
      // Store in database for future reference
      await supabase
        .from('deployed_contracts')
        .insert({
          contract_address: data.contractAddress,
          contract_type: 'prompt_token',
          network: 'base_sepolia',
          version: 'v1',
          name: 'PROMPTTEST',
          symbol: 'PROMPT',
          is_active: true
        });

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
      
      // Store in database
      await supabase
        .from('deployed_contracts')
        .insert({
          contract_address: data.contractAddress,
          contract_type: 'factory',
          network: 'base_sepolia',
          version: 'v2',
          name: 'AgentTokenFactory',
          symbol: 'FACTORY',
          is_active: true
        });

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
      setIsDeploying(true);
      
      console.log('🚀 Starting foundation contract deployment sequence...');
      
      if (!user) {
        throw new Error('Please sign in to deploy contracts');
      }

      // Step 1: Deploy the real ERC20 PROMPTTEST token
      console.log('📋 Step 1: Deploying PROMPTTEST token...');
      toast.info('Step 1: Deploying PROMPTTEST token...');
      const promptAddr = await deployPromptTestToken();
      console.log('✅ PROMPTTEST token deployed at:', promptAddr);
      
      // Wait a moment for transaction to settle
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 2: Deploy factory with the new PROMPTTEST token address
      console.log('📋 Step 2: Deploying AgentTokenFactory...');
      toast.info('Step 2: Deploying AgentTokenFactory...');
      
      // Use the user's wallet address as treasury if available, otherwise use deployer address
      const treasuryAddr = address || "0x23d03610584B0f0988A6F9C281a37094D5611388";
      console.log('🏦 Using treasury address:', treasuryAddr);
      
      const factoryAddr = await deployFactory(promptAddr, treasuryAddr);
      console.log('✅ AgentTokenFactory deployed at:', factoryAddr);
      
      toast.success('🎉 All foundation contracts deployed successfully!');
      console.log('🎉 Foundation deployment complete!');
      
      return {
        promptTokenAddress: promptAddr,
        factoryAddress: factoryAddr
      };
    } catch (error) {
      console.error('❌ Error deploying foundation contracts:', error);
      toast.error(`Failed to deploy contracts: ${error.message}`);
      throw error;
    } finally {
      setIsDeploying(false);
    }
  };

  // Get deployed contract addresses from database
  const getDeployedContracts = async () => {
    try {
      const { data: contracts, error } = await supabase
        .from('deployed_contracts')
        .select('contract_address, contract_type, name, symbol')
        .eq('network', 'base_sepolia')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const promptToken = contracts?.find(c => c.contract_type === 'prompt_token');
      const factory = contracts?.find(c => c.contract_type === 'factory');

      if (promptToken) setPromptTokenAddress(promptToken.contract_address);
      if (factory) setFactoryAddress(factory.contract_address);

      return contracts || [];
    } catch (error) {
      console.error('Error fetching deployed contracts:', error);
      return [];
    }
  };

  return {
    deployPromptTestToken,
    deployFactory,
    deployAll,
    getDeployedContracts,
    isDeploying,
    promptTokenAddress,
    factoryAddress
  };
};
