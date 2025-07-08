import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
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

  const [isProcessing, setIsProcessing] = useState(false);

  // Handle authentication state changes and close modals
  useEffect(() => {
    if (ready && authenticated && user) {
      // Force close any Privy modals when authenticated
      setTimeout(() => {
        const privyModal = document.querySelector('[data-privy-modal]');
        const privyOverlay = document.querySelector('[data-privy-overlay]');
        if (privyModal) privyModal.remove();
        if (privyOverlay) privyOverlay.remove();
      }, 100);
    }
  }, [ready, authenticated, user]);

  // Sync Privy user with Supabase profiles
  useEffect(() => {
    console.log('Auth state changed:', { ready, authenticated, user: user?.id });
    
    if (!ready || !authenticated || !user) {
      setIsProcessing(false);
      return;
    }

    const syncUserProfile = async () => {
      console.log('Starting profile sync for user:', user.id);
      setIsProcessing(true);
      try {
        // Use Privy's user ID directly (it's a string, not UUID)
        const userId = user.id;
        
        // Check if profile exists
        const { data: existingProfile, error: selectError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (selectError) {
          console.error('Error checking profile:', selectError);
          return;
        }

        if (!existingProfile) {
          console.log('Creating new profile for user:', userId);
          // Create new profile
          const { error } = await supabase
            .from('profiles')
            .insert({
              user_id: userId,
              wallet_address: user.wallet?.address,
              username: user.email?.address?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
              display_name: user.email?.address?.split('@')[0] || `User ${user.id.slice(0, 8)}`,
            });

          if (error) {
            console.error('Error creating profile:', error);
          } else {
            console.log('Profile created successfully');
          }
        } else {
          console.log('Profile exists, checking for updates');
          // Update existing profile with wallet if connected
          if (user.wallet?.address && existingProfile.wallet_address !== user.wallet.address) {
            const { error } = await supabase
              .from('profiles')
              .update({ wallet_address: user.wallet.address })
              .eq('user_id', userId);

            if (error) {
              console.error('Error updating wallet address:', error);
            } else {
              console.log('Wallet address updated');
            }
          }
        }
      } catch (error) {
        console.error('Error syncing user profile:', error);
      } finally {
        console.log('Profile sync completed');
        setIsProcessing(false);
      }
    };

    syncUserProfile();
  }, [ready, authenticated, user]);

  return {
    user: authenticated ? user : null,
    session: authenticated ? { user } : null,
    loading: !ready || isProcessing,
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