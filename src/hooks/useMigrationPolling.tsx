import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MigrationPollingProps {
  agentId: string;
  isEnabled: boolean;
  onComplete: () => void;
  pollingInterval?: number; // in milliseconds
}

/**
 * Migration Polling Hook - Phase 4 implementation
 * Polls for agent token deployment completion every 5-10 seconds
 */
export function useMigrationPolling({ 
  agentId, 
  isEnabled, 
  onComplete, 
  pollingInterval = 7000 // 7 seconds default
}: MigrationPollingProps) {
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  const checkTokenDeployment = useCallback(async () => {
    if (!agentId || !isEnabled) return;

    setIsPolling(true);
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('token_address')
        .eq('id', agentId)
        .single();

      if (error) {
        console.error('Migration polling error:', error);
        return;
      }

      // If token_address is now populated, migration is complete
      if (data?.token_address) {
        console.log('Migration complete! Token deployed:', data.token_address);
        onComplete();
        return;
      }

      setPollCount(prev => prev + 1);
    } catch (error) {
      console.error('Migration polling failed:', error);
    } finally {
      setIsPolling(false);
    }
  }, [agentId, isEnabled, onComplete]);

  useEffect(() => {
    if (!isEnabled) {
      setPollCount(0);
      return;
    }

    // Start immediate check
    checkTokenDeployment();

    // Set up polling interval
    const interval = setInterval(checkTokenDeployment, pollingInterval);

    return () => clearInterval(interval);
  }, [isEnabled, checkTokenDeployment, pollingInterval]);

  return {
    isPolling,
    pollCount,
    checkNow: checkTokenDeployment
  };
}