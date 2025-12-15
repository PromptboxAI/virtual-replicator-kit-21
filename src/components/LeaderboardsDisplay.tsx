import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLeaderboards, useTrending, useNewListings, LeaderboardType, LeaderboardTimeframe } from '@/hooks/useLeaderboards';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity, 
  DollarSign, 
  Trophy,
  Flame,
  Sparkles,
  Users,
  GraduationCap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LeaderboardsDisplayProps {
  showFilters?: boolean;
  compact?: boolean;
}

export function LeaderboardsDisplay({ showFilters = true, compact = false }: LeaderboardsDisplayProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<LeaderboardType>('market_cap');
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>('24h');
  const [page, setPage] = useState(1);
  const limit = compact ? 5 : 10;

  const { data: leaderboardData, isLoading } = useLeaderboards({
    type: activeTab,
    timeframe,
    limit,
    page
  });

  const { data: trendingData } = useTrending({ limit: 5 });
  const { data: newListingsData } = useNewListings({ hours: 24, limit: 5 });

  const handleTabChange = (value: string) => {
    setActiveTab(value as LeaderboardType);
    setPage(1);
  };

  const renderLeaderboardItem = (agent: any, index: number, showChange: boolean = false) => (
    <div
      key={agent.id}
      className="flex items-center justify-between p-3 hover:bg-accent/50 rounded-lg cursor-pointer transition-colors"
      onClick={() => navigate(`/agents/${agent.id}`)}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
          {index === 0 ? <Trophy className="h-4 w-4 text-yellow-500" /> : (page - 1) * limit + index + 1}
        </div>
        {agent.avatar_url && (
          <img 
            src={agent.avatar_url} 
            alt={agent.name} 
            className="w-8 h-8 rounded-full object-cover shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{agent.name}</div>
          <div className="text-xs text-muted-foreground">{agent.symbol}</div>
        </div>
      </div>
      <div className="text-right shrink-0 ml-2">
        <div className="font-semibold text-sm">
          {formatValue(agent, activeTab)}
        </div>
        {showChange && agent.price_change_24h !== undefined && (
          <div className={`text-xs flex items-center gap-1 justify-end ${agent.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {agent.price_change_24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {agent.price_change_24h >= 0 ? '+' : ''}{Number(agent.price_change_24h).toFixed(2)}%
          </div>
        )}
        {agent.trending_score !== undefined && (
          <div className="text-xs text-orange-500 flex items-center gap-1 justify-end">
            <Flame className="h-3 w-3" />
            {agent.trending_score.toFixed(1)}
          </div>
        )}
        {agent.tx_count !== undefined && activeTab === 'most_traded' && (
          <div className="text-xs text-muted-foreground">
            {agent.tx_count} trades
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5" />
            Leaderboards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="w-7 h-7 rounded-full" />
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const tokens = leaderboardData?.data || [];
  const pagination = leaderboardData?.pagination;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5" />
            Leaderboards
          </CardTitle>
          {showFilters && (
            <Select value={timeframe} onValueChange={(v) => setTimeframe(v as LeaderboardTimeframe)}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1H</SelectItem>
                <SelectItem value="24h">24H</SelectItem>
                <SelectItem value="7d">7D</SelectItem>
                <SelectItem value="30d">30D</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9 h-auto gap-1 bg-transparent p-0 mb-3">
            <TabsTrigger value="market_cap" className="text-xs px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <DollarSign className="h-3 w-3 mr-1 hidden sm:inline" />
              MCap
            </TabsTrigger>
            <TabsTrigger value="trending" className="text-xs px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Flame className="h-3 w-3 mr-1 hidden sm:inline" />
              Hot
            </TabsTrigger>
            <TabsTrigger value="volume" className="text-xs px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="h-3 w-3 mr-1 hidden sm:inline" />
              Vol
            </TabsTrigger>
            <TabsTrigger value="gainers" className="text-xs px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <TrendingUp className="h-3 w-3 mr-1 hidden sm:inline" />
              Gain
            </TabsTrigger>
            <TabsTrigger value="losers" className="text-xs px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <TrendingDown className="h-3 w-3 mr-1 hidden sm:inline" />
              Loss
            </TabsTrigger>
            <TabsTrigger value="new" className="text-xs px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hidden lg:flex">
              <Sparkles className="h-3 w-3 mr-1" />
              New
            </TabsTrigger>
            <TabsTrigger value="holders" className="text-xs px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hidden lg:flex">
              <Users className="h-3 w-3 mr-1" />
              Hold
            </TabsTrigger>
            <TabsTrigger value="graduated" className="text-xs px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hidden lg:flex">
              <GraduationCap className="h-3 w-3 mr-1" />
              Grad
            </TabsTrigger>
            <TabsTrigger value="most_traded" className="text-xs px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hidden lg:flex">
              <Activity className="h-3 w-3 mr-1" />
              Trade
            </TabsTrigger>
          </TabsList>

          <div className="space-y-1">
            {tokens.length > 0 ? (
              tokens.map((agent, idx) => 
                renderLeaderboardItem(
                  agent, 
                  idx, 
                  ['gainers', 'losers', 'market_cap', 'volume'].includes(activeTab)
                )
              )
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No data available
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <div className="text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                  className="h-7 px-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={!pagination.hasNext}
                  className="h-7 px-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}

function formatValue(agent: any, type: LeaderboardType): string {
  switch (type) {
    case 'market_cap':
      return `$${formatNumber(agent.market_cap)}`;
    case 'volume':
      return `$${formatNumber(agent.volume_24h)}`;
    case 'gainers':
    case 'losers':
      return `${agent.price_change_24h >= 0 ? '+' : ''}${Number(agent.price_change_24h).toFixed(2)}%`;
    case 'holders':
      return `${agent.token_holders || 0} holders`;
    case 'trending':
      return `$${formatNumber(agent.market_cap)}`;
    case 'most_traded':
      return `${agent.tx_count || 0} txs`;
    case 'new':
      return agent.time_since_creation || formatTimeSince(agent.created_at);
    case 'graduated':
      return `$${formatNumber(agent.market_cap)}`;
    default:
      return `$${formatNumber(agent.market_cap)}`;
  }
}

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(2);
}

function formatTimeSince(dateStr: string): string {
  const now = Date.now();
  const created = new Date(dateStr).getTime();
  const diffMs = now - created;
  
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
