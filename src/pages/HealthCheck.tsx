import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HealthStatus {
  ok: boolean;
  ts: number;
  mode: 'mock' | 'sepolia' | 'mainnet';
  apiVersion: string;
  settings?: {
    testMode: boolean;
    deploymentMode: 'database' | 'smart_contract';
  };
}

export default function HealthCheck() {
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setLoading(true);
        const { data, error: invokeError } = await supabase.functions.invoke('healthz');
        
        if (invokeError) throw invokeError;
        
        setStatus(data);
        setError(null);
      } catch (err: any) {
        console.error('Health check failed:', err);
        setError(err.message || 'Failed to fetch health status');
        // Set fallback status
        setStatus({
          ok: false,
          ts: Date.now(),
          mode: 'mock',
          apiVersion: 'unknown'
        });
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
    
    // Refresh every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !status) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p>Checking system health...</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              Health Check Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error || 'Unknown error'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const modeConfig = {
    mock: { label: 'Mock Data', variant: 'secondary' as const, icon: '🧪', color: 'text-muted-foreground' },
    sepolia: { label: 'Base Sepolia (Testnet)', variant: 'outline' as const, icon: '🟠', color: 'text-warning' },
    mainnet: { label: 'Base Mainnet', variant: 'default' as const, icon: '🟢', color: 'text-success' }
  };

  const config = modeConfig[status.mode] || modeConfig.mock;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status.ok ? (
              <CheckCircle className="h-6 w-6 text-success" />
            ) : (
              <XCircle className="h-6 w-6 text-destructive" />
            )}
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={status.ok ? 'default' : 'destructive'}>
              {status.ok ? 'Healthy' : 'Unhealthy'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">System Mode</span>
            <Badge variant={config.variant}>
              {config.icon} {config.label}
            </Badge>
          </div>

          {status.settings && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Test Mode</span>
                <Badge variant={status.settings.testMode ? 'outline' : 'default'}>
                  {status.settings.testMode ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Deployment</span>
                <Badge variant="secondary">
                  {status.settings.deploymentMode === 'smart_contract' ? 'Smart Contracts' : 'Database'}
                </Badge>
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">API Version</span>
            <span className="text-sm font-mono text-foreground">{status.apiVersion}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Timestamp</span>
            <div className="flex items-center gap-1 text-sm text-foreground">
              <Clock className="h-3 w-3" />
              {new Date(status.ts).toLocaleString()}
            </div>
          </div>

          {error && (
            <div className="pt-4 border-t border-destructive/20">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              {status.mode === 'mock' && '⚠️ Mock Mode: Using database-only mode (no blockchain interaction).'}
              {status.mode === 'sepolia' && '🧪 Testnet Mode: Connected to Base Sepolia for testing.'}
              {status.mode === 'mainnet' && '✅ Production Mode: Connected to Base mainnet with real tokens.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
