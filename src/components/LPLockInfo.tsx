import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lock, Droplets, ExternalLink, Loader2, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';

interface LPLockInfoProps {
  agentId: string;
  agentName?: string;
}

interface LPInfo {
  lpPairAddress: string;
  totalLpTokens: number;
  lpLocked: number;
  lpToVault: number;
  lockId: number;
  unlockTime: Date;
  lockedPercent: number;
  daysUntilUnlock: number;
  lockProgress: number;
}

export function LPLockInfo({ agentId, agentName }: LPLockInfoProps) {
  const { data: lpInfo, isLoading } = useQuery({
    queryKey: ['lp-info', agentId],
    queryFn: async (): Promise<LPInfo | null> => {
      const { data, error } = await supabase
        .from('agent_lp_info')
        .select('*')
        .eq('agent_id', agentId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      const now = new Date();
      const unlockTime = new Date(data.unlock_time);
      const createdAt = new Date(data.created_at);
      
      const totalLockDuration = unlockTime.getTime() - createdAt.getTime();
      const elapsed = now.getTime() - createdAt.getTime();
      const lockProgress = Math.min(100, (elapsed / totalLockDuration) * 100);
      
      const daysUntilUnlock = Math.max(0, differenceInDays(unlockTime, now));

      return {
        lpPairAddress: data.lp_pair_address,
        totalLpTokens: data.total_lp_tokens,
        lpLocked: data.lp_locked,
        lpToVault: data.lp_to_vault,
        lockId: data.lock_id,
        unlockTime,
        lockedPercent: (data.lp_locked / data.total_lp_tokens) * 100,
        daysUntilUnlock,
        lockProgress,
      };
    },
    enabled: !!agentId,
  });

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!lpInfo) {
    return null;
  }

  const isUnlocked = new Date() >= lpInfo.unlockTime;

  return (
    <Card className="border-border/50 bg-gradient-to-br from-blue-500/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-lg">Liquidity Lock</CardTitle>
          </div>
          {isUnlocked ? (
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              Unlocked
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              <Lock className="h-3 w-3 mr-1" />
              95% Locked
            </Badge>
          )}
        </div>
        <CardDescription>
          LP tokens locked for 3 years to ensure liquidity
          {agentName && ` for ${agentName}`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Lock Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Lock Progress</span>
            <span className="font-medium">{lpInfo.lockProgress.toFixed(1)}%</span>
          </div>
          <Progress value={lpInfo.lockProgress} className="h-2" />
          {!isUnlocked && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Unlocks {formatDistanceToNow(lpInfo.unlockTime, { addSuffix: true })}
              <span>({lpInfo.daysUntilUnlock} days)</span>
            </div>
          )}
        </div>

        {/* LP Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-sm font-medium">Locked LP (95%)</p>
                <p className="text-xs text-muted-foreground">
                  {lpInfo.lpLocked.toLocaleString()} tokens
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-blue-500/30 text-blue-400">
              3 Years
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Vault LP (5%)</p>
                <p className="text-xs text-muted-foreground">
                  {lpInfo.lpToVault.toLocaleString()} tokens
                </p>
              </div>
            </div>
            <Badge variant="outline">
              Immediate
            </Badge>
          </div>
        </div>

        {/* LP Pair Address */}
        {lpInfo.lpPairAddress !== '0x0000000000000000000000000000000000000000' && (
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">LP Pair</span>
              <a
                href={`https://basescan.org/address/${lpInfo.lpPairAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline font-mono text-xs"
              >
                {lpInfo.lpPairAddress.slice(0, 6)}...{lpInfo.lpPairAddress.slice(-4)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-muted-foreground">Unlock Date</span>
              <span className="font-medium">
                {format(lpInfo.unlockTime, 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
