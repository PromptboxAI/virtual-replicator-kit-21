import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function WalletProfileSync() {
  const { address, isConnected } = useAccount();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const syncWalletAddress = async () => {
      if (!user || !address || !isConnected) return;

      try {
        // Check if this wallet is already connected to another user
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('wallet_address', address)
          .single();

        if (existingProfile && existingProfile.user_id !== user.id) {
          toast({
            title: "Wallet Already Connected",
            description: "This wallet is already connected to another account.",
            variant: "destructive",
          });
          return;
        }

        // Update user's profile with wallet address
        const { error } = await supabase
          .from('profiles')
          .update({ wallet_address: address })
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Wallet Connected",
          description: "Your wallet has been linked to your account.",
        });
      } catch (err: any) {
        console.error('Error syncing wallet:', err);
        toast({
          title: "Sync Error",
          description: "Failed to link wallet to your account.",
          variant: "destructive",
        });
      }
    };

    syncWalletAddress();
  }, [address, isConnected, user, toast]);

  return null; // This component doesn't render anything
}