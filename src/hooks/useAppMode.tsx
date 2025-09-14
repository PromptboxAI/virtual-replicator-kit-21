import { useState, useEffect } from 'react';
import { useUserRole } from './useUserRole';
import { useAuth } from './useAuth';
import { useAdminSettings } from './useAdminSettings';

export type AppMode = 'test' | 'production';

// Allow toggle visibility but keep automated trading disabled via backend security
const LOCK_TESTNET_ONLY = false;

export const useAppMode = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { settings, isLoading: settingsLoading } = useAdminSettings();
  const [isLoading, setIsLoading] = useState(true);

  // Use admin settings as the single source of truth
  const isTestMode = settings?.test_mode_enabled ?? true; // Default to test mode
  const mode: AppMode = isTestMode ? 'test' : 'production';

  useEffect(() => {
    // Global safety lock
    if (LOCK_TESTNET_ONLY) {
      setIsLoading(false);
      return;
    }

    // Wait for settings to load
    if (settingsLoading) {
      return;
    }

    setIsLoading(false);
  }, [settingsLoading]);

  const setAppMode = (newMode: AppMode) => {
    if (LOCK_TESTNET_ONLY) {
      console.warn('Production mode is temporarily locked until TGE.');
      return;
    }
    if (!isAdmin) {
      console.warn('Only admin users can change app mode');
      return;
    }
    
    // This function is deprecated - mode should only be changed via admin panel
    console.warn('setAppMode is deprecated. Use admin settings to change mode.');
  };

  const isProductionMode = mode === 'production';

  return {
    mode,
    isTestMode,
    isProductionMode,
    setAppMode,
    canChangeMode: isAdmin && !LOCK_TESTNET_ONLY,
    isLoading: isLoading || settingsLoading,
  };
};