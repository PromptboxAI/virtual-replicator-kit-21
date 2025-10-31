import { usePrivyWallet } from './usePrivyWallet';
import { useToast } from '@/hooks/use-toast';

export function useTokenBalance(userId?: string) {
  const { toast } = useToast();
  const { promptBalance, isLoading, refreshBalances, isTestMode, canChangeMode } = usePrivyWallet();

  const deductTokens = async (amount: number): Promise<boolean> => {
    // Token deduction now happens via blockchain transactions, not database updates
    toast({
      title: "Not Implemented",
      description: "Token deduction is handled via blockchain transactions",
      variant: "destructive"
    });
    return false;
  };

  const addTestTokens = async (amount: number = 5000): Promise<boolean> => {
    // Test tokens now come from the faucet page
    toast({
      title: "Use Faucet",
      description: "Please use the Faucet page to get test PROMPT tokens",
    });
    return false;
  };

  const refundTokens = async (amount: number): Promise<boolean> => {
    // Refunds now handled via blockchain transactions
    toast({
      title: "Not Implemented",
      description: "Token refunds are handled via blockchain transactions",
      variant: "destructive"
    });
    return false;
  };

  return {
    balance: parseFloat(promptBalance) || 0,
    loading: isLoading,
    deductTokens,
    addTestTokens,
    refundTokens,
    isTestMode,
    refetchBalance: refreshBalances
  };
}