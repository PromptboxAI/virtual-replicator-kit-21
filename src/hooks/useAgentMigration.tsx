import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MigrationStatus {
  isV3: boolean;
  migrationValidated: boolean;
  migrationCompletedAt?: string;
  needsMigration: boolean;
}

interface MigrationState {
  id: string;
  migration_phase: string;
  validation_passed: boolean;
  old_price: number;
  new_price: number;
  price_change_percent: number;
}

export function useAgentMigration(agentId: string) {
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>({
    isV3: false,
    migrationValidated: false,
    needsMigration: true
  });
  const [migrationState, setMigrationState] = useState<MigrationState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check migration status
  const checkMigrationStatus = useCallback(async () => {
    if (!agentId) return;

    try {
      const { data: agent, error } = await supabase
        .from('agents')
        .select('pricing_model, migration_validated, migration_completed_at')
        .eq('id', agentId)
        .single();

      if (error) {
        console.error('Failed to check migration status:', error);
        return;
      }

      const isV3 = agent.pricing_model === 'linear_v3';
      const isV4 = agent.pricing_model === 'linear_v4';
      const migrationValidated = agent.migration_validated || false;
      // V4 agents don't need migration, only legacy and unvalidated V3
      const needsMigration = !isV4 && (!isV3 || !migrationValidated);

      setMigrationStatus({
        isV3,
        migrationValidated,
        migrationCompletedAt: agent.migration_completed_at,
        needsMigration
      });

      // Get latest migration state if exists
      const { data: stateData } = await supabase
        .from('agent_migration_state')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (stateData) {
        const priceChangePercent = stateData.old_price > 0 ? 
          ((stateData.new_price - stateData.old_price) / stateData.old_price) * 100 : 0;

        setMigrationState({
          ...stateData,
          price_change_percent: priceChangePercent
        });
      }

    } catch (error) {
      console.error('Migration status check failed:', error);
    }
  }, [agentId]);

  // Run dry-run migration test
  const runDryMigration = useCallback(async () => {
    if (!agentId) return null;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('migrate-agent-v3', {
        body: {
          agentId,
          dryRun: true
        }
      });

      if (error) throw error;

      return data.results?.[0] || null;
    } catch (error) {
      console.error('Dry migration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  // Perform actual migration
  const migrateAgent = useCallback(async () => {
    if (!agentId) return null;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('migrate-agent-v3', {
        body: {
          agentId,
          dryRun: false
        }
      });

      if (error) throw error;

      // Refresh status after migration
      await checkMigrationStatus();

      return data.results?.[0] || null;
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [agentId, checkMigrationStatus]);

  // Rollback migration
  const rollbackMigration = useCallback(async () => {
    if (!agentId) return null;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('rollback_agent_migration', {
        p_agent_id: agentId
      });

      if (error) throw error;

      // Refresh status after rollback
      await checkMigrationStatus();

      return data;
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [agentId, checkMigrationStatus]);

  // Load status on mount and when agentId changes
  useEffect(() => {
    checkMigrationStatus();
  }, [checkMigrationStatus]);

  return {
    migrationStatus,
    migrationState,
    isLoading,
    runDryMigration,
    migrateAgent,
    rollbackMigration,
    refreshStatus: checkMigrationStatus
  };
}