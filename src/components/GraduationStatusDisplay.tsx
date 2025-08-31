import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, Zap, Trophy, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { formatPromptAmountV3 } from '@/lib/bondingCurveV3';

interface GraduationEvent {
  id: string;
  agent_id: string;
  graduation_timestamp: string;
  prompt_raised_at_graduation: number;
  graduation_status: string;
  v2_contract_address?: string;
  deployment_tx_hash?: string;
  liquidity_pool_address?: string;
  liquidity_tx_hash?: string;
  error_message?: string;
  metadata?: any;
}

interface GraduationStatusDisplayProps {
  agentId: string;
  currentPromptRaised: number;
  isGraduated?: boolean;
  tokenAddress?: string;
}

const GRADUATION_THRESHOLD = 42000;

export const GraduationStatusDisplay: React.FC<GraduationStatusDisplayProps> = ({
  agentId,
  currentPromptRaised,
  isGraduated = false,
  tokenAddress
}) => {
  const [graduationEvent, setGraduationEvent] = useState<GraduationEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGraduationEvent = async () => {
      if (!isGraduated) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('agent_graduation_events')
          .select('*')
          .eq('agent_id', agentId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error('Error fetching graduation event:', error);
        } else {
          setGraduationEvent(data);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGraduationEvent();

    // Subscribe to real-time updates for graduation events
    const channel = supabase
      .channel('graduation-events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_graduation_events',
          filter: `agent_id=eq.${agentId}`
        },
        (payload) => {
          console.log('Graduation event update:', payload);
          if (payload.new) {
            setGraduationEvent(payload.new as GraduationEvent);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, isGraduated]);

  const graduationProgress = Math.min((currentPromptRaised / GRADUATION_THRESHOLD) * 100, 100);
  const remainingPrompt = Math.max(GRADUATION_THRESHOLD - currentPromptRaised, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'initiated':
        return <Clock className="h-4 w-4" />;
      case 'contract_deploying':
        return <Zap className="h-4 w-4 animate-pulse" />;
      case 'contract_deployed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'liquidity_creating':
        return <Zap className="h-4 w-4 animate-pulse" />;
      case 'liquidity_created':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <Trophy className="h-4 w-4 text-gold" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'initiated':
        return 'bg-blue-500/10 text-blue-400';
      case 'contract_deploying':
        return 'bg-yellow-500/10 text-yellow-400';
      case 'contract_deployed':
        return 'bg-green-500/10 text-green-400';
      case 'liquidity_creating':
        return 'bg-purple-500/10 text-purple-400';
      case 'liquidity_created':
        return 'bg-green-500/10 text-green-400';
      case 'completed':
        return 'bg-gold/10 text-gold';
      case 'failed':
        return 'bg-red-500/10 text-red-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-2 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isGraduated) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-muted-foreground" />
            Graduation Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>PROMPT Raised</span>
              <span className="font-medium">
                {formatPromptAmountV3(currentPromptRaised)} / {formatPromptAmountV3(GRADUATION_THRESHOLD)}
              </span>
            </div>
            <Progress value={graduationProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {remainingPrompt > 0 
                ? `${formatPromptAmountV3(remainingPrompt)} PROMPT needed to graduate`
                : 'Ready to graduate!'
              }
            </p>
          </div>
          
          {graduationProgress >= 100 && (
            <div className="p-4 bg-gold/10 border border-gold/20 rounded-lg">
              <div className="flex items-center gap-2 text-gold">
                <Trophy className="h-4 w-4" />
                <span className="font-medium">Ready for Graduation!</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                This agent will graduate to a DEX with the next trade.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gold/20 bg-gradient-to-br from-gold/5 to-gold/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-gold" />
          <span className="text-gold">Agent Graduated!</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Graduated at</p>
            <p className="font-medium">{formatPromptAmountV3(currentPromptRaised)} PROMPT</p>
          </div>
          <div>
            <p className="text-muted-foreground">Date</p>
            <p className="font-medium">
              {graduationEvent?.graduation_timestamp 
                ? new Date(graduationEvent.graduation_timestamp).toLocaleDateString()
                : 'N/A'
              }
            </p>
          </div>
        </div>

        {graduationEvent && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge className={getStatusColor(graduationEvent.graduation_status)}>
                <span className="flex items-center gap-1">
                  {getStatusIcon(graduationEvent.graduation_status)}
                  {formatStatus(graduationEvent.graduation_status)}
                </span>
              </Badge>
            </div>

            {graduationEvent.v2_contract_address && (
              <div className="space-y-2">
                <p className="text-sm font-medium">V2 Contract Address</p>
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs font-mono">
                  <span className="truncate">{graduationEvent.v2_contract_address}</span>
                  <ExternalLink 
                    className="h-3 w-3 cursor-pointer text-primary hover:text-primary-glow transition-colors" 
                    onClick={() => window.open(`https://sepolia.basescan.org/address/${graduationEvent.v2_contract_address}`, '_blank')}
                  />
                </div>
              </div>
            )}

            {graduationEvent.deployment_tx_hash && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Deployment Transaction</p>
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs font-mono">
                  <span className="truncate">{graduationEvent.deployment_tx_hash}</span>
                  <ExternalLink 
                    className="h-3 w-3 cursor-pointer text-primary hover:text-primary-glow transition-colors" 
                    onClick={() => window.open(`https://sepolia.basescan.org/tx/${graduationEvent.deployment_tx_hash}`, '_blank')}
                  />
                </div>
              </div>
            )}

            {graduationEvent.error_message && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
                <p className="text-sm text-red-400 font-medium">Error</p>
                <p className="text-xs text-red-300 mt-1">{graduationEvent.error_message}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};