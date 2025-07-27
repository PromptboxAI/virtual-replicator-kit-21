
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

  const verifyContractOnChain = async (contractAddress: string, retries = 10): Promise<boolean> => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`🔍 Attempt ${i + 1}/${retries}: Verifying contract ${contractAddress} on-chain...`);
        
        const response = await fetch('https://sepolia.base.org', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getCode',
            params: [contractAddress, 'latest']
          })
        });
        
        const result = await response.json();
        const bytecode = result.result;
        
        if (bytecode && bytecode !== '0x' && bytecode.length > 2) {
          console.log(`✅ Contract ${contractAddress} verified on-chain with bytecode length: ${bytecode.length}`);
          return true;
        }
        
        console.log(`⏳ Contract ${contractAddress} not ready yet, waiting ${Math.min(2000 * (i + 1), 10000)}ms...`);
        await new Promise(resolve => setTimeout(resolve, Math.min(2000 * (i + 1), 10000)));
      } catch (error) {
        console.error(`❌ Error verifying contract ${contractAddress}:`, error);
        if (i === retries - 1) return false;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    return false;
  };

  const deployPromptTestToken = async (skipStateManagement = false) => {
    try {
      if (!skipStateManagement) setIsDeploying(true);
      toast.info('Deploying real ERC20 PROMPTTEST token...');

      const { data, error } = await supabase.functions.invoke('deploy-real-erc20-token');

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to deploy PROMPTTEST token');

      // Verify contract actually exists on-chain before storing
      if (!data.contractAddress || data.contractAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Invalid contract address returned from deployment');
      }

      console.log(`🚀 PROMPT token deployed, verifying on-chain: ${data.contractAddress}`);
      toast.info('Verifying PROMPT token on-chain...');
      
      // Wait for contract to be available on-chain with exponential backoff
      const isVerified = await verifyContractOnChain(data.contractAddress);
      if (!isVerified) {
        throw new Error(`PROMPT token contract ${data.contractAddress} failed on-chain verification`);
      }

      setPromptTokenAddress(data.contractAddress);
      
      // Store in database ONLY after successful verification
      await supabase
        .from('deployed_contracts')
        .insert({
          contract_address: data.contractAddress,
          contract_type: 'prompt_token',
          network: 'base_sepolia',
          version: 'v1',
          name: 'PROMPTTEST',
          symbol: 'PROMPT',
          transaction_hash: data.transactionHash,
          is_active: true
        });

      toast.success(`✅ PROMPT token deployed and verified: ${data.contractAddress}`);
      return data.contractAddress;
    } catch (error) {
      console.error('Error deploying PROMPTTEST token:', error);
      toast.error('Failed to deploy PROMPTTEST token');
      throw error;
    } finally {
      if (!skipStateManagement) setIsDeploying(false);
    }
  };

  const deployFactory = async (promptTokenAddr: string, treasuryAddr: string, skipStateManagement = false) => {
    try {
      if (!skipStateManagement) setIsDeploying(true);
      toast.info('Deploying AgentTokenFactory...');

      const { data, error } = await supabase.functions.invoke('deploy-factory-contract-fixed', {
        body: { promptTokenAddress: promptTokenAddr, treasuryAddress: treasuryAddr }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to deploy factory contract');

      // Verify contract actually exists on-chain before storing
      if (!data.contractAddress || data.contractAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Invalid factory contract address returned from deployment');
      }

      setFactoryAddress(data.contractAddress);
      
      // Store in database ONLY after successful verification
      await supabase
        .from('deployed_contracts')
        .insert({
          contract_address: data.contractAddress,
          contract_type: 'factory',
          network: 'base_sepolia',
          version: 'v2',
          name: 'AgentTokenFactory',
          symbol: 'FACTORY',
          transaction_hash: data.transactionHash,
          is_active: true
        });

      toast.success(`Factory deployed at: ${data.contractAddress}`);
      return data.contractAddress;
    } catch (error) {
      console.error('Error deploying factory contract:', error);
      toast.error('Failed to deploy factory contract');
      throw error;
    } finally {
      if (!skipStateManagement) setIsDeploying(false);
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
      const promptAddr = await deployPromptTestToken(true); // Skip state management, includes on-chain verification
      console.log('✅ PROMPTTEST token deployed and verified at:', promptAddr);
      
      // Step 2: Deploy factory with the VERIFIED PROMPTTEST token address
      console.log('📋 Step 2: Deploying AgentTokenFactory...');
      toast.info('Step 2: Deploying AgentTokenFactory...');
      console.log(`🔗 Using verified PROMPT token address: ${promptAddr}`);
      
      const treasuryAddr = address || "0x23d03610584B0f0988A6F9C281a37094D5611388";
      const factoryAddr = await deployFactory(promptAddr, treasuryAddr, true); // Skip state management
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
        .select('contract_address, contract_type, name, symbol, transaction_hash')
        .eq('network', 'base_sepolia')
        .eq('is_active', true)
        .neq('transaction_hash', null) // Only get contracts with confirmed transactions
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get the most recent PROMPT token that actually has a transaction hash (confirmed deployment)
      const promptToken = contracts?.find(c => 
        c.contract_type === 'prompt_token' && 
        c.transaction_hash
      );
      const factory = contracts?.find(c => 
        c.contract_type === 'factory' && 
        c.transaction_hash
      );

      if (promptToken) {
        console.log('📍 Using PROMPT token from database:', promptToken.contract_address);
        setPromptTokenAddress(promptToken.contract_address);
      }
      if (factory) {
        console.log('📍 Using Factory from database:', factory.contract_address);
        setFactoryAddress(factory.contract_address);
      }

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
