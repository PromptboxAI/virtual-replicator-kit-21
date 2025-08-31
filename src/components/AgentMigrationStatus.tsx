import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  RotateCcw,
  Zap,
  TrendingUp
} from 'lucide-react';
import { useAgentMigration } from '@/hooks/useAgentMigration';
import { useToast } from '@/hooks/use-toast';

interface AgentMigrationStatusProps {
  agentId: string;
  agentName: string;
}

export function AgentMigrationStatus({ agentId, agentName }: AgentMigrationStatusProps) {
  const { 
    migrationStatus, 
    migrationState, 
    isLoading, 
    runDryMigration, 
    migrateAgent, 
    rollbackMigration 
  } = useAgentMigration(agentId);
  const { toast } = useToast();

  const handleDryRun = async () => {
    try {
      const result = await runDryMigration();
      if (result) {
        toast({
          title: "Dry Run Complete",
          description: `${agentName} migration simulation successful. Price change: ${result.migrationData?.price_change_percent?.toFixed(2)}%`,
        });
      }
    } catch (error) {
      toast({
        title: "Dry Run Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleMigrate = async () => {
    try {
      const result = await migrateAgent();
      if (result && typeof result === 'object' && 'success' in result && result.success) {
        toast({
          title: "Migration Complete",
          description: `${agentName} successfully migrated to V3 pricing`,
        });
      }
    } catch (error) {
      toast({
        title: "Migration Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleRollback = async () => {
    try {
      const result = await rollbackMigration();
      if (result && typeof result === 'object' && 'success' in result && result.success) {
        toast({
          title: "Rollback Complete",
          description: `${agentName} successfully rolled back to legacy pricing`,
        });
      }
    } catch (error) {
      toast({
        title: "Rollback Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Don't show anything if agent is already properly migrated
  if (migrationStatus.isV3 && migrationStatus.migrationValidated) {
    return null;
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium">V3 Migration Status</h4>
              {migrationStatus.isV3 ? (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  V3 Pending Validation
                </Badge>
              ) : (
                <Badge variant="outline">Legacy AMM</Badge>
              )}
            </div>

            {migrationState && (
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  {migrationState.migration_phase === 'completed' ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : migrationState.migration_phase === 'failed' ? (
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                  ) : (
                    <Clock className="h-3 w-3 text-yellow-600" />
                  )}
                  <span>Migration Phase: {migrationState.migration_phase}</span>
                </div>
                
                {Math.abs(migrationState.price_change_percent) > 0.01 && (
                  <div className={`text-xs ${
                    Math.abs(migrationState.price_change_percent) > 5 
                      ? 'text-yellow-600' 
                      : 'text-green-600'
                  }`}>
                    Price change: {migrationState.price_change_percent.toFixed(2)}%
                    {Math.abs(migrationState.price_change_percent) > 5 && " (High - requires review)"}
                  </div>
                )}
              </div>
            )}

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                This agent needs to be migrated to V3 linear pricing for accurate graduation progress and pricing.
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDryRun}
              disabled={isLoading}
              className="gap-1"
            >
              <Zap className="h-3 w-3" />
              Test
            </Button>

            <Button
              size="sm"
              onClick={handleMigrate}
              disabled={isLoading}
              className="gap-1"
            >
              {isLoading ? (
                <Clock className="h-3 w-3 animate-spin" />
              ) : (
                <TrendingUp className="h-3 w-3" />
              )}
              Migrate
            </Button>

            {migrationStatus.isV3 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRollback}
                disabled={isLoading}
                className="gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Rollback
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}