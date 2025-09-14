import { useUserRole } from './useUserRole';
import { useAdminSettings } from './useAdminSettings';

export type AppMode = 'test' | 'production';

export const useAppMode = () => {
  const { isAdmin } = useUserRole();
  const { settings, isLoading: settingsLoading } = useAdminSettings();

  // Single source of truth: admin_settings.test_mode_enabled
  const isTestMode = settings?.test_mode_enabled ?? false;
  const mode: AppMode = isTestMode ? 'test' : 'production';

  // Deprecated - should not be used
  const setAppMode = (newMode: AppMode) => {
    console.warn('setAppMode is deprecated. Use AdminSettings to change mode.');
  };

  return {
    mode,
    isTestMode,
    isProductionMode: !isTestMode,
    setAppMode, // Kept for compatibility but does nothing
    canChangeMode: false, // Always false - only admin panel can change
    isLoading: settingsLoading,
  };
};