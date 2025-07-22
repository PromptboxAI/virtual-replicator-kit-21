import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { baseSepolia } from 'viem/chains';
import { useAppMode } from '@/hooks/useAppMode';
import { calculateTokensFromPrompt, calculateSellReturn, getCurrentPrice } from '@/lib/bondingCurve';
import { supabase } from '@/integrations/supabase/client';

// Transaction states
type TransactionState = 'idle' | 'pending' | 'confirmed' | 'error';

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

interface FeeConfig {
  feePercent: number;
  creatorSplit: number;
  platformSplit: number;
  creatorWalletAddress?: string;
  platformWalletAddress?: string;
}

interface TransactionFees {
  feeAmount: number;
  creatorAmount: number;
  platformAmount: number;
  netAmount: number;
}

export function useAgentToken(tokenAddress?: string, agentId?: string) {
  const { address } = useAccount();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<any>(null);
  const [feeConfig, setFeeConfig] = useState<FeeConfig>({
    feePercent: 0.01,
    creatorSplit: 0.7,
    platformSplit: 0.3
  });
  
  // Transaction state management
  const [buyTxState, setBuyTxState] = useState<TransactionState>('idle');
  const [sellTxState, setSellTxState] = useState<TransactionState>('idle');
  const [buyTxHash, setBuyTxHash] = useState<`0x${string}` | undefined>();
  const [sellTxHash, setSellTxHash] = useState<`0x${string}` | undefined>();
  
  // Transaction metadata for enhanced toasts
  const [buyTxMeta, setBuyTxMeta] = useState<{
    promptAmount: string;
    expectedTokens: number;
    slippage: string;
  } | null>(null);
  
  const [sellTxMeta, setSellTxMeta] = useState<{
    tokenAmount: string;
    expectedPrompt: number;
    slippage: string;
  } | null>(null);
  
  const { writeContract: writeBuy } = useWriteContract();
  const { writeContract: writeSell } = useWriteContract();
  
  // Wait for transaction receipts with timeout handling
  const { isLoading: isBuyConfirming, data: buyReceipt } = useWaitForTransactionReceipt({
    hash: buyTxHash,
    timeout: 180_000, // 3 minutes
  });
  
  const { isLoading: isSellConfirming, data: sellReceipt } = useWaitForTransactionReceipt({
    hash: sellTxHash,
    timeout: 180_000, // 3 minutes
  });

  // Get Token Metrics
  const { data: tokenMetrics, refetch: refetchMetrics } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: AGENT_TOKEN_ABI,
    functionName: 'getTokenMetrics',
  });

  // Fetch fee configuration for the agent
  useEffect(() => {
    if (agentId) {
      const fetchFeeConfig = async () => {
        try {
          const { data, error } = await supabase
            .from('revenue_config')
            .select('*')
            .eq('agent_id', agentId)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching fee config:', error);
            return;
          }

          if (data) {
            setFeeConfig({
              feePercent: data.fee_percent,
              creatorSplit: data.creator_split,
              platformSplit: data.platform_split,
              creatorWalletAddress: data.creator_wallet_address,
              platformWalletAddress: data.platform_wallet_address
            });
          }
        } catch (error) {
          console.error('Error fetching fee config:', error);
        }
      };

      fetchFeeConfig();
    }
  }, [agentId]);

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

  // Calculate transaction fees for a given amount
  const calculateTransactionFees = (tradeAmount: number): TransactionFees => {
    const feeAmount = tradeAmount * feeConfig.feePercent;
    const creatorAmount = feeAmount * feeConfig.creatorSplit;
    const platformAmount = feeAmount * feeConfig.platformSplit;
    const netAmount = tradeAmount - feeAmount;

    return {
      feeAmount,
      creatorAmount,
      platformAmount,
      netAmount
    };
  };

  // Prepare transaction amounts with fee adjustments (for frontend validation)
  const prepareTransactionAmounts = (promptAmount: number, isBuy: boolean = true) => {
    if (isBuy) {
      // For buying, user pays the full amount + fees
      const fees = calculateTransactionFees(promptAmount);
      return {
        totalAmount: promptAmount,
        netTradeAmount: fees.netAmount,
        fees: fees,
        displayAmount: promptAmount
      };
    } else {
      // For selling, user receives amount - fees
      const fees = calculateTransactionFees(promptAmount);
      return {
        totalAmount: promptAmount,
        netReceiveAmount: fees.netAmount,
        fees: fees,
        displayAmount: fees.netAmount
      };
    }
  };

  // Utility function for Etherscan links
  const getEtherscanLink = (txHash: string) => {
    const baseUrl = baseSepolia.id === 84532 ? 'https://sepolia.basescan.org' : 'https://etherscan.io';
    return `${baseUrl}/tx/${txHash}`;
  };

  // Enhanced reset functions that clear all state
  const resetBuyState = (clearForm = false) => {
    setBuyTxState('idle');
    setBuyTxHash(undefined);
    setBuyTxMeta(null);
    // Form clearing is handled by UI components
  };

  const resetSellState = (clearForm = false) => {
    setSellTxState('idle');
    setSellTxHash(undefined);
    setSellTxMeta(null);
    // Form clearing is handled by UI components
  };

  // Timeout handling for stuck transactions
  useEffect(() => {
    if (buyTxHash && buyTxState === 'pending') {
      const timeoutId = setTimeout(() => {
        if (buyTxState === 'pending' && isBuyConfirming) {
          toast({
            title: "⏰ Transaction Taking Longer Than Expected",
            description: `Transaction may be stuck. View on Etherscan: ${getEtherscanLink(buyTxHash)}`,
            variant: "default",
          });
        }
      }, 120_000); // 2 minutes warning

      return () => clearTimeout(timeoutId);
    }
  }, [buyTxHash, buyTxState, isBuyConfirming, toast]);

  useEffect(() => {
    if (sellTxHash && sellTxState === 'pending') {
      const timeoutId = setTimeout(() => {
        if (sellTxState === 'pending' && isSellConfirming) {
          toast({
            title: "⏰ Transaction Taking Longer Than Expected", 
            description: `Transaction may be stuck. View on Etherscan: ${getEtherscanLink(sellTxHash)}`,
            variant: "default",
          });
        }
      }, 120_000); // 2 minutes warning

      return () => clearTimeout(timeoutId);
    }
  }, [sellTxHash, sellTxState, isSellConfirming, toast]);

  // Enhanced transaction confirmation with detailed logging
  useEffect(() => {
    if (buyTxHash && !isBuyConfirming && buyTxState === 'pending' && buyReceipt) {
      setBuyTxState('confirmed');
      
      const txHashShort = `${buyTxHash.slice(0, 8)}...${buyTxHash.slice(-6)}`;
      const etherscanLink = getEtherscanLink(buyTxHash);
      
      // TODO: Parse actual amounts from transaction logs for accurate comparison
      const estimatedTokens = buyTxMeta?.expectedTokens.toFixed(4) || "Unknown";
      const promptAmount = buyTxMeta?.promptAmount || "Unknown";
      
      // Debug logging for slippage analysis
      console.log('🔍 Buy Transaction Analysis:', {
        txHash: buyTxHash,
        expected: {
          tokens: buyTxMeta?.expectedTokens,
          promptAmount: buyTxMeta?.promptAmount,
          slippage: buyTxMeta?.slippage + '%'
        },
        // actual: parseTransactionLogs(buyReceipt.logs), // TODO: Implement log parsing
        slippageProtectionUsed: buyTxMeta?.slippage,
        timestamp: new Date().toISOString(),
        gasUsed: buyReceipt.gasUsed?.toString(),
        effectiveGasPrice: buyReceipt.effectiveGasPrice?.toString()
      });
      
      toast({
        title: "✅ Purchase Confirmed",
        description: `Bought ~${estimatedTokens} tokens for ${promptAmount} PROMPT. Tx: ${txHashShort}. Click to view on Etherscan.`,
      });
      
      refetchMetrics();
      resetBuyState(true);
    }
  }, [buyTxHash, isBuyConfirming, buyTxState, buyReceipt, buyTxMeta, toast, refetchMetrics]);

  useEffect(() => {
    if (sellTxHash && !isSellConfirming && sellTxState === 'pending' && sellReceipt) {
      setSellTxState('confirmed');
      
      const txHashShort = `${sellTxHash.slice(0, 8)}...${sellTxHash.slice(-6)}`;
      const etherscanLink = getEtherscanLink(sellTxHash);
      
      // Debug logging for slippage analysis
      console.log('🔍 Sell Transaction Analysis:', {
        txHash: sellTxHash,
        expected: {
          promptReturn: sellTxMeta?.expectedPrompt,
          tokenAmount: sellTxMeta?.tokenAmount,
          slippage: sellTxMeta?.slippage + '%'
        },
        // actual: parseTransactionLogs(sellReceipt.logs), // TODO: Implement log parsing
        slippageProtectionUsed: sellTxMeta?.slippage,
        timestamp: new Date().toISOString(),
        gasUsed: sellReceipt.gasUsed?.toString(),
        effectiveGasPrice: sellReceipt.effectiveGasPrice?.toString()
      });
      
      // Calculate actual amounts
      const estimatedPrompt = sellTxMeta?.expectedPrompt.toFixed(4) || "Unknown";
      const tokenAmount = sellTxMeta?.tokenAmount || "Unknown";
      
      toast({
        title: "✅ Sale Confirmed",
        description: `Sold ${tokenAmount} tokens for ~${estimatedPrompt} PROMPT. Tx: ${txHashShort}. Click to view on Etherscan.`,
      });
      
      refetchMetrics();
      resetSellState(true);
    }
  }, [sellTxHash, isSellConfirming, sellTxState, sellReceipt, sellTxMeta, toast, refetchMetrics]);

  const buyAgentTokens = async (promptAmount: string, slippage: string = "2", agentData?: any) => {
    if (!address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to buy tokens.",
        variant: "destructive",
      });
      return;
    }

    const promptAmountFloat = parseFloat(promptAmount);
    
    // Check if this is a pre-graduated token (bonding curve)
    const isPreGraduated = !tokenAddress || tokenAddress === undefined;
    
    if (isPreGraduated) {
      // Handle pre-graduated token via transactional database operation
      try {
        setBuyTxState('pending');
        
        // Store transaction metadata
        setBuyTxMeta({
          promptAmount,
          expectedTokens: 0, // Will be calculated by the function
          slippage,
        });
        
        // Call the edge function for transactional trade execution
        const { data, error } = await supabase.functions.invoke('execute-trade', {
          body: {
            agentId: agentId,
            userId: address,
            promptAmount: promptAmountFloat,
            tradeType: 'buy',
            expectedPrice: agentData?.current_price || 0,
            slippage: parseFloat(slippage)
          }
        });

        if (error) {
          throw new Error(error.message || 'Failed to execute trade');
        }

        if (!data.success) {
          throw new Error(data.error || 'Trade execution failed');
        }

        setBuyTxState('confirmed');
        
        // Update metadata with actual results
        setBuyTxMeta(prev => prev ? {
          ...prev,
          expectedTokens: data.data[0]?.token_amount || 0
        } : null);
        
        toast({
          title: "✅ Purchase Successful",
          description: `Bought ${data.data[0]?.token_amount?.toFixed(4) || 0} ${agentData?.symbol || 'tokens'} for ${promptAmountFloat} PROMPT`,
        });
        
        // Trigger refetch of data
        if (refetchMetrics) refetchMetrics();
        resetBuyState(true);
        
      } catch (error: any) {
        setBuyTxState('error');
        console.error('Bonding curve trade error:', error);
        
        // Show specific error messages for better UX
        let errorMessage = "Failed to complete trade";
        if (error.message.includes('Insufficient PROMPT balance')) {
          errorMessage = "Insufficient PROMPT balance. Please check your balance and try again.";
        } else if (error.message.includes('Agent not found')) {
          errorMessage = "Agent not found. Please refresh the page and try again.";
        } else {
          errorMessage = error.message || errorMessage;
        }
        
        toast({
          title: "Purchase Failed",
          description: errorMessage,
          variant: "destructive",
        });
        resetBuyState();
      }
      return;
    }

    // Original smart contract logic for graduated tokens
    if (!metrics) {
      toast({
        title: "⚠️ Slippage Protection Disabled",
        description: "Token metrics not loaded. Proceeding without slippage protection.",
        variant: "destructive",
      });
      return;
    }

    // 🔐 PRODUCTION SAFETY: Hard block on real contract trading in test mode
    // Note: useAppMode() must be called at component level, not here
    // This check is implemented at the UI layer in TradingInterface

    // Show contract upgrade warning
    toast({
      title: "ℹ️ Slippage Protection",
      description: "Note: Slippage protection only applies once upgraded contracts are deployed.",
      variant: "default",
    });

    try {
      setBuyTxState('pending');
      
      const slippagePct = Number(slippage) / 100;
      
      // Calculate expected tokens from bonding curve
      const expectedResult = calculateTokensFromPrompt(metrics.promptRaised, promptAmountFloat);
      const expectedTokens = expectedResult.tokenAmount;
      
      // Apply slippage protection
      const minTokensOut = expectedTokens * (1 - slippagePct);
      
      const promptAmountWei = parseEther(promptAmount);
      const minTokensOutWei = parseEther(minTokensOut.toString());
      
      // Store transaction metadata for enhanced success toast
      setBuyTxMeta({
        promptAmount,
        expectedTokens,
        slippage,
      });
      
      writeBuy({
        address: tokenAddress as `0x${string}`,
        abi: AGENT_TOKEN_ABI,
        functionName: 'buyTokens',
        args: [promptAmountWei, minTokensOutWei],
        account: address,
        chain: baseSepolia,
      }, {
        onSuccess: (txHash) => {
          setBuyTxHash(txHash);
          toast({
            title: "🚀 Transaction Sent",
            description: `Buying ~${expectedTokens.toFixed(4)} tokens with ${slippage}% slippage protection. Waiting for confirmation...`,
          });
        },
        onError: (error) => {
          setBuyTxState('error');
          toast({
            title: "Purchase Failed",
            description: error.message || "Failed to purchase tokens",
            variant: "destructive",
          });
          resetBuyState(true);
        }
      });
      
    } catch (error: any) {
      setBuyTxState('error');
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase tokens",
        variant: "destructive",
      });
      resetBuyState();
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
      setSellTxState('pending');
      
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
      
      // Store transaction metadata for enhanced success toast
      setSellTxMeta({
        tokenAmount,
        expectedPrompt,
        slippage,
      });
      
      writeSell({
        address: tokenAddress as `0x${string}`,
        abi: AGENT_TOKEN_ABI,
        functionName: 'sellTokens',
        args: [tokenAmountWei, minPromptOutWei],
        account: address,
        chain: baseSepolia,
      }, {
        onSuccess: (txHash) => {
          setSellTxHash(txHash);
          toast({
            title: "🚀 Transaction Sent",
            description: `Selling ${tokenAmount} tokens expecting ~${expectedPrompt.toFixed(4)} PROMPT with ${slippage}% slippage protection. Waiting for confirmation...`,
          });
        },
        onError: (error) => {
          setSellTxState('error');
          toast({
            title: "Sale Failed",
            description: error.message || "Failed to sell tokens",
            variant: "destructive",
          });
          resetSellState(true);
        }
      });
      
    } catch (error: any) {
      setSellTxState('error');
      toast({
        title: "Sale Failed",
        description: error.message || "Failed to sell tokens",
        variant: "destructive",
      });
      resetSellState();
    }
  };

  return {
    metrics,
    buyAgentTokens,
    sellAgentTokens,
    // Transaction states for UI components
    buyTxState,
    sellTxState,
    isBuying: buyTxState === 'pending' || isBuyConfirming,
    isSelling: sellTxState === 'pending' || isSellConfirming,
    // Additional state helpers
    resetBuyState,
    resetSellState,
    refetchMetrics,
    // Fee configuration and calculations
    feeConfig,
    calculateTransactionFees,
    prepareTransactionAmounts,
  };
}