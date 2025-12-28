import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'user';

export const useUserRole = () => {
  const { user, ready } = useAuth();
  const [role, setRole] = useState<UserRole>('user');
  const [isLoading, setIsLoading] = useState(true);
  const lastCheckedUserId = useRef<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      // Wait for auth to be ready before deciding on role
      if (!ready) {
        console.log('useUserRole - auth not ready yet');
        setIsLoading(true);
        return;
      }

      if (!user) {
        console.log('useUserRole - no user, setting loading false');
        setIsLoading(false);
        setRole('user');
        lastCheckedUserId.current = null;
        return;
      }

      // Prevent duplicate fetches for the same user
      if (lastCheckedUserId.current === user.id) {
        console.log('useUserRole - already checked this user');
        return;
      }

      // Keep loading true while we fetch the role for this user
      setIsLoading(true);
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
        lastCheckedUserId.current = user.id;
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setRole('user');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user?.id, ready]); // Depend on both user.id and ready state

  const isAdmin = role === 'admin';

  return {
    role,
    isAdmin,
    isLoading,
  };
};