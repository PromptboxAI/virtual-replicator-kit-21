import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useLeaderboards } from '@/hooks/useLeaderboards';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, BarChart3, Activity, DollarSign, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LeaderboardsDisplay() {
  const navigate = useNavigate();
  const [limit] = useState(10);
  const { data: leaderboards, isLoading } = useLeaderboards(limit);

  const renderLeaderboardItem = (agent: any, index: number, showChange: boolean = false) => (
    <div
      key={agent.agent_id}
      className="flex items-center justify-between p-4 hover:bg-accent/50 rounded-lg cursor-pointer transition-colors"
      onClick={() => navigate(`/agents/${agent.agent_id}`)}
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
          {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
          {index !== 0 && agent.rank}
        </div>
        <div className="flex-1">
          <div className="font-semibold">{agent.name}</div>
          <div className="text-sm text-muted-foreground">{agent.symbol}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-semibold">
          ${typeof agent.value === 'number' ? agent.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'}
        </div>
        {showChange && agent.change_24h !== undefined && (
          <div className={`text-sm flex items-center gap-1 justify-end ${agent.change_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {agent.change_24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {agent.change_24h >= 0 ? '+' : ''}{agent.change_24h.toFixed(2)}%
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Leaderboards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4 flex-1">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Leaderboards
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="market_cap" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="market_cap" className="text-xs">
              <DollarSign className="h-3 w-3 mr-1" />
              Market Cap
            </TabsTrigger>
            <TabsTrigger value="volume" className="text-xs">
              <BarChart3 className="h-3 w-3 mr-1" />
              Volume
            </TabsTrigger>
            <TabsTrigger value="gainers" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Gainers
            </TabsTrigger>
            <TabsTrigger value="losers" className="text-xs">
              <TrendingDown className="h-3 w-3 mr-1" />
              Losers
            </TabsTrigger>
            <TabsTrigger value="traded" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Most Traded
            </TabsTrigger>
          </TabsList>

          <TabsContent value="market_cap" className="space-y-2 mt-4">
            {leaderboards?.top_by_market_cap?.map((agent, idx) => 
              renderLeaderboardItem(agent, idx, false)
            ) || <div className="text-center py-8 text-muted-foreground">No data available</div>}
          </TabsContent>

          <TabsContent value="volume" className="space-y-2 mt-4">
            {leaderboards?.top_by_volume?.map((agent, idx) => 
              renderLeaderboardItem(agent, idx, false)
            ) || <div className="text-center py-8 text-muted-foreground">No data available</div>}
          </TabsContent>

          <TabsContent value="gainers" className="space-y-2 mt-4">
            {leaderboards?.top_gainers?.map((agent, idx) => 
              renderLeaderboardItem(agent, idx, true)
            ) || <div className="text-center py-8 text-muted-foreground">No data available</div>}
          </TabsContent>

          <TabsContent value="losers" className="space-y-2 mt-4">
            {leaderboards?.top_losers?.map((agent, idx) => 
              renderLeaderboardItem(agent, idx, true)
            ) || <div className="text-center py-8 text-muted-foreground">No data available</div>}
          </TabsContent>

          <TabsContent value="traded" className="space-y-2 mt-4">
            {leaderboards?.most_traded?.map((agent, idx) => 
              renderLeaderboardItem(agent, idx, false)
            ) || <div className="text-center py-8 text-muted-foreground">No data available</div>}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
