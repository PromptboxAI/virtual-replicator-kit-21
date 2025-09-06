import { useState, useEffect } from 'react';
import { useUserRole } from './useUserRole';
import { useAuth } from './useAuth';

export type AppMode = 'test' | 'production';

// Temporary global safety lock: force testnet-only until TGE
const LOCK_TESTNET_ONLY = true;

export const useAppMode = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [mode, setMode] = useState<AppMode>('test');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Global safety lock
    if (LOCK_TESTNET_ONLY) {
      setMode('test');
      setIsLoading(false);
      return;
    }

    // For non-admin users, always use production mode (real ERC20 tokens)
    if (!isAdmin) {
      setMode('production');
      setIsLoading(false);
      return;
    }

    // For admin users, check localStorage for preference
    const savedMode = localStorage.getItem('app-mode') as AppMode;
    if (savedMode && (savedMode === 'test' || savedMode === 'production')) {
      setMode(savedMode);
    } else {
      // Default admins to production mode
      setMode('production');
    }
    setIsLoading(false);
  }, [isAdmin]);

  const setAppMode = (newMode: AppMode) => {
    if (LOCK_TESTNET_ONLY) {
      console.warn('Production mode is temporarily locked until TGE.');
      return;
    }
    if (!isAdmin) {
      console.warn('Only admin users can change app mode');
      return;
    }
    
    setMode(newMode);
    localStorage.setItem('app-mode', newMode);
  };

  const isTestMode = mode === 'test';
  const isProductionMode = mode === 'production';

  return {
    mode,
    isTestMode,
    isProductionMode,
    setAppMode,
    canChangeMode: isAdmin && !LOCK_TESTNET_ONLY,
    isLoading,
  };
};