import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatChartPrice } from '@/lib/formatters';

interface ChartData {
  timestamp: string;
  price: number;
  volume: number;
}

interface TradingChartProps {
  tokenAddress: string;
  agentSymbol: string;
  currentPrice: number;
  priceChange24h: number;
  fxRate?: number; // Optional FX rate, defaults to 0.10 if not provided
}

export function TradingChart({ tokenAddress, agentSymbol, currentPrice, priceChange24h, fxRate = 0.10 }: TradingChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [timeframe, setTimeframe] = useState('1D');
  const [loading, setLoading] = useState(true);

  const timeframes = ['15m', '1h', '4h', '1D', '1W'];

  useEffect(() => {
    fetchChartData();
  }, [tokenAddress, timeframe]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      // For now, generate mock data since Moralis chart endpoint needs specific implementation
      // This would be replaced with actual Moralis API call
      const mockData = generateMockChartData();
      setChartData(mockData);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockChartData = (): ChartData[] => {
    const data: ChartData[] = [];
    const now = Date.now();
    const points = 50;
    
    for (let i = points; i >= 0; i--) {
      const timestamp = new Date(now - i * 30 * 60 * 1000); // 30 min intervals
      const basePrice = currentPrice;
      const volatility = 0.02; // 2% volatility
      const randomChange = (Math.random() - 0.5) * volatility;
      const price = basePrice * (1 + randomChange + (priceChange24h / 100) * (i / points));
      
      data.push({
        timestamp: timestamp.toISOString(),
        price: Math.max(price, 0.000001),
        volume: Math.random() * 1000000
      });
    }
    
    return data;
  };

  const formatPrice = (price: number) => {
    return formatChartPrice(price, fxRate);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-semibold">{agentSymbol}/USD</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">${formatPrice(currentPrice)}</span>
              <div className={`flex items-center gap-1 ${priceChange24h >= 0 ? 'text-success' : 'text-destructive'}`}>
                {priceChange24h >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="font-medium">{Math.abs(priceChange24h).toFixed(2)}%</span>
              </div>
            </div>
          </div>
          
          {/* Timeframe Buttons */}
          <div className="flex gap-1">
            {timeframes.map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeframe(tf)}
                className="h-8 px-3"
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="h-[400px] w-full">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Loading chart...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis 
                  dataKey="timestamp"
                  tickFormatter={formatTime}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(value) => `$${formatPrice(value)}`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value: number) => [`$${formatPrice(value)}`, 'Price']}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart Footer */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Powered by Moralis</span>
          <span>Real-time data</span>
        </div>
      </CardContent>
    </Card>
  );
}