import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Database, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentPriceV3, tokensSoldFromPromptRaisedV3, formatPriceV3 } from '@/lib/bondingCurveV3';
import { useToast } from '@/hooks/use-toast';

interface PriceHistoryIssue {
  type: 'gap' | 'inconsistency' | 'duplicate' | 'missing';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp?: string;
  agentId?: string;
  details?: any;
}

interface PriceHistoryValidatorProps {
  agentId?: string;
  className?: string;
}

export function PriceHistoryValidator({ agentId, className }: PriceHistoryValidatorProps) {
  const [issues, setIssues] = useState<PriceHistoryIssue[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<Date | null>(null);
  const { toast } = useToast();

  const validatePriceHistory = async () => {
    setIsValidating(true);
    const foundIssues: PriceHistoryIssue[] = [];

    try {
      // Check for data gaps in price snapshots
      const { data: snapshots, error: snapshotsError } = await supabase
        .from('agent_price_snapshots')
        .select('*')
        .order('timestamp', { ascending: true })
        .limit(1000);

      if (snapshotsError) throw snapshotsError;

      if (snapshots && snapshots.length > 1) {
        // Check for time gaps (>6 hours between snapshots)
        for (let i = 1; i < snapshots.length; i++) {
          const prevTime = new Date(snapshots[i-1].timestamp!);
          const currTime = new Date(snapshots[i].timestamp!);
          const gap = currTime.getTime() - prevTime.getTime();
          const hoursGap = gap / (1000 * 60 * 60);

          if (hoursGap > 6) {
            foundIssues.push({
              type: 'gap',
              severity: hoursGap > 24 ? 'high' : 'medium',
              message: `${hoursGap.toFixed(1)} hour gap in price data`,
              timestamp: snapshots[i].timestamp!,
              agentId: snapshots[i].agent_id
            });
          }
        }

        // Check for price inconsistencies
        for (const snapshot of snapshots) {
          if (snapshot.prompt_raised && snapshot.price) {
            const calculatedPrice = getCurrentPriceV3(tokensSoldFromPromptRaisedV3(snapshot.prompt_raised));
            const recordedPrice = snapshot.price;
            const difference = Math.abs(calculatedPrice - recordedPrice);
            const percentDiff = (difference / calculatedPrice) * 100;

            if (percentDiff > 1) { // >1% difference
              foundIssues.push({
                type: 'inconsistency',
                severity: percentDiff > 5 ? 'high' : 'medium',
                message: `Price mismatch: recorded ${formatPriceV3(recordedPrice)}, calculated ${formatPriceV3(calculatedPrice)} (${percentDiff.toFixed(2)}% diff)`,
                timestamp: snapshot.timestamp!,
                agentId: snapshot.agent_id,
                details: { recorded: recordedPrice, calculated: calculatedPrice, difference: percentDiff }
              });
            }
          }
        }

        // Check for duplicates
        const timestampGroups = new Map();
        snapshots.forEach(snapshot => {
          const key = `${snapshot.agent_id}-${snapshot.timestamp}`;
          if (timestampGroups.has(key)) {
            timestampGroups.get(key).push(snapshot);
          } else {
            timestampGroups.set(key, [snapshot]);
          }
        });

        timestampGroups.forEach((group, key) => {
          if (group.length > 1) {
            foundIssues.push({
              type: 'duplicate',
              severity: 'medium',
              message: `${group.length} duplicate snapshots found`,
              timestamp: group[0].timestamp,
              agentId: group[0].agent_id,
              details: { count: group.length }
            });
          }
        });
      }

      // Check for missing recent data for active agents
      const { data: activeAgents, error: agentsError } = await supabase
        .from('agents')
        .select('id, name, updated_at')
        .eq('is_active', true)
        .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (agentsError) throw agentsError;

      if (activeAgents) {
        for (const agent of activeAgents) {
          const { data: recentSnapshots, error: recentError } = await supabase
            .from('agent_price_snapshots')
            .select('timestamp')
            .eq('agent_id', agent.id)
            .gte('timestamp', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()) // Last 4 hours
            .limit(1);

          if (recentError) throw recentError;

          if (!recentSnapshots || recentSnapshots.length === 0) {
            foundIssues.push({
              type: 'missing',
              severity: 'high',
              message: `No recent price data for active agent`,
              agentId: agent.id,
              details: { agentName: agent.name, lastUpdate: agent.updated_at }
            });
          }
        }
      }

      setIssues(foundIssues);
      setLastValidation(new Date());

      if (foundIssues.length === 0) {
        toast({
          title: "Validation Complete",
          description: "No price history issues found",
        });
      } else {
        const highSeverity = foundIssues.filter(i => i.severity === 'high').length;
        toast({
          title: "Validation Complete",
          description: `Found ${foundIssues.length} issues (${highSeverity} high severity)`,
          variant: highSeverity > 0 ? "destructive" : "default"
        });
      }

    } catch (error) {
      toast({
        title: "Validation Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      high: 'destructive' as const,
      medium: 'secondary' as const,
      low: 'outline' as const
    };
    return <Badge variant={variants[severity as keyof typeof variants] || 'outline'}>{severity.toUpperCase()}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'gap':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'inconsistency':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'duplicate':
        return <AlertCircle className="h-4 w-4 text-secondary" />;
      case 'missing':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Database className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Price History Validator
        </CardTitle>
        {lastValidation && (
          <p className="text-sm text-muted-foreground">
            Last validated: {lastValidation.toLocaleString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={validatePriceHistory} 
          disabled={isValidating}
          className="w-full"
        >
          {isValidating ? 'Validating...' : 'Validate Price History'}
        </Button>

        {issues.length === 0 && lastValidation ? (
          <div className="flex items-center gap-2 p-4 bg-success/10 border border-success/20 rounded-lg">
            <CheckCircle className="h-5 w-5 text-success" />
            <div>
              <div className="font-medium">No Issues Found</div>
              <div className="text-sm text-muted-foreground">Price history data integrity verified</div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(issue.type)}
                    <span className="font-medium capitalize">{issue.type}</span>
                  </div>
                  {getSeverityBadge(issue.severity)}
                </div>
                
                <div className="text-sm space-y-1">
                  <div className={getSeverityColor(issue.severity)}>{issue.message}</div>
                  {issue.timestamp && (
                    <div className="text-muted-foreground">
                      Time: {new Date(issue.timestamp).toLocaleString()}
                    </div>
                  )}
                  {issue.agentId && (
                    <div className="text-muted-foreground">
                      Agent: {issue.agentId}
                    </div>
                  )}
                  {issue.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer">Details</summary>
                      <pre className="mt-1 p-2 bg-muted rounded">
                        {JSON.stringify(issue.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {issues.length > 0 && (
          <div className="pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Found {issues.length} total issues:
              <ul className="mt-1 space-y-1">
                <li>• {issues.filter(i => i.severity === 'high').length} high severity</li>
                <li>• {issues.filter(i => i.severity === 'medium').length} medium severity</li>
                <li>• {issues.filter(i => i.severity === 'low').length} low severity</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}