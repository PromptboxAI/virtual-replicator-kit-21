import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'user';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>('user');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        console.log('useUserRole - no user, setting loading false');
        setIsLoading(false);
        return;
      }

      console.log('useUserRole - fetching role for user:', user.id);

      try {
        // Check if user has admin role
        console.log('useUserRole - about to query with user_id:', user.id);
        
        // Since we're using Privy auth (not Supabase auth), we need to bypass RLS
        // by using a direct function call instead of the table query
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        console.log('useUserRole - query result:', { data, error, userId: user.id });

        if (error) {
          console.error('Error fetching user role:', error);
        }

        const newRole = data ? 'admin' : 'user';
        console.log('useUserRole - setting role to:', newRole);
        setRole(newRole);
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setRole('user');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user?.id]); // Fix: Only depend on user.id which is stable, not the entire user object

  const isAdmin = role === 'admin';

  return {
    role,
    isAdmin,
    isLoading,
  };
};