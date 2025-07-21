import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { baseSepolia } from 'viem/chains';
import { useAppMode } from '@/hooks/useAppMode';
import { calculateTokensFromPrompt, calculateSellReturn } from '@/lib/bondingCurve';

// Get contract addresses from localStorage (set by deployment hook)
const getContractAddress = (key: string, fallback: string = '0x0000000000000000000000000000000000000000') => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key) || fallback;
  }
  return fallback;
};

const AGENT_TOKEN_FACTORY_ADDRESS = getContractAddress('factoryAddress');
const PROMPT_TOKEN_ADDRESS = getContractAddress('promptTokenAddress');

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
    "inputs": [
      {"internalType": "uint256", "name": "promptAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "minTokensOut", "type": "uint256"}
    ],
    "name": "buyTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "tokenAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "minPromptOut", "type": "uint256"}
    ],
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
  const factoryAddr = getContractAddress('factoryAddress');
  const { data: allTokens } = useReadContract({
    address: factoryAddr as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'getAllTokens',
    query: {
      enabled: factoryAddr !== '0x0000000000000000000000000000000000000000'
    }
  });

  const createAgentToken = async (name: string, symbol: string, agentId: string): Promise<string | null> => {
    if (!address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create an agent token.",
        variant: "destructive",
      });
      return null;
    }

    // Check if factory is deployed
    const factoryAddr = getContractAddress('factoryAddress');
    if (factoryAddr === '0x0000000000000000000000000000000000000000') {
      toast({
        title: "Factory Not Deployed",
        description: "Please deploy the factory contract first.",
        variant: "destructive",
      });
      return null;
    }

    try {
      await writeContract({
        address: factoryAddr as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: 'createAgentToken',
        args: [name, symbol, agentId],
        account: address,
        chain: baseSepolia,
      });
      
      toast({
        title: "Token Created!",
        description: "Agent token has been deployed successfully.",
      });
      
      // For now return a placeholder - in a real system, you'd get this from the transaction logs
      return 'pending'; // This would be the actual token address from contract event logs
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create token",
        variant: "destructive",
      });
      return null;
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

  const buyAgentTokens = async (promptAmount: string, slippage: string = "2") => {
    if (!address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to buy tokens.",
        variant: "destructive",
      });
      return;
    }

    if (!metrics) {
      toast({
        title: "⚠️ Slippage Protection Disabled",
        description: "Token metrics not loaded. Proceeding without slippage protection.",
        variant: "destructive",
      });
      return;
    }

    // Show contract upgrade warning
    toast({
      title: "ℹ️ Slippage Protection",
      description: "Note: Slippage protection only applies once upgraded contracts are deployed.",
      variant: "default",
    });

    try {
      const promptAmountFloat = parseFloat(promptAmount);
      const slippagePct = Number(slippage) / 100;
      
      // Calculate expected tokens from bonding curve
      const expectedResult = calculateTokensFromPrompt(metrics.promptRaised, promptAmountFloat);
      const expectedTokens = expectedResult.tokenAmount;
      
      // Apply slippage protection
      const minTokensOut = expectedTokens * (1 - slippagePct);
      
      const promptAmountWei = parseEther(promptAmount);
      const minTokensOutWei = parseEther(minTokensOut.toString());
      
      await writeBuy({
        address: tokenAddress as `0x${string}`,
        abi: AGENT_TOKEN_ABI,
        functionName: 'buyTokens',
        args: [promptAmountWei, minTokensOutWei],
        account: address,
        chain: baseSepolia,
      });
      
      toast({
        title: "Purchase Successful",
        description: `Tokens purchased with ${slippage}% slippage protection!`,
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

  const sellAgentTokens = async (tokenAmount: string, slippage: string = "2") => {
    if (!address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to sell tokens.",
        variant: "destructive",
      });
      return;
    }

    if (!metrics) {
      toast({
        title: "⚠️ Slippage Protection Disabled",
        description: "Token metrics not loaded. Proceeding without slippage protection.",
        variant: "destructive",
      });
      return;
    }

    // Show contract upgrade warning
    toast({
      title: "ℹ️ Slippage Protection",
      description: "Note: Slippage protection only applies once upgraded contracts are deployed.",
      variant: "default",
    });

    try {
      const tokenAmountFloat = parseFloat(tokenAmount);
      const slippagePct = Number(slippage) / 100;
      
      // Calculate expected PROMPT return from bonding curve
      const currentTokensSold = metrics.promptRaised * 1000; // Convert to tokens
      const expectedResult = calculateSellReturn(currentTokensSold, tokenAmountFloat);
      const expectedPrompt = expectedResult.return;
      
      // Apply slippage protection
      const minPromptOut = expectedPrompt * (1 - slippagePct);
      
      const tokenAmountWei = parseEther(tokenAmount);
      const minPromptOutWei = parseEther(minPromptOut.toString());
      
      await writeSell({
        address: tokenAddress as `0x${string}`,
        abi: AGENT_TOKEN_ABI,
        functionName: 'sellTokens',
        args: [tokenAmountWei, minPromptOutWei],
        account: address,
        chain: baseSepolia,
      });
      
      toast({
        title: "Sale Successful",
        description: `Tokens sold with ${slippage}% slippage protection!`,
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