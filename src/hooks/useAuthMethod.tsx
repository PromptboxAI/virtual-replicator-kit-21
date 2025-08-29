import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export function useAuthMethod() {
  const { user, authenticated } = useAuth();
  const [authMethod, setAuthMethod] = useState<'email' | 'wallet' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authenticated || !user) {
      setAuthMethod(null);
      return;
    }

    const fetchAuthMethod = async () => {
      setIsLoading(true);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('auth_method')
          .eq('user_id', user.id)
          .maybeSingle();

        // Always set to email since we force email-first auth
        setAuthMethod('email');
      } catch (error) {
        console.error('Error fetching auth method:', error);
        setAuthMethod('email'); // Default fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuthMethod();
  }, [authenticated, user]);

  return {
    authMethod,
    isLoading,
    isEmailAuth: authMethod === 'email',
    isWalletAuth: authMethod === 'wallet',
  };
}