import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Rocket, Clock, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MigrationBannerProps {
  agentName: string;
  onComplete?: () => void;
}

/**
 * Migration Banner - Phase 4 implementation
 * Shows when agent is graduating from bonding curve to DEX listing
 */
export function MigrationBanner({ agentName, onComplete }: MigrationBannerProps) {
  return (
    <Card className="border-2 border-orange-500/50 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          {/* Animated Spinner */}
          <div className="flex-shrink-0">
            <div className="relative">
              <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
              <Rocket className="h-4 w-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-orange-600" />
            </div>
          </div>
          
          {/* Migration Message */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                <Clock className="h-3 w-3 mr-1" />
                Migrating
              </Badge>
              <h3 className="font-semibold text-orange-900 dark:text-orange-200">
                Finalizing DEX Listing
              </h3>
            </div>
            
            <p className="text-sm text-orange-800 dark:text-orange-300">
              <span className="font-medium">{agentName}</span> has graduated! 
              Please hold tight while we prepare live trading via OKX. 
              This usually takes less than a minute.
            </p>
            
            {/* Migration Steps */}
            <div className="flex items-center gap-4 text-xs text-orange-700 dark:text-orange-400 mt-3">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Bonding Curve Complete</span>
              </div>
              <div className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Creating DEX Liquidity</span>
              </div>
              <div className="flex items-center gap-1 opacity-50">
                <div className="h-3 w-3 rounded-full border-2 border-gray-400" />
                <span>Live Trading Ready</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}