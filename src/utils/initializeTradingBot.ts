import { supabase } from '@/integrations/supabase/client';

export async function initializeTradingBot(agentId: string) {
  const tradingConfig = {
    tradingStrategy: "momentum",
    riskLevel: "moderate", 
    maxPositionSize: 1000,
    stopLossPercentage: 5,
    takeProfitPercentage: 10,
    tradingPairs: ["ETH/USD", "BTC/USD"],
    exchanges: ["1inch", "Uniswap"],
    backtestingEnabled: true,
    paperTradingEnabled: true,
    realTradingEnabled: false,
    maxDailyTrades: 5,
    portfolioAllocation: 20,
    strategyParameters: {
      lookbackPeriod: "4h",
      momentumThreshold: 0.05,
      riskMultiplier: 1.2
    },
    riskParameters: {
      maxPositionSize: 0.1,
      stopLoss: 0.05,
      takeProfit: 0.1,
      maxDailyTrades: 5
    }
  };

  try {
    const { data, error } = await supabase.functions.invoke('save-trading-config', {
      body: {
        agentId,
        configuration: tradingConfig
      }
    });

    if (error) {
      throw error;
    }

    console.log('Trading bot initialized successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to initialize trading bot:', error);
    throw error;
  }
}