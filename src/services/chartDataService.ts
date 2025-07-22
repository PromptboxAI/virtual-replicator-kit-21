import { supabase } from '@/integrations/supabase/client';
import { isAgentGraduated } from '@/lib/bondingCurve';

export interface OHLCVData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tradeCount: number;
}

export interface PriceImpactData {
  currentPrice: number;
  impactPrice: number;
  priceImpactPercent: number;
  estimatedTokens: number;
}

export type ChartInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export class ChartDataService {
  
  static async getOHLCVData(
    agentId: string,
    interval: ChartInterval = '1m',
    startTime?: Date,
    endTime?: Date
  ): Promise<OHLCVData[]> {
    try {
      // For now, return mock data since we need to implement the RPC function properly
      console.log('Mock OHLCV data for agent:', agentId, 'interval:', interval);
      
      // Generate some sample OHLCV data
      const mockData: OHLCVData[] = [];
      const now = Date.now();
      
      for (let i = 0; i < 100; i++) {
        const timestamp = now - (i * 60 * 1000); // 1 minute intervals
        const basePrice = 30 + Math.sin(i * 0.1) * 5;
        const open = basePrice + (Math.random() - 0.5) * 2;
        const close = open + (Math.random() - 0.5) * 4;
        const high = Math.max(open, close) + Math.random() * 2;
        const low = Math.min(open, close) - Math.random() * 2;
        
        mockData.unshift({
          time: Math.floor(timestamp / 1000),
          open,
          high,
          low,
          close,
          volume: Math.random() * 1000,
          tradeCount: Math.floor(Math.random() * 10)
        });
      }
      
      return mockData;
    } catch (error) {
      console.error('Error in getOHLCVData:', error);
      return [];
    }
  }

  static async simulatePriceImpact(
    agentId: string,
    promptAmount: number,
    tradeType: 'buy' | 'sell' = 'buy'
  ): Promise<PriceImpactData | null> {
    try {
      // Mock price impact calculation for now
      console.log('Mock price impact simulation for agent:', agentId, 'amount:', promptAmount);
      
      const currentPrice = 30 + Math.random() * 10;
      const impactPercent = (promptAmount / 1000) * 2; // Simple impact calculation
      const impactPrice = tradeType === 'buy' 
        ? currentPrice * (1 + impactPercent / 100)
        : currentPrice * (1 - impactPercent / 100);
      
      return {
        currentPrice,
        impactPrice,
        priceImpactPercent: impactPercent,
        estimatedTokens: promptAmount / currentPrice
      };
    } catch (error) {
      console.error('Error in simulatePriceImpact:', error);
      return null;
    }
  }

  static async getDEXData(
    tokenAddress: string,
    interval: ChartInterval = '1h'
  ): Promise<OHLCVData[]> {
    try {
      // This would integrate with DexScreener or Uniswap API
      // For now, return empty array as placeholder
      console.log('DEX data integration not yet implemented for:', tokenAddress);
      return [];
    } catch (error) {
      console.error('Error fetching DEX data:', error);
      return [];
    }
  }

  static async getChartData(
    agentId: string,
    interval: ChartInterval = '1m',
    startTime?: Date,
    endTime?: Date
  ): Promise<{ data: OHLCVData[]; isGraduated: boolean }> {
    try {
      // Get agent data to check graduation status
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('prompt_raised, token_address, token_graduated')
        .eq('id', agentId)
        .single();

      if (agentError) {
        console.error('Error fetching agent:', agentError);
        return { data: [], isGraduated: false };
      }

      const graduated = isAgentGraduated(agent.prompt_raised || 0) || agent.token_graduated;

      if (graduated && agent.token_address) {
        // Use DEX data for graduated tokens
        const dexData = await this.getDEXData(agent.token_address, interval);
        return { data: dexData, isGraduated: true };
      } else {
        // Use bonding curve data for non-graduated tokens
        const bondingData = await this.getOHLCVData(agentId, interval, startTime, endTime);
        return { data: bondingData, isGraduated: false };
      }
    } catch (error) {
      console.error('Error in getChartData:', error);
      return { data: [], isGraduated: false };
    }
  }

  static subscribeToRealTimeUpdates(
    agentId: string,
    onUpdate: (data: OHLCVData) => void
  ) {
    const channel = supabase
      .channel(`chart-updates-${agentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_token_buy_trades',
          filter: `agent_id=eq.${agentId}`
        },
        (payload) => {
          console.log('New buy trade:', payload);
          // Process the new trade into OHLCV format
          // This is a simplified version - in production you'd aggregate properly
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_token_sell_trades', 
          filter: `agent_id=eq.${agentId}`
        },
        (payload) => {
          console.log('New sell trade:', payload);
          // Process the new trade into OHLCV format
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}