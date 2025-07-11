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
        
        // Check Supabase auth context
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        console.log('useUserRole - supabase auth user:', supabaseUser);
        
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

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
  }, [user]);

  const isAdmin = role === 'admin';

  return {
    role,
    isAdmin,
    isLoading,
  };
};