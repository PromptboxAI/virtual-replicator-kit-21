import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAccount } from 'wagmi';
import { ArrowRight, Info, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface MigrationOption {
  v1Contract: string;
  v2Contract: string;
  agentId: string;
  totalV1Supply: string;
  totalV1Holders: number;
  migrationRatio: string;
}

interface MigrationEligibility {
  eligible: boolean;
  v1Balance: string;
  v2Balance: string;
  migrationRatio: string;
  estimatedV2Tokens: string;
}

export function AgentMigrationManager() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [migrationOptions, setMigrationOptions] = useState<MigrationOption[]>([]);
  const [eligibility, setEligibility] = useState<{ [key: string]: MigrationEligibility }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [migrationInProgress, setMigrationInProgress] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      loadMigrationOptions();
    }
  }, [address]);

  const loadMigrationOptions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('migrate-agent-token', {
        body: { action: 'get_options' }
      });

      if (error) throw error;

      if (data?.success) {
        setMigrationOptions(data.migrationOptions || []);
        
        // Check eligibility for each migration option
        if (address && data.migrationOptions?.length > 0) {
          await checkAllEligibility(data.migrationOptions);
        }
      } else {
        throw new Error(data?.error || 'Failed to load migration options');
      }
    } catch (error: any) {
      toast({
        title: "Error Loading Migration Options",
        description: error.message || "Failed to load available migrations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkAllEligibility = async (options: MigrationOption[]) => {
    if (!address) return;

    try {
      const eligibilityChecks = await Promise.all(
        options.map(async (option) => {
          const { data } = await supabase.functions.invoke('migrate-agent-token', {
            body: {
              action: 'check_eligibility',
              userAddress: address,
              v1Contract: option.v1Contract,
              v2Contract: option.v2Contract
            }
          });

          return {
            key: option.agentId,
            eligibility: data?.eligibility || null
          };
        })
      );

      const eligibilityMap: { [key: string]: MigrationEligibility } = {};
      eligibilityChecks.forEach(({ key, eligibility }) => {
        if (eligibility) {
          eligibilityMap[key] = eligibility;
        }
      });

      setEligibility(eligibilityMap);
    } catch (error) {
      console.warn('Error checking eligibility:', error);
    }
  };

  const handleMigration = async (option: MigrationOption) => {
    if (!address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to migrate tokens.",
        variant: "destructive",
      });
      return;
    }

    setMigrationInProgress(option.agentId);

    try {
      const { data, error } = await supabase.functions.invoke('migrate-agent-token', {
        body: {
          action: 'migrate',
          userAddress: address,
          v1Contract: option.v1Contract,
          v2Contract: option.v2Contract
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "🚀 Migration Initiated",
          description: `Migration transaction submitted. Hash: ${data.transactionHash.slice(0, 10)}...`,
        });

        // Refresh eligibility after a delay
        setTimeout(() => {
          checkAllEligibility([option]);
        }, 5000);
      } else {
        throw new Error(data?.error || 'Migration failed');
      }
    } catch (error: any) {
      toast({
        title: "Migration Failed",
        description: error.message || "Failed to migrate tokens",
        variant: "destructive",
      });
    } finally {
      setMigrationInProgress(null);
    }
  };

  if (!address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            Agent Token Migration
          </CardTitle>
          <CardDescription>
            Upgrade your V1 agent tokens to V2 with enhanced slippage protection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <p className="text-muted-foreground">
              Please connect your wallet to view available migrations
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5" />
                Agent Token Migration
              </CardTitle>
              <CardDescription>
                Upgrade your V1 agent tokens to V2 with enhanced slippage protection
              </CardDescription>
            </div>
            <Button onClick={loadMigrationOptions} disabled={isLoading} variant="outline">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">V2 Improvements</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                  <li>• Built-in slippage protection on all trades</li>
                  <li>• Enhanced bonding curve mechanics</li>
                  <li>• Improved gas efficiency</li>
                  <li>• Better transaction lifecycle management</li>
                </ul>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading migration options...</p>
            </div>
          ) : migrationOptions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="font-medium mb-2">No Migrations Available</h3>
              <p className="text-muted-foreground">
                You don't have any V1 tokens eligible for migration, or all your tokens are already on V2.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {migrationOptions.map((option) => {
                const elig = eligibility[option.agentId];
                const isEligible = elig?.eligible && parseFloat(elig.v1Balance) > 0;
                const isMigrating = migrationInProgress === option.agentId;

                return (
                  <Card key={option.agentId} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">Agent Token Migration</h4>
                            <Badge variant={isEligible ? "default" : "secondary"}>
                              {isEligible ? "Eligible" : "No V1 Balance"}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-muted-foreground">V1 Balance</p>
                              <p className="font-mono">{elig?.v1Balance || "0"} tokens</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Estimated V2 Tokens</p>
                              <p className="font-mono text-green-600">
                                {elig?.estimatedV2Tokens || "0"} tokens
                              </p>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>V1 Contract: <code className="bg-muted px-1 rounded">{option.v1Contract.slice(0, 10)}...</code></p>
                            <p>V2 Contract: <code className="bg-muted px-1 rounded">{option.v2Contract.slice(0, 10)}...</code></p>
                          </div>
                        </div>

                        <div className="ml-4">
                          <Button
                            onClick={() => handleMigration(option)}
                            disabled={!isEligible || isMigrating}
                            size="sm"
                          >
                            {isMigrating ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Migrating...
                              </>
                            ) : (
                              <>
                                <ArrowRight className="w-4 h-4 mr-2" />
                                Migrate to V2
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {isEligible && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span>Migration Progress</span>
                            <span>1:1 Ratio</span>
                          </div>
                          <Progress value={100} className="mt-2 h-2" />
                          <p className="text-xs text-muted-foreground mt-2">
                            All V1 tokens will be converted to V2 tokens at a 1:1 ratio
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}