import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Gift, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { useRewardClaim } from '@/hooks/useRewardClaim';
import { formatDistanceToNow } from 'date-fns';

interface RewardClaimCardProps {
  agentId: string;
  walletAddress?: string;
  agentName?: string;
}

export function RewardClaimCard({ agentId, walletAddress, agentName }: RewardClaimCardProps) {
  const { reward, isLoading, isClaiming, claim, hasReward, canClaim } = useRewardClaim({
    agentId,
    walletAddress,
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

  if (!hasReward) {
    return null;
  }

  return (
    <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Holder Rewards</CardTitle>
          </div>
          {reward?.fullyVested ? (
            <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Fully Vested
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              <Clock className="h-3 w-3 mr-1" />
              Vesting
            </Badge>
          )}
        </div>
        <CardDescription>
          5% bonus reward for pre-graduation holders
          {agentName && ` of ${agentName}`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Vest Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Vest Progress</span>
            <span className="font-medium">{reward?.vestProgress.toFixed(1)}%</span>
          </div>
          <Progress value={reward?.vestProgress || 0} className="h-2" />
          {reward && !reward.fullyVested && (
            <p className="text-xs text-muted-foreground">
              Fully vested {formatDistanceToNow(reward.vestEndTime, { addSuffix: true })}
            </p>
          )}
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Reward</p>
            <p className="text-lg font-semibold">
              {reward?.totalRewardAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Claimed</p>
            <p className="text-lg font-semibold">
              {reward?.claimedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Claimable */}
        <div className="rounded-lg bg-primary/10 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Available to Claim</p>
              <p className="text-xl font-bold text-primary">
                {reward?.claimableAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
            <Button
              onClick={claim}
              disabled={!canClaim || isClaiming}
              size="sm"
            >
              {isClaiming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : (
                'Claim'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
