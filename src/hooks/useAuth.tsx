import { usePrivy } from '@privy-io/react-auth';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAuth() {
  const { 
    ready, 
    authenticated, 
    user, 
    login, 
    logout,
    linkEmail,
    linkWallet,
    unlinkEmail,
    unlinkWallet
  } = usePrivy();

  // Sync Privy user with Supabase profiles
  useEffect(() => {
    if (!ready || !authenticated || !user) return;

    const syncUserProfile = async () => {
      try {
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!existingProfile) {
          // Create new profile
          const { error } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              wallet_address: user.wallet?.address,
              username: user.email?.address?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
              display_name: user.email?.address?.split('@')[0] || `User ${user.id.slice(0, 8)}`,
            });

          if (error) {
            console.error('Error creating profile:', error);
          }
        } else {
          // Update existing profile with wallet if connected
          if (user.wallet?.address && existingProfile.wallet_address !== user.wallet.address) {
            const { error } = await supabase
              .from('profiles')
              .update({ wallet_address: user.wallet.address })
              .eq('user_id', user.id);

            if (error) {
              console.error('Error updating wallet address:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error syncing user profile:', error);
      }
    };

    syncUserProfile();
  }, [ready, authenticated, user]);

  return {
    user: authenticated ? user : null,
    session: authenticated ? { user } : null,
    loading: !ready,
    signOut: logout,
    signIn: login,
    linkEmail,
    linkWallet,
    unlinkEmail,
    unlinkWallet,
    authenticated,
    ready
  };
}