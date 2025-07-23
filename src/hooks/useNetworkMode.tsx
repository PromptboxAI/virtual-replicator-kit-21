import { useState, useEffect } from 'react';
import { useUserRole } from './useUserRole';
import { base, baseSepolia } from 'wagmi/chains';

export type NetworkMode = 'testnet' | 'mainnet';

export const useNetworkMode = () => {
  const { isAdmin } = useUserRole();
  const [networkMode, setNetworkMode] = useState<NetworkMode>('testnet');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // For non-admin users, always use testnet for now
    if (!isAdmin) {
      setNetworkMode('testnet');
      setIsLoading(false);
      return;
    }

    // For admin users, check localStorage for preference
    const savedMode = localStorage.getItem('network-mode') as NetworkMode;
    if (savedMode && (savedMode === 'testnet' || savedMode === 'mainnet')) {
      setNetworkMode(savedMode);
    } else {
      // Default to testnet for continued testing
      setNetworkMode('testnet');
    }
    setIsLoading(false);
  }, [isAdmin]);

  const setNetworkModeValue = (newMode: NetworkMode) => {
    if (!isAdmin) {
      console.warn('Only admin users can change network mode');
      return;
    }
    
    setNetworkMode(newMode);
    localStorage.setItem('network-mode', newMode);
  };

  const isTestnet = networkMode === 'testnet';
  const isMainnet = networkMode === 'mainnet';
  const currentChain = isTestnet ? baseSepolia : base;
  const targetChainId = currentChain.id;

  return {
    networkMode,
    isTestnet,
    isMainnet,
    setNetworkMode: setNetworkModeValue,
    canChangeNetworkMode: isAdmin,
    isLoading,
    currentChain,
    targetChainId,
  };
};