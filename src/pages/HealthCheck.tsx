import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function HealthCheck() {
  const [status, setStatus] = useState<{
    ok: boolean;
    ts: number;
    mock: boolean;
    version: string;
  } | null>(null);

  useEffect(() => {
    // Mock health check response for Phase 1
    setStatus({
      ok: true,
      ts: Date.now(),
      mock: true,
      version: '1.0.0-phase1',
    });
  }, []);

  if (!status) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

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
            <span className="text-sm text-muted-foreground">Mode</span>
            <Badge variant="outline">
              {status.mock ? 'Mock Data' : 'Production'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Version</span>
            <span className="text-sm font-mono text-foreground">{status.version}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Timestamp</span>
            <div className="flex items-center gap-1 text-sm text-foreground">
              <Clock className="h-3 w-3" />
              {new Date(status.ts).toLocaleString()}
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              This is a Phase 1 development environment with mock APIs.
              Real blockchain integration coming in Phase 2.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
