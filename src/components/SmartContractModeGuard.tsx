import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Database } from 'lucide-react';
import { useAdminSettings } from '@/hooks/useAdminSettings';

interface SmartContractModeGuardProps {
  agentCreationMode?: 'database' | 'smart_contract';
  tokenGraduated?: boolean;
  children: React.ReactNode;
  blockDatabaseTrading?: boolean;
}

/**
 * 🔒 Smart Contract Mode Guard
 * Prevents database trading when agent is smart contract based
 */
export function SmartContractModeGuard({ 
  agentCreationMode,
  tokenGraduated,
  children,
  blockDatabaseTrading = true
}: SmartContractModeGuardProps) {
  const { settings } = useAdminSettings();
  const globalMode = settings?.deployment_mode;

  // Block if agent was created in smart_contract mode OR if token is graduated
  const isSmartContractAgent = agentCreationMode === 'smart_contract' || tokenGraduated;
  const shouldBlock = blockDatabaseTrading && isSmartContractAgent;

  if (shouldBlock) {
    return (
      <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/30">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="space-y-2">
          <div>
            <p className="font-semibold text-blue-800 dark:text-blue-300">
              Smart Contract Token
            </p>
            <p className="text-blue-700 dark:text-blue-400 text-sm">
              This token uses on-chain smart contracts. Database simulation is disabled.
              {tokenGraduated && ' Token has graduated to DEX.'}
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
            <Shield className="h-3 w-3" />
            <span>Trading occurs on Base Sepolia network</span>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Show mode indicator but allow interaction
  return (
    <div className="space-y-2">
      {(globalMode === 'smart_contract' || isSmartContractAgent) && (
        <Alert className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
          <Shield className="h-3 w-3 text-blue-600" />
          <AlertDescription className="text-xs text-blue-700 dark:text-blue-400">
            Smart Contract Mode Active
          </AlertDescription>
        </Alert>
      )}
      {children}
    </div>
  );
}
