import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RotateCcw, 
  Play, 
  Pause,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MigrationState {
  id: string;
  agent_id: string;
  migration_phase: string;
  old_price: number;
  new_price: number;
  old_supply: number;
  new_supply: number;
  validation_passed: boolean;
  migration_started_at: string;
  migration_completed_at?: string;
}

interface Agent {
  id: string;
  name: string;
  symbol: string;
  pricing_model: string;
  prompt_raised: number;
  current_price: number;
  migration_validated: boolean;
  migration_completed_at?: string;
}

export function MigrationDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [migrationStates, setMigrationStates] = useState<MigrationState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDryRun, setIsDryRun] = useState(true);
  const [batchSize, setBatchSize] = useState(5);
  const [migrationResults, setMigrationResults] = useState<any[]>([]);
  const { toast } = useToast();

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load agents that need migration
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('*')
        .or('pricing_model.is.null,pricing_model.eq.legacy_amm')
        .eq('is_active', true)
        .order('prompt_raised', { ascending: false });

      if (agentsError) throw agentsError;

      // Load migration states
      const { data: statesData, error: statesError } = await supabase
        .from('agent_migration_state')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (statesError) throw statesError;

      setAgents(agentsData || []);
      setMigrationStates(statesData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: "Error",
        description: "Failed to load migration data",
        variant: "destructive"
      });
    }
  };

  const runMigration = async (agentId?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('migrate-agent-v3', {
        body: {
          agentId,
          dryRun: isDryRun,
          batchSize: agentId ? 1 : batchSize,
          migrateAll: !agentId
        }
      });

      if (error) throw error;

      setMigrationResults(data.results || []);
      
      toast({
        title: isDryRun ? "Dry Run Complete" : "Migration Complete",
        description: `Processed ${data.totalProcessed} agents. ${data.successCount} successful, ${data.failureCount} failed.`,
        variant: data.failureCount > 0 ? "destructive" : "default"
      });

      if (!isDryRun) {
        loadData(); // Reload data after actual migration
      }
    } catch (error) {
      console.error('Migration failed:', error);
      toast({
        title: "Migration Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const rollbackAgent = async (agentId: string) => {
    try {
      const { data, error } = await supabase.rpc('rollback_agent_migration', {
        p_agent_id: agentId
      });

      if (error) throw error;

      toast({
        title: "Rollback Complete",
        description: `Agent ${agentId} has been rolled back successfully`,
      });

      loadData();
    } catch (error) {
      console.error('Rollback failed:', error);
      toast({
        title: "Rollback Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (phase: string) => {
    switch (phase) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
      case 'rolled_back':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (pricingModel: string, migrationValidated: boolean) => {
    if (pricingModel === 'linear_v3' && migrationValidated) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Migrated</Badge>;
    }
    if (pricingModel === 'linear_v3') {
      return <Badge variant="secondary">V3 Pending</Badge>;
    }
    return <Badge variant="outline">Legacy AMM</Badge>;
  };

  const totalAgents = agents.length;
  const migratedAgents = agents.filter(a => a.pricing_model === 'linear_v3' && a.migration_validated).length;
  const migrationProgress = totalAgents > 0 ? (migratedAgents / totalAgents) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Migration Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            V3 Migration Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Overview */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Migration Progress</span>
              <span className="text-sm text-muted-foreground">
                {migratedAgents} / {totalAgents} agents migrated
              </span>
            </div>
            <Progress value={migrationProgress} className="h-2" />
          </div>

          {/* Migration Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Mode:</label>
              <Button
                variant={isDryRun ? "default" : "outline"}
                size="sm"
                onClick={() => setIsDryRun(!isDryRun)}
              >
                {isDryRun ? "Dry Run" : "Live Migration"}
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Batch Size:</label>
              <select
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value={1}>1</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <Button
              onClick={() => runMigration()}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? <Clock className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isDryRun ? "Run Dry Test" : "Migrate Batch"}
            </Button>

            <Button variant="outline" onClick={loadData}>
              Refresh Data
            </Button>
          </div>

          {/* Migration Results */}
          {migrationResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Latest Migration Results:</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {migrationResults.map((result, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                    {result.success ? 
                      <CheckCircle className="h-4 w-4 text-green-600" /> : 
                      <XCircle className="h-4 w-4 text-red-600" />
                    }
                    <span className="font-medium">{result.agentName}</span>
                    {result.success ? (
                      <span className="text-green-600">
                        {result.dryRun ? 'Validation passed' : 'Migrated successfully'}
                      </span>
                    ) : (
                      <span className="text-red-600">{result.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agents List */}
      <Card>
        <CardHeader>
          <CardTitle>Agents Requiring Migration ({agents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agents.map((agent) => {
              const migrationState = migrationStates.find(s => s.agent_id === agent.id);
              const priceChange = migrationState ? 
                ((migrationState.new_price - migrationState.old_price) / migrationState.old_price) * 100 : 0;

              return (
                <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{agent.name}</span>
                      <span className="text-sm text-muted-foreground">({agent.symbol})</span>
                      {getStatusBadge(agent.pricing_model, agent.migration_validated)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>PROMPT: {agent.prompt_raised.toFixed(2)}</span>
                      <span>Price: {agent.current_price.toFixed(6)}</span>
                      {migrationState && (
                        <span className={`flex items-center gap-1 ${
                          Math.abs(priceChange) > 5 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {getStatusIcon(migrationState.migration_phase)}
                          {Math.abs(priceChange) > 0.01 && `${priceChange.toFixed(2)}% price change`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runMigration(agent.id)}
                      disabled={isLoading}
                    >
                      {isDryRun ? "Test" : "Migrate"}
                    </Button>
                    
                    {agent.pricing_model === 'linear_v3' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rollbackAgent(agent.id)}
                        className="gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Rollback
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {agents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                🎉 All agents have been migrated to V3!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Safety Warning */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Safety Notice:</strong> Always run dry tests before live migration. 
          Price changes over 5% will be flagged for manual review. 
          All migrations can be rolled back if needed.
        </AlertDescription>
      </Alert>
    </div>
  );
}