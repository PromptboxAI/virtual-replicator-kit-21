import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, DollarSign, Users, Clock, Lock, Activity } from "lucide-react";
import { toast } from "sonner";

interface GraduationAnalytics {
  id: string;
  agent_id: string;
  agent_name?: string;
  agent_symbol?: string;
  created_at: string;
  updated_at: string;
  
  // Pre-graduation metrics
  pre_graduation_volume: number;
  days_to_graduation: number;
  final_prompt_raised: number;
  final_price: number;
  holder_count: number;
  
  // Post-graduation metrics
  post_graduation_volume: number;
  lp_value_usd: number;
  price_impact_percent: number;
  dex_price: number;
  dex_volume_24h: number;
  
  // Platform metrics
  platform_tokens_value_usd: number;
  lp_prompt_amount: number;
  lp_token_amount: number;
  lp_pool_address: string;
  lp_lock_tx_hash: string;
  lp_unlock_date: string;
  
  // Analytics
  graduation_roi_percent: number;
  liquidity_depth_score: number;
  trading_activity_score: number;
}

interface DashboardMetrics {
  total_graduations: number;
  total_platform_value: number;
  avg_lp_depth: number;
  total_dex_volume: number;
  avg_roi: number;
}

export function GraduationAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<GraduationAnalytics[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch graduation analytics with agent details
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('graduation_analytics')
        .select(`
          *,
          agents!inner(name, symbol)
        `)
        .order('created_at', { ascending: false });

      if (analyticsError) throw analyticsError;

      // Transform data to include agent names
      const transformedAnalytics = analyticsData?.map(item => ({
        ...item,
        agent_name: item.agents?.name,
        agent_symbol: item.agents?.symbol
      })) || [];

      setAnalytics(transformedAnalytics);

      // Calculate dashboard metrics
      if (transformedAnalytics.length > 0) {
        const totalPlatformValue = transformedAnalytics.reduce((sum, a) => sum + (a.platform_tokens_value_usd || 0), 0);
        const avgLpDepth = transformedAnalytics.reduce((sum, a) => sum + (a.lp_value_usd || 0), 0) / transformedAnalytics.length;
        const totalDexVolume = transformedAnalytics.reduce((sum, a) => sum + (a.dex_volume_24h || 0), 0);
        const avgRoi = transformedAnalytics.reduce((sum, a) => sum + (a.graduation_roi_percent || 0), 0) / transformedAnalytics.length;

        setMetrics({
          total_graduations: transformedAnalytics.length,
          total_platform_value: totalPlatformValue,
          avg_lp_depth: avgLpDepth,
          total_dex_volume: totalDexVolume,
          avg_roi: avgRoi
        });
      }

    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load graduation analytics');
    } finally {
      setLoading(false);
    }
  };

  const syncPrices = async () => {
    try {
      setSyncing(true);
      
      const { data, error } = await supabase.functions.invoke('sync-graduated-prices');
      
      if (error) throw error;
      
      toast.success(`Successfully synced ${data.synced} graduated agent prices`);
      await loadAnalytics(); // Reload data
      
    } catch (error) {
      console.error('Error syncing prices:', error);
      toast.error('Failed to sync graduated prices');
    } finally {
      setSyncing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading graduation analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Graduation Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track graduated agents and platform metrics</p>
        </div>
        <Button onClick={syncPrices} disabled={syncing}>
          <Activity className="w-4 h-4 mr-2" />
          {syncing ? 'Syncing...' : 'Sync Prices'}
        </Button>
      </div>

      {/* Overview Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Graduations</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_graduations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.total_platform_value)}</div>
              <p className="text-xs text-muted-foreground">4M tokens × {metrics.total_graduations} grads</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg LP Depth</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.avg_lp_depth)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">24h DEX Volume</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.total_dex_volume)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg ROI</CardTitle>
              {metrics.avg_roi > 0 ? 
                <TrendingUp className="h-4 w-4 text-green-500" /> :
                <TrendingDown className="h-4 w-4 text-red-500" />
              }
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercent(metrics.avg_roi)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
          <TabsTrigger value="platform">Platform</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {analytics.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {item.agent_name}
                        <Badge variant="secondary">{item.agent_symbol}</Badge>
                      </CardTitle>
                      <CardDescription>
                        Graduated {new Date(item.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">${item.dex_price?.toFixed(6) || '0.000000'}</div>
                      <div className="text-sm text-muted-foreground">Current DEX Price</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm font-medium">PROMPT Raised</div>
                      <div className="text-2xl">{item.final_prompt_raised?.toLocaleString() || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">24h Volume</div>
                      <div className="text-2xl">{formatCurrency(item.dex_volume_24h || 0)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">LP Value</div>
                      <div className="text-2xl">{formatCurrency(item.lp_value_usd || 0)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Platform Value</div>
                      <div className="text-2xl">{formatCurrency(item.platform_tokens_value_usd || 0)}</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-4">
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-2">Liquidity Score</div>
                      <Progress value={(item.liquidity_depth_score || 0) * 10} className="h-2" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-2">Activity Score</div>
                      <Progress value={(item.trading_activity_score || 0) * 10} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="liquidity" className="space-y-4">
          <div className="grid gap-4">
            {analytics.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    {item.agent_name} LP Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-medium">PROMPT Amount (70%)</div>
                      <div className="text-xl">{item.lp_prompt_amount?.toLocaleString() || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Token Amount</div>
                      <div className="text-xl">{(item.lp_token_amount || 196000000).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Total LP Value</div>
                      <div className="text-xl">{formatCurrency(item.lp_value_usd || 0)}</div>
                    </div>
                  </div>
                  
                  {item.lp_pool_address && (
                    <div className="mt-4">
                      <div className="text-sm font-medium">Pool Address</div>
                      <code className="text-xs bg-muted p-1 rounded">{item.lp_pool_address}</code>
                    </div>
                  )}
                  
                  {item.lp_unlock_date && (
                    <div className="mt-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        Unlocks: {new Date(item.lp_unlock_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="platform" className="space-y-4">
          <div className="grid gap-4">
            {analytics.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    {item.agent_name} Platform Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-medium">Platform Tokens</div>
                      <div className="text-xl">4,000,000</div>
                      <div className="text-xs text-muted-foreground">Fixed allocation</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Current Value</div>
                      <div className="text-xl">{formatCurrency(item.platform_tokens_value_usd || 0)}</div>
                      <div className="text-xs text-muted-foreground">At current DEX price</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">ROI</div>
                      <div className="text-xl">{formatPercent(item.graduation_roi_percent || 0)}</div>
                      <div className="text-xs text-muted-foreground">Since graduation</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {analytics.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium">No Graduated Agents Yet</h3>
            <p className="text-muted-foreground">
              Analytics will appear here once agents graduate and create liquidity pools.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}