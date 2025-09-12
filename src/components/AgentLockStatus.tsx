import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Clock, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AgentLockStatusProps {
  agent: {
    id: string;
    name: string;
    creation_locked?: boolean;
    creation_expires_at?: string | null;
    creator_id?: string;
  };
  currentUserId?: string;
  variant?: 'badge' | 'alert' | 'inline';
}

export function AgentLockStatus({ 
  agent, 
  currentUserId, 
  variant = 'badge' 
}: AgentLockStatusProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!agent.creation_locked || !agent.creation_expires_at) {
      return;
    }

    const updateCountdown = () => {
      const expiryTime = new Date(agent.creation_expires_at!).getTime();
      const now = Date.now();
      const difference = expiryTime - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft('Expired');
        return;
      }

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

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [agent.creation_locked, agent.creation_expires_at]);

  // Don't show if not locked or already expired
  if (!agent.creation_locked || isExpired) {
    return null;
  }

  const isCreator = currentUserId === agent.creator_id;

  if (variant === 'badge') {
    return (
      <Badge 
        variant={isCreator ? "default" : "destructive"} 
        className="flex items-center gap-1 text-xs"
      >
        <Shield className="w-3 h-3" />
        {isCreator ? 'Creator Lock' : 'Locked'}
        {timeLeft && (
          <>
            <Clock className="w-3 h-3" />
            {timeLeft}
          </>
        )}
      </Badge>
    );
  }

  if (variant === 'alert') {
    return (
      <Alert className={isCreator ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
        <Shield className="w-4 h-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>
              {isCreator 
                ? `You have exclusive trading access to ${agent.name}` 
                : `${agent.name} is in creator lock period`
              }
            </span>
            {timeLeft && (
              <div className="flex items-center gap-1 text-sm font-medium">
                <Clock className="w-3 h-3" />
                {timeLeft}
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
        isCreator 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-orange-100 text-orange-800 border border-orange-200'
      }`}>
        <Shield className="w-4 h-4" />
        <span>
          {isCreator ? 'Your exclusive trading window' : 'Creator-only trading'}
        </span>
        {timeLeft && (
          <div className="flex items-center gap-1 ml-auto">
            <Clock className="w-3 h-3" />
            <span className="font-medium">{timeLeft}</span>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export function AgentLockInfo({ 
  isLocked, 
  timeLeft, 
  isCreator 
}: { 
  isLocked: boolean; 
  timeLeft: string; 
  isCreator: boolean; 
}) {
  if (!isLocked) return null;

  return (
    <div className="bg-purple-50 dark:bg-purple-950/50 border border-purple-200 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-4 h-4 text-purple-600" />
        <span className="font-medium text-purple-900 dark:text-purple-100">
          MEV Protection Active
        </span>
      </div>
      <div className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
        <p>
          {isCreator 
            ? '✅ You can trade during this protection period'
            : '⏳ Only the creator can trade during this period'
          }
        </p>
        {timeLeft && (
          <div className="flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3" />
            <span>{timeLeft} remaining</span>
          </div>
        )}
      </div>
    </div>
  );
}