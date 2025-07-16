import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarketData {
  symbol: string;
  price: number;
  volume24h: number;
  change24h: number;
  rsi: number;
  macd: number;
  movingAverage20: number;
  timestamp: number;
}

interface TradingSignal {
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  reason: string;
  suggestedAmount: number;
  stopLoss?: number;
  takeProfit?: number;
}

interface TradeExecution {
  success: boolean;
  transactionHash?: string;
  error?: string;
  executedPrice?: number;
  slippage?: number;
  gasCost?: number;
}

// Real market data fetcher using CoinGecko API (free tier)
async function fetchRealMarketData(symbol: string): Promise<MarketData> {
  const coinGeckoId = symbol.toLowerCase().replace('/', '-').replace('usd', 'usd');
  
  try {
    // Fetch current price and 24h data
    const priceResponse = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
    );
    const priceData = await priceResponse.json();
    
    // Fetch historical data for technical indicators
    const historyResponse = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinGeckoId}/market_chart?vs_currency=usd&days=30&interval=daily`
    );
    const historyData = await historyResponse.json();
    
    const prices = historyData.prices.map((p: [number, number]) => p[1]);
    const currentPrice = Object.values(priceData)[0] as any;
    
    // Calculate technical indicators
    const rsi = calculateRSI(prices);
    const macd = calculateMACD(prices);
    const ma20 = calculateMovingAverage(prices, 20);
    
    return {
      symbol,
      price: currentPrice.usd,
      volume24h: currentPrice.usd_24h_vol || 0,
      change24h: currentPrice.usd_24h_change || 0,
      rsi,
      macd,
      movingAverage20: ma20,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw new Error(`Failed to fetch market data for ${symbol}`);
  }
}

// Technical indicator calculations
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50; // Default neutral RSI
  
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateMACD(prices: number[]): number {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  return ema12 - ema26;
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  const multiplier = 2 / (period + 1);
  let ema = prices[0];
  
  for (let i = 1; i < prices.length; i++) {
    ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
  }
  
  return ema;
}

function calculateMovingAverage(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const recent = prices.slice(-period);
  return recent.reduce((a, b) => a + b, 0) / period;
}

// Strategy implementations
async function executeDCAStrategy(agentId: string, config: any, marketData: MarketData): Promise<TradingSignal> {
  const { amount = 100, interval = '1h' } = config.strategyParameters || {};
  
  // DCA always buys regardless of price
  return {
    action: 'buy',
    confidence: 0.8,
    reason: `DCA strategy: Regular purchase of $${amount}`,
    suggestedAmount: amount
  };
}

async function executeMomentumStrategy(agentId: string, config: any, marketData: MarketData): Promise<TradingSignal> {
  const { momentumThreshold = 0.05 } = config.strategyParameters || {};
  
  const momentum = marketData.change24h / 100;
  
  if (momentum > momentumThreshold) {
    return {
      action: 'buy',
      confidence: Math.min(momentum * 10, 0.9),
      reason: `Strong upward momentum: ${marketData.change24h.toFixed(2)}%`,
      suggestedAmount: config.maxPositionSize * 0.5,
      stopLoss: marketData.price * (1 - config.stopLossPercentage / 100),
      takeProfit: marketData.price * (1 + config.takeProfitPercentage / 100)
    };
  } else if (momentum < -momentumThreshold) {
    return {
      action: 'sell',
      confidence: Math.min(Math.abs(momentum) * 10, 0.9),
      reason: `Strong downward momentum: ${marketData.change24h.toFixed(2)}%`,
      suggestedAmount: config.maxPositionSize * 0.3
    };
  }
  
  return {
    action: 'hold',
    confidence: 0.6,
    reason: 'Momentum below threshold',
    suggestedAmount: 0
  };
}

async function executeMeanReversionStrategy(agentId: string, config: any, marketData: MarketData): Promise<TradingSignal> {
  const { deviationThreshold = 2 } = config.strategyParameters || {};
  
  const currentPrice = marketData.price;
  const ma20 = marketData.movingAverage20;
  const deviation = (currentPrice - ma20) / ma20;
  
  if (deviation < -deviationThreshold / 100) {
    return {
      action: 'buy',
      confidence: 0.8,
      reason: `Price ${Math.abs(deviation * 100).toFixed(1)}% below MA20, potential reversion`,
      suggestedAmount: config.maxPositionSize * 0.6,
      takeProfit: ma20
    };
  } else if (deviation > deviationThreshold / 100) {
    return {
      action: 'sell',
      confidence: 0.8,
      reason: `Price ${(deviation * 100).toFixed(1)}% above MA20, potential reversion`,
      suggestedAmount: config.maxPositionSize * 0.4
    };
  }
  
  return {
    action: 'hold',
    confidence: 0.7,
    reason: 'Price within normal range of MA20',
    suggestedAmount: 0
  };
}

async function executeGridStrategy(agentId: string, config: any, marketData: MarketData): Promise<TradingSignal> {
  const { gridSize = 0.02, gridLevels = 5 } = config.strategyParameters || {};
  
  // Simplified grid logic - in production would track open grid orders
  const currentPrice = marketData.price;
  const gridSpacing = currentPrice * gridSize;
  
  // Check if price moved enough to trigger grid action
  const rsi = marketData.rsi;
  
  if (rsi < 30) {
    return {
      action: 'buy',
      confidence: 0.75,
      reason: `Grid strategy: RSI oversold (${rsi.toFixed(1)}), buying at grid level`,
      suggestedAmount: config.maxPositionSize / gridLevels,
      takeProfit: currentPrice * (1 + gridSize)
    };
  } else if (rsi > 70) {
    return {
      action: 'sell',
      confidence: 0.75,
      reason: `Grid strategy: RSI overbought (${rsi.toFixed(1)}), selling at grid level`,
      suggestedAmount: config.maxPositionSize / gridLevels
    };
  }
  
  return {
    action: 'hold',
    confidence: 0.6,
    reason: 'Grid strategy: Waiting for RSI trigger',
    suggestedAmount: 0
  };
}

// Execute trade via 1inch DEX (testnet mode for safety)
async function executeTradeVia1inch(signal: TradingSignal, pair: string, agentId: string): Promise<TradeExecution> {
  const oneInchApiKey = Deno.env.get('ONEINCH_API_KEY');
  
  if (!oneInchApiKey) {
    return {
      success: false,
      error: 'No 1inch API key configured'
    };
  }
  
  try {
    // For now, simulate the trade execution
    // In production, this would call 1inch API with actual wallet integration
    console.log(`Simulating ${signal.action} trade for ${pair} via 1inch`);
    
    // Log the trade intention
    await supabase.from('agent_activities').insert({
      agent_id: agentId,
      activity_type: 'trade_execution',
      title: `${signal.action.toUpperCase()} ${pair}`,
      description: `Executed ${signal.action} order via 1inch DEX`,
      metadata: {
        signal,
        pair,
        exchange: '1inch',
        mode: 'testnet'
      },
      status: 'completed',
      result: {
        success: true,
        simulated: true,
        executedPrice: signal.suggestedAmount,
        reason: signal.reason
      }
    });
    
    return {
      success: true,
      transactionHash: 'simulated_' + Date.now(),
      executedPrice: signal.suggestedAmount,
      slippage: 0.1,
      gasCost: 25
    };
  } catch (error) {
    console.error('Trade execution failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Main trading engine
async function runTradingEngine(agentId: string) {
  try {
    // Fetch agent configuration
    const { data: configs } = await supabase
      .from('agent_configurations')
      .select('*')
      .eq('agent_id', agentId);
    
    const tradingConfig = configs?.find(c => c.category === 'trading');
    
    if (!tradingConfig?.configuration) {
      throw new Error('No trading configuration found for agent');
    }
    
    const config = tradingConfig.configuration;
    const strategy = config.tradingStrategy;
    const pairs = config.tradingPairs || ['ETH/USD'];
    
    for (const pair of pairs.slice(0, 2)) { // Limit to 2 pairs per cycle
      try {
        // Get real market data
        const marketData = await fetchRealMarketData(pair.replace('/', ''));
        
        // Log market analysis
        await supabase.from('agent_activities').insert({
          agent_id: agentId,
          activity_type: 'market_analysis',
          title: `${pair} Market Analysis`,
          description: `Analyzed real market data for ${pair}`,
          metadata: {
            marketData,
            technicalIndicators: {
              rsi: marketData.rsi,
              macd: marketData.macd,
              ma20: marketData.movingAverage20
            }
          },
          status: 'completed',
          result: {
            price: marketData.price,
            volume: marketData.volume24h,
            change24h: marketData.change24h
          }
        });
        
        // Generate trading signal based on strategy
        let signal: TradingSignal;
        
        switch (strategy) {
          case 'dca':
            signal = await executeDCAStrategy(agentId, config, marketData);
            break;
          case 'momentum':
            signal = await executeMomentumStrategy(agentId, config, marketData);
            break;
          case 'mean_reversion':
            signal = await executeMeanReversionStrategy(agentId, config, marketData);
            break;
          case 'grid':
            signal = await executeGridStrategy(agentId, config, marketData);
            break;
          default:
            signal = await executeMomentumStrategy(agentId, config, marketData);
        }
        
        // Log trading decision
        await supabase.from('agent_activities').insert({
          agent_id: agentId,
          activity_type: 'trading_decision',
          title: `${strategy.toUpperCase()} Strategy Decision`,
          description: signal.reason,
          metadata: {
            strategy,
            signal,
            pair,
            confidence: signal.confidence
          },
          status: 'completed',
          result: {
            action: signal.action,
            amount: signal.suggestedAmount,
            confidence: signal.confidence
          }
        });
        
        // Execute trade if signal is strong enough and not hold
        if (signal.action !== 'hold' && signal.confidence > 0.7) {
          const execution = await executeTradeVia1inch(signal, pair, agentId);
          
          if (execution.success) {
            console.log(`Trade executed successfully for ${pair}:`, execution);
          } else {
            console.error(`Trade execution failed for ${pair}:`, execution.error);
          }
        }
        
        // Small delay between pairs
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (pairError) {
        console.error(`Error processing pair ${pair}:`, pairError);
        
        await supabase.from('agent_activities').insert({
          agent_id: agentId,
          activity_type: 'trading_error',
          title: `${pair} Trading Error`,
          description: `Failed to process trading for ${pair}: ${pairError.message}`,
          status: 'failed',
          result: { error: pairError.message }
        });
      }
    }
    
  } catch (error) {
    console.error('Trading engine error:', error);
    
    await supabase.from('agent_activities').insert({
      agent_id: agentId,
      activity_type: 'system_error',
      title: 'Trading Engine Error',
      description: `Trading engine encountered an error: ${error.message}`,
      status: 'failed',
      result: { error: error.message }
    });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, action } = await req.json();

    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    switch (action) {
      case 'run_trading_cycle':
        await runTradingEngine(agentId);
        return new Response(
          JSON.stringify({ success: true, message: 'Trading cycle completed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      case 'get_market_data':
        const { symbol } = await req.json();
        const marketData = await fetchRealMarketData(symbol);
        return new Response(
          JSON.stringify({ success: true, data: marketData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Trading engine request failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});