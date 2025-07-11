import { useState, useEffect } from 'react';
import { useUserRole } from './useUserRole';
import { useAuth } from './useAuth';

export type AppMode = 'test' | 'production';

export const useAppMode = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [mode, setMode] = useState<AppMode>('test');

  useEffect(() => {
    // For non-admin users, always use test mode
    if (!isAdmin) {
      setMode('test');
      return;
    }

    // For admin users, check localStorage for preference
    const savedMode = localStorage.getItem('app-mode') as AppMode;
    if (savedMode && (savedMode === 'test' || savedMode === 'production')) {
      setMode(savedMode);
    }
  }, [isAdmin]);

  const setAppMode = (newMode: AppMode) => {
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
    canChangeMode: isAdmin,
  };
};