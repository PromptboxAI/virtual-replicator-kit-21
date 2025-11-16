import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { getAgentGraduationThreshold, getGraduationProgress } from '@/services/GraduationService';
import { Units } from '@/lib/units';

interface GraduationProgressBarProps {
  agentId: string;
  promptRaised: number;
  fx: string;
  className?: string;
}

/**
 * Unified Graduation Progress Display
 * Shows consistent graduation progress across the platform
 */
export function GraduationProgressBar({ 
  agentId, 
  promptRaised, 
  fx,
  className 
}: GraduationProgressBarProps) {
  const [threshold, setThreshold] = useState<number>(42000);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const fetchProgress = async () => {
      const thresholdValue = await getAgentGraduationThreshold(agentId);
      const progressValue = await getGraduationProgress(agentId, promptRaised);
      
      setThreshold(thresholdValue);
      setProgress(progressValue);
    };

    fetchProgress();
  }, [agentId, promptRaised]);

  const isNearGraduation = progress >= 90;
  const isGraduated = progress >= 100;

  // Calculate USD values
  const raisedUSD = Units.toDisplay(promptRaised.toString(), fx, 'USD');
  const thresholdUSD = Units.toDisplay(threshold.toString(), fx, 'USD');

  return (
    <Card className={cn("p-4", className)}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isGraduated ? (
              <Trophy className="h-5 w-5 text-yellow-500" />
            ) : (
              <TrendingUp className="h-5 w-5 text-primary" />
            )}
            <h3 className="font-semibold">
              {isGraduated ? 'Graduated!' : 'Ascension Progress'}
            </h3>
          </div>
          <span className={cn(
            "text-sm font-medium",
            isGraduated && "text-yellow-500",
            isNearGraduation && !isGraduated && "text-orange-500"
          )}>
            {progress.toFixed(1)}%
          </span>
        </div>

        {/* Progress Bar */}
        <Progress 
          value={progress} 
          className="h-2"
        />

        {/* Details */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <div>
            <div className="font-medium text-foreground">
              {Units.formatPrice(promptRaised.toString(), 'PROMPT')}
            </div>
            <div>{Units.formatPrice(raisedUSD, 'USD')}</div>
          </div>
          <div className="text-right">
            <div className="font-medium text-foreground">
              {Units.formatPrice(threshold.toString(), 'PROMPT')}
            </div>
            <div>{Units.formatPrice(thresholdUSD, 'USD')}</div>
          </div>
        </div>

        {/* Status Message */}
        {!isGraduated && (
          <div className="text-xs text-muted-foreground text-center pt-1">
            {isNearGraduation 
              ? '🔥 Almost there! Graduation imminent'
              : `${Units.formatPrice((threshold - promptRaised).toString(), 'PROMPT')} to go`
            }
          </div>
        )}
      </div>
    </Card>
  );
}
