import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';
import { useToast } from './use-toast';

export interface AdminSettings {
  deployment_mode: 'database' | 'smart_contract';
  allowed_lock_durations: number[];
  allowed_frameworks: string[];
  max_prebuy_amount: number;
  creation_fee: number;
  test_mode_enabled: boolean;
  trading_fee_percent: number;
  graduation_threshold: number;
  mev_protection_enabled: boolean;
  emergency_pause: boolean;
}

export const useAdminSettings = () => {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('admin_settings')
        .select('key, value');

      if (error) throw error;

      // Convert array of key-value pairs to settings object
      const settingsObj = data.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, any>);

      // Apply default values for missing settings
      const defaultSettings: AdminSettings = {
        deployment_mode: 'database',
        allowed_lock_durations: [15, 60, 240, 1440],
        allowed_frameworks: ['PROMPT', 'OPENAI', 'ANTHROPIC'],
        max_prebuy_amount: 1000,
        creation_fee: 100,
        test_mode_enabled: true,
        trading_fee_percent: 1,
        graduation_threshold: 42000,
        mev_protection_enabled: false,
        emergency_pause: false,
      };

      const finalSettings = { ...defaultSettings, ...settingsObj };
      setSettings(finalSettings as AdminSettings);
    } catch (err) {
      console.error('Error fetching admin settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    settings,
    isLoading,
    error,
    refreshSettings: fetchSettings,
  };
};

export const useUpdateAdminSettings = () => {
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateSetting = async (
    key: keyof AdminSettings,
    value: any,
    reason?: string
  ) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can modify system settings.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setIsUpdating(true);

      const user = await supabase.auth.getUser();
      
      // Use RPC function to update or insert setting
      const { error } = await supabase.rpc('update_admin_setting', {
        p_key: key,
        p_value: JSON.stringify(value),
        p_changed_by: user.data.user?.id || 'unknown',
        p_reason: reason || `Updated ${key} setting`,
      });

      if (error) throw error;

      toast({
        title: "Setting Updated",
        description: `Successfully updated ${key}`,
      });

      return true;
    } catch (err) {
      console.error('Error updating admin setting:', err);
      toast({
        title: "Update Failed",
        description: err instanceof Error ? err.message : 'Failed to update setting',
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const updateMultipleSettings = async (
    updates: Partial<AdminSettings>,
    reason?: string
  ) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can modify system settings.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setIsUpdating(true);

      // Update settings in parallel
      const user = await supabase.auth.getUser();
      const promises = Object.entries(updates).map(([key, value]) =>
        supabase.rpc('update_admin_setting', {
          p_key: key,
          p_value: JSON.stringify(value),
          p_changed_by: user.data.user?.id || 'unknown',
          p_reason: reason || `Bulk update: ${key}`,
        })
      );

      const results = await Promise.all(promises);
      const hasErrors = results.some(result => result.error);

      if (hasErrors) {
        throw new Error('Some settings failed to update');
      }

      toast({
        title: "Settings Updated",
        description: `Successfully updated ${Object.keys(updates).length} settings`,
      });

      return true;
    } catch (err) {
      console.error('Error updating admin settings:', err);
      toast({
        title: "Update Failed",
        description: err instanceof Error ? err.message : 'Failed to update settings',
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateSetting,
    updateMultipleSettings,
    isUpdating,
  };
};