import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { base } from 'viem/chains';

const AGENT_TOKEN_FACTORY_ADDRESS = '0x...'; // Will be set after deployment
const PROMPT_TOKEN_ADDRESS = '0x...'; // Will be set after PROMPT token deployment

const FACTORY_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "string", "name": "symbol", "type": "string"},
      {"internalType": "string", "name": "agentId", "type": "string"}
    ],
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
];

const AGENT_TOKEN_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "promptAmount", "type": "uint256"}],
    "name": "buyTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenAmount", "type": "uint256"}],
    "name": "sellTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "promptAmount", "type": "uint256"}],
    "name": "getBuyPrice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenAmount", "type": "uint256"}],
    "name": "getSellPrice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTokenMetrics",
    "outputs": [
      {"internalType": "uint256", "name": "_promptRaised", "type": "uint256"},
      {"internalType": "uint256", "name": "_currentPrice", "type": "uint256"},
      {"internalType": "uint256", "name": "_marketCap", "type": "uint256"},
      {"internalType": "uint256", "name": "_circulatingSupply", "type": "uint256"},
      {"internalType": "bool", "name": "_graduated", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export function useAgentTokenFactory() {
  const { address } = useAccount();
  const { toast } = useToast();
  const { writeContract, isPending: isCreating } = useWriteContract();

  // Get All Tokens
  const { data: allTokens } = useReadContract({
    address: AGENT_TOKEN_FACTORY_ADDRESS as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'getAllTokens',
  });

  const createAgentToken = async (name: string, symbol: string, agentId: string) => {
    if (!address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create an agent token.",
        variant: "destructive",
      });
      return;
    }

    try {
      await writeContract({
        address: AGENT_TOKEN_FACTORY_ADDRESS as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: 'createAgentToken',
        args: [name, symbol, agentId],
        account: address,
        chain: base,
      });
      
      toast({
        title: "Token Created!",
        description: "Agent token has been deployed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create token",
        variant: "destructive",
      });
    }
  };

  return {
    createAgentToken,
    isCreating,
    allTokens: allTokens as string[] || [],
  };
}

export function useAgentToken(tokenAddress?: string) {
  const { address } = useAccount();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<any>(null);
  const { writeContract: writeBuy, isPending: isBuying } = useWriteContract();
  const { writeContract: writeSell, isPending: isSelling } = useWriteContract();

  // Get Token Metrics
  const { data: tokenMetrics, refetch: refetchMetrics } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: AGENT_TOKEN_ABI,
    functionName: 'getTokenMetrics',
  });

  useEffect(() => {
    if (tokenMetrics) {
      setMetrics({
        promptRaised: Number(formatEther(tokenMetrics[0])),
        currentPrice: Number(formatEther(tokenMetrics[1])),
        marketCap: Number(formatEther(tokenMetrics[2])),
        circulatingSupply: Number(formatEther(tokenMetrics[3])),
        graduated: tokenMetrics[4],
      });
    }
  }, [tokenMetrics]);

  const buyAgentTokens = async (promptAmount: string) => {
    if (!address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to buy tokens.",
        variant: "destructive",
      });
      return;
    }

    try {
      const amountWei = parseEther(promptAmount);
      await writeBuy({
        address: tokenAddress as `0x${string}`,
        abi: AGENT_TOKEN_ABI,
        functionName: 'buyTokens',
        args: [amountWei],
        account: address,
        chain: base,
      });
      
      toast({
        title: "Purchase Successful",
        description: "Tokens purchased successfully!",
      });
      refetchMetrics();
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase tokens",
        variant: "destructive",
      });
    }
  };

  const sellAgentTokens = async (tokenAmount: string) => {
    if (!address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to sell tokens.",
        variant: "destructive",
      });
      return;
    }

    try {
      const amountWei = parseEther(tokenAmount);
      await writeSell({
        address: tokenAddress as `0x${string}`,
        abi: AGENT_TOKEN_ABI,
        functionName: 'sellTokens',
        args: [amountWei],
        account: address,
        chain: base,
      });
      
      toast({
        title: "Sale Successful",
        description: "Tokens sold successfully!",
      });
      refetchMetrics();
    } catch (error: any) {
      toast({
        title: "Sale Failed",
        description: error.message || "Failed to sell tokens",
        variant: "destructive",
      });
    }
  };

  return {
    metrics,
    buyAgentTokens,
    sellAgentTokens,
    isBuying,
    isSelling,
    refetchMetrics,
  };
}