import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AgentLockData {
  creation_locked: boolean;
  creation_expires_at: string | null;
  creator_id: string;
}

export function useAgentLockStatus(agentId: string | undefined) {
  const [lockData, setLockData] = useState<AgentLockData | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Fetch agent lock data
  useEffect(() => {
    if (!agentId) return;

    const fetchLockData = async () => {
      try {
        const { data, error } = await supabase
          .from('agents')
          .select('creation_locked, creation_expires_at, creator_id')
          .eq('id', agentId)
          .single();

        if (error) {
          console.error('Failed to fetch lock data:', error);
          return;
        }

        setLockData(data);
      } catch (error) {
        console.error('Lock data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLockData();
  }, [agentId]);

  // Update lock status and countdown
  useEffect(() => {
    if (!lockData) return;

    const updateLockStatus = () => {
      if (!lockData.creation_locked || !lockData.creation_expires_at) {
        setIsLocked(false);
        setTimeLeft('');
        return;
      }

      const expiryTime = new Date(lockData.creation_expires_at).getTime();
      const now = Date.now();
      const difference = expiryTime - now;

      if (difference <= 0) {
        setIsLocked(false);
        setTimeLeft('');
        return;
      }

      setIsLocked(true);

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateLockStatus();
    const interval = setInterval(updateLockStatus, 1000);

    return () => clearInterval(interval);
  }, [lockData]);

  const canTrade = (userId: string | undefined): boolean => {
    if (!isLocked || !lockData) return true;
    return userId === lockData.creator_id;
  };

  const isCreator = (userId: string | undefined): boolean => {
    return userId === lockData?.creator_id;
  };

  return {
    isLocked,
    timeLeft,
    canTrade,
    isCreator,
    creatorId: lockData?.creator_id,
    loading,
    lockData
  };
}

export async function unlockExpiredAgents() {
  try {
    const { data, error } = await supabase.rpc('unlock_expired_agents');
    
    if (error) {
      console.error('Failed to unlock expired agents:', error);
      return 0;
    }

    console.log(`Unlocked ${data} expired agents`);
    return data || 0;
  } catch (error) {
    console.error('Error unlocking expired agents:', error);
    return 0;
  }
}