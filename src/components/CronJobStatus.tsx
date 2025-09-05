import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CronJobLog {
  id: string;
  job_name: string;
  execution_start: string;
  execution_end: string | null;
  status: string; // Changed from union type to string
  error_message: string | null;
  retry_count: number;
  metadata: any;
  created_at: string;
}

interface JobStats {
  job_name: string;
  total_runs: number;
  success_rate: number;
  last_run: string | null;
  last_status: string | null;
  avg_duration_ms: number;
}

export function CronJobStatus() {
  const [cronLogs, setCronLogs] = useState<CronJobLog[]>([]);
  const [jobStats, setJobStats] = useState<JobStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCronJobData = async () => {
    try {
      setLoading(true);

      // Fetch recent cron job logs
      const { data: logs, error: logsError } = await supabase
        .from('cron_job_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (logsError) throw logsError;

      setCronLogs(logs as CronJobLog[] || []);

      // Calculate job statistics
      const statsMap = new Map<string, {
        total: number;
        successes: number;
        durations: number[];
        lastRun: string | null;
        lastStatus: string | null;
      }>();

      logs?.forEach(log => {
        if (!statsMap.has(log.job_name)) {
          statsMap.set(log.job_name, {
            total: 0,
            successes: 0,
            durations: [],
            lastRun: null,
            lastStatus: null
          });
        }

        const stats = statsMap.get(log.job_name)!;
        stats.total++;
        
        if (log.status === 'success') {
          stats.successes++;
        }

        if (log.execution_start && log.execution_end) {
          const duration = new Date(log.execution_end).getTime() - new Date(log.execution_start).getTime();
          stats.durations.push(duration);
        }

        if (!stats.lastRun || new Date(log.created_at) > new Date(stats.lastRun)) {
          stats.lastRun = log.created_at;
          stats.lastStatus = log.status;
        }
      });

      const jobStatsArray: JobStats[] = Array.from(statsMap.entries()).map(([jobName, stats]) => ({
        job_name: jobName,
        total_runs: stats.total,
        success_rate: stats.total > 0 ? (stats.successes / stats.total) * 100 : 0,
        last_run: stats.lastRun,
        last_status: stats.lastStatus,
        avg_duration_ms: stats.durations.length > 0 
          ? stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length 
          : 0
      }));

      setJobStats(jobStatsArray);

    } catch (error: any) {
      console.error('Error fetching cron job data:', error);
      toast.error('Failed to fetch cron job data');
    } finally {
      setLoading(false);
    }
  };

  const triggerManualRun = async (jobName: string) => {
    try {
      const functionName = jobName === 'sync-graduated-prices' 
        ? 'sync-graduated-prices' 
        : 'monitor-production-health';

      const { error } = await supabase.functions.invoke(functionName, {
        body: { manual: true, timestamp: new Date().toISOString() }
      });

      if (error) throw error;

      toast.success(`Manual run triggered for ${jobName}`);
      setTimeout(() => fetchCronJobData(), 2000); // Refresh after 2 seconds
    } catch (error: any) {
      console.error('Error triggering manual run:', error);
      toast.error(`Failed to trigger ${jobName}: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchCronJobData();
    
    // Set up polling every 30 seconds
    const interval = setInterval(fetchCronJobData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Success</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'running':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Running</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Cron Job Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Job Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Cron Job Statistics
          </CardTitle>
          <CardDescription>
            Overview of scheduled job performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobStats.map((stats) => (
              <div key={stats.job_name} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{stats.job_name}</h4>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => triggerManualRun(stats.job_name)}
                  >
                    Run Now
                  </Button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Runs:</span>
                    <span>{stats.total_runs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className={stats.success_rate >= 90 ? 'text-green-600' : stats.success_rate >= 70 ? 'text-yellow-600' : 'text-red-600'}>
                      {stats.success_rate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Duration:</span>
                    <span>{formatDuration(stats.avg_duration_ms)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Last Status:</span>
                    {stats.last_status && getStatusBadge(stats.last_status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Execution Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Recent Executions
            </span>
            <Button size="sm" variant="outline" onClick={fetchCronJobData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Last 20 cron job executions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cronLogs.length === 0 ? (
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  No cron job logs found. Jobs may not have run yet.
                </AlertDescription>
              </Alert>
            ) : (
              cronLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium">{log.job_name}</span>
                      {getStatusBadge(log.status)}
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.execution_start).toLocaleString()}
                      </span>
                    </div>
                    {log.execution_end && (
                      <div className="text-sm text-muted-foreground">
                        Duration: {formatDuration(
                          new Date(log.execution_end).getTime() - new Date(log.execution_start).getTime()
                        )}
                      </div>
                    )}
                    {log.error_message && (
                      <Alert className="mt-2">
                        <XCircle className="w-4 h-4" />
                        <AlertDescription className="text-sm">
                          {log.error_message}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}