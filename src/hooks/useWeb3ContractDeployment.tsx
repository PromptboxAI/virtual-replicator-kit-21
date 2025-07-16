import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { toast } from 'sonner';
import { parseEther } from 'viem';

// Contract bytecodes (from compiled contracts)
const PROMPT_TOKEN_BYTECODE = "0x608060405234801561001057600080fd5b5033600081905550600160a01b63ffffffff60e01b031663a0712d6860e01b8152336004820152683635c9adc5dea0000060248201526044016020604051808303816000875af1158015610068573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061008c919061014a565b506101e2565b34801561009e57600080fd5b506100a76101c0565b6040516100b49190610167565b60405180910390f35b3480156100c957600080fd5b506100d26101d8565b005b3480156100e057600080fd5b506100e96101dd565b6040516100f691906101b7565b60405180910390f35b34801561010b57600080fd5b50610114610192565b60405161012191906101b7565b60405180910390f35b61013481610197565b811461013f57600080fd5b50565b61014b8161012a565b82525050565b60006020828403121561016357610162610000fd5b5b600061016f84846101420565b91505092915050565b6000610183826101a2565b61018d81856101b2565b93506101b8565b60200282019050919050565b6000610ca8565b90565b600081905092915050565b82818337600083830152505050565b60006101d1826101178565b9050919050565b6101e1816101c8565b81146101ec57600080fd5b50";

const FACTORY_BYTECODE = "0x608060405234801561001057600080fd5b5060405161099938038061099983398101604081905261002f916100b6565b600080546001600160a01b0319166001600160a01b0384161790556001805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b03929092169190911790555034801561008457600080fd5b5061008e826100f6565b61009781610113565b50506101b09050565b80516001600160a01b03811681146100b157600080fd5b919050565b600080604083850312156100c957600080fd5b6100d2836100a0565b91506100e0602084016100a0565b90509250929050565b634e487b7160e01b600052604160045260246000fd5b60006001600160a01b038216610108565b919050565b61011c816100f6565b811461012757600080fd5b50565b6001600160a01b0381168114604051906020016040518091039020565b7f416765";

const PROMPT_TOKEN_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "faucet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "transfer",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "from", "type": "address"}, {"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "transferFrom",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

const FACTORY_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "_promptToken", "type": "address"}, {"internalType": "address", "name": "_treasury", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{"internalType": "string", "name": "name", "type": "string"}, {"internalType": "string", "name": "symbol", "type": "string"}, {"internalType": "string", "name": "agentId", "type": "string"}],
    "name": "createAgentToken",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllTokens",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const useWeb3ContractDeployment = () => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [promptTokenAddress, setPromptTokenAddress] = useState<string>('');
  const [factoryAddress, setFactoryAddress] = useState<string>('');
  const [deploymentTxHash, setDeploymentTxHash] = useState<string>('');
  
  const { address, isConnected, chain } = useAccount();
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Load saved addresses from localStorage
  useEffect(() => {
    const savedPromptToken = localStorage.getItem('promptTokenAddress');
    const savedFactory = localStorage.getItem('factoryAddress');
    
    if (savedPromptToken) setPromptTokenAddress(savedPromptToken);
    if (savedFactory) setFactoryAddress(savedFactory);
  }, []);

  const deployPromptTestToken = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (chain?.id !== baseSepolia.id) {
      toast.error('Please switch to Base Sepolia network');
      return;
    }

    try {
      setIsDeploying(true);
      toast.info('Deploying PROMPTTEST token...');
      
      // Deploy PromptTestToken using edge function
      const response = await fetch(`https://cjzazuuwapsliacmjxfg.supabase.co/functions/v1/deploy-prompt-test-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqemF6dXV3YXBzbGlhY21qeGZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDk1ODgsImV4cCI6MjA2NzU4NTU4OH0.RuRyIGlY0362B3yLcMZEGuCyhAYVIK9K7mcW7BiXpAc`
        },
        body: JSON.stringify({
          deployer: address
        })
      });

      const result = await response.json();
      
      if (result.contractAddress) {
        setPromptTokenAddress(result.contractAddress);
        localStorage.setItem('promptTokenAddress', result.contractAddress);
        toast.success(`PROMPTTEST token deployed at: ${result.contractAddress}`);
        
        // Auto-deploy factory
        setTimeout(() => {
          deployFactory(result.contractAddress, address);
        }, 1000);
      } else {
        throw new Error(result.error || 'Deployment failed');
      }

    } catch (error) {
      console.error('Error deploying PROMPTTEST token:', error);
      toast.error('Failed to deploy PROMPTTEST token');
      setIsDeploying(false);
    }
  };

  const deployFactory = async (promptTokenAddr: string, treasuryAddr: string) => {
    try {
      toast.info('Deploying AgentTokenFactory...');
      
      // Deploy AgentTokenFactory using edge function
      const response = await fetch(`https://cjzazuuwapsliacmjxfg.supabase.co/functions/v1/deploy-factory-contract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqemF6dXV3YXBzbGlhY21qeGZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDk1ODgsImV4cCI6MjA2NzU4NTU4OH0.RuRyIGlY0362B3yLcMZEGuCyhAYVIK9K7mcW7BiXpAc`
        },
        body: JSON.stringify({
          promptTokenAddress: promptTokenAddr,
          treasuryAddress: treasuryAddr,
          deployer: treasuryAddr
        })
      });

      const result = await response.json();
      
      if (result.contractAddress) {
        setFactoryAddress(result.contractAddress);
        localStorage.setItem('factoryAddress', result.contractAddress);
        toast.success(`Factory deployed at: ${result.contractAddress}`);
        toast.success('All contracts deployed successfully!');
        setIsDeploying(false);
      } else {
        throw new Error(result.error || 'Factory deployment failed');
      }

    } catch (error) {
      console.error('Error deploying factory contract:', error);
      toast.error('Failed to deploy factory contract');
      setIsDeploying(false);
    }
  };

  const deployAll = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet to deploy contracts');
      return;
    }

    if (chain?.id !== baseSepolia.id) {
      toast.error('Please switch to Base Sepolia network');
      return;
    }

    await deployPromptTestToken();
  };

  return {
    deployPromptTestToken,
    deployFactory,
    deployAll,
    isDeploying,
    promptTokenAddress,
    factoryAddress,
    isConnected,
    userAddress: address,
    isCorrectNetwork: chain?.id === baseSepolia.id,
    contractsDeployed: promptTokenAddress && factoryAddress,
    PROMPT_TOKEN_ABI,
    FACTORY_ABI
  };
};