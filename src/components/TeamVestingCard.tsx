import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, CheckCircle2, Loader2, Lock } from 'lucide-react';
import { useTeamVesting } from '@/hooks/useTeamVesting';
import { format, formatDistanceToNow } from 'date-fns';

interface TeamVestingCardProps {
  agentId: string;
  walletAddress?: string;
  agentName?: string;
}

export function TeamVestingCard({ agentId, walletAddress, agentName }: TeamVestingCardProps) {
  const { vesting, isLoading, isClaiming, isBeneficiary, claim, hasVesting, canClaim } = useTeamVesting({
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

  if (!hasVesting) {
    return null;
  }

  const vestProgress = vesting?.fullyVested
    ? 100
    : vesting?.cliff1Reached
      ? 50
      : 0;

  return (
    <Card className="border-border/50 bg-gradient-to-br from-secondary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-secondary-foreground" />
            <CardTitle className="text-lg">Team Vesting</CardTitle>
          </div>
          {vesting?.fullyVested ? (
            <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Fully Vested
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              <Lock className="h-3 w-3 mr-1" />
              Cliff Vesting
            </Badge>
          )}
        </div>
        <CardDescription>
          10% team allocation with 3-month and 6-month cliffs
          {agentName && ` for ${agentName}`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Cliff Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Vest Progress</span>
            <span className="font-medium">{vestProgress}%</span>
          </div>
          <Progress value={vestProgress} className="h-2" />
        </div>

        {/* Cliff Timeline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {vesting?.cliff1Reached ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
              <span>Cliff 1 (50%)</span>
            </div>
            <span className={vesting?.cliff1Reached ? 'text-green-500' : 'text-muted-foreground'}>
              {vesting?.cliff1Time && format(vesting.cliff1Time, 'MMM d, yyyy')}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {vesting?.cliff2Reached ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
              <span>Cliff 2 (100%)</span>
            </div>
            <span className={vesting?.cliff2Reached ? 'text-green-500' : 'text-muted-foreground'}>
              {vesting?.cliff2Time && format(vesting.cliff2Time, 'MMM d, yyyy')}
            </span>
          </div>
        </div>

        {/* Next Cliff Info */}
        {vesting?.nextCliffDate && vesting.daysUntilNextCliff !== null && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">
              Next cliff {formatDistanceToNow(vesting.nextCliffDate, { addSuffix: true })}
              <span className="ml-1">({vesting.daysUntilNextCliff} days)</span>
            </p>
          </div>
        )}

        {/* Amounts */}
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Allocation</p>
            <p className="text-lg font-semibold">
              {vesting?.totalAmount.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Claimed</p>
            <p className="text-lg font-semibold">
              {vesting?.claimedAmount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Claimable - Only show for beneficiary */}
        {isBeneficiary && (
          <div className="rounded-lg bg-primary/10 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Available to Claim</p>
                <p className="text-xl font-bold text-primary">
                  {vesting?.claimableAmount.toLocaleString()}
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
        )}

        {!isBeneficiary && walletAddress && (
          <p className="text-xs text-muted-foreground text-center">
            Only the team beneficiary can claim these tokens
          </p>
        )}
      </CardContent>
    </Card>
  );
}
