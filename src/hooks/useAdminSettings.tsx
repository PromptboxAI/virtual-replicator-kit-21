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

      // Convert array of key-value pairs to settings object with proper JSON parsing
      const settingsObj = data.reduce((acc, item) => {
        console.log(`Raw DB value for ${item.key}:`, item.value, typeof item.value);
        
        // Handle different value types correctly
        let parsedValue = item.value;
        if (typeof item.value === 'string') {
          try {
            // Try to parse as JSON first
            parsedValue = JSON.parse(item.value);
            console.log(`JSON parsed ${item.key}:`, parsedValue, typeof parsedValue);
          } catch (error) {
            // If JSON parsing fails, use the string directly
            parsedValue = item.value;
            console.log(`Using string value for ${item.key}:`, parsedValue);
          }
        }
        
        acc[item.key] = parsedValue;
        console.log(`Final value for ${item.key}:`, acc[item.key], typeof acc[item.key]);
        return acc;
      }, {} as Record<string, any>);

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
          console.log(`Using default for missing setting ${key}:`, defaultSettings[key]);
        }
        return acc;
      }, {} as Record<string, any>);

      console.log('Final admin settings after processing:', finalSettings);
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

      if (error) {
        console.error('RPC update_admin_setting error:', error);
        throw error;
      }

      console.log(`Successfully updated setting ${key} to:`, value);
      
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