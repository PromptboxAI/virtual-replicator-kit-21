import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAppMode } from './useAppMode';

export function useTokenBalance(userId?: string) {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isTestMode } = useAppMode();

  useEffect(() => {
    if (userId) {
      fetchBalance();
    } else {
      setLoading(false);
    }
  }, [userId, isTestMode]); // React to mode changes

  const fetchBalance = async () => {
    if (!userId) return;
    
    try {
      // First, try to get existing balance
      let { data: userBalance, error } = await supabase
        .from('user_token_balances')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // User doesn't have a balance record, create one
        const initialBalance = isTestMode ? 10000 : 1000; // Give more tokens in test mode
        const { data: newBalance, error: insertError } = await supabase
          .from('user_token_balances')
          .insert([{ user_id: userId, balance: initialBalance }])
          .select('balance')
          .single();

        if (insertError) {
          console.error('Error creating token balance:', insertError);
          toast({
            title: "Error",
            description: "Failed to initialize token balance",
            variant: "destructive"
          });
          return;
        }
        
        if (isTestMode) {
          toast({
            title: "Test Mode Active",
            description: `Welcome! You've been given ${initialBalance} test tokens for development.`,
          });
        }
        
        userBalance = newBalance;
      } else if (error) {
        console.error('Error fetching token balance:', error);
        toast({
          title: "Error",
          description: "Failed to fetch token balance",
          variant: "destructive"
        });
        return;
      }

      setBalance(userBalance?.balance || 0);
    } catch (error) {
      console.error('Token balance error:', error);
    } finally {
      setLoading(false);
    }
  };

  const deductTokens = async (amount: number): Promise<boolean> => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to perform this action",
        variant: "destructive"
      });
      return false;
    }

    if (balance < amount) {
      toast({
        title: "Insufficient Tokens",
        description: `You need ${amount} tokens but only have ${balance}`,
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_token_balances')
        .update({ balance: balance - amount })
        .eq('user_id', userId);

      if (error) {
        console.error('Error deducting tokens:', error);
        toast({
          title: "Error",
          description: "Failed to deduct tokens",
          variant: "destructive"
        });
        return false;
      }

      setBalance(prev => prev - amount);
      return true;
    } catch (error) {
      console.error('Token deduction error:', error);
      return false;
    }
  };

  const addTestTokens = async (amount: number = 5000): Promise<boolean> => {
    if (!isTestMode) {
      toast({
        title: "Not Available",
        description: "Test tokens are only available in development mode",
        variant: "destructive"
      });
      return false;
    }

    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to get test tokens",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_token_balances')
        .update({ balance: balance + amount })
        .eq('user_id', userId);

      if (error) {
        console.error('Error adding test tokens:', error);
        toast({
          title: "Error",
          description: "Failed to add test tokens",
          variant: "destructive"
        });
        return false;
      }

      setBalance(prev => prev + amount);
      toast({
        title: "Test Tokens Added!",
        description: `Added ${amount} test tokens to your balance`,
      });
      return true;
    } catch (error) {
      console.error('Test token addition error:', error);
      return false;
    }
  };

  return {
    balance,
    loading,
    deductTokens,
    addTestTokens,
    isTestMode,
    refetchBalance: fetchBalance
  };
}