import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface TradeResult {
  success: boolean;
  tokenAmount?: number;
  newPrice?: number;
  newPromptRaised?: number;
  message?: string;
  error?: string;
}

interface FeeBreakdown {
  totalFees: number;
  creatorFee: number;
  platformFee: number;
  netAmount: number;
}

interface AgentTokenData {
  balance: number;
  totalInvested: number;
  averageBuyPrice: number;
  unrealizedPnL: number;
  realizedPnL: number;
}

export function useAgentTokens(tokenAddress?: string) {
  const [loading, setLoading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [agentTokenData, setAgentTokenData] = useState<AgentTokenData | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fee configuration (matching virtuals.io: 1% total, 70%/30% split)
  const feeConfig = {
    feePercent: 0.01,      // 1% total trading fee
    creatorSplit: 0.7,     // 70% goes to agent creator
    platformSplit: 0.3     // 30% goes to platform
  };

  const calculateFees = (amount: number): FeeBreakdown => {
    const totalFees = amount * feeConfig.feePercent;
    const creatorFee = totalFees * feeConfig.creatorSplit;
    const platformFee = totalFees * feeConfig.platformSplit;
    const netAmount = amount - totalFees;

    return {
      totalFees,
      creatorFee,
      platformFee,
      netAmount
    };
  };

  const fetchTokenBalance = async (agentId: string) => {
    if (!user?.id || !agentId) return;

    try {
      const { data, error } = await supabase
        .from('agent_token_holders')
        .select('token_balance, total_invested, average_buy_price')
        .eq('agent_id', agentId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching token balance:', error);
        return;
      }

      if (data) {
        setTokenBalance(data.token_balance || 0);
        setAgentTokenData({
          balance: data.token_balance || 0,
          totalInvested: data.total_invested || 0,
          averageBuyPrice: data.average_buy_price || 0,
          unrealizedPnL: 0, // Calculate based on current price
          realizedPnL: 0    // Calculate from trade history
        });
      } else {
        setTokenBalance(0);
        setAgentTokenData(null);
      }
    } catch (error) {
      console.error('Token balance fetch error:', error);
    }
  };

  const buyAgentTokens = async (promptAmount: string, slippage: string, agent: any) => {
    console.log('🔍 buyAgentTokens called with:', {
      promptAmount,
      slippage,
      agent: agent.name,
      agentId: agent.id,
      userId: user?.id
    });

    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    if (!agent?.id) {
      throw new Error('Agent ID not provided');
    }

    const promptAmountNum = parseFloat(promptAmount);
    if (isNaN(promptAmountNum) || promptAmountNum <= 0) {
      throw new Error('Invalid prompt amount');
    }

    console.log('🚀 Calling execute-trade with:', {
      agentId: agent.id,
      userId: user.id,
      promptAmount: promptAmountNum,
      tradeType: 'buy',
      expectedPrice: agent.current_price || 30,
      slippage: parseFloat(slippage)
    });

    try {
      // Use execute-trade (database RPC) for bonding curve trades
      const { data, error } = await supabase.functions.invoke('execute-trade', {
        body: {
          agentId: agent.id,
          userId: user.id,
          promptAmount: promptAmountNum,
          tradeType: 'buy',
          expectedPrice: agent.current_price || 0,
          slippage: parseFloat(slippage)
        }
      });

      console.log('📊 Edge function response:', { data, error });

      if (error) {
        console.error('🚨 Execute-trade error:', error);
        throw new Error(error.message || 'Trade execution failed');
      }

      if (!data?.success) {
        console.error('🚨 Trade failed:', data);
        throw new Error(data?.error || 'Trade was not successful');
      }

      console.log('✅ Trade successful:', data);
      return data;
    } catch (error) {
      console.error('🚨 buyAgentTokens error:', error);
      throw error;
    }
  };

  const sellAgentTokens = async (tokenAmount: string, slippage: string, agent: any) => {
    console.log('🔍 sellAgentTokens called with:', {
      tokenAmount,
      slippage,
      agent: agent.name,
      agentId: agent.id,
      userId: user?.id
    });

    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    if (!agent?.id) {
      throw new Error('Agent ID not provided');
    }

    const tokenAmountNum = parseFloat(tokenAmount);
    if (isNaN(tokenAmountNum) || tokenAmountNum <= 0) {
      throw new Error('Invalid token amount');
    }

    console.log('🚀 Calling execute-trade for sell with:', {
      agentId: agent.id,
      userId: user.id,
      tokenAmount: tokenAmountNum,
      tradeType: 'sell',
      slippage: parseFloat(slippage)
    });

    try {
      // Use execute-trade (database RPC) for bonding curve trades
      const { data, error } = await supabase.functions.invoke('execute-trade', {
        body: {
          agentId: agent.id,
          userId: user.id,
          tokenAmount: tokenAmountNum,
          tradeType: 'sell',
          expectedPrice: agent.current_price || 0,
          slippage: parseFloat(slippage)
        }
      });

      console.log('📊 Sell edge function response:', { data, error });

      if (error) {
        console.error('🚨 Execute-trade sell error:', error);
        throw new Error(error.message || 'Sell execution failed');
      }

      if (!data?.success) {
        console.error('🚨 Sell failed:', data);
        throw new Error(data?.error || 'Sell was not successful');
      }

      console.log('✅ Sell successful:', data);
      return data;
    } catch (error) {
      console.error('🚨 sellAgentTokens error:', error);
      throw error;
    }
  };

  const getEstimatedGas = async (amount: string, tradeType: 'buy' | 'sell') => {
    // Simulate gas estimation for bonding curve trades
    return {
      gasLimit: '150000',
      gasPrice: '20000000000', // 20 gwei
      estimatedCost: '0.003' // ETH
    };
  };

  const getTokenMetrics = async (agentId: string) => {
    if (!agentId) return null;

    try {
      const { data, error } = await supabase
        .from('agents')
        .select('current_price, market_cap, volume_24h, token_holders, prompt_raised')
        .eq('id', agentId)
        .single();

      if (error) throw error;

      return {
        price: data.current_price,
        marketCap: data.market_cap,
        volume24h: data.volume_24h,
        holders: data.token_holders,
        promptRaised: data.prompt_raised
      };
    } catch (error) {
      console.error('Error fetching token metrics:', error);
      return null;
    }
  };

  return {
    // Core trading functions
    buyAgentTokens,
    sellAgentTokens,
    
    // Balance and data
    tokenBalance,
    agentTokenData,
    fetchTokenBalance,
    
    // Fee calculations
    calculateFees,
    feeConfig,
    
    // Utility functions
    getEstimatedGas,
    getTokenMetrics,
    
    // State
    loading,
    setLoading
  };
}
