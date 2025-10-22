import { useAppMode } from './useAppMode';
import { useNetworkMode } from './useNetworkMode';
import { useAdminSettings } from './useAdminSettings';

export type DeploymentMethod = 'database' | 'contract';

export const useDeploymentMode = () => {
  const { isTestMode } = useAppMode();
  const { networkMode, currentChain, targetChainId } = useNetworkMode();
  const { settings } = useAdminSettings();
  
  // Access deployment_modes from admin_settings - it's stored as a JSONB value
  // Settings might have a deployment_modes key that wasn't in the original AdminSettings type
  const deploymentModesValue = (settings as any)?.deployment_modes as any;
  const allowDatabaseOnly = deploymentModesValue?.allow_database_only ?? true;
  const allowContractDeployment = deploymentModesValue?.allow_contract_deployment ?? true;
  const defaultMode = deploymentModesValue?.default_mode ?? 'contract';
  
  return {
    // Environment state
    isTestEnvironment: isTestMode && networkMode === 'testnet',
    isProductionEnvironment: !isTestMode && networkMode === 'mainnet',
    
    // What's allowed
    allowDatabaseAgents: isTestMode && allowDatabaseOnly,
    allowContractAgents: allowContractDeployment,
    
    // Network info
    currentNetwork: networkMode === 'testnet' ? 'Base Sepolia' : 'Base Mainnet',
    networkEnvironment: networkMode === 'testnet' ? 'testnet' : 'mainnet' as 'testnet' | 'mainnet',
    chainId: targetChainId,
    currentChain,
    
    // Deployment methods
    availableMethods: {
      database: isTestMode && allowDatabaseOnly,
      contract: allowContractDeployment,
    },
    
    // Default
    defaultDeploymentMethod: defaultMode as DeploymentMethod,
  };
};
