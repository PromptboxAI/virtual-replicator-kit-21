import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useToast } from '@/hooks/use-toast';
import { useAppMode } from './useAppMode';
import { useAuthMethod } from './useAuthMethod';

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
  
  // For email users, only use embedded wallet. For wallet users, use connected wallet
  const effectiveAddress = isWalletAuth ? 
    (walletType !== 'privy' ? address : null) : // Wallet auth users need external wallet
    (walletType === 'privy' ? address : null);  // Email auth users use embedded wallet

  // Simulate fetching ETH balance
  const fetchBalance = useCallback(async () => {
    if (!address || !ready) return;

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
  }, [address, ready]);

  // Fetch $PROMPT token balance (test mode vs production mode)
  const fetchPromptBalance = useCallback(async () => {
    if (!address || !ready) return;

    try {
      setIsLoading(true);
      
      console.log('fetchPromptBalance - Admin mode debug:', {
        canChangeMode,
        isTestMode,
        shouldUseTestMode,
        walletType,
        address
      });
      
      if (shouldUseTestMode) {
        // TEST MODE: Simulated balances for admin testing
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (walletType === 'privy') {
          setPromptBalance('1000'); // Embedded wallet gets starter balance
        } else {
          setPromptBalance('2500'); // Connected wallet might have more
        }
      } else {
        // PRODUCTION MODE: Query actual $PROMPT token balance from blockchain
        try {
          // TODO: Replace with actual token contract query when token is deployed
          // Until the $PROMPT token contract is deployed, all users will have 0 balance
          setPromptBalance('0');
          
          console.log('Wallet address for balance query:', address);
          console.log('Wallet type:', walletType);
          
          // Future implementation will query the actual $PROMPT token contract here:
          // const tokenContract = new ethers.Contract(PROMPT_TOKEN_ADDRESS, ERC20_ABI, provider);
          // const balance = await tokenContract.balanceOf(address);
          // const formattedBalance = ethers.utils.formatUnits(balance, 18);
          // setPromptBalance(formattedBalance);
          
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
  }, [address, ready, walletType, shouldUseTestMode]);

  // Send $PROMPT tokens (simulated)
  const sendPromptTokens = useCallback(async (to: string, amount: string) => {
    if (!address || !authenticated) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to send tokens.",
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
        // PRODUCTION MODE: Real transaction
        toast({
          title: "Transaction Sent",
          description: `Sending ${amount} $PROMPT tokens...`,
        });

        // TODO: Replace with actual smart contract interaction
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Update balance after real transaction
        const newBalance = (currentBalance - amountNum).toString();
        setPromptBalance(newBalance);

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
  }, [address, authenticated, promptBalance, toast, shouldUseTestMode]);

  // Pay for agent creation
  const payForAgentCreation = useCallback(async (cost: string, treasuryAddress: string) => {
    if (!authenticated || !address) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create an agent.",
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
  }, [authenticated, address, promptBalance, sendPromptTokens, toast]);

  // Refresh all balances
  const refreshBalances = useCallback(async () => {
    await Promise.all([fetchBalance(), fetchPromptBalance()]);
  }, [fetchBalance, fetchPromptBalance]);

  // Auto-fetch balances when wallet connects
  useEffect(() => {
    if (authenticated && address && ready) {
      refreshBalances();
    }
  }, [authenticated, address, ready, refreshBalances]);

  return {
    // Wallet info
    address,
    walletType,
    isConnected: authenticated && !!address,
    isEmbeddedWallet: walletType === 'privy',
    
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