import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle } from 'lucide-react';
import { useAppMode } from '@/hooks/useAppMode';

interface TradingModeGuardProps {
  tokenAddress?: string;
  tokenGraduated?: boolean;
  children: React.ReactNode;
}

/**
 * 🔐 Production Safety Guard Component
 * Prevents real contract trading in test mode
 */
export function TradingModeGuard({ 
  tokenAddress, 
  tokenGraduated, 
  children 
}: TradingModeGuardProps) {
  const { mode, isTestMode, setAppMode, canChangeMode } = useAppMode();
  
  // Check if this would be a real contract trade in test mode
  const wouldBeBlockedTrade = isTestMode && tokenAddress && tokenGraduated;

  if (wouldBeBlockedTrade) {
    return (
      <Alert className="border-orange-500 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="space-y-3">
          <div>
            <p className="font-semibold text-orange-800">Real Contract Trading Disabled</p>
            <p className="text-orange-700 text-sm">
              This token has graduated to a smart contract, but you're in test mode. 
              Real contract trading is disabled for safety.
            </p>
          </div>
          
          {canChangeMode && (
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={() => setAppMode('production')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Shield className="h-3 w-3 mr-1" />
                Switch to Production Mode
              </Button>
              <span className="text-xs text-orange-600">
                (Admin only)
              </span>
            </div>
          )}
          
          {!canChangeMode && (
            <p className="text-xs text-orange-600">
              Contact an admin to enable production trading mode.
            </p>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}