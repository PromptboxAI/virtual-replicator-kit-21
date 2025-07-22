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
      const { data, error } = await supabase.rpc('get_agent_ohlcv_data', {
        p_agent_id: agentId,
        p_interval: interval,
        p_start_time: startTime?.toISOString(),
        p_end_time: endTime?.toISOString()
      });

      if (error) {
        console.error('Error fetching OHLCV data:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        time: Math.floor(new Date(item.time_bucket).getTime() / 1000),
        open: parseFloat(item.open_price || '0'),
        high: parseFloat(item.high_price || '0'),
        low: parseFloat(item.low_price || '0'),
        close: parseFloat(item.close_price || '0'),
        volume: parseFloat(item.volume || '0'),
        tradeCount: parseInt(item.trade_count || '0')
      }));
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
      const { data, error } = await supabase.rpc('simulate_price_impact', {
        p_agent_id: agentId,
        p_prompt_amount: promptAmount,
        p_trade_type: tradeType
      });

      if (error) {
        console.error('Error simulating price impact:', error);
        return null;
      }

      const result = data?.[0];
      if (!result) return null;

      return {
        currentPrice: parseFloat(String(result.current_price || '0')),
        impactPrice: parseFloat(String(result.impact_price || '0')),
        priceImpactPercent: parseFloat(String(result.price_impact_percent || '0')),
        estimatedTokens: parseFloat(String(result.estimated_tokens || '0'))
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