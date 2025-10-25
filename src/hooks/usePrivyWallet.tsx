import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useToast } from '@/hooks/use-toast';
import { useAppMode } from './useAppMode';
import { useAuthMethod } from './useAuthMethod';
import { supabase } from '@/integrations/supabase/client';

export function usePrivyWallet() {
  const { user, authenticated, ready } = usePrivy();
  const { isTestMode, canChangeMode } = useAppMode();
  const { authMethod, isWalletAuth } = useAuthMethod();
  const [balance, setBalance] = useState<string>('0');
  const [promptBalance, setPromptBalance] = useState<string>('1000');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Regular users always use production mode, only admins can switch to test mode
  const shouldUseTestMode = canChangeMode ? isTestMode : false;

  // Get the wallet address based on auth method
  const address = user?.wallet?.address;
  const walletType = user?.wallet?.walletClientType;
  
  // Only use external wallets - no embedded wallets allowed
  const effectiveAddress = user?.wallet?.address && user?.wallet?.walletClientType !== 'privy' 
    ? user.wallet.address 
    : null;

  // Simulate fetching ETH balance
  const fetchBalance = useCallback(async () => {
    if (!effectiveAddress || !ready) return;

    try {
      setIsLoading(true);
      // Simulate API call - in production, you'd use Web3 provider
      await new Promise(resolve => setTimeout(resolve, 1000));
      setBalance('0.1'); // Demo balance
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveAddress, ready]);

  // Fetch $PROMPT token balance (test mode vs production mode)
  const fetchPromptBalance = useCallback(async () => {
    if (!effectiveAddress || !ready) return;

    try {
      setIsLoading(true);
      
        console.log('fetchPromptBalance - Admin mode debug:', {
          canChangeMode,
          isTestMode,
          shouldUseTestMode,
          walletType,
          address: effectiveAddress
        });
        
        if (shouldUseTestMode) {
          // TEST MODE: Simulated balances for admin testing
          await new Promise(resolve => setTimeout(resolve, 800));
          setPromptBalance('2500'); // External wallet balance
        } else {
          // PRODUCTION MODE: Query actual $PROMPT token balance from blockchain
          try {
            console.log('Querying real PROMPTTEST token balance for:', effectiveAddress);
            
            // Query the actual $PROMPT token contract balance
            const { data, error } = await supabase.functions.invoke('query-token-balance', {
              body: { address: effectiveAddress }
            });
          
          if (error) {
            console.error('Error querying token balance:', error);
            setPromptBalance('0');
          } else if (data.success) {
            setPromptBalance(data.balance);
            console.log('Real token balance:', data.balance);
          } else {
            console.error('Failed to query balance:', data.error);
            setPromptBalance('0');
          }
          
        } catch (contractError) {
          console.error('Error querying token contract:', contractError);
          setPromptBalance('0');
        }
      }
    } catch (error) {
      console.error('Error fetching PROMPT balance:', error);
      setPromptBalance(shouldUseTestMode ? '1000' : '0');
    } finally {
      setIsLoading(false);
    }
  }, [effectiveAddress, ready, walletType, shouldUseTestMode]);

  // Send $PROMPT tokens (requires external wallet)
  const sendPromptTokens = useCallback(async (to: string, amount: string) => {
    if (!effectiveAddress || !authenticated) {
      toast({
        title: "External Wallet Required",
        description: "Please connect an external wallet (MetaMask, Coinbase, etc.) to send tokens.",
        variant: "destructive"
      });
      return false;
    }

    const amountNum = parseFloat(amount);
    const currentBalance = parseFloat(promptBalance);

    if (currentBalance < amountNum) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${amount} $PROMPT tokens but only have ${promptBalance}.`,
        variant: "destructive"
      });
      return false;
    }

    try {
      setIsLoading(true);
      
      if (shouldUseTestMode) {
        // TEST MODE: Simulated transaction for admin testing
        toast({
          title: "Test Transaction Sent",
          description: `[TEST MODE] Sending ${amount} $PROMPT tokens...`,
        });

        // Simulate transaction time
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Update balance
        const newBalance = (currentBalance - amountNum).toString();
        setPromptBalance(newBalance);

        toast({
          title: "Test Transaction Confirmed",
          description: `[TEST MODE] Successfully sent ${amount} $PROMPT tokens!`,
        });
      } else {
        // PRODUCTION MODE: Real blockchain transaction
        toast({
          title: "Transaction Sent",
          description: `Sending ${amount} $PROMPT tokens...`,
        });

        // Call the real token transfer function
        const { data, error } = await supabase.functions.invoke('transfer-tokens', {
          body: {
            fromAddress: effectiveAddress,
            toAddress: to,
            amount: amount
          }
        });

        if (error || !data.success) {
          throw new Error(data?.error || error?.message || 'Transaction failed');
        }

        // Refresh balance after successful transaction
        await fetchPromptBalance();

        toast({
          title: "Transaction Confirmed",
          description: `Successfully sent ${amount} $PROMPT tokens!`,
        });
      }

      return true;
    } catch (error: any) {
      console.error('Error sending tokens:', error);
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to send tokens",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [effectiveAddress, authenticated, promptBalance, toast, shouldUseTestMode]);

  // Pay for agent creation (requires external wallet)
  const payForAgentCreation = useCallback(async (cost: string, treasuryAddress: string, agentId?: string) => {
    if (!authenticated || !effectiveAddress) {
      toast({
        title: "External Wallet Required",
        description: "Please connect an external wallet to create an agent.",
        variant: "destructive"
      });
      return false;
    }

    const costNumber = parseFloat(cost);
    const currentBalance = parseFloat(promptBalance);

    if (currentBalance < costNumber) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${cost} $PROMPT tokens but only have ${promptBalance}.`,
        variant: "destructive"
      });
      return false;
    }

    toast({
      title: "Processing Payment",
      description: `Paying ${cost} $PROMPT tokens for agent creation...`,
    });

    const success = await sendPromptTokens(treasuryAddress, cost);
    
    if (success) {
      toast({
        title: "Payment Successful",
        description: "Agent creation payment processed successfully!",
      });
    }

    return success;
  }, [authenticated, effectiveAddress, promptBalance, sendPromptTokens, toast]);

  // Refresh all balances
  const refreshBalances = useCallback(async () => {
    await Promise.all([fetchBalance(), fetchPromptBalance()]);
  }, [fetchBalance, fetchPromptBalance]);

  // Auto-fetch balances when external wallet connects
  useEffect(() => {
    if (authenticated && effectiveAddress && ready) {
      fetchBalance();
      fetchPromptBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, effectiveAddress, ready]);

  return {
    // Wallet info
    address: effectiveAddress,
    walletType,
    isConnected: authenticated && !!effectiveAddress,
    isEmbeddedWallet: false, // We don't allow embedded wallets
    hasExternalWallet: !!effectiveAddress,
    
    // Balances
    balance,
    promptBalance,
    isLoading,
    
    // Actions
    refreshBalances,
    sendPromptTokens,
    payForAgentCreation,
    
    // App mode info
    isTestMode: shouldUseTestMode,
    canChangeMode,
    
    // Utility
    hasWallet: !!user?.wallet,
    walletProvider: user?.wallet?.walletClientType || 'none',
  };
}