import { useState, useEffect } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { toast } from 'sonner';
import {
  calculateBuyReturn,
  calculateSellReturn,
  calculateCurrentPrice,
  canGraduate,
  getGraduationProgress,
  type BondingCurveV5Config,
  type BondingCurveV5State,
} from '@/lib/bondingCurveV5';

// Get deployed contract addresses from localStorage (set by deployment component)
const getBondingCurveAddress = () => 
  typeof window !== 'undefined' 
    ? localStorage.getItem('BONDING_CURVE_V5_ADDRESS') || '0x0000000000000000000000000000000000000000'
    : '0x0000000000000000000000000000000000000000';

const getPromptTokenAddress = () =>
  typeof window !== 'undefined'
    ? localStorage.getItem('PROMPT_TOKEN_ADDRESS') || '0x0000000000000000000000000000000000000000'
    : '0x0000000000000000000000000000000000000000';

// Simplified ABIs for the hook
const BONDING_CURVE_V5_ABI = [
  {
    name: 'buy',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'bytes32' },
      { name: 'promptIn', type: 'uint256' },
      { name: 'minTokensOut', type: 'uint256' },
    ],
    outputs: [{ name: 'tokensOut', type: 'uint256' }],
  },
  {
    name: 'sell',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'bytes32' },
      { name: 'tokensIn', type: 'uint256' },
      { name: 'minPromptOut', type: 'uint256' },
    ],
    outputs: [{ name: 'promptOut', type: 'uint256' }],
  },
  {
    name: 'getCurrentPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'agentStates',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'bytes32' }],
    outputs: [
      { name: 'tokensSold', type: 'uint256' },
      { name: 'promptReserves', type: 'uint256' },
      { name: 'phase', type: 'uint8' },
    ],
  },
] as const;

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

interface UseBondingCurveV5Props {
  agentId: string;
  config: BondingCurveV5Config;
}

export function useBondingCurveV5({ agentId, config }: UseBondingCurveV5Props) {
  const [state, setState] = useState<BondingCurveV5State>({
    tokensSold: 0,
    promptReserves: 0,
    phase: 'active',
  });

  const { writeContract, data: txHash } = useWriteContract();
  const { isLoading: isTxPending } = useWaitForTransactionReceipt({ hash: txHash });

  // Read current state from contract
  const { data: contractState, refetch: refetchState } = useReadContract({
    address: getBondingCurveAddress() as `0x${string}`,
    abi: BONDING_CURVE_V5_ABI,
    functionName: 'agentStates',
    args: [agentId as `0x${string}`],
  });

  // Read current price from contract
  const { data: currentPrice } = useReadContract({
    address: getBondingCurveAddress() as `0x${string}`,
    abi: BONDING_CURVE_V5_ABI,
    functionName: 'getCurrentPrice',
    args: [agentId as `0x${string}`],
  });

  // Update local state when contract state changes
  useEffect(() => {
    if (contractState) {
      setState({
        tokensSold: Number(formatEther(contractState[0])),
        promptReserves: Number(formatEther(contractState[1])),
        phase: contractState[2] === 0 ? 'active' : 'graduated',
      });
    }
  }, [contractState]);

  /**
   * Buy tokens with PROMPT
   */
  const buyTokens = (promptAmount: number, slippageBps: number = 100) => {
    try {
      const { tokensOut } = calculateBuyReturn(config, state, promptAmount);
      const minTokensOut = tokensOut * (1 - slippageBps / 10000);

      writeContract({
        address: getBondingCurveAddress() as `0x${string}`,
        abi: BONDING_CURVE_V5_ABI,
        functionName: 'buy',
        args: [
          agentId as `0x${string}`,
          parseEther(promptAmount.toString()),
          parseEther(minTokensOut.toString()),
        ],
      } as any);

      toast.success('Buy transaction submitted');
    } catch (error: any) {
      console.error('Buy failed:', error);
      toast.error(error.message || 'Buy transaction failed');
    }
  };

  /**
   * Sell tokens for PROMPT
   */
  const sellTokens = (tokenAmount: number, slippageBps: number = 100) => {
    try {
      const { promptNet } = calculateSellReturn(config, state, tokenAmount);
      const minPromptOut = promptNet * (1 - slippageBps / 10000);

      writeContract({
        address: getBondingCurveAddress() as `0x${string}`,
        abi: BONDING_CURVE_V5_ABI,
        functionName: 'sell',
        args: [
          agentId as `0x${string}`,
          parseEther(tokenAmount.toString()),
          parseEther(minPromptOut.toString()),
        ],
      } as any);

      toast.success('Sell transaction submitted');
    } catch (error: any) {
      console.error('Sell failed:', error);
      toast.error(error.message || 'Sell transaction failed');
    }
  };

  /**
   * Approve PROMPT tokens for trading
   */
  const approvePrompt = (amount: number) => {
    try {
      writeContract({
        address: getPromptTokenAddress() as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [getBondingCurveAddress() as `0x${string}`, parseEther(amount.toString())],
      } as any);

      toast.success('Approval submitted');
    } catch (error: any) {
      console.error('Approval failed:', error);
      toast.error(error.message || 'Approval failed');
    }
  };

  return {
    // State
    state,
    currentPrice: currentPrice ? Number(formatEther(currentPrice)) : calculateCurrentPrice(config, state.tokensSold),
    canGraduate: canGraduate(config, state),
    graduationProgress: getGraduationProgress(config, state),
    
    // Actions
    buyTokens,
    sellTokens,
    approvePrompt,
    refetchState,
    
    // Status
    isLoading: isTxPending,
  };
}
