import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Clock, DollarSign, TrendingDown, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SystemAlert {
  id: string;
  type: string;
  severity: string;
  message: string;
  agent_id?: string;
  is_resolved: boolean;
  created_at: string;
  metadata?: any;
}

interface HealthSnapshot {
  total_platform_tokens_value_usd: number;
  graduated_agents_count: number;
  avg_lp_value_usd: number;
  low_liquidity_agents: number;
  created_at: string;
}

export function ProductionAlertsPanel() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [healthSnapshot, setHealthSnapshot] = useState<HealthSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningHealthCheck, setIsRunningHealthCheck] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      // Load active alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('system_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (alertsError) throw alertsError;

      // Load latest health snapshot
      const { data: snapshotData, error: snapshotError } = await supabase
        .from('platform_health_snapshots')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (snapshotError) throw snapshotError;

      setAlerts(alertsData || []);
      setHealthSnapshot(snapshotData?.[0] || null);
    } catch (error) {
      console.error('Error loading alerts data:', error);
      toast({
        title: "Error loading alerts",
        description: "Failed to load system alerts and health data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runHealthCheck = async () => {
    setIsRunningHealthCheck(true);
    try {
      const { data, error } = await supabase.functions.invoke('monitor-production-health');
      
      if (error) throw error;
      
      toast({
        title: "Health check complete",
        description: `Generated ${data.alerts?.length || 0} alerts`,
      });
      
      // Reload data to show new alerts
      await loadData();
    } catch (error) {
      console.error('Error running health check:', error);
      toast({
        title: "Health check failed",
        description: "Failed to run production health monitoring",
        variant: "destructive",
      });
    } finally {
      setIsRunningHealthCheck(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('system_alerts')
        .update({ 
          is_resolved: true, 
          resolved_at: new Date().toISOString() 
        })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      toast({
        title: "Alert resolved",
        description: "Alert has been marked as resolved",
      });
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive' as const;
      case 'warning':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Production Alerts & Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading system status...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Platform Health Overview
          </CardTitle>
          <Button 
            onClick={runHealthCheck}
            disabled={isRunningHealthCheck}
            size="sm"
          >
            {isRunningHealthCheck ? 'Running...' : 'Run Health Check'}
          </Button>
        </CardHeader>
        <CardContent>
          {healthSnapshot ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  ${healthSnapshot.total_platform_tokens_value_usd.toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">Platform Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {healthSnapshot.graduated_agents_count}
                </div>
                <div className="text-sm text-muted-foreground">Graduated Agents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  ${healthSnapshot.avg_lp_value_usd.toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">Avg LP Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">
                  {healthSnapshot.low_liquidity_agents}
                </div>
                <div className="text-sm text-muted-foreground">Low Liquidity</div>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-center py-4">
              No health data available. Run a health check to generate metrics.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Active Alerts ({alerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <div className="text-lg font-medium">All systems operational</div>
              <div>No active alerts or issues detected</div>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{alert.type.replace('_', ' ')}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm font-medium mb-1">{alert.message}</div>
                    {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {JSON.stringify(alert.metadata, null, 2)}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => resolveAlert(alert.id)}
                  >
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}