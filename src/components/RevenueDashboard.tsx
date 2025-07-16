import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  BarChart3,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RevenueData {
  id: string;
  revenue_type: string;
  amount: number;
  agent_id?: string;
  transaction_hash?: string;
  network: string;
  created_at: string;
}

interface RevenueStats {
  totalRevenue: number;
  agentCreationRevenue: number;
  tradingFeeRevenue: number;
  totalTransactions: number;
  avgTransactionValue: number;
}

export function RevenueDashboard() {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    agentCreationRevenue: 0,
    tradingFeeRevenue: 0,
    totalTransactions: 0,
    avgTransactionValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d' | 'all'>('7d');

  useEffect(() => {
    fetchRevenueData();
  }, [timeFilter]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('platform_revenue')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply time filter
      if (timeFilter !== 'all') {
        const hours = timeFilter === '24h' ? 24 : timeFilter === '7d' ? 168 : 720;
        const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', cutoffDate);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      setRevenueData(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: RevenueData[]) => {
    const totalRevenue = data.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);
    const agentCreationRevenue = data
      .filter(item => item.revenue_type === 'agent_creation')
      .reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);
    const tradingFeeRevenue = data
      .filter(item => item.revenue_type === 'trading_fee')
      .reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);
    const totalTransactions = data.length;
    const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    setStats({
      totalRevenue,
      agentCreationRevenue,
      tradingFeeRevenue,
      totalTransactions,
      avgTransactionValue
    });
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} PROMPT`;
  };

  const getExplorerUrl = (hash: string, network: string) => {
    if (network === 'testnet') {
      return `https://sepolia.basescan.org/tx/${hash}`;
    }
    return `https://basescan.org/tx/${hash}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Revenue Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Revenue Dashboard
        </CardTitle>
        <CardDescription>
          Platform revenue tracking and analytics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={timeFilter} onValueChange={(value) => setTimeFilter(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="24h">24h</TabsTrigger>
            <TabsTrigger value="7d">7d</TabsTrigger>
            <TabsTrigger value="30d">30d</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={timeFilter} className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Total Revenue</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats.totalRevenue)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Agent Creation</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(stats.agentCreationRevenue)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Trading Fees</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(stats.tradingFeeRevenue)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Transactions</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.totalTransactions}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg: {formatCurrency(stats.avgTransactionValue)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Revenue Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {revenueData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No revenue data found for the selected time period
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {revenueData.map((transaction) => (
                      <div 
                        key={transaction.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={transaction.revenue_type === 'agent_creation' ? 'default' : 'secondary'}
                          >
                            {transaction.revenue_type === 'agent_creation' ? 'Creation' : 'Trading'}
                          </Badge>
                          <div>
                            <div className="font-medium">
                              {formatCurrency(parseFloat(transaction.amount.toString()))}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {transaction.network}
                          </Badge>
                          {transaction.transaction_hash && (
                            <a
                              href={getExplorerUrl(transaction.transaction_hash, transaction.network)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}