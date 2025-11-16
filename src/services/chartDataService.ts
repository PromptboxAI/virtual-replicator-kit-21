
import { supabase } from '@/integrations/supabase/client';
import { isAgentGraduatedV3 } from '@/lib/bondingCurveV3';

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
  
  // Generate mock OHLCV data for testing
  private static generateMockData(interval: ChartInterval): OHLCVData[] {
    console.log('📊 Generating MOCK data for interval:', interval);
    const now = Math.floor(Date.now() / 1000);
    const bars = 100;
    const basePrice = 0.0000075;
    
    return Array.from({ length: bars }, (_, i) => {
      const time = now - (bars - i) * 300; // 5min intervals
      const random = Math.random();
      return {
        time,
        open: basePrice + random * 0.000005,
        high: basePrice + random * 0.000006,
        low: basePrice + random * 0.000004,
        close: basePrice + random * 0.000005,
        volume: Math.random() * 10000,
        tradeCount: Math.floor(Math.random() * 50)
      };
    });
  }
  
  static async getOHLCVData(
    agentId: string,
    interval: ChartInterval = '5m', // Default to 5m instead of 1m
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
    interval: ChartInterval = '5m',
    startTime?: Date,
    endTime?: Date
  ): Promise<{ data: OHLCVData[]; isGraduated: boolean }> {
    try {
      console.log('📊 Fetching chart data for agent:', agentId, 'interval:', interval);
      
      // Fetch OHLC data from edge function
      const { data: response, error } = await supabase.functions.invoke('get-ohlc', {
        body: { agentId, timeframe: interval }
      });

      if (error) {
        console.error('Error fetching OHLC data:', error);
        return { data: this.generateMockData(interval), isGraduated: false };
      }

      if (!response?.data?.buckets || response.data.buckets.length === 0) {
        console.warn('⚠️ No OHLC data returned, using fallback');
        return { data: this.generateMockData(interval), isGraduated: false };
      }

      // Transform response to OHLCVData format
      const ohlcvData: OHLCVData[] = response.data.buckets.map((bucket: any) => ({
        time: Math.floor(new Date(bucket.timestamp).getTime() / 1000),
        open: parseFloat(bucket.open),
        high: parseFloat(bucket.high),
        low: parseFloat(bucket.low),
        close: parseFloat(bucket.close),
        volume: parseFloat(bucket.volume || '0'),
        tradeCount: 0
      }));

      console.log(`✅ Loaded ${ohlcvData.length} OHLC bars for agent ${agentId}`);
      
      // Check if agent is graduated
      const { data: agent } = await supabase
        .from('agents')
        .select('token_graduated')
        .eq('id', agentId)
        .single();
      
      const isGraduated = agent?.token_graduated || false;
      
      return { data: ohlcvData, isGraduated };
    } catch (error) {
      console.error('Error in getChartData:', error);
      return { data: this.generateMockData(interval), isGraduated: false };
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
        async (payload) => {
          console.log('New buy trade for real-time chart update:', payload);
          // Small delay to ensure all database updates are complete
          setTimeout(async () => {
            try {
              const { data } = await this.getChartData(agentId);
              if (data.length > 0) {
                const latestData = data[data.length - 1];
                onUpdate(latestData);
              }
            } catch (error) {
              console.error('Error updating chart data:', error);
            }
          }, 500);
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
        async (payload) => {
          console.log('New sell trade for real-time chart update:', payload);
          // Small delay to ensure all database updates are complete
          setTimeout(async () => {
            try {
              const { data } = await this.getChartData(agentId);
              if (data.length > 0) {
                const latestData = data[data.length - 1];
                onUpdate(latestData);
              }
            } catch (error) {
              console.error('Error updating chart data:', error);
            }
          }, 500);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agents',
          filter: `id=eq.${agentId}`
        },
        async (payload) => {
          console.log('Agent updated for real-time chart update:', payload);
          // Refresh chart when agent data changes (price, volume, etc.)
          setTimeout(async () => {
            try {
              const { data } = await this.getChartData(agentId);
              if (data.length > 0) {
                const latestData = data[data.length - 1];
                onUpdate(latestData);
              }
            } catch (error) {
              console.error('Error updating chart data:', error);
            }
          }, 200);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}
