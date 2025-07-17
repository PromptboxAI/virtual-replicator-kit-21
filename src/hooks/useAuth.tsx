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
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Handle authentication state changes and close modals
  useEffect(() => {
    console.log('Privy state:', { ready, authenticated, user });
    if (ready && authenticated && user) {
      // Multiple attempts to close Privy modals with different selectors
      const closeModals = () => {
        const modalSelectors = [
          '[data-privy-modal]',
          '[data-privy-overlay]',
          '.privy-modal',
          '.privy-overlay',
          '[role="dialog"]',
          '.ReactModal__Overlay',
          '[data-testid="privy-modal"]'
        ];
        
        modalSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            try {
              // Check if element still exists and has a parent before removing
              if (el && el.parentNode && document.body.contains(el)) {
                el.parentNode.removeChild(el);
              }
            } catch (error) {
              // Safely ignore DOM manipulation errors
              console.warn('Failed to remove modal element:', error);
            }
          });
        });

        // Also try to remove any backdrop/overlay elements
        document.body.style.overflow = 'unset';
        document.documentElement.style.overflow = 'unset';
      };

      // Try multiple times with different delays
      setTimeout(closeModals, 50);
      setTimeout(closeModals, 200);
      setTimeout(closeModals, 500);
      setTimeout(closeModals, 1000);
    }
  }, [ready, authenticated, user]);

  // Sync Privy user with Supabase profiles (optimized with localStorage cache)
  useEffect(() => {
    if (!ready || !authenticated || !user) {
      setIsProcessing(false);
      return;
    }

    // Check if we've already initialized this user in this session
    const cacheKey = `profile_initialized_${user.id}`;
    const alreadyInitialized = sessionStorage.getItem(cacheKey) === 'true';
    
    console.log('Auth effect triggered:', { 
      ready, 
      authenticated, 
      user: user?.id, 
      alreadyInitialized,
      cacheKey
    });
    
    if (alreadyInitialized) {
      setIsProcessing(false);
      setHasInitialized(true);
      return;
    }

    // Run profile sync in background without blocking UI
    const syncUserProfile = async () => {
      console.log('Starting profile sync for user:', user.id);
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
          
          // Determine authentication method
          const authMethod = user.wallet?.address && !user.email ? 'wallet' : 'email';
          
          // Create new profile
          const { error } = await supabase
            .from('profiles')
            .insert({
              user_id: userId,
              wallet_address: user.wallet?.address,
              username: user.email?.address?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
              display_name: user.email?.address?.split('@')[0] || `User ${user.id.slice(0, 8)}`,
              auth_method: authMethod,
            });

          if (error) {
            console.error('Error creating profile:', error);
          } else {
            console.log('Profile created successfully');
            // Show terms modal for new users
            setShowTermsModal(true);
          }
        } else {
          console.log('Profile exists, checking for updates');
          // Check if user has accepted terms
          if (existingProfile.terms_accepted_at) {
            setHasAcceptedTerms(true);
          }
          // Only show terms modal for new users, not existing ones
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
        // Cache that we've initialized this user
        sessionStorage.setItem(cacheKey, 'true');
        setHasInitialized(true);
      }
    };

    // Mark as non-processing immediately to not block UI
    setIsProcessing(false);
    // Run sync in background
    syncUserProfile();
  }, [ready, authenticated, user]);

  const handleAcceptTerms = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ terms_accepted_at: new Date().toISOString() })
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error accepting terms:', error);
      } else {
        setHasAcceptedTerms(true);
        setShowTermsModal(false);
      }
    } catch (error) {
      console.error('Error accepting terms:', error);
    }
  };

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
    ready,
    showTermsModal,
    hasAcceptedTerms,
    handleAcceptTerms
  };
}