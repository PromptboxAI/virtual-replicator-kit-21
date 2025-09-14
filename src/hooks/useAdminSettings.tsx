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

    // Set up real-time subscription for admin_settings changes
    const channel = supabase
      .channel('admin-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'admin_settings'
        },
        (payload) => {
          console.log('🔔 Admin settings real-time change:', payload);
          fetchSettings(); // Refetch when settings change
        }
      )
      .subscribe((status) => {
        console.log('🔌 Admin settings subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('admin_settings')
        .select('key, value');

      console.log('🔍 Admin settings fetch result:', { data, error });

      if (error) throw error;

      // Convert array of key-value pairs to settings object
      // Supabase JSONB values are already parsed, no need to JSON.parse again
      const settingsObj = data.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, any>);

      console.log('🔍 Settings object:', settingsObj);

      // Apply default values for missing settings ONLY
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

      // ONLY use defaults for keys that don't exist in the database
      const finalSettings = Object.keys(defaultSettings).reduce((acc, key) => {
        if (settingsObj.hasOwnProperty(key)) {
          acc[key] = settingsObj[key]; // Use database value
        } else {
          acc[key] = defaultSettings[key]; // Use default only if missing
        }
        return acc;
      }, {} as Record<string, any>);

      console.log('🔍 Final settings:', finalSettings);
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
        p_value: value, // Don't JSON.stringify - RPC function handles JSONB conversion
        p_changed_by: user.data.user?.id || 'unknown',
        p_reason: reason || `Updated ${key} setting`,
      });

      if (error) {
        throw error;
      }
      
      toast({
        title: "Setting Updated",
        description: key === 'test_mode_enabled'
          ? `Test mode ${value ? 'enabled' : 'disabled'}`
          : `Successfully updated ${key}`,
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
          p_value: value, // Don't JSON.stringify - RPC function handles JSONB conversion
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