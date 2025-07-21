import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, DollarSign, TrendingUp, Activity, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RevenueEvent {
  id: string;
  agent_id: string;
  timestamp: string;
  source: string;
  fee_amount: number;
  creator_amount: number;
  platform_amount: number;
  tx_hash?: string;
  status: string;
  metadata?: any;
}

interface AgentRevenueSummary {
  agent_id: string;
  agent_name: string;
  agent_symbol: string;
  total_fee_amount: number;
  total_creator_amount: number;
  total_platform_amount: number;
  event_count: number;
  last_activity: string;
}

export const RevenueAuditDashboard: React.FC = () => {
  const [revenueEvents, setRevenueEvents] = useState<RevenueEvent[]>([]);
  const [agentSummaries, setAgentSummaries] = useState<AgentRevenueSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Fetch revenue events
  const fetchRevenueEvents = async () => {
    try {
      let query = supabase
        .from('revenue_events')
        .select(`
          id,
          agent_id,
          timestamp,
          source,
          fee_amount,
          creator_amount,
          platform_amount,
          tx_hash,
          status,
          metadata
        `)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (selectedSource !== 'all') {
        query = query.eq('source', selectedSource);
      }
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching revenue events:', error);
        return;
      }

      setRevenueEvents(data || []);
    } catch (error) {
      console.error('Error fetching revenue events:', error);
    }
  };

  // Fetch agent revenue summaries
  const fetchAgentSummaries = async () => {
    try {
      const { data, error } = await supabase
        .from('revenue_events')
        .select(`
          agent_id,
          fee_amount,
          creator_amount,
          platform_amount,
          timestamp
        `);

      if (error) {
        console.error('Error fetching revenue data:', error);
        return;
      }

      // Get agent details
      const { data: agents, error: agentError } = await supabase
        .from('agents')
        .select('id, name, symbol');

      if (agentError) {
        console.error('Error fetching agents:', agentError);
        return;
      }

      // Group by agent and calculate totals
      const summaryMap = new Map<string, AgentRevenueSummary>();
      
      data?.forEach(event => {
        const agent = agents?.find(a => a.id === event.agent_id);
        if (!agent) return;

        const existing = summaryMap.get(event.agent_id) || {
          agent_id: event.agent_id,
          agent_name: agent.name,
          agent_symbol: agent.symbol,
          total_fee_amount: 0,
          total_creator_amount: 0,
          total_platform_amount: 0,
          event_count: 0,
          last_activity: event.timestamp
        };

        existing.total_fee_amount += Number(event.fee_amount);
        existing.total_creator_amount += Number(event.creator_amount);
        existing.total_platform_amount += Number(event.platform_amount);
        existing.event_count += 1;
        
        if (new Date(event.timestamp) > new Date(existing.last_activity)) {
          existing.last_activity = event.timestamp;
        }

        summaryMap.set(event.agent_id, existing);
      });

      setAgentSummaries(Array.from(summaryMap.values()).sort((a, b) => 
        b.total_fee_amount - a.total_fee_amount
      ));
    } catch (error) {
      console.error('Error calculating agent summaries:', error);
    }
  };

  // Load data
  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([fetchRevenueEvents(), fetchAgentSummaries()]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedSource, selectedStatus]);

  // Calculate platform totals
  const platformTotals = agentSummaries.reduce(
    (totals, summary) => ({
      totalRevenue: totals.totalRevenue + summary.total_fee_amount,
      totalCreatorPayout: totals.totalCreatorPayout + summary.total_creator_amount,
      totalPlatformRevenue: totals.totalPlatformRevenue + summary.total_platform_amount,
      totalEvents: totals.totalEvents + summary.event_count
    }),
    { totalRevenue: 0, totalCreatorPayout: 0, totalPlatformRevenue: 0, totalEvents: 0 }
  );

  const formatCurrency = (amount: number) => `$${amount.toFixed(4)}`;
  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'buy': return 'bg-green-100 text-green-800';
      case 'sell': return 'bg-red-100 text-red-800';
      case 'trading_fee': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Revenue Audit Dashboard</h2>
        <Button 
          onClick={loadData} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Platform Totals */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(platformTotals.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">All fees collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Creator Payouts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(platformTotals.totalCreatorPayout)}</div>
            <p className="text-xs text-muted-foreground">70% of fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(platformTotals.totalPlatformRevenue)}</div>
            <p className="text-xs text-muted-foreground">30% of fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformTotals.totalEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Revenue events</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Revenue Events</TabsTrigger>
          <TabsTrigger value="agents">Agent Summaries</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
                <SelectItem value="trading_fee">Trading Fee</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Revenue Events</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Fee Amount</TableHead>
                    <TableHead>Creator Amount</TableHead>
                    <TableHead>Platform Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>TX Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-mono text-sm">
                        {formatDate(event.timestamp)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {event.agent_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge className={getSourceBadgeColor(event.source)}>
                          {event.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(event.fee_amount)}
                      </TableCell>
                      <TableCell className="font-mono text-green-600">
                        {formatCurrency(event.creator_amount)}
                      </TableCell>
                      <TableCell className="font-mono text-blue-600">
                        {formatCurrency(event.platform_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(event.status)}>
                          {event.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {event.tx_hash ? (
                          <span title={event.tx_hash}>
                            {event.tx_hash.slice(0, 10)}...
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Revenue Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Total Revenue</TableHead>
                    <TableHead>Creator Earned</TableHead>
                    <TableHead>Platform Earned</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentSummaries.map((summary) => (
                    <TableRow key={summary.agent_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{summary.agent_name}</div>
                          <div className="text-sm text-muted-foreground">{summary.agent_symbol}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-bold">
                        {formatCurrency(summary.total_fee_amount)}
                      </TableCell>
                      <TableCell className="font-mono text-green-600">
                        {formatCurrency(summary.total_creator_amount)}
                      </TableCell>
                      <TableCell className="font-mono text-blue-600">
                        {formatCurrency(summary.total_platform_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{summary.event_count}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(summary.last_activity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};